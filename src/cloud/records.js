import { emptySummary, mergeSummary } from '../rewards.js';

// 記録（モードごとの最高記録）の形と、2か所にある記録の合わせ方。
// 画面にも Firebase にも関係しないので、Node だけでテストできる。
//
// 記録1つ: { score: 正解数, seconds: かかった秒数 }（時間を記録しないモードでは seconds は 0）
// 1人分:   { [モードの id]: 記録 }

// ---- Firestore に保存する形 (小学生向けの学習アプリで共通。Wordlynx と同じ) ----
//
//   users/{uid}                                その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
//   users/{uid}/apps/{appId}                   アプリごとの記録のまとめ。スタンプ・ポイントのもと・カード
//   users/{uid}/apps/{appId}/progress/{itemId} 教材1つごとの記録。このアプリではモードごとの最高記録
//
// このアプリの appId は "math-quiz"。

export const SCHEMA = 1;
export const APP_ID = 'math-quiz';

/** a のほうが b よりよい記録か。正解数が多いほう。同じなら、時間が短いほう */
export function isBetter(a, b) {
    if (!a || !(a.score > 0)) return false;
    if (!b) return true;
    if (a.score !== b.score) return a.score > b.score;
    return a.seconds > 0 && (!(b.seconds > 0) || a.seconds < b.seconds);
}

export function sameRecord(a, b) {
    return !!a && !!b && a.score === b.score && a.seconds === b.seconds;
}

/**
 * 2か所の記録を合わせる。モードごとに、よいほうを残す。
 * 何回合わせても同じ結果になるので、通信に失敗してやり直しても記録はこわれない。
 */
export function mergeRecords(a, b) {
    const out = {};
    for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
        const best = isBetter(b[id], a[id]) ? b[id] : a[id];
        if (best && best.score > 0) out[id] = { score: best.score, seconds: best.seconds || 0 };
    }
    return out;
}

export function hasRecords(records) {
    return Object.values(records).some(r => r.score > 0);
}

/**
 * アプリごとのまとめ。スタンプ・「やったね」の記録・カードを、共通の項目に入れる
 *   activeDays: スタンプをもらった日 / completed: 「やったね」の記録 / inventory: 交換したリスザルカード
 */
export function toAppDoc(summary, now) {
    return {
        schema: SCHEMA,
        updatedAt: now,
        activeDays: summary.stamps,
        completed: summary.clears,
        inventory: Object.fromEntries(summary.cards.map(c => [c.id, { paid: c.paid }])),
        spent: {},
        settings: {},
    };
}

const strings = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);

/** Firestore から読んだものは形がくずれているかもしれないので、確かめながらもどす */
export function fromAppDoc(doc) {
    const cards = [];
    for (const [id, item] of Object.entries(doc?.inventory ?? {})) {
        if (typeof item?.paid === 'number' && item.paid >= 0) cards.push({ id, paid: item.paid });
    }
    return mergeSummary(emptySummary(), { stamps: strings(doc?.activeDays), clears: strings(doc?.completed), cards });
}

export function toProgressDoc(record, now) {
    return { schema: SCHEMA, updatedAt: now, status: 'done', data: { score: record.score, seconds: record.seconds || 0 } };
}

/** Firestore から読んだものは形がくずれているかもしれないので、確かめながらもどす */
export function fromProgressDoc(doc) {
    const d = doc?.data;
    if (!d || !Number.isInteger(d.score) || d.score <= 0) return null;
    return { score: d.score, seconds: Number.isInteger(d.seconds) && d.seconds > 0 ? d.seconds : 0 };
}
