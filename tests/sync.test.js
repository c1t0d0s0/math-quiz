import { describe, it, expect } from 'vitest';
import { RecordSync } from '../src/cloud/sync.js';
import { isBetter, mergeRecords, toProgressDoc, fromProgressDoc, toAppDoc, fromAppDoc, APP_ID } from '../src/cloud/records.js';
import { emptySummary } from '../src/rewards.js';

// ---- 代用品 ----

/** メモリ上の Firestore。fail を true にすると、通信できない状態になる */
class FakeCloud {
    constructor() {
        this.summaries = new Map(); // uid → まとめ (スタンプ・カードなど)
        this.data = new Map(); // uid → { modeId: record }
        this.fail = false;
        this.writes = 0;
        /** 全部読むのにかかる時間 (ミリ秒) */
        this.delay = 0;
    }
    check() {
        if (this.fail) throw new Error('offline');
    }
    of(uid) {
        if (!this.data.has(uid)) this.data.set(uid, {});
        return this.data.get(uid);
    }
    async loadAll(uid) {
        if (this.delay) await new Promise(r => setTimeout(r, this.delay));
        this.check();
        return {
            exists: this.summaries.has(uid),
            records: JSON.parse(JSON.stringify(this.of(uid))),
            summary: JSON.parse(JSON.stringify(this.summaries.get(uid) ?? emptySummary())),
        };
    }
    async loadRecord(uid, id) {
        this.check();
        const r = this.of(uid)[id];
        return r ? { ...r } : null;
    }
    async loadSummary(uid) {
        this.check();
        const s = this.summaries.get(uid);
        return s ? JSON.parse(JSON.stringify(s)) : null;
    }
    async saveSummary(uid, summary) {
        this.check();
        this.summaryWrites = (this.summaryWrites ?? 0) + 1;
        this.summaries.set(uid, JSON.parse(JSON.stringify(summary)));
    }
    async saveRecord(uid, id, record) {
        this.check();
        this.writes++;
        this.of(uid)[id] = { ...record };
    }
}

class FakeAuth {
    constructor() {
        this.next = 'alice';
    }
    onUser(cb) {
        this.cb = cb;
    }
    emit(uid) {
        this.cb(uid);
    }
    async signIn() {
        this.emit(this.next);
    }
    async signOut() {
        this.emit(null);
    }
}

/** 端末1台分。guest はログインなしの記録 (localStorage のかわり) */
function device(cloud, { guest = {}, guestSummary = emptySummary(), migrate = true } = {}) {
    const auth = new FakeAuth();
    const state = { guest: { ...guest }, guestSummary, shown: undefined, shownSummary: undefined, asked: 0, statuses: [] };
    const sync = new RecordSync(cloud, auth, {
        onStatus: s => state.statuses.push(s.status),
        onRecords: (records, current) => {
            state.shown = records === null ? null : { ...records };
            state.shownSummary = records === null ? null : JSON.parse(JSON.stringify(current.summary));
        },
        askMigrate: () => {
            state.asked++;
            return migrate;
        },
        readGuest: () => ({ records: { ...state.guest }, summary: state.guestSummary }),
        clearGuest: () => {
            state.guest = {};
            state.guestSummary = emptySummary();
        },
    }, { retryMs: 5 });
    sync.start();
    return { sync, auth, state };
}

const settle = sync => sync.flush();
const wait = ms => new Promise(r => setTimeout(r, ms));
const rec = (score, seconds = 0) => ({ score, seconds });

