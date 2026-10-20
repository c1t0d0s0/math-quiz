// 対戦の通信 (Firebase Realtime Database)。Firebase を使うのは、対戦ではこのファイルだけ。
// 対戦の画面を開いたときにだけ読みこむ。Wordlynx の対戦と同じしくみ。
import { signInAnonymously } from 'firebase/auth';
import {
    connectDatabaseEmulator,
    get,
    getDatabase,
    onDisconnect,
    onValue,
    ref,
    remove,
    runTransaction,
    serverTimestamp,
    set,
    update,
} from 'firebase/database';
import { COUNTDOWN_MS, ROOM_TTL_MS, freeSeat, makeCode, makeSeed, seatOf } from '../battle/battle.js';
import { firebaseApp, firebaseAuth } from './app.js';
import { useEmulator } from './config.js';

/** Realtime Database の中で、この算数チャレンジの部屋を置く場所 (Wordlynx の battles とは分ける) */
export const ROOT = 'mathBattles';

let db = null;

function database() {
    if (db) return db;
    db = getDatabase(firebaseApp());
    if (useEmulator) connectDatabaseEmulator(db, '127.0.0.1', 9000);
    return db;
}

/** 席の番号 (0〜7) は数字なので、Realtime Database から配列で返ってくることがある。いつも { 席: 記録 } の形にそろえる */
function normalize(val) {
    if (!val || typeof val !== 'object') return null;
    const players = {};
    Object.entries(val.players ?? {}).forEach(([seat, p]) => {
        if (p) players[seat] = p;
    });
    return { ...val, players };
}

/**
 * ログインしていなければ匿名でログインして、対戦の通信を始める。
 * もどり値は、対戦の画面から使う窓口
 */
