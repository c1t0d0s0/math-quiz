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
/** 対戦で1位になるともらえるポイントと、最後まで解いて1位以外だったときのポイント */
export const BATTLE_WIN_POINTS = 20;
export const BATTLE_LOSE_POINTS = 10;
/** 対戦のポイントがもらえるのは、1日にこの回数まで */
export const BATTLE_DAILY_LIMIT = 5;

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
    // 今日のチャレンジは毎日あるので、「やったね」はつけない (スタンプはもらえる)
    if (mode.kind === 'daily') return null;
    if (mode.kind === 'long') return total > 0 && score === total ? `perfect:${mode.id}` : null;
    return score >= CLEAR_SCORE ? `clear:${mode.id}` : null;
}

// 対戦の結果は「やったね」と同じ記録 (clears) に、battle:<日付>:<部屋のコード>-<回>:win|lose として入れる
const BATTLE_ID = /^battle:(\d{4}-\d{2}-\d{2}):(\d{5}-\d+):(win|lose)$/;

/** 対戦の結果の記録の名前 */
export function battleId(date, code, round, outcome) {
    return `battle:${date}:${code}-${round}:${outcome}`;
}

/** 対戦の結果1つでもらえるポイント (対戦の記録でなければ 0) */
function battlePoints(id) {
    const m = typeof id === 'string' ? id.match(BATTLE_ID) : null;
    if (!m) return 0;
    return m[3] === 'win' ? BATTLE_WIN_POINTS : BATTLE_LOSE_POINTS;
}

/**
 * 対戦でもらったポイントの合計。同じ回は1回だけ、1日 BATTLE_DAILY_LIMIT 回分までを数える
 * (記録がそれより多くあっても数えない。2台の記録を合わせても同じ結果になる)
 */
export function battleTotal(clears) {
    const byRound = new Map();
    for (const id of new Set(clears)) {
        const m = typeof id === 'string' ? id.match(BATTLE_ID) : null;
        if (!m) continue;
        const key = `${m[1]}:${m[2]}`;
        byRound.set(key, Math.max(byRound.get(key) ?? 0, battlePoints(id)));
    }
    const byDate = new Map();
    for (const [key, points] of byRound) {
        const date = key.slice(0, 10);
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date).push(points);
    }
    let total = 0;
    for (const list of byDate.values()) {
        total += list.sort((a, b) => b - a).slice(0, BATTLE_DAILY_LIMIT).reduce((s, p) => s + p, 0);
    }
    return total;
}

/** その日に、ポイントをもらった対戦の回数 */
export function battlesOn(clears, date) {
    const rounds = new Set();
    for (const id of clears) {
        const m = typeof id === 'string' ? id.match(BATTLE_ID) : null;
        if (m && m[1] === date) rounds.add(m[2]);
    }
    return rounds.size;
}

/**
 * 対戦の結果をつけたあとの記録。ポイントがもらえないとき (今日の分はおしまい・この回はもうつけた) は、もとのまま。
 * もどり値: { summary, points: もらったポイント, remaining: 今日あと何回もらえるか }
 */
export function battleReward(summary, date, code, round, outcome) {
    const already = summary.clears.some(id => id.startsWith(`battle:${date}:${code}-${round}:`));
    const count = battlesOn(summary.clears, date);
    if (already || count >= BATTLE_DAILY_LIMIT) {
        return { summary, points: 0, remaining: Math.max(0, BATTLE_DAILY_LIMIT - count), already };
    }
    const next = { ...summary, clears: [...summary.clears, battleId(date, code, round, outcome)].sort() };
    return {
        summary: next,
        points: outcome === 'win' ? BATTLE_WIN_POINTS : BATTLE_LOSE_POINTS,
        remaining: BATTLE_DAILY_LIMIT - count - 1,
        already: false,
    };
}

/** 「やったね」の記録1つでもらえるポイント (知らない名前は 0。対戦の記録は battleTotal で数える) */
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
        + battleTotal(summary.clears)
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
        clears: [...new Set([...a.clears, ...b.clears].filter(id => clearPoints(id) > 0 || battlePoints(id) > 0))].sort(),
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
