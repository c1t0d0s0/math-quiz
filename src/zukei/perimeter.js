import { shape, rectPoints } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, perimeterOf, splitPoints } from './helpers.js';

// まわりの長さ。答えは図の多角形の辺の長さを足して出す (問題文の数に頼らない)

const T = 'perimeter';

const rect = pattern(T, 'rect', ['mid'], (r) => {
    const [a, b] = until(r, () => [r.int(3, 15), r.int(4, 20)], ([x, y]) => x < y);
    const points = rectPoints(0, 0, b, a);
    return fillQ({
        text: `たて${a}cm、横${b}cmの長方形があります。この長方形のまわりの長さは何cmですか。`,
        figure: shape(b, a, {
            polys: [{ points }],
            dims: [{ from: [0, 0], to: [b, 0], text: `${b}cm`, side: 'below' }, { from: [0, 0], to: [0, a], text: `${a}cm`, side: 'left' }],
        }),
        answer: perimeterOf(points),
        unit: 'cm',
        explain: `長方形は、向かい合う辺の長さが同じです。(${a} + ${b}) × 2 = ${2 * (a + b)}（cm）`,
    });
});

const squareSide = pattern(T, 'square-side', ['mid'], (r) => {
    const a = r.int(3, 25);
    return fillQ({
        text: `まわりの長さが${4 * a}cmの正方形があります。この正方形の1辺の長さは何cmですか。`,
        figure: shape(1, 1, { polys: [{ points: rectPoints(0, 0, 1, 1) }], dims: [{ from: [0, 0], to: [1, 0], text: '?cm', side: 'below' }] }),
        answer: a,
        unit: 'cm',
        explain: `正方形は4つの辺の長さが同じなので、${4 * a} ÷ 4 = ${a}（cm）`,
    });
});

/**
 * 右下へ下がっていく階段の形。xs は列の区切り (0 と W をふくむ)、ts は列ごとの高さ (左から高い順)。
 * 左下 (0, 0) から反時計回りの点の列を返す (bottom があれば、下の辺をその点の列にする)
 */
function stairPoints(xs, ts, bottom = [[0, 0], [xs[xs.length - 1], 0]]) {
    const pts = [...bottom];
    for (let i = ts.length - 1; i >= 0; i--) {
        pts.push([xs[i + 1], ts[i]], [xs[i], ts[i]]);
    }
    return pts;
}

function makeStairs(r, W, H, k) {
    const xs = [0, ...splitPoints(r, W, k - 1, 2), W];
    const ts = [H, ...splitPoints(r, H, k - 1, 2).reverse()];
    return { xs, ts };
}

const stairs = pattern(T, 'stairs', ['mid', 'high'], (r) => {
    const [W, H, k] = [r.int(10, 20), r.int(8, 15), r.int(3, 4)];
    const { xs, ts } = makeStairs(r, W, H, k);
    const points = stairPoints(xs, ts);
    return fillQ({
        text: '図のような階段の形があります。図の角はすべて直角です。この形のまわりの長さは何cmですか。',
        figure: shape(W, H, {
            polys: [{ points }],
            dims: [{ from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' }, { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' }],
        }),
        answer: perimeterOf(points),
        unit: 'cm',
        explain: `階段の横の辺を上へ、たての辺を右へ動かすと、たて${H}cm、横${W}cmの長方形のまわりと同じになります。(${H} + ${W}) × 2 = ${2 * (H + W)}（cm）`,
    });
}, { hirameki: true });

