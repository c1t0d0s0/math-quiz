// 対戦 (同じ問題を何人かで同時に解いて、タイムを競う) の決まりごと。
// 通信や画面には依存しない関数だけを置く (Wordlynx の対戦と同じ考え方)。

/** 1つの部屋に入れる人数 */
export const MAX_PLAYERS = 8;
/** 名前の長さ (文字数) */
export const NAME_MAX = 10;
/** スタートを押してから、問題が出るまで */
export const COUNTDOWN_MS = 3500;
/** 作ってからこれだけたった部屋は、だれが消してもよい (Realtime Database のルールと同じ値) */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * mathBattles/{code}
 *   app: 'math-quiz', hostUid, createdAt, grade: 1〜6, count: 5 | 10 | 20, version: 問題の作り方の指紋
 *   round: 1, 2, …, seed, status: 'waiting' | 'playing' | 'finished', startAt
 *   players/{seat}: { uid, name, joinedAt, online, round, solved, misses, finishedAt?, retired? }
 */

/** 空いている席の番号。満席なら null */
export function freeSeat(room) {
    for (let i = 0; i < MAX_PLAYERS; i++) if (!room.players?.[i]) return String(i);
    return null;
}

/** その人がすわっている席の番号 */
export function seatOf(room, uid) {
    const found = Object.entries(room.players ?? {}).find(([, p]) => p.uid === uid);
    return found ? found[0] : null;
}

/** 対戦コード: 数字5けた (0 から始まる番号は使わない) */
export function makeCode(random = Math.random) {
    return String(10000 + Math.floor(random() * 90000));
}

export function isCode(s) {
    return /^[1-9]\d{4}$/.test(s);
}

/** 打ちこまれたコードを整える (全角数字・空白・ハイフンを許す) */
export function parseCode(input) {
    const s = String(input).replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0)).replace(/[\s\-ー－]/g, '');
    return isCode(s) ? s : null;
}

/** 対戦ごとの乱数の種 */
export function makeSeed(random = Math.random) {
    let s = '';
    for (let i = 0; i < 10; i++) s += Math.floor(random() * 36).toString(36);
    return s;
}

/** 名前を整える。前後の空白と制御文字を消し、続く空白は1つにして、NAME_MAX 文字までにする */
export function cleanName(input) {
    const s = String(input).replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, '').replace(/\s+/g, ' ').trim();
    return [...s].slice(0, NAME_MAX).join('');
}

/**
 * 今の回の順位表。解き終わった人はタイムの速い順、まだ解いている人は解いた数の多い順、
 * そのあとにリタイアした人、対戦のとちゅうでぬけた人。同じタイムは同じ順位
 */
export function standings(room) {
    const rows = Object.values(room.players ?? {}).map((p) => {
        const current = p.round === room.round;
        let status = 'playing';
        let timeMs = null;
        if (current && typeof p.finishedAt === 'number' && typeof room.startAt === 'number') {
            status = 'done';
            timeMs = Math.max(0, p.finishedAt - room.startAt);
        } else if (current && p.retired) status = 'retired';
        else if (!p.online) status = 'left';
        return {
            uid: p.uid,
            name: p.name,
            status,
            rank: null,
            timeMs,
            solved: current ? p.solved || 0 : 0,
            misses: current ? p.misses || 0 : 0,
            online: p.online,
        };
    });
    const order = { done: 0, playing: 1, retired: 2, left: 3 };
    rows.sort((a, b) => order[a.status] - order[b.status]
        || (a.timeMs ?? 0) - (b.timeMs ?? 0)
        || b.solved - a.solved
        || a.name.localeCompare(b.name, 'ja'));
    let prev = null;
    rows.forEach((row, i) => {
        if (row.status !== 'done') return;
        row.rank = prev && prev.timeMs === row.timeMs ? prev.rank : i + 1;
        prev = row;
    });
    return rows;
}

/** まだ解いている人がいないか (全員が、解き終わったか・リタイアしたか・ぬけた) */
export function everyoneDone(room) {
    return standings(room).every(s => s.status !== 'playing');
}

/**
 * この回の自分の結果 (ポイントのため)。1位 (同じタイムもふくむ) は 'win'、最後まで解いたそれ以外は 'lose'、
 * 解き終わっていない (リタイア・退出) ときは null。回の結果が決まる前 (まだ解いている人がいる) も null
 */
export function battleOutcome(room, uid) {
    if (room.status !== 'finished' && !everyoneDone(room)) return null;
    const me = standings(room).find(s => s.uid === uid);
    if (!me || me.status !== 'done') return null;
    return me.rank === 1 ? 'win' : 'lose';
}

/** 1:05 や 12:30 の形 */
export function formatMs(ms) {
    const total = Math.floor(Math.max(0, ms) / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
}
