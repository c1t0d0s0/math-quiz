import { shape } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, pi, PI_NOTE, areaOf } from './helpers.js';
import { prism, cubes, extent, proj } from './solid.js';

// 立体。3・4年は体積をまだ習わないので、立方体の積み木の数を数える

const T = 'volume';

/** 立体の多角形と寸法 (3次元の点) を、図にする */
function solidFigure(polys, dims = [], extra = {}) {
    const { w, h } = extent(polys);
    return shape(w, h, {
        polys,
        dims: dims.map(d => ({ ...d, from: proj(d.from), to: proj(d.to) })),
        ...extra,
    });
}

const block = (a, b, c) => {
    const list = [];
    for (let z = 0; z < a; z++) for (let y = 0; y < c; y++) for (let x = 0; x < b; x++) list.push([x, y, z]);
    return list;
};

const stairsCount = pattern(T, 'stairs-count', ['mid'], (r) => {
    const k = r.int(3, 4);
    const depth = r.int(2, 3);
    const heights = Array.from({ length: k }, (_, i) => k - i + (r.bool(0.3) ? 1 : 0)).sort((a, b) => b - a);
    const list = [];
    heights.forEach((h, x) => {
        for (let y = 0; y < h; y++) for (let z = 0; z < depth; z++) list.push([x, y, z]);
    });
    const answer = list.length;
    return fillQ({
        text: `1辺1cmの立方体の積み木を、図のように階段の形に積みました。おく行きの向きには、どこも${depth}こずつならんでいて、見えないところにも積み木はすきまなくつまっています。積み木は全部で何こですか。`,
        figure: solidFigure(cubes(list)),
        answer,
        unit: 'こ',
        explain: `前から見ると、積み木は左の列から ${heights.join('こ・')}こ で、合わせて${heights.reduce((s, h) => s + h, 0)}こ。それがおく行きに${depth}列あるので、${heights.reduce((s, h) => s + h, 0)} × ${depth} = ${answer}（こ）`,
    });
});

const blockCount = pattern(T, 'block-count', ['mid'], (r) => {
    const [a, b, c] = until(r, () => [r.int(2, 4), r.int(2, 5), r.int(2, 4)], ([x, y, z]) => !(x === y && y === z));
    return fillQ({
        text: '1辺1cmの立方体の積み木を、すきまなく積んで、図のような直方体を作りました。積み木は全部で何こですか。',
        figure: solidFigure(cubes(block(a, b, c))),
        answer: a * b * c,
        unit: 'こ',
        explain: `1だんに 横${b}こ × おく行き${a}こ = ${a * b}こ。それが${c}だんあるので、${a * b} × ${c} = ${a * b * c}（こ）`,
    });
});

// ひらめき: 直方体の積み木に、あと何こたすと立方体になるか
const toCube = pattern(T, 'to-cube', ['mid', 'high'], (r) => {
    const [a, b, c] = until(r, () => [r.int(2, 4), r.int(2, 4), r.int(2, 4)], ([x, y, z]) => new Set([x, y, z]).size >= 2);
    const n = Math.max(a, b, c);
    const answer = n * n * n - a * b * c;
    return fillQ({
        text: '1辺1cmの立方体の積み木で、図のような直方体を作りました。この直方体に積み木をたして、できるだけ小さい立方体を作ります。積み木をあと何こたせばよいですか。',
        figure: solidFigure(cubes(block(a, b, c))),
        answer,
        unit: 'こ',
        explain: `いちばん長い辺は${n}こ分なので、1辺が${n}cmの立方体を作ります。立方体の積み木は ${n} × ${n} × ${n} = ${n * n * n}こ、今あるのは ${b} × ${a} × ${c} = ${a * b * c}こ なので、${n * n * n} − ${a * b * c} = ${answer}（こ）`,
    });
}, { hirameki: true });

