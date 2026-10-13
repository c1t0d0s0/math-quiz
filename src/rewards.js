// スタンプ・ポイントのきまり。画面にも保存先にも関係しないので、Node だけでテストできる。
//
// ごほうびの記録 (summary) の形:
//   { stamps: ['2026-10-13', …],  スタンプをもらった日
//     clears: ['clear:addition', 'perfect:long-g3', …],  1回だけもらえる「やったね」の記録
//     cards:  [{ id: 'm01', paid: 40 }, …] }  交換したカードと、そのとき使ったポイント
//
// ポイントは合計を保存せず、スタンプと「やったね」の記録から毎回計算する (二重にもらったり取りこぼしたりしない)。

/** 1回のプレイでこの数以上正解すると、その日のスタンプがもらえる */
export const STAMP_SCORE = 5;
/** スタンプ1個でもらえるポイント (1日1個) */
export const STAMP_POINTS = 20;
/** 7日連続するたびにもらえるポイント */
export const WEEK_POINTS = 1000;
/** その月の1日から末日まで、すべてスタンプがそろうともらえるポイント */
export const MONTH_POINTS = 5000;
export const WEEK_LENGTH = 7;
/** 計算・文章問題で、1回のプレイでこの数以上正解すると「やったね」(モードごとに1回だけ) */
export const CLEAR_SCORE = 10;
export const CLEAR_POINTS = 20;
/** 長文チャレンジで全問正解すると「やったね」(モードごとに1回だけ) */
export const PERFECT_POINTS = 200;

export function emptySummary() {
    return { stamps: [], clears: [], cards: [] };
}

/** 日本時間の今日の日付 (YYYY-MM-DD) */
export function jstDate(now = new Date()) {
    return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export function addDays(date, days) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** 重複をのぞいて日付順にならべる */
export function normalizeStamps(stamps) {
    return [...new Set(stamps.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
}

/** 連続する日のかたまりごとの日数 */
export function runLengths(stamps) {
    const days = normalizeStamps(stamps);
    const runs = [];
    days.forEach((day, i) => {
        if (i > 0 && addDays(days[i - 1], 1) === day) runs[runs.length - 1]++;
        else runs.push(1);
    });
    return runs;
}

export function daysInMonth(month) {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** スタンプの日付から、これまでにもらったポイントを計算する */
export function earnedPoints(stamps) {
    const days = normalizeStamps(stamps);
    const weeks = runLengths(days).reduce((sum, len) => sum + Math.floor(len / WEEK_LENGTH), 0);
    const perMonth = new Map();
    for (const day of days) perMonth.set(day.slice(0, 7), (perMonth.get(day.slice(0, 7)) ?? 0) + 1);
    const months = [...perMonth].filter(([month, count]) => count === daysInMonth(month)).map(([month]) => month);
    return {
        days: days.length,
        weeks,
        months,
        total: days.length * STAMP_POINTS + weeks * WEEK_POINTS + months.length * MONTH_POINTS,
    };
}

/** date の日まで何日つづいているか (date にスタンプがなければ 0) */
export function runEndingAt(stamps, date) {
    const set = new Set(stamps);
    let n = 0;
    for (let d = date; set.has(d); d = addDays(d, -1)) n++;
    return n;
}

/** 今つづいている日数。今日がまだでも、きのうまで続いていれば数える */
export function currentRun(stamps, today) {
    return runEndingAt(stamps, today) || runEndingAt(stamps, addDays(today, -1));
}

/** その月の1日から順に、スタンプがあるかどうか */
export function monthView(stamps, month) {
    const set = new Set(stamps);
    return Array.from({ length: daysInMonth(month) }, (_, i) => set.has(`${month}-${String(i + 1).padStart(2, '0')}`));
}

/** そのプレイが「やったね」にあたるなら、その記録の名前。あたらなければ null */
export function achievement(mode, score, total) {
    if (mode.kind === 'long') return total > 0 && score === total ? `perfect:${mode.id}` : null;
    return score >= CLEAR_SCORE ? `clear:${mode.id}` : null;
}

/** 「やったね」の記録1つでもらえるポイント (知らない名前は 0) */
export function clearPoints(id) {
    if (typeof id !== 'string') return 0;
    if (id.startsWith('perfect:')) return PERFECT_POINTS;
    if (id.startsWith('clear:')) return CLEAR_POINTS;
    return 0;
}

/** 今つかえるポイント = スタンプと「やったね」でもらった分 − カードに使った分 */
export function balance(summary) {
    return earnedPoints(summary.stamps).total
        + [...new Set(summary.clears)].reduce((sum, id) => sum + clearPoints(id), 0)
        - summary.cards.reduce((sum, c) => sum + c.paid, 0);
}

/**
 * 1回のプレイが終わったときの、ごほうび。
 * もどり値の summary は、スタンプと「やったね」を足したあとの記録 (変わらなければ、もとのまま)。
 */
export function playReward(summary, mode, score, total, today) {
    const before = balance(summary);
    const stampAdded = score >= STAMP_SCORE && !summary.stamps.includes(today);
    const stamps = stampAdded ? normalizeStamps([...summary.stamps, today]) : summary.stamps;
    const a = earnedPoints(summary.stamps);
    const b = earnedPoints(stamps);

    const id = achievement(mode, score, total);
    const clearAdded = id !== null && !summary.clears.includes(id);
    const clears = clearAdded ? [...summary.clears, id].sort() : summary.clears;

    const next = stampAdded || clearAdded ? { ...summary, stamps, clears } : summary;
    return {
        summary: next,
        stampAdded,
        /** 今日まで何日つづいているか */
        run: runEndingAt(stamps, today),
        stampPoints: stampAdded ? STAMP_POINTS : 0,
        weekPoints: (b.weeks - a.weeks) * WEEK_POINTS,
        monthPoints: (b.months.length - a.months.length) * MONTH_POINTS,
        clearPoints: clearAdded ? clearPoints(id) : 0,
        gained: balance(next) - before,
        balance: balance(next),
    };
}

/** ポイントとカードを交換したあとの記録。足りないときや、もう持っているときは null */
export function buyCard(summary, card) {
    if (summary.cards.some(c => c.id === card.id) || balance(summary) < card.price) return null;
    return { ...summary, cards: [...summary.cards, { id: card.id, paid: card.price }] };
}

// ---- 2か所にある記録を合わせる (この端末と Firestore など) ----
// 何回合わせても、順番を入れかえても、同じ結果になる

/** カード: 両方を合わせる。同じカードは、払った額の小さいほう */
function mergeCards(a, b) {
    const paid = new Map();
    for (const c of [...a, ...b]) {
        if (typeof c?.id === 'string' && c.paid >= 0) paid.set(c.id, Math.min(c.paid, paid.get(c.id) ?? Infinity));
    }
    return [...paid].map(([id, p]) => ({ id, paid: p })).sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}

export function mergeSummary(a, b) {
    return {
        stamps: normalizeStamps([...a.stamps, ...b.stamps]),
        clears: [...new Set([...a.clears, ...b.clears].filter(id => clearPoints(id) > 0))].sort(),
        cards: mergeCards(a.cards, b.cards),
    };
}

export function sameSummary(a, b) {
    return JSON.stringify(mergeSummary(a, a)) === JSON.stringify(mergeSummary(b, b));
}

/** 記録が1つでもあるか */
export function hasSummary(summary) {
    return summary.stamps.length > 0 || summary.clears.length > 0 || summary.cards.length > 0;
}
