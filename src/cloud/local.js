import { MODES } from '../modes.js';

// ログインしていないときの記録。この端末の localStorage に保存する。
// キーは以前のバージョンと同じ（記録を引き継ぐため）
const scoreKey = modeId => `math_quiz_highscore_${modeId}`;
// 長文チャレンジで、最高記録を出したときにかかった秒数
const timeKey = modeId => `math_quiz_besttime_${modeId}`;
// 前にログインしたままだったか。ページを開いた直後、ログインを確かめ終わる前に、
// ログインなしの記録を一瞬見せてしまわないために使う（記録そのものは入れない）
const SIGNED_IN_KEY = 'math_quiz_signed_in';

function readNumber(key) {
    try {
        return parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch {
        return 0;
    }
}

/** この端末にある、ログインなしの記録 */
export function readLocalRecords() {
    const records = {};
    for (const mode of MODES) {
        const score = readNumber(scoreKey(mode.id));
        if (score > 0) records[mode.id] = { score, seconds: readNumber(timeKey(mode.id)) };
    }
    return records;
}

export function writeLocalRecord(modeId, record) {
    try {
        localStorage.setItem(scoreKey(modeId), String(record.score));
        if (record.seconds > 0) localStorage.setItem(timeKey(modeId), String(record.seconds));
        else localStorage.removeItem(timeKey(modeId));
    } catch {
        // 保存できなくても、この画面の間は記録を表示する
    }
}

/** ログインなしの記録を消す（アカウントにうつしたあと、二重にうつらないように） */
export function clearLocalRecords() {
    try {
        for (const mode of MODES) {
            localStorage.removeItem(scoreKey(mode.id));
            localStorage.removeItem(timeKey(mode.id));
        }
    } catch {
        // 消せなくても続ける
    }
}

export function wasSignedIn() {
    try {
        return localStorage.getItem(SIGNED_IN_KEY) === '1';
    } catch {
        return false;
    }
}

export function rememberSignedIn(signedIn) {
    try {
        if (signedIn) localStorage.setItem(SIGNED_IN_KEY, '1');
        else localStorage.removeItem(SIGNED_IN_KEY);
    } catch {
        // おぼえられなくても続ける
    }
}