describe('記録のくらべ方', () => {
    it('正解数が多いほう、同じなら時間が短いほうがよい', () => {
        expect(isBetter(rec(5), rec(4))).toBe(true);
        expect(isBetter(rec(4), rec(5))).toBe(false);
        expect(isBetter(rec(5), rec(5))).toBe(false);
        expect(isBetter(rec(7, 100), rec(7, 120))).toBe(true);
        expect(isBetter(rec(7, 120), rec(7, 100))).toBe(false);
        expect(isBetter(rec(7, 100), rec(7, 0))).toBe(true);
        expect(isBetter(rec(3), undefined)).toBe(true);
        expect(isBetter(rec(0), undefined)).toBe(false);
    });

    it('合わせた結果は、順番を入れかえても、何回合わせても同じ', () => {
        const a = { addition: rec(10), 'long-g3': rec(7, 300), mixed: rec(4) };
        const b = { addition: rec(12), 'long-g3': rec(7, 250), division: rec(9) };
        const merged = mergeRecords(a, b);
        expect(merged).toEqual({ addition: rec(12), division: rec(9), 'long-g3': rec(7, 250), mixed: rec(4) });
        expect(mergeRecords(b, a)).toEqual(merged);
        expect(mergeRecords(merged, a)).toEqual(merged);
        expect(mergeRecords(merged, merged)).toEqual(merged);
    });

    it('Firestore の形に直して、もとにもどせる', () => {
        expect(APP_ID).toBe('math-quiz');
        const doc = toProgressDoc(rec(7, 250), 1234);
        expect(doc).toEqual({ schema: 1, updatedAt: 1234, status: 'done', data: { score: 7, seconds: 250 } });
        expect(fromProgressDoc(doc)).toEqual(rec(7, 250));
        const summary = { stamps: ['2026-10-12', '2026-10-13'], clears: ['clear:addition'], cards: [{ id: 'm01', paid: 40 }] };
        const app = toAppDoc(summary, 1);
        expect(app).toEqual({
            schema: 1, updatedAt: 1, activeDays: ['2026-10-12', '2026-10-13'], completed: ['clear:addition'],
            inventory: { m01: { paid: 40 } }, spent: {}, settings: {},
        });
        expect(fromAppDoc(app)).toEqual(summary);
        expect(fromAppDoc(null)).toEqual(emptySummary());
        expect(fromAppDoc({ activeDays: 'x', completed: [1, 'clear:mixed', 'bogus'], inventory: { m02: { paid: 'x' } } }))
            .toEqual({ stamps: [], clears: ['clear:mixed'], cards: [] });
    });

    it('形がくずれたデータは読まない', () => {
        expect(fromProgressDoc(null)).toBeNull();
        expect(fromProgressDoc({ data: { score: 'x' } })).toBeNull();
        expect(fromProgressDoc({ data: { score: -1 } })).toBeNull();
        expect(fromProgressDoc({ data: { score: 3, seconds: 'x' } })).toEqual(rec(3));
    });
});

describe('ログインしていないとき', () => {
    it('Firestore には何も書かない', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud);
        d.auth.emit(null);
        await settle(d.sync);
        d.sync.submit('addition', rec(10));
        await settle(d.sync);
        expect(d.sync.status).toBe('signed-out');
        expect(d.state.shown).toBeNull();
        expect(cloud.writes).toBe(0);
        expect(cloud.summaries.size).toBe(0);
    });
});

describe('ログインしたとき', () => {
    it('Firestore の記録を読んで見せる', async () => {
        const cloud = new FakeCloud();
        cloud.of('alice').addition = rec(15);
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        expect(d.sync.status).toBe('synced');
        expect(d.sync.loaded).toBe(true);
        expect(d.state.shown).toEqual({ addition: rec(15) });
        expect(cloud.writes).toBe(0);
        expect(cloud.summaries.has('alice')).toBe(true);
    });

    it('ボタンからログインして、うつすことをえらぶと、ログインなしの記録をアカウントに合わせて端末から消す', async () => {
        const cloud = new FakeCloud();
        cloud.of('alice').addition = rec(15);
        cloud.of('alice').division = rec(3);
        const d = device(cloud, { guest: { addition: rec(10), division: rec(8), 'long-g3': rec(9, 200) } });
        d.auth.emit(null);
        await settle(d.sync);
        await d.sync.signIn();
        await settle(d.sync);
        expect(d.state.asked).toBe(1);
        expect(cloud.of('alice')).toEqual({ addition: rec(15), division: rec(8), 'long-g3': rec(9, 200) });
        expect(d.state.shown).toEqual(cloud.of('alice'));
        expect(d.state.guest).toEqual({});
    });

    it('うつさないことをえらぶと、アカウントの記録だけを使い、端末の記録は残す', async () => {
        const cloud = new FakeCloud();
        cloud.of('alice').addition = rec(15);
        const guest = { addition: rec(20), mixed: rec(5) };
        const d = device(cloud, { guest, migrate: false });
        d.auth.emit(null);
        await settle(d.sync);
        await d.sync.signIn();
        await settle(d.sync);
        expect(d.state.asked).toBe(1);
        expect(cloud.of('alice')).toEqual({ addition: rec(15) });
        expect(d.state.shown).toEqual({ addition: rec(15) });
        expect(d.state.guest).toEqual(guest);
    });

    it('ページを開き直してログインがもどっただけのときは、うつすかどうかを聞かない', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud, { guest: { addition: rec(10) } });
        d.auth.emit('alice');
        await settle(d.sync);
        expect(d.state.asked).toBe(0);
        expect(cloud.of('alice')).toEqual({});
        expect(d.state.guest).toEqual({ addition: rec(10) });
    });
});

