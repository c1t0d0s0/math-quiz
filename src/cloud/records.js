import { emptySummary, mergeSummary } from '../rewards.js';

// 記録（モードごとの最高記録）の形と、2か所にある記録の合わせ方。
// 画面にも Firebase にも関係しないので、Node だけでテストできる。
//
// 記録1つ: { score: 正解数, seconds: かかった秒数 }（時間を記録しないモードでは seconds は 0）
//          今日のチャレンジだけは { score, seconds, date: その記録を出した日 }。新しい日の記録が、前の日の記録に勝つ
//          長文チャレンジと図形チャレンジは { score, seconds, perfect?: いちばん新しい、全問正解した日 }。
//          perfect は、記録のよしあしをくらべるときには使わない (ホームの花丸を、その日だけ出すのに使う)
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

/** a のほうが b よりよい記録か。(日付があれば新しい日のほう。) 正解数が多いほう。同じなら、時間が短いほう */
export function isBetter(a, b) {
    if (!a || !(a.score > 0)) return false;
    if (!b) return true;
    if ((a.date ?? '') !== (b.date ?? '')) return (a.date ?? '') > (b.date ?? '');
    if (a.score !== b.score) return a.score > b.score;
    return a.seconds > 0 && (!(b.seconds > 0) || a.seconds < b.seconds);
}

export function sameRecord(a, b) {
    return !!a && !!b && a.score === b.score && a.seconds === b.seconds && (a.date ?? '') === (b.date ?? '')
        && (a.perfect ?? '') === (b.perfect ?? '');
}

const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 決まった項目だけを持つ記録にする */
function clean(record) {
    const out = { score: record.score, seconds: record.seconds || 0 };
    if (isDate(record.date)) out.date = record.date;
    if (isDate(record.perfect)) out.perfect = record.perfect;
    return out;
}

/**
 * 2つの記録を1つにする。よいほうの記録に、2つのうち新しいほうの「全問正解した日」をつける。
 * 全問正解でも最高記録より時間がかかったときは、記録はそのままで、全問正解した日だけ新しくなる。
 * どちらにも記録がなければ undefined
 */
export function combineRecords(a, b) {
    const best = isBetter(b, a) ? b : a;
    if (!best || !(best.score > 0)) return undefined;
    const perfect = [a?.perfect, b?.perfect].filter(isDate).sort().pop();
    return clean(perfect ? { ...best, perfect } : best);
}

/**
 * 2か所の記録を合わせる。モードごとに、よいほうを残す。
 * 何回合わせても同じ結果になるので、通信に失敗してやり直しても記録はこわれない。
 */
export function mergeRecords(a, b) {
    const out = {};
    for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
        const record = combineRecords(a[id], b[id]);
        if (record) out[id] = record;
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
    return { schema: SCHEMA, updatedAt: now, status: 'done', data: clean(record) };
}

/** Firestore から読んだものは形がくずれているかもしれないので、確かめながらもどす */
export function fromProgressDoc(doc) {
    const d = doc?.data;
    if (!d || !Number.isInteger(d.score) || d.score <= 0) return null;
    return clean({ score: d.score, seconds: Number.isInteger(d.seconds) && d.seconds > 0 ? d.seconds : 0, date: d.date, perfect: d.perfect });
}
