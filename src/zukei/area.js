import { shape, rectPoints } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, areaOf } from './helpers.js';

// 四角形の面積

const T = 'area';

const rect = pattern(T, 'rect', ['mid'], (r) => {
    const [a, b] = until(r, () => [r.int(3, 15), r.int(4, 20)], ([x, y]) => x < y);
    const points = rectPoints(0, 0, b, a);
    return fillQ({
        text: `たて${a}cm、横${b}cmの長方形の面積は何cm²ですか。`,
        figure: shape(b, a, {
            polys: [{ points, fill: 'shade' }],
            dims: [{ from: [0, 0], to: [b, 0], text: `${b}cm`, side: 'below' }, { from: [0, 0], to: [0, a], text: `${a}cm`, side: 'left' }],
        }),
        answer: areaOf(points),
        unit: 'cm²',
        explain: `長方形の面積 = たて × 横。${a} × ${b} = ${a * b}（cm²）`,
    });
});

const side = pattern(T, 'side', ['mid'], (r) => {
    const [a, b] = until(r, () => [r.int(3, 12), r.int(4, 15)], ([x, y]) => x < y);
    return fillQ({
        text: `面積が${a * b}cm²で、横の長さが${b}cmの長方形があります。たての長さは何cmですか。`,
        figure: shape(b, a, {
            polys: [{ points: rectPoints(0, 0, b, a), fill: 'shade' }],
            dims: [{ from: [0, 0], to: [b, 0], text: `${b}cm`, side: 'below' }, { from: [0, 0], to: [0, a], text: '?cm', side: 'left' }],
            labels: [{ at: [b / 2, a / 2], text: `${a * b}cm²` }],
        }),
        answer: a,
        unit: 'cm',
        explain: `たて × 横 = 面積 なので、たて = 面積 ÷ 横。${a * b} ÷ ${b} = ${a}（cm）`,
    });
});

const lshape = pattern(T, 'lshape', ['mid', 'high'], (r) => {
    const v = until(r, () => {
        const [W, H] = [r.int(8, 16), r.int(7, 14)];
        return { W, H, u: r.int(3, W - 3), t: r.int(2, H - 3) };
    }, x => x.u >= 3 && x.t >= 2);
    const { W, H, u, t } = v;
    // 左は高さ H、右は高さ t の L 字形
    const points = [[0, 0], [W, 0], [W, t], [u, t], [u, H], [0, H]];
    const answer = areaOf(points);
    return fillQ({
        text: '図のような形の面積は何cm²ですか。図の角はすべて直角です。',
        figure: shape(W, H, {
            polys: [{ points, fill: 'shade' }],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' },
                { from: [0, H], to: [u, H], text: `${u}cm`, side: 'above' },
                { from: [W, 0], to: [W, t], text: `${t}cm`, side: 'right' },
            ],
        }),
        answer,
        unit: 'cm²',
        explain: `2つの長方形に分けます。${H} × ${u} + ${t} × ${W - u} = ${u * H} + ${t * (W - u)} = ${answer}（cm²）。大きな長方形から欠けた部分を引いて、${H} × ${W} − ${H - t} × ${W - u} と考えてもよいです。`,
    });
});

const road = pattern(T, 'road', ['mid'], (r) => {
    const w = r.int(1, 3);
    const [W, H] = [r.int(4, 9) * 2 + w, r.int(3, 7) * 2 + w];
    const [x0, y0] = [r.int(2, W - w - 2), r.int(2, H - w - 2)];
    const answer = (W - w) * (H - w);
    return fillQ({
        text: `たて${H}m、横${W}mの長方形の土地に、図のように、はばが${w}mのまっすぐな道をたてと横に作りました。色をつけた部分（道をのぞいた部分）の面積は何m²ですか。`,
        figure: shape(W, H, {
            polys: [
                { points: rectPoints(0, 0, W, H), fill: 'shade' },
                { points: rectPoints(x0, 0, w, H), fill: 'paper' },
                { points: rectPoints(0, y0, W, w), fill: 'paper' },
            ],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}m`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}m`, side: 'left' },
                { from: [x0, H], to: [x0 + w, H], text: `${w}m`, side: 'above' },
                { from: [W, y0], to: [W, y0 + w], text: `${w}m`, side: 'right' },
            ],
        }),
        answer,
        unit: 'm²',
        explain: `道を土地のはしに寄せると、色をつけた部分は、たて ${H} − ${w} = ${H - w}m、横 ${W} − ${w} = ${W - w}m の長方形になります。${H - w} × ${W - w} = ${answer}（m²）`,
    });
}, { hirameki: true });

const parallelogram = pattern(T, 'parallelogram', ['high'], (r) => {
    const [a, h, s] = [r.int(5, 14), r.int(3, 10), r.int(2, 5)];
    return fillQ({
        text: '図の平行四辺形の面積は何cm²ですか。',
        figure: shape(a + s, h, {
            polys: [{ points: [[0, 0], [a, 0], [a + s, h], [s, h]], fill: 'shade' }],
            lines: [{ from: [s, h], to: [s, 0], dashed: true }],
            angles: [{ at: [s, 0], from: [s, h], to: [a, 0], right: true }],
            dims: [{ from: [0, 0], to: [a, 0], text: `${a}cm`, side: 'below' }, { from: [s, 0], to: [s, h], text: `${h}cm`, side: 'right' }],
        }),
        answer: a * h,
        unit: 'cm²',
        explain: `平行四辺形の面積 = 底辺 × 高さ。${a} × ${h} = ${a * h}（cm²）`,
    });
});