const cuboid = pattern(T, 'cuboid', ['high'], (r) => {
    const [a, b, c] = [r.int(2, 9), r.int(3, 12), r.int(2, 9)];
    const front = [[0, 0], [b, 0], [b, c], [0, c]];
    return fillQ({
        text: `たて${a}cm、横${b}cm、高さ${c}cmの直方体の体積は何cm³ですか。`,
        figure: solidFigure(prism(front, a), [
            { from: [0, 0, 0], to: [b, 0, 0], text: `${b}cm`, side: 'below' },
            { from: [0, 0, 0], to: [0, c, 0], text: `${c}cm`, side: 'left' },
            { from: [b, 0, 0], to: [b, 0, a], text: `${a}cm`, side: 'right' },
        ]),
        answer: a * b * c,
        unit: 'cm³',
        explain: `直方体の体積 = たて × 横 × 高さ。${a} × ${b} × ${c} = ${a * b * c}（cm³）`,
    });
});

const lsolid = pattern(T, 'l-solid', ['high'], (r) => {
    const v = until(r, () => ({ W: r.int(6, 12), H: r.int(5, 10), u: r.int(2, 6), t: r.int(2, 5), d: r.int(3, 8) }), x => x.u <= x.W - 2 && x.t <= x.H - 2);
    const { W, H, u, t, d } = v;
    const front = [[0, 0], [W, 0], [W, t], [u, t], [u, H], [0, H]];
    const area = areaOf(front);
    return fillQ({
        text: '図のような、角がすべて直角の立体があります。この立体の体積は何cm³ですか。',
        figure: solidFigure(prism(front, d), [
            { from: [0, 0, 0], to: [W, 0, 0], text: `${W}cm`, side: 'below' },
            { from: [0, 0, 0], to: [0, H, 0], text: `${H}cm`, side: 'left' },
            { from: [W, 0, 0], to: [W, t, 0], text: `${t}cm`, side: 'right' },
            { from: [0, H, 0], to: [u, H, 0], text: `${u}cm`, side: 'below' },
            { from: [W, 0, 0], to: [W, 0, d], text: `${d}cm`, side: 'right' },
        ]),
        answer: area * d,
        unit: 'cm³',
        explain: `正面の L 字の形の面積は ${H} × ${u} + ${t} × ${W - u} = ${area}cm²。それにおく行きの${d}cmをかけて、${area} × ${d} = ${area * d}（cm³）`,
    });
});

const triPrism = pattern(T, 'triangular-prism', ['high'], (r) => {
    const [p, q, h] = until(r, () => [r.int(3, 10), r.int(3, 9), r.int(3, 10)], ([x, y]) => (x * y) % 2 === 0);
    const front = [[0, 0], [p, 0], [0, q]];
    const answer = ((p * q) / 2) * h;
    return fillQ({
        text: '図のような三角柱があります。底面は直角三角形です。この三角柱の体積は何cm³ですか。',
        figure: solidFigure(prism(front, h), [
            { from: [0, 0, 0], to: [p, 0, 0], text: `${p}cm`, side: 'below' },
            { from: [0, 0, 0], to: [0, q, 0], text: `${q}cm`, side: 'left' },
            { from: [p, 0, 0], to: [p, 0, h], text: `${h}cm`, side: 'right' },
        ], { angles: [{ at: [0, 0], from: [p, 0], to: [0, q], right: true }] }),
        answer,
        unit: 'cm³',
        explain: `角柱の体積 = 底面積 × 高さ。底面積は ${p} × ${q} ÷ 2 = ${(p * q) / 2}cm² なので、${(p * q) / 2} × ${h} = ${answer}（cm³）`,
    });
});

const cylinder = pattern(T, 'cylinder', ['high'], (r) => {
    const [rad, h] = [r.int(2, 10), r.int(3, 12)];
    const ry = rad * 0.35;
    const answer = pi(rad * rad * h);
    return fillQ({
        text: `底面の半径が${rad}cm、高さが${h}cmの円柱の体積は何cm³ですか。${PI_NOTE}`,
        figure: shape(2 * rad, h + 2 * ry, {
            ellipses: [
                { cx: rad, cy: h + ry, rx: rad, ry },
                { cx: rad, cy: ry, rx: rad, ry, half: 'front' },
                { cx: rad, cy: ry, rx: rad, ry, half: 'back', dashed: true },
            ],
            lines: [{ from: [0, ry], to: [0, h + ry] }, { from: [2 * rad, ry], to: [2 * rad, h + ry] }, { from: [rad, h + ry], to: [2 * rad, h + ry] }],
            labels: [{ at: [rad * 1.5, h + ry + ry * 0.35 + 0.15], text: `${rad}cm` }],
            dims: [{ from: [2 * rad, ry], to: [2 * rad, h + ry], text: `${h}cm`, side: 'right' }],
        }),
        answer,
        unit: 'cm³',
        explain: `円柱の体積 = 底面積 × 高さ。${rad} × ${rad} × 3.14 × ${h} = ${answer}（cm³）`,
    });
});

