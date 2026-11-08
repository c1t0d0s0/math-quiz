import { fmtNum } from '../word/helpers.js';

// 図形の問題を書くときの道具。問題の側は数と図のデータだけを返す (描くのは src/components/figures/)

/** 浮動小数の誤差を落とした数 (0.30000000000000004 → 0.3) */
export const num = v => Number(fmtNum(v));

/** 円周率 3.14 のかけ算を誤差なく行う */
export const pi = v => num((v * 314) / 100);
export const PI_NOTE = '円周率は3.14とします。';

/**
 * パターンを1つ作る。id は `${topic}-${name}`。
 * levels は出す学年帯 ('mid' | 'high')、hirameki は「ひらめき問題」(くふうして解く問題) かどうか
 */
export function pattern(topic, name, levels, generate, { hirameki = false } = {}) {
    return { id: `${topic}-${name}`, topic, levels, hirameki, generate };
}

/**
 * テンキーで答える問題 (空欄が1つ)。答えが小数なら「.」のキーを出す。
 * 入れられる文字の数は答えのけた数で決めない (けた数が答えのヒントにならないように)
 */
export function fillQ({ text, figure, answer, unit, explain }) {
    return fillParts({ text, figure, parts: unit ? [answer, ` ${unit}`] : [answer], explain });
}

/** 空欄がいくつかある問題。parts は文字と答えの数をならべたもの (数のところが空欄になる) */
export function fillParts({ text, figure, parts, explain }) {
    let blank = 0;
    const blanks = [];
    const out = parts.map((p) => {
        if (typeof p !== 'number') return p;
        blanks.push(num(p));
        return { blank: blank++ };
    });
    const decimal = blanks.some(v => !Number.isInteger(v));
    return { type: 'fill', text, figure, parts: out, blanks, keys: decimal ? ['.'] : [], maxLength: decimal ? 7 : 6, explain };
}

/** 図をえらんで答える問題。options はア・イ・ウ・エの図、answer は正しい図の記号 */
export function pickQ({ text, figure, choices, correct, explain }) {
    const labels = ['ア', 'イ', 'ウ', 'エ'].slice(0, choices.length);
    const optionFigures = Object.fromEntries(labels.map((l, i) => [l, choices[i]]));
    return { type: 'pick', text, figure, options: labels, optionFigures, answer: labels[correct], explain };
}

// ---- 平面の計算 ----

export const deg = d => (d * Math.PI) / 180;
export const dir = d => [Math.cos(deg(d)), Math.sin(deg(d))];
export const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
export const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
export const mul = (p, s) => [p[0] * s, p[1] * s];

/** 多角形のまわりの長さ */
export function perimeterOf(points) {
    return num(points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0));
}

/** 多角形の面積 (くつひもの公式) */
export function areaOf(points) {
    return num(Math.abs(points.reduce((sum, p, i) => {
        const q = points[(i + 1) % points.length];
        return sum + p[0] * q[1] - q[0] * p[1];
    }, 0)) / 2);
}

/** 2本の直線 (p1→p2 と p3→p4) の交わる点 */
export function intersect(p1, p2, p3, p4) {
    const [d1, d2] = [sub(p2, p1), sub(p4, p3)];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    const t = ((p3[0] - p1[0]) * d2[1] - (p3[1] - p1[1]) * d2[0]) / den;
    return add(p1, mul(d1, t));
}

/**
 * 点を左下が (0, 0) になるように動かす。もどり値は { move: 点を動かす関数, w, h }。
 * margin は図のはしにあける余白
 */
export function fitPoints(points, margin = 0) {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const [x0, y0] = [Math.min(...xs) - margin, Math.min(...ys) - margin];
    return {
        move: p => [p[0] - x0, p[1] - y0],
        w: Math.max(...xs) - x0 + margin,
        h: Math.max(...ys) - y0 + margin,
    };
}

/** 0 から total までを、n 個の点で区切る (となりとの間は minGap 以上)。区切りの点を小さい順に返す */
export function splitPoints(r, total, n, minGap) {
    for (let i = 0; i < 5000; i++) {
        const cuts = [...new Set(Array.from({ length: n }, () => r.int(minGap, total - minGap)))].sort((a, b) => a - b);
        if (cuts.length === n && cuts.every((c, j) => j === 0 || c - cuts[j - 1] >= minGap)) return cuts;
    }
    throw new Error('区切りが作れません');
}
