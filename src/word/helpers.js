import { gcd } from '../generators/rng.js';

/**
 * 浮動小数の誤差を落として文字列にする（0.30000000000000004 → "0.3"）
 */
export function fmtNum(v) {
    return String(Math.round(v * 1000) / 1000);
}

/**
 * トピック単位でパターンをまとめて定義する。ID は `${prefix}-01` からの連番
 */
export function defineTopic(prefix, topic, generators) {
    return generators.map((generate, i) => ({
        id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
        topic,
        generate,
    }));
}

/** 約分した分数の文字列（整数になるときは整数） */
export function frac(n, d) {
    const g = gcd(n, d);
    return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`;
}

/** 分数の答えに対する誤答候補 */
export function fracWrongs(n, d) {
    const g = gcd(n, d);
    const [a, b] = [n / g, d / g];
    const list = [frac(a + 1, b), frac(a, b + 1), frac(b, a), frac(a + 2, b), frac(a, b + 2)];
    if (a > 1) {
        list.push(frac(a - 1, b));
    }
    return list;
}

/** 分を「3時20分」の形にする（12時間制、ちょうどの時は「3時」） */
export function clock(totalMinutes, prefix = '') {
    const t = ((totalMinutes % 720) + 720) % 720;
    const h = Math.floor(t / 60) || 12;
    const m = t % 60;
    return m === 0 ? `${prefix}${h}時` : `${prefix}${h}時${m}分`;
}

/** 時こくの答えに対する誤答候補 */
export function clockWrongs(totalMinutes, prefix = '') {
    return [10, -10, 60, -60, 20, 5].map(d => clock(totalMinutes + d, prefix));
}

/** 分を「1時間20分」の形にする */
export function hourMin(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** 大きい単位と小さい単位の組（1km200m、2kg500g など）。per は 1大単位あたりの小単位 */
export function compound(total, per, big, small) {
    const b = Math.floor(total / per);
    const s = total % per;
    if (b === 0) return `${s}${small}`;
    return s === 0 ? `${b}${big}` : `${b}${big}${s}${small}`;
}

function autoStep(answer) {
    if (!Number.isInteger(answer)) {
        const decimals = (fmtNum(answer).split('.')[1] || '').length;
        return decimals >= 2 ? 0.01 : 0.1;
    }
    if (answer >= 1000 && answer % 100 === 0) return 100;
    if (answer >= 100 && answer % 10 === 0) return 10;
    if (answer >= 200 && answer % 5 === 0) return 5;
    return 1;
}

/**
 * パターンの生成結果から4択問題を組み立てる
 *
 * res: { text, answer, unit?, prefix?, wrong?, step? }
 *  - answer が数値: wrong（典型的な誤り）を優先し、足りない分は近い値で補う
 *  - answer が文字列: wrong に3つ以上の異なる誤答が必要
 */
export function buildQuestion(res, r) {
    const { text, answer, unit = '', prefix = '', wrong = [] } = res;

    if (typeof answer === 'string') {
        const options = [answer];
        for (const w of wrong) {
            if (options.length < 4 && !options.includes(w)) {
                options.push(w);
            }
        }
        if (options.length < 4) {
            throw new Error(`誤答が足りません: ${text}`);
        }
        return { question: text, options: r.shuffle(options), answer };
    }

    if (!Number.isFinite(answer) || answer <= 0) {
        throw new Error(`答えが正の数ではありません (${answer}): ${text}`);
    }

    const values = [answer];
    const keys = new Set([fmtNum(answer)]);
    const isInt = Number.isInteger(answer);
    const add = (v) => {
        if (values.length >= 4 || !Number.isFinite(v) || v <= 0) return;
        if (isInt && !Number.isInteger(v)) return;
        const key = fmtNum(v);
        if (keys.has(key)) return;
        keys.add(key);
        values.push(Number(key));
    };

    wrong.forEach(add);

    const step = res.step ?? autoStep(answer);
    for (let i = 0; i < 200 && values.length < 4; i++) {
        add(answer + r.int(1, 5) * step * (r.bool() ? 1 : -1));
    }
    for (let k = 6; values.length < 4; k++) {
        add(answer + k * step);
    }

    const fmt = v => `${prefix}${fmtNum(v)}${unit}`;
    return {
        question: text,
        options: r.shuffle(values).map(fmt),
        answer: fmt(answer),
    };
}

// 10択で近い値を作るときの間かく。きりのよい数でも、小さい数なら1ずつにする
// （110 に対して 10・20・40… のように、かけはなれた値がならぶのをさけるため）
function choiceStep(answer) {
    if (!Number.isInteger(answer)) return autoStep(answer);
    if (answer >= 2000 && answer % 100 === 0) return 100;
    if (answer >= 300 && answer % 10 === 0) return 10;
    return 1;
}

/**
 * 長文問題用の多肢選択（既定10択）を組み立てる。答えは数値のみ
 *
 * q: { text, answer, unit?, prefix?, format?, wrong?, step? }
 *  - format(v) があれば、数値を表示用の文字列にするのに使う（時こく、分数、比 など）
 *  - 正解より小さい選択肢の数を先にランダムに決め、その数に合わせて
 *    典型的な誤り（wrong）と近い値を入れるので、正解の位置はかたよらない
 *  - 選択肢は小さい順に並べて返す
 */
export function buildChoices(q, r, count = 10) {
    const { text, answer, unit = '', prefix = '', wrong = [] } = q;
    if (!Number.isFinite(answer) || answer <= 0) {
        throw new Error(`答えが正の数ではありません (${answer}): ${text}`);
    }
    const fmt = q.format || (v => `${prefix}${fmtNum(v)}${unit}`);
    const isInt = Number.isInteger(answer);
    const step = q.step ?? choiceStep(answer);
    const norm = v => Number(fmtNum(v));

    const below = [];
    const above = [];
    const labels = new Set([fmt(answer)]);
    const tryAdd = (raw, list, limit) => {
        const v = norm(raw);
        if (list.length >= limit || !Number.isFinite(v) || v <= 0) return false;
        if (isInt && !Number.isInteger(v)) return false;
        const label = fmt(v);
        if (labels.has(label)) return false;
        labels.add(label);
        list.push(v);
        return true;
    };

    const wantBelow = r.int(0, count - 1);
    const wantAbove = count - 1 - wantBelow;
    for (const w of r.shuffle(wrong)) {
        if (w < answer) tryAdd(w, below, wantBelow);
        else if (w > answer) tryAdd(w, above, wantAbove);
    }

    // 近い値で補う。間かくは step の1〜2倍にして、等間かくにならないようにする
    let v = answer;
    for (let i = 0; i < 60 && below.length < wantBelow; i++) {
        v -= step * r.int(1, 2);
        if (v <= 0) break;
        tryAdd(v, below, wantBelow);
    }
    v = answer;
    for (let i = 0; i < 200 && below.length + above.length < count - 1; i++) {
        v += step * r.int(1, 2);
        tryAdd(v, above, count);
    }
    if (below.length + above.length < count - 1) {
        throw new Error(`選択肢を${count}個作れません: ${text}`);
    }

    const values = [...below, answer, ...above].sort((a, b) => a - b);
    return { question: text, options: values.map(fmt), answer: fmt(answer) };
}