// ひらめき: 直方体をななめの平面で切った立体。同じ立体をさかさにして合わせると直方体になる
const cut = pattern(T, 'cut-cuboid', ['high'], (r) => {
    const v = until(r, () => ({ w: r.int(3, 8), d: r.int(3, 6), hA: r.int(5, 12), hC: r.int(3, 10) }), x => x.hA !== x.hC && (x.w * x.d * (x.hA + x.hC)) % 2 === 0);
    return cutQuestion(v.w, v.d, v.hA, v.hC);
}, { hirameki: true });

/**
 * 底面 w × d の直方体を、ななめの平面で切った立体。手前左の辺 AE が hA、おく右の辺 CG が hC。
 * 平面で切ったので、向かい合う2本の辺の長さの和は等しい (手前右 + おく左 = hA + hC)
 */
export function cutQuestion(w, d, hA, hC) {
    const hB = (hA + hC) / 2;
    const hD = hA + hC - hB;
    const P = p => proj(p);
    const polys = [
        { points: [P([w, 0, 0]), P([w, 0, d]), P([w, hC, d]), P([w, hB, 0])], fill: 'paper' },
        { points: [P([0, hA, 0]), P([w, hB, 0]), P([w, hC, d]), P([0, hD, d])], fill: 'shade' },
        { points: [P([0, 0, 0]), P([w, 0, 0]), P([w, hB, 0]), P([0, hA, 0])], fill: 'paper' },
    ];
    const answer = (w * d * (hA + hC)) / 2;
    const { w: W, h: H } = extent(polys);
    return fillQ({
        text: `底面がたて${d}cm、横${w}cmの長方形の直方体を、図のようにななめの平面で切りました。辺AEは${hA}cm、辺CGは${hC}cmです。この立体の体積は何cm³ですか。`,
        figure: shape(W, H, {
            polys,
            lines: [
                { from: P([0, 0, 0]), to: P([0, 0, d]), dashed: true },
                { from: P([0, 0, d]), to: P([w, 0, d]), dashed: true },
                { from: P([0, 0, d]), to: P([0, hD, d]), dashed: true },
            ],
            dims: [
                { from: P([0, 0, 0]), to: P([w, 0, 0]), text: `${w}cm`, side: 'below' },
                { from: P([w, 0, 0]), to: P([w, 0, d]), text: `${d}cm`, side: 'right' },
                { from: P([0, 0, 0]), to: P([0, hA, 0]), text: `${hA}cm`, side: 'left' },
                { from: P([w, 0, d]), to: P([w, hC, d]), text: `${hC}cm`, side: 'right' },
            ],
            points: [
                { at: P([0, hA, 0]), text: 'A', dx: -10, dy: -4 },
                { at: P([w, hC, d]), text: 'C', dx: 10, dy: -6 },
                { at: P([0, 0, 0]), text: 'E', dx: -10, dy: 14 },
                { at: P([w, 0, d]), text: 'G', dx: 12, dy: 12 },
            ],
        }),
        answer,
        unit: 'cm³',
        explain: `同じ立体をもう1つ用意して、さかさにして切り口どうしを合わせると、高さが ${hA} + ${hC} = ${hA + hC}cm の直方体になります。その体積の半分なので、${d} × ${w} × ${hA + hC} ÷ 2 = ${answer}（cm³）`,
    });
}

export default [stairsCount, blockCount, toCube, cuboid, lsolid, triPrism, cylinder, cut];