const notch = pattern(T, 'notch', ['mid', 'high'], (r) => {
    const v = until(r, () => {
        const [W, H] = [r.int(10, 20), r.int(7, 14)];
        const q = r.int(2, Math.floor(W / 2));
        const p = r.int(2, W - q - 2);
        const d = r.int(2, H - 3);
        return { W, H, p, q, d };
    }, x => x.p >= 2 && x.p + x.q <= x.W - 2);
    const { W, H, p, q, d } = v;
    const points = [[0, 0], [W, 0], [W, H], [p + q, H], [p + q, H - d], [p, H - d], [p, H], [0, H]];
    return fillQ({
        text: '長方形の上の辺から、長方形を1つ切り取った形があります。図の角はすべて直角です。この形のまわりの長さは何cmですか。',
        figure: shape(W, H, {
            polys: [{ points }],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' },
                { from: [p, H - d], to: [p + q, H - d], text: `${q}cm`, side: 'below' },
                { from: [p + q, H - d], to: [p + q, H], text: `${d}cm`, side: 'right' },
            ],
        }),
        answer: perimeterOf(points),
        unit: 'cm',
        explain: `へこんだところの底の辺を上へ動かすと、長方形のまわり (${W} + ${H}) × 2 = ${2 * (W + H)}cm になります。そのほかに、へこみのたての辺 ${d}cm が2本あるので、${2 * (W + H)} + ${d} × 2 = ${2 * (W + H) + 2 * d}（cm）`,
    });
});

// 正方形をならべた形。cells は [列, 段]
const POLYOMINOES = [
    [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1]],
];

const squares = pattern(T, 'squares', ['mid', 'high'], (r) => {
    const cells = r.pick(POLYOMINOES);
    const a = r.int(2, 9);
    const has = (x, y) => cells.some(c => c[0] === x && c[1] === y);
    const edges = cells.reduce((sum, [x, y]) => sum + [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !has(x + dx, y + dy)).length, 0);
    const w = Math.max(...cells.map(c => c[0])) + 1;
    const h = Math.max(...cells.map(c => c[1])) + 1;
    const [x0, y0] = cells[0];
    return fillQ({
        text: `1辺が${a}cmの正方形を${cells.length}まい、図のようにすきまなくならべました。この形のまわりの長さは何cmですか。`,
        figure: shape(w, h, {
            polys: cells.map(([x, y]) => ({ points: rectPoints(x, y, 1, 1) })),
            dims: [{ from: [x0, y0], to: [x0 + 1, y0], text: `${a}cm`, side: 'below' }],
        }),
        answer: edges * a,
        unit: 'cm',
        explain: `まわりには、正方形の辺が${edges}本あります。${a} × ${edges} = ${edges * a}（cm）`,
    });
});

// ひらめき: 階段と、下の辺のへこみがある形。ばらばらの線をまとめて、長方形のまわりとへこみの分に分ける
const combined = pattern(T, 'combined', ['high'], (r) => {
    const v = until(r, () => {
        const [W, H, k] = [r.int(12, 20), r.int(9, 15), r.int(2, 3)];
        const { xs, ts } = makeStairs(r, W, H, k);
        const q = r.int(2, 4);
        const p = r.int(2, W - q - 2);
        const d = r.int(2, Math.min(...ts) - 2);
        return { W, H, xs, ts, p, q, d };
    }, x => x.d >= 2 && x.p + x.q <= x.W - 2);
    const { W, H, xs, ts, p, q, d } = v;
    const points = stairPoints(xs, ts, [[0, 0], [p, 0], [p, d], [p + q, d], [p + q, 0], [W, 0]]);
    const answer = perimeterOf(points);
    return fillQ({
        text: '図のような形があります。図の角はすべて直角です。この形のまわりの長さは何cmですか。',
        figure: shape(W, H, {
            polys: [{ points }],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' },
                { from: [p + q, 0], to: [p + q, d], text: `${d}cm`, side: 'right' },
            ],
        }),
        answer,
        unit: 'cm',
        explain: `長さのわからない横の線は上下に、たての線は左右に動かしてまとめると、たて${H}cm、横${W}cmの長方形のまわり ${2 * (W + H)}cm になります。下のへこみのたての辺 ${d}cm が2本のこるので、${2 * (W + H)} + ${d} × 2 = ${answer}（cm）`,
    });
}, { hirameki: true });

export default [rect, squareSide, stairs, notch, squares, combined];
