import { buildQuestion, compound, fmtNum, frac, fracWrongs } from '../word/helpers.js';

// 単位の換算（1.5m = ?cm、1時間20分 = ?分 など）。学年帯ごとに、習った単位だけを出す
//  - low (2年): mm・cm・m、L・dL・mL、じかん・分・日。整数だけ（「時間」は「じかん」と書く）
//  - mid (3・4年): km・kg・t・秒 (3年)、小数をつかった換算と面積の単位 (4年)
//  - high (5・6年): 小数2けた、体積、mg・kL、時間の小数・分数

/** 「1.5m = ?cm」の形の問題。答えは v × factor。wrongFactors は、けたをまちがえたときの倍率 */
function simple(v, from, to, factor, wrongFactors) {
    return {
        text: `${fmtNum(v)}${from} = ?${to}`,
        answer: Number(fmtNum(v * factor)),
        unit: to,
        wrong: wrongFactors.map(f => v * f),
    };
}

/** 「130cm = ?m?cm」の形の問題。total は小さい単位での量、per は 1大単位あたりの小単位 */
function split(total, per, big, small) {
    const show = t => compound(t, per, big, small);
    // 60分 = 1時間 を 100分 = 1時間 とまちがえる、1m = 10cm とまちがえる、など
    const mistakes = per === 60
        ? [compound(total, 100, big, small)]
        : per >= 100 ? [compound(total, per / 10, big, small)] : [];
    return {
        text: `${total}${small} = ?${big}?${small}`,
        answer: show(total),
        wrong: [...mistakes, show(total + per), show(total - per), show(total + 1), show(total - 1), show(total + 2)]
            .filter(w => !w.startsWith('0')),
    };
}

/** 「1m30cm = ?cm」の形の問題 */
function join(b, s, per, big, small) {
    const t = b * per + s;
    const wrong = per === 60 ? [b * 100 + s, b * 10 + s, t + 10] : [b * per / 10 + s, b * per * 10 + s, b + s];
    return { text: `${b}${big}${s}${small} = ?${small}`, answer: t, unit: small, wrong };
}

/** min〜max のうち、step の倍数でない整数 */
function notMultiple(r, min, max, step) {
    let v;
    do v = r.int(min, max); while (v % step === 0);
    return v;
}

const tenths = (r, min, max) => notMultiple(r, min * 10, max * 10, 10) / 10;

// ---- 学年帯ごとの問題 ----

const LOW = {
    length: [
        r => join(r.int(1, 15), r.int(1, 9), 10, 'cm', 'mm'),
        r => split(notMultiple(r, 11, 159, 10), 10, 'cm', 'mm'),
        r => join(r.int(1, 3), r.int(1, 99), 100, 'm', 'cm'),
        r => split(notMultiple(r, 101, 399, 100), 100, 'm', 'cm'),
        r => simple(r.int(2, 9), 'm', 'cm', 100, [10, 1000]),
    ],
    volume: [
        r => simple(r.int(1, 9), 'L', 'dL', 10, [100, 1000]),
        r => join(r.int(1, 5), r.int(1, 9), 10, 'L', 'dL'),
        r => split(notMultiple(r, 11, 59, 10), 10, 'L', 'dL'),
        r => simple(r.int(1, 5), 'L', 'mL', 1000, [100, 10]),
        r => simple(r.int(1, 9), 'dL', 'mL', 100, [10, 1000]),
    ],
    time: [
        r => join(r.int(1, 3), r.int(1, 11) * 5, 60, 'じかん', '分'),
        r => split(notMultiple(r, 13, 47, 12) * 5, 60, 'じかん', '分'),
        r => simple(r.int(1, 2), '日', 'じかん', 24, [12, 60, 10]),
        r => simple(r.int(2, 5), 'じかん', '分', 60, [100, 10]),
    ],
};

const MID = {
    length: [
        r => join(r.int(1, 9), r.int(1, 99) * 10, 1000, 'km', 'm'),
        r => split(notMultiple(r, 101, 999, 100) * 10, 1000, 'km', 'm'),
        r => simple(tenths(r, 1, 5), 'm', 'cm', 100, [10, 1000]),
        r => simple(tenths(r, 1, 10), 'km', 'm', 1000, [100, 10]),
        r => simple(notMultiple(r, 11, 49, 10) * 10, 'cm', 'm', 1 / 100, [1 / 10, 1 / 1000]),
        r => simple(tenths(r, 1, 10), 'cm', 'mm', 10, [100, 1]),
    ],
    weight: [
        r => join(r.int(1, 5), r.int(1, 99) * 10, 1000, 'kg', 'g'),
        r => split(notMultiple(r, 101, 999, 100) * 10, 1000, 'kg', 'g'),
        r => simple(r.int(2, 9), 't', 'kg', 1000, [100, 10]),
        r => simple(tenths(r, 1, 10), 'kg', 'g', 1000, [100, 10]),
        r => simple(r.int(1, 9) * 100, 'g', 'kg', 1 / 1000, [1 / 100, 1 / 10]),
    ],
    volume: [
        r => simple(r.int(1, 9) / 10, 'L', 'dL', 10, [100, 1000]),
        r => simple(tenths(r, 1, 5), 'L', 'mL', 1000, [100, 10]),
        r => join(r.int(1, 4), r.int(1, 19) * 50, 1000, 'L', 'mL'),
    ],
    time: [
        r => join(r.int(1, 5), r.int(1, 59), 60, '分', '秒'),
        r => split(notMultiple(r, 61, 299, 60), 60, '分', '秒'),
        r => join(r.int(1, 4), r.int(1, 11) * 5, 60, '時間', '分'),
        r => split(notMultiple(r, 13, 59, 12) * 5, 60, '時間', '分'),
    ],
    area: [
        r => simple(r.int(1, 9), 'm²', 'cm²', 10000, [100, 1000]),
        r => simple(r.int(2, 9), 'a', 'm²', 100, [10, 1000]),
        r => simple(r.int(2, 9) * 100, 'm²', 'a', 1 / 100, [1 / 10, 1 / 1000]),
        r => simple(r.int(2, 9), 'ha', 'a', 100, [10, 1000]),
        r => simple(r.int(1, 9), 'ha', 'm²', 10000, [1000, 100]),
        r => simple(r.int(1, 9), 'km²', 'ha', 100, [1000, 10000]),
    ],
};