describe('ログイン中の記録', () => {
    it('新しい記録を Firestore に書く', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        d.sync.submit('addition', rec(12));
        d.sync.submit('long-g6', rec(8, 400));
        await settle(d.sync);
        expect(cloud.of('alice')).toEqual({ addition: rec(12), 'long-g6': rec(8, 400) });
        expect(d.sync.status).toBe('synced');
        expect(d.state.guest).toEqual({});
    });

    it('ほかの端末でもっとよい記録が出ていたら、消さずにそちらを見せる', async () => {
        const cloud = new FakeCloud();
        const a = device(cloud);
        const b = device(cloud);
        a.auth.emit('alice');
        b.auth.emit('alice');
        await settle(a.sync);
        await settle(b.sync);
        a.sync.submit('addition', rec(20));
        await settle(a.sync);
        b.sync.submit('addition', rec(14));
        await settle(b.sync);
        expect(cloud.of('alice').addition).toEqual(rec(20));
        expect(b.state.shown.addition).toEqual(rec(20));
    });

    it('読みこみ中に出た記録も、読みこんだ記録と合わせて残る', async () => {
        const cloud = new FakeCloud();
        cloud.of('alice').addition = rec(15);
        cloud.of('alice').mixed = rec(6);
        cloud.delay = 20;
        const d = device(cloud);
        d.auth.emit('alice');
        await wait(5);
        expect(d.sync.loaded).toBe(false);
        d.sync.submit('addition', rec(9));
        d.sync.submit('division', rec(4));
        await settle(d.sync);
        expect(cloud.of('alice')).toEqual({ addition: rec(15), division: rec(4), mixed: rec(6) });
        expect(d.state.shown).toEqual(cloud.of('alice'));
    });

    it('送れなかった記録は、つながったら送る', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        cloud.fail = true;
        d.sync.submit('addition', rec(12));
        await settle(d.sync);
        expect(d.sync.status).toBe('offline');
        expect(d.sync.hasPending()).toBe(true);
        expect(cloud.of('alice')).toEqual({});
        cloud.fail = false;
        await wait(30);
        await settle(d.sync);
        expect(d.sync.status).toBe('synced');
        expect(cloud.of('alice')).toEqual({ addition: rec(12) });
    });

    it('はじめの読みこみに失敗しても、あとでやり直す', async () => {
        const cloud = new FakeCloud();
        cloud.of('alice').addition = rec(15);
        cloud.fail = true;
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        expect(d.sync.status).toBe('offline');
        expect(d.sync.loaded).toBe(false);
        cloud.fail = false;
        await wait(30);
        await settle(d.sync);
        expect(d.sync.loaded).toBe(true);
        expect(d.state.shown).toEqual({ addition: rec(15) });
    });
});

describe('ログアウト', () => {
    it('ログインなしの記録にもどり、そのあとの記録は Firestore に書かない', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud, { guest: { mixed: rec(5) }, migrate: false });
        d.auth.emit(null);
        await settle(d.sync);
        await d.sync.signIn();
        await settle(d.sync);
        d.sync.submit('addition', rec(12));
        expect(await d.sync.signOut()).toBe('ok');
        await settle(d.sync);
        expect(d.sync.status).toBe('signed-out');
        expect(d.state.shown).toBeNull();
        expect(d.state.guest).toEqual({ mixed: rec(5) });
        const writes = cloud.writes;
        d.sync.submit('addition', rec(30));
        await settle(d.sync);
        expect(cloud.writes).toBe(writes);
        expect(cloud.of('alice')).toEqual({ addition: rec(12) });
    });

    it('送れていない記録があるときは、たしかめてからでないとログアウトしない', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        cloud.fail = true;
        d.sync.submit('addition', rec(12));
        expect(await d.sync.signOut()).toBe('unsynced');
        expect(d.sync.uid).toBe('alice');
        expect(await d.sync.signOut(true)).toBe('ok');
        await settle(d.sync);
        expect(d.sync.uid).toBeNull();
    });

    it('べつの人がログインしても、前の人の記録はまざらない', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        d.sync.submit('addition', rec(12));
        await d.sync.signOut();
        d.auth.emit('bob');
        await settle(d.sync);
        expect(d.state.shown).toEqual({});
        d.sync.submit('mixed', rec(3));
        await settle(d.sync);
        expect(cloud.of('bob')).toEqual({ mixed: rec(3) });
        expect(cloud.of('alice')).toEqual({ addition: rec(12) });
    });
});

