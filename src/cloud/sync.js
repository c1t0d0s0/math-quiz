import { hasRecords, isBetter, mergeRecords, sameRecord } from './records.js';

/**
 * ログイン中の人の記録を Firestore に保存する。
 *
 * - ログインしている間は、記録を localStorage には書かず、このクラスが持つ records と Firestore に入れる
 * - ログインしたときに Firestore の記録を読み、(のぞめば) この端末にあったログインなしの記録と合わせる
 * - 新しい記録が出たら、Firestore にある記録とくらべて、よいほうを書く (ほかの端末の記録を消さないように)
 * - 送れなかったら、あとでもう一度ためす
 *
 * remote: Firestore とのやりとり。テストでは、メモリ上の代用品に差しかえる
 *   loadAll(uid)              → { exists: まとめがあるか, records }
 *   loadRecord(uid, modeId)   → 記録 | null
 *   saveSummary(uid)          その人の情報と、アプリごとのまとめを作る
 *   saveRecord(uid, modeId, record)
 * auth: ログインのやりとり
 *   onUser(cb)  ログインの状態が分かったとき・変わったときに cb(uid | null)
 *   signIn() / signOut()
 * hooks:
 *   onStatus(sync)          表示している状態 (ログイン中か、保存ずみか) が変わった
 *   onRecords(records, sync) 見せる記録が変わった。ログアウトしたときは null (ログインなしの記録を見せる)
 *   askMigrate()        ログインしたとき、この端末にログインなしの記録があった。アカウントにうつすかどうか
 *   readGuest() / clearGuest()  この端末の、ログインなしの記録
 *
 * status:
 *   loading: ログインしているかどうかを確かめている
 *   signed-out: ログインしていない (記録はこの端末だけ)
 *   syncing: Firestore に送っている / 読みこんでいる
 *   synced: Firestore と同じになっている
 *   offline: 送れていない記録がある (つながったら送る)
 */
export class RecordSync {
    constructor(remote, auth, hooks, opts = {}) {
        this.remote = remote;
        this.auth = auth;
        this.hooks = hooks;
        this.retryMs = opts.retryMs ?? 15000;

        this.uid = null;
        this.status = 'loading';
        /** ログイン中の人の記録 */
        this.records = {};
        /** ログインしたあと、Firestore の記録を読み終わったか */
        this.loaded = false;

        this.dirty = new Set();
        this.timer = null;
        this.chain = Promise.resolve();
        this.interactive = false;
        this.needsFull = false;
        this.migrate = false;
    }

    start() {
        this.auth.onUser((uid) => {
            void this.enqueue(() => this.handleUser(uid));
        });
    }

    /** ボタンからのログイン。ここから始まったログインのときだけ、記録をうつすかどうかを聞く */
    async signIn() {
        this.interactive = true;
        try {
            await this.auth.signIn();
        } catch (err) {
            this.interactive = false;
            throw err;
        }
    }

    /** ログイン中に新しい記録が出た。おぼえておいて、Firestore に送る */
    submit(modeId, record) {
        if (this.uid === null) return;
        if (isBetter(record, this.records[modeId])) this.records[modeId] = record;
        this.dirty.add(modeId);
        this.setStatus('syncing');
        void this.enqueue(() => this.push());
    }

    /** まだ Firestore に送れていない記録があるか */
    hasPending() {
        return this.uid !== null && (this.dirty.size > 0 || this.needsFull);
    }

    /** たまっている記録を、今すぐ送る */
    flush() {
        this.clearTimer();
        return this.enqueue(() => this.push());
    }

    /**
     * ログアウトする。送れていない記録があるときは、force を付けないかぎりログアウトせず 'unsynced' を返す
     * (ログイン中の記録は端末に残さないので、送れていない分は失われる)。
     */
    async signOut(force = false) {
        await this.flush();
        if (this.hasPending() && !force) return 'unsynced';
        await this.auth.signOut();
        return 'ok';
    }