/** 「45分 = ?時間」の小数の答えになる分（60で割ると小数2けたまでで終わる） */
const DECIMAL_MINUTES = [6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54];
/** 時間・分の小数部分 */
const PARTS = [0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8];

/** 「1.5時間 = ?分」の形。1時間50分（小数部分を分とよむ）とのとりちがえも誤答に入れる */
function decimalTime(r, big, small, maxWhole) {
    const whole = r.int(0, maxWhole);
    const part = r.pick(PARTS);
    const v = whole + part;
    const q = simple(v, big, small, 60, [100, 10]);
    q.wrong.unshift(whole * 60 + Math.round(part * 100));
    return q;
}

const HIGH = {
    length: [
        r => simple(notMultiple(r, 101, 999, 10) / 100, 'km', 'm', 1000, [100, 10000]),
        r => simple(r.int(1, 99), 'cm', 'm', 1 / 100, [1 / 10, 1 / 1000]),
        r => simple(r.int(11, 99) * 10, 'mm', 'm', 1 / 1000, [1 / 100, 1 / 10000]),
        r => simple(r.int(1, 99) * 10, 'm', 'km', 1 / 1000, [1 / 100, 1 / 10000]),
    ],
    weight: [
        r => simple(r.int(1, 99) / 100, 'kg', 'g', 1000, [100, 10000]),
        r => simple(notMultiple(r, 2, 19, 2) * 500, 'mg', 'g', 1 / 1000, [1 / 100, 1 / 10]),
        r => simple(r.int(2, 9), 'g', 'mg', 1000, [100, 10]),
        r => simple(tenths(r, 0, 3), 't', 'kg', 1000, [100, 10]),
        r => simple(r.int(1, 9) * 100, 'kg', 't', 1 / 1000, [1 / 100, 1 / 10]),
    ],
    volume: [
        r => simple(r.int(5, 50) / 10, 'L', 'cm³', 1000, [100, 10]),
        r => simple(r.int(1, 20) * 500, 'cm³', 'L', 1 / 1000, [1 / 100, 1 / 10]),
        r => simple(r.int(2, 30) / 10, 'm³', 'L', 1000, [100, 10]),
        r => simple(r.int(1, 9) * 50, 'mL', 'cm³', 1, [10, 1000]),
        r => simple(r.int(2, 9), 'kL', 'L', 1000, [100, 10]),
        r => simple(r.int(1, 5), 'm³', 'cm³', 1000000, [1000, 10000, 100000]),
    ],
    area: [
        r => simple(tenths(r, 1, 10), 'ha', 'm²', 10000, [1000, 100]),
        r => simple(r.int(1, 9) / 10, 'km²', 'ha', 100, [10, 1000]),
        r => simple(r.int(1, 99), 'a', 'ha', 1 / 100, [1 / 10, 1 / 1000]),
        r => simple(r.int(1, 9) * 1000, 'cm²', 'm²', 1 / 10000, [1 / 1000, 1 / 100]),
        r => simple(r.int(1, 99) * 10, 'm²', 'a', 1 / 100, [1 / 10, 1 / 1000]),
    ],
    time: [
        r => decimalTime(r, '時間', '分', 2),
        r => {
            const m = r.int(0, 1) * 60 + r.pick(DECIMAL_MINUTES);
            return simple(m, '分', '時間', 1 / 60, [1 / 100, 1 / 10]);
        },
        r => {
            const m = r.pick([5, 10, 20, 25, 35, 40, 50, 55]);
            return {
                text: `${m}分 = ?時間`,
                answer: `${frac(m, 60)}時間`,
                wrong: [frac(m, 100), ...fracWrongs(m, 60)].map(w => `${w}時間`),
            };
        },
        r => decimalTime(r, '分', '秒', 4),
        r => simple(r.int(1, 3) + 0.5, '日', '時間', 24, [10, 12, 60]),
    ],
};

export const UNIT_TOPICS = { low: LOW, mid: MID, high: HIGH };

/** その学年帯の単位の問題を1問。量の種類（長さ・重さ…）をえらんでから、問題の形をえらぶ */
export function generateUnitsQuestion(level, r) {
    const topics = UNIT_TOPICS[level];
    const make = r.pick(topics[r.pick(Object.keys(topics))]);
    return buildQuestion(make(r), r);
}

export const generateUnitsLow = r => generateUnitsQuestion('low', r);
export const generateUnitsMid = r => generateUnitsQuestion('mid', r);
export const generateUnitsHigh = r => generateUnitsQuestion('high', r);