describe('スタンプ・カードの記録', () => {
    const day = d => `2026-10-${String(d).padStart(2, '0')}`;

    it('ログイン中に変わった分を Firestore に書き、ほかの端末の分と合わせる', async () => {
        const cloud = new FakeCloud();
        const a = device(cloud);
        const b = device(cloud);
        a.auth.emit('alice');
        b.auth.emit('alice');
        await settle(a.sync);
        await settle(b.sync);
        a.sync.submitSummary({ stamps: [day(12)], clears: ['clear:addition'], cards: [] });
        await settle(a.sync);
        b.sync.submitSummary({ stamps: [day(13)], clears: [], cards: [{ id: 'm01', paid: 40 }] });
        await settle(b.sync);
        const expected = { stamps: [day(12), day(13)], clears: ['clear:addition'], cards: [{ id: 'm01', paid: 40 }] };
        expect(cloud.summaries.get('alice')).toEqual(expected);
        expect(b.state.shownSummary).toEqual(expected);
        expect(b.sync.status).toBe('synced');
    });

    it('ログインしたとき、うつすことをえらぶと、ログインなしのスタンプとカードもアカウントに合わせて端末から消す', async () => {
        const cloud = new FakeCloud();
        cloud.summaries.set('alice', { stamps: [day(10)], clears: [], cards: [{ id: 'm01', paid: 40 }] });
        const d = device(cloud, { guestSummary: { stamps: [day(11)], clears: ['perfect:long-g3'], cards: [{ id: 'm02', paid: 80 }] } });
        d.auth.emit(null);
        await settle(d.sync);
        await d.sync.signIn();
        await settle(d.sync);
        expect(d.state.asked).toBe(1);
        expect(cloud.summaries.get('alice')).toEqual({
            stamps: [day(10), day(11)], clears: ['perfect:long-g3'], cards: [{ id: 'm01', paid: 40 }, { id: 'm02', paid: 80 }],
        });
        expect(d.state.guestSummary).toEqual(emptySummary());
        expect(d.state.shownSummary).toEqual(cloud.summaries.get('alice'));
    });

    it('変わっていなければ、まとめを書き直さない', async () => {
        const cloud = new FakeCloud();
        cloud.summaries.set('alice', { stamps: [day(10)], clears: [], cards: [] });
        const d = device(cloud);
        d.auth.emit('alice');
        await settle(d.sync);
        expect(cloud.summaryWrites ?? 0).toBe(0);
        d.sync.submitSummary({ stamps: [day(10)], clears: [], cards: [] });
        await settle(d.sync);
        expect(cloud.summaryWrites ?? 0).toBe(0);
    });

    it('送れなかった分は、つながったら送る。ログアウトすると、ログインなしの記録にもどる', async () => {
        const cloud = new FakeCloud();
        const d = device(cloud, { guestSummary: { stamps: [day(1)], clears: [], cards: [] }, migrate: false });
        d.auth.emit('alice');
        await settle(d.sync);
        cloud.fail = true;
        d.sync.submitSummary({ stamps: [day(12)], clears: [], cards: [] });
        await settle(d.sync);
        expect(d.sync.status).toBe('offline');
        cloud.fail = false;
        await wait(30);
        await settle(d.sync);
        expect(cloud.summaries.get('alice').stamps).toEqual([day(12)]);
        await d.sync.signOut();
        await settle(d.sync);
        expect(d.state.shownSummary).toBeNull();
        expect(d.state.guestSummary.stamps).toEqual([day(1)]);
        expect(d.sync.summary).toEqual(emptySummary());
    });
});