export async function connectBattle() {
    const auth = firebaseAuth();
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
    const uid = auth.currentUser.uid;
    const d = database();
    const roomRef = code => ref(d, `${ROOT}/${code}`);
    const seatRef = (code, seat) => ref(d, `${ROOT}/${code}/players/${seat}`);

    let offset = 0;
    onValue(ref(d, '.info/serverTimeOffset'), (snap) => {
        offset = Number(snap.val()) || 0;
    });
    const serverNow = () => Date.now() + offset;

    // 自分の席 (部屋ごと)。つながり直したときに online をもどし、切れたときの予約をかけ直す
    const mySeat = new Map();
    const disconnects = new Map();
    onValue(ref(d, '.info/connected'), (snap) => {
        if (snap.val() !== true) return;
        mySeat.forEach((seat, code) => void markOnline(code, seat));
    });

    async function markOnline(code, seat) {
        const r = ref(d, `${ROOT}/${code}/players/${seat}/online`);
        const od = onDisconnect(r);
        disconnects.set(code, od);
        await od.set(false);
        await set(r, true).catch(() => {});
    }

    function freshPlayer(name, round) {
        return { uid, name, joinedAt: serverNow(), online: true, round, solved: 0, misses: 0 };
    }

    async function sit(code, seat, player) {
        await set(seatRef(code, seat), player);
        mySeat.set(code, seat);
        await markOnline(code, seat);
    }

    return {
        uid,
        serverNow,

        /** 部屋を作って、自分も席にすわる。もどり値は対戦コード */
        async create(grade, count, version, name) {
            for (let tries = 0; tries < 20; tries++) {
                const code = makeCode();
                const room = {
                    app: 'math-quiz',
                    hostUid: uid,
                    createdAt: serverTimestamp(),
                    grade,
                    count,
                    version,
                    round: 1,
                    seed: '',
                    status: 'waiting',
                    players: { 0: freshPlayer(name, 1) },
                };
                // 使われていない番号 (または1日以上前の古い部屋) のときだけ作る
                const now = serverNow();
                const result = await runTransaction(
                    roomRef(code),
                    current => (current && current.createdAt >= now - ROOM_TTL_MS ? undefined : room),
                    { applyLocally: false },
                );
                if (!result.committed) continue;
                mySeat.set(code, '0');
                await markOnline(code, '0');
                return code;
            }
            throw new Error('対戦コードを作れませんでした');
        },

        /** 部屋に入る (すでにすわっていれば、その席にもどる)。もどり値: 'ok' | 'missing' | 'started' | 'full' */
        async join(code, name) {
            for (let tries = 0; tries < 10; tries++) {
                const room = normalize((await get(roomRef(code))).val());
                if (!room) return 'missing';
                const mine = seatOf(room, uid);
                if (mine) {
                    // 前にすわっていた席にもどる (ページを読みこみ直したときなど)
                    mySeat.set(code, mine);
                    await update(seatRef(code, mine), { name });
                    await markOnline(code, mine);
                    return 'ok';
                }
                if (room.status !== 'waiting') return 'started';
                const seat = freeSeat(room);
                if (!seat) return 'full';
                try {
                    await sit(code, seat, freshPlayer(name, room.round));
                    return 'ok';
                } catch {
                    // ほぼ同時に、ほかの人が同じ席にすわった。もういちど空いている席をさがす
                }
            }
            return 'full';
        },

        /** 部屋のようすを見つづける。部屋がなくなると null が来る。もどり値は見るのをやめる関数 */
        watch(code, cb) {
            return onValue(roomRef(code), snap => cb(normalize(snap.val())), () => cb(null));
        },

        /** 次の回になっていたら、自分の記録をその回のはじめの形にもどす */
        async resetForRound(code, room) {
            const seat = mySeat.get(code);
            const me = seat ? room.players?.[seat] : undefined;
            if (!seat || !me || me.round === room.round) return;
            await set(seatRef(code, seat), { ...freshPlayer(me.name, room.round), joinedAt: me.joinedAt });
        },

        /** 解いた数とまちがえた数を知らせる */
        progress(code, solved, misses) {
            const seat = mySeat.get(code);
            if (seat) void update(seatRef(code, seat), { solved, misses }).catch(() => {});
        },

        /** 全問解き終わった。ゴールの時刻はサーバーの時計で記録する */
        async finish(code, solved, misses) {
            const seat = mySeat.get(code);
            if (seat) await update(seatRef(code, seat), { solved, misses, finishedAt: serverTimestamp() });
        },

        async retire(code) {
            const seat = mySeat.get(code);
            if (seat) await update(seatRef(code, seat), { retired: true });
        },

        /** ホストだけ: 新しい問題の種を決めて、カウントダウンを始める */
        async start(code) {
            await update(roomRef(code), { seed: makeSeed(), status: 'playing', startAt: serverNow() + COUNTDOWN_MS });
        },

        /** ホストだけ: まだ解いている人がいても、この回を終わりにする */
        async end(code) {
            await set(ref(d, `${ROOT}/${code}/status`), 'finished');
        },

        /** ホストだけ: 同じ部屋で、次の回の待ち画面にもどる */
        async rematch(code, round) {
            await update(roomRef(code), { round: round + 1, status: 'waiting', seed: '' });
        },

        /** 部屋を出る。ホストなら部屋ごと消す */
        async leave(code) {
            const seat = mySeat.get(code);
            mySeat.delete(code);
            await disconnects.get(code)?.cancel().catch(() => {});
            disconnects.delete(code);
            const room = normalize((await get(roomRef(code)).catch(() => null))?.val());
            if (!room) return;
            if (room.hostUid === uid) {
                await remove(roomRef(code)).catch(() => {});
            } else if (seat && room.players?.[seat]?.uid === uid) {
                // 待っている間なら席をあける。対戦のとちゅうなら、リタイアとして記録をのこす
                if (room.status === 'waiting') await remove(seatRef(code, seat)).catch(() => {});
                else await update(seatRef(code, seat), { online: false, retired: true }).catch(() => {});
            }
        },
    };
}