const trapezoid = pattern(T, 'trapezoid', ['high'], (r) => {
    const v = until(r, () => ({ a: r.int(3, 9), b: r.int(6, 16), h: r.int(3, 10), s: r.int(1, 4) }), x => x.b > x.a + 1 && x.s + x.a < x.b && ((x.a + x.b) * x.h) % 2 === 0);
    const { a, b, h, s } = v;
    return fillQ({
        text: '図の台形の面積は何cm²ですか。',
        figure: shape(b, h, {
            polys: [{ points: [[0, 0], [b, 0], [s + a, h], [s, h]], fill: 'shade' }],
            lines: [{ from: [s, h], to: [s, 0], dashed: true }],
            angles: [{ at: [s, 0], from: [s, h], to: [b, 0], right: true }],
            dims: [
                { from: [s, h], to: [s + a, h], text: `${a}cm`, side: 'above' },
                { from: [0, 0], to: [b, 0], text: `${b}cm`, side: 'below' },
                { from: [s, 0], to: [s, h], text: `${h}cm`, side: 'right' },
            ],
        }),
        answer: ((a + b) * h) / 2,
        unit: 'cm²',
        explain: `台形の面積 = (上底 + 下底) × 高さ ÷ 2。(${a} + ${b}) × ${h} ÷ 2 = ${((a + b) * h) / 2}（cm²）`,
    });
});

const rhombus = pattern(T, 'rhombus', ['high'], (r) => {
    const [p, q] = until(r, () => [r.int(4, 16), r.int(4, 12)], ([x, y]) => x !== y && (x * y) % 2 === 0);
    return fillQ({
        text: `対角線の長さが${p}cmと${q}cmのひし形があります。このひし形の面積は何cm²ですか。`,
        figure: shape(p, q, {
            polys: [{ points: [[p / 2, 0], [p, q / 2], [p / 2, q], [0, q / 2]], fill: 'shade' }],
            lines: [{ from: [0, q / 2], to: [p, q / 2], dashed: true }, { from: [p / 2, 0], to: [p / 2, q], dashed: true }],
            dims: [{ from: [0, 0], to: [p, 0], text: `${p}cm`, side: 'below' }, { from: [p, 0], to: [p, q], text: `${q}cm`, side: 'right' }],
        }),
        answer: (p * q) / 2,
        unit: 'cm²',
        explain: `ひし形の面積 = 対角線 × 対角線 ÷ 2。${p} × ${q} ÷ 2 = ${(p * q) / 2}（cm²）`,
    });
});

// ひらめき: 大・中・小の正方形をならべた図。中の正方形の1辺を先にもとめる
const threeSquares = pattern(T, 'three-squares', ['high'], (r) => {
    const M = r.int(5, 12);
    const [a, b] = [r.int(1, 4), r.int(1, 4)];
    return threeSquaresQuestion(M + a, M, M - b);
}, { hirameki: true });

/** 大きい正方形 ABCD (1辺 L)・中の正方形 ECFG (1辺 M)・小さい正方形 HFIJ (1辺 S) */
export function threeSquaresQuestion(L, M, S) {
    const total = L + M + S;
    const [de, hg] = [L - M, M - S];
    return fillQ({
        text: `図のように、大きさのちがう3つの正方形ABCD・ECFG・HFIJをならべました。辺BC・CF・FIの長さの合計は${total}cm、DEは${de}cm、HGは${hg}cmです。正方形ABCDの面積は何cm²ですか。`,
        figure: shape(total, L, {
            polys: [
                { points: rectPoints(0, 0, L, L), fill: 'shade' },
                { points: rectPoints(L, 0, M, M) },
                { points: rectPoints(L + M, 0, S, S) },
            ],
            dims: [
                { from: [0, 0], to: [total, 0], text: `${total}cm`, side: 'below' },
                { from: [L, M], to: [L, L], text: `${de}cm`, side: 'right' },
                { from: [L + M, S], to: [L + M, M], text: `${hg}cm`, side: 'right' },
            ],
            points: [
                { at: [0, L], text: 'A', dx: -10, dy: -6 },
                { at: [0, 0], text: 'B', dx: -10, dy: 16 },
                { at: [L, 0], text: 'C', dx: 0, dy: 18 },
                { at: [L, L], text: 'D', dx: 10, dy: -6 },
                { at: [L, M], text: 'E', dx: -10, dy: -6 },
                { at: [L + M, 0], text: 'F', dx: 0, dy: 18 },
                { at: [L + M, M], text: 'G', dx: 10, dy: -6 },
                { at: [L + M, S], text: 'H', dx: -10, dy: -6 },
                { at: [total, 0], text: 'I', dx: 10, dy: 16 },
                { at: [total, S], text: 'J', dx: 10, dy: -6 },
            ],
        }),
        answer: L * L,
        unit: 'cm²',
        explain: `正方形の辺はどれも同じ長さなので、BC = DC、FI = FH です。DC + CF + FH = ${total}cm から DE をひいて HG をたすと、EC + CF + FG = ${total} − ${de} + ${hg} = ${3 * M}cm。中の正方形の1辺は ${3 * M} ÷ 3 = ${M}cm、大きい正方形の1辺は ${M} + ${de} = ${L}cm なので、面積は ${L} × ${L} = ${L * L}（cm²）`,
    });
}

export default [rect, side, lshape, road, parallelogram, trapezoid, rhombus, threeSquares];