    // ---- ここから下は中の処理 ----

    /** 処理が重ならないよう、1つずつ順番に行う */
    enqueue(job) {
        this.chain = this.chain.then(job, job);
        return this.chain;
    }

    setStatus(status) {
        if (this.status === status) return;
        this.status = status;
        this.hooks.onStatus(this);
    }

    clearTimer() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
    }

    schedule(ms) {
        this.clearTimer();
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.enqueue(() => this.push());
        }, ms);
    }

    async handleUser(uid) {
        if (uid === null) {
            // ログアウトした (または、ログインしていなかった)。ログインなしの記録にもどす
            this.clearTimer();
            this.dirty.clear();
            this.needsFull = false;
            this.interactive = false;
            this.migrate = false;
            this.uid = null;
            this.records = {};
            this.loaded = false;
            this.hooks.onRecords(null, this);
            this.setStatus('signed-out');
            return;
        }
        if (uid === this.uid) return;

        // この端末にログインなしの記録があれば、うつすかどうかを聞く (ボタンからログインしたときだけ)
        const guest = this.hooks.readGuest();
        this.migrate = this.interactive && hasRecords(guest) && (await this.hooks.askMigrate());
        this.interactive = false;

        this.uid = uid;
        this.records = this.migrate ? mergeRecords(guest, {}) : {};
        this.loaded = false;
        this.dirty.clear();
        this.needsFull = true;
        this.hooks.onRecords(this.records, this);
        await this.push();
    }

    async push() {
        const uid = this.uid;
        if (uid === null || !this.hasPending()) return;
        this.setStatus('syncing');
        const ids = [...this.dirty];
        this.dirty.clear();
        try {
            if (this.needsFull) await this.fullSync(uid);
            else await this.sendChanges(uid, ids);
            if (this.uid !== uid) return; // 送っている間にログアウトした
            this.setStatus(this.hasPending() ? 'syncing' : 'synced');
        } catch {
            if (this.uid !== uid) return;
            // 送れなかった分は、もう一度送るものとしておぼえておく
            for (const id of ids) this.dirty.add(id);
            this.setStatus('offline');
            this.schedule(this.retryMs);
        }
    }

    /** Firestore の記録を全部読んで、手元の記録と合わせる (ログインした直後に1回) */
    async fullSync(uid) {
        const remote = await this.remote.loadAll(uid);
        if (this.uid !== uid) return;

        // 読んでいる間に出た記録も this.records に入っているので、いっしょに合わせる
        const merged = mergeRecords(remote.records, this.records);
        if (!remote.exists) await this.remote.saveSummary(uid);
        for (const [id, record] of Object.entries(merged)) {
            if (!sameRecord(remote.records[id], record)) await this.remote.saveRecord(uid, id, record);
        }
        if (this.uid !== uid) return;

        // Firestore に入ったのを確かめてから、ログインなしの記録を消す (二重にうつらないように)
        if (this.migrate) {
            this.hooks.clearGuest();
            this.migrate = false;
        }
        this.records = mergeRecords(merged, this.records);
        this.needsFull = false;
        this.loaded = true;
        this.hooks.onStatus(this);
        this.hooks.onRecords(this.records, this);
    }

    /** 新しく出た記録だけを送る。ほかの端末でもっとよい記録が出ていたら、そちらを残す */
    async sendChanges(uid, ids) {
        let changed = false;
        for (const id of ids) {
            const mine = this.records[id];
            const theirs = await this.remote.loadRecord(uid, id);
            if (this.uid !== uid) return;
            const best = isBetter(theirs, mine) ? theirs : mine;
            if (!best) continue;
            if (!sameRecord(best, this.records[id]) && !isBetter(this.records[id], best)) {
                this.records[id] = best;
                changed = true;
            }
            if (!sameRecord(theirs, best)) await this.remote.saveRecord(uid, id, best);
        }
        if (changed && this.uid === uid) this.hooks.onRecords(this.records, this);
    }
}
