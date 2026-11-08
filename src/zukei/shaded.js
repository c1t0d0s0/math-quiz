import { shape, rectPoints } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, num, pi, PI_NOTE, intersect, areaOf } from './helpers.js';

// 色をつけた部分の面積

const T = 'shaded';

const hole = pattern(T, 'hole', ['mid', 'high'], (r) => {
    const v = until(r, () => {
        const [W, H] = [r.int(8, 18), r.int(6, 14)];
        const [w, h] = [r.int(2, W - 4), r.int(2, H - 4)];
        return { W, H, w, h, x: r.int(1, W - w - 1), y: r.int(1, H - h - 1) };
    }, x => x.w >= 2 && x.h >= 2);
    const { W, H, w, h, x, y } = v;
    const answer = W * H - w * h;
    return fillQ({
        text: `たて${H}cm、横${W}cmの長方形の紙から、たて${h}cm、横${w}cmの長方形を切り取りました。色をつけた部分の面積は何cm²ですか。`,
        figure: shape(W, H, {
            polys: [{ points: rectPoints(0, 0, W, H), fill: 'shade' }, { points: rectPoints(x, y, w, h), fill: 'paper' }],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' },
            ],
            labels: [{ at: [x + w / 2, y + h / 2], text: '切り取る' }],
        }),
        answer,
        unit: 'cm²',
        explain: `大きい長方形の面積から、切り取った長方形の面積をひきます。${H} × ${W} − ${h} × ${w} = ${W * H} − ${w * h} = ${answer}（cm²）`,
    });
});

const frame = pattern(T, 'frame', ['mid'], (r) => {
    const t = r.int(1, 3);
    const [W, H] = [r.int(t * 2 + 4, 20), r.int(t * 2 + 3, 14)];
    const answer = W * H - (W - 2 * t) * (H - 2 * t);
    return fillQ({
        text: `たて${H}cm、横${W}cmの長方形の絵に、図のように、はば${t}cmのふちをつけました。ふちは絵の内側にあります。色をつけたふちの面積は何cm²ですか。`,
        figure: shape(W, H, {
            polys: [{ points: rectPoints(0, 0, W, H), fill: 'shade' }, { points: rectPoints(t, t, W - 2 * t, H - 2 * t), fill: 'paper' }],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' },
            ],
        }),
        answer,
        unit: 'cm²',
        explain: `内側の白い長方形は、たて ${H} − ${t} × 2 = ${H - 2 * t}cm、横 ${W} − ${t} × 2 = ${W - 2 * t}cm です。${W * H} − ${H - 2 * t} × ${W - 2 * t} = ${answer}（cm²）`,
    });
});

// ひらめき: ななめの道。道を横に寄せても、道のはばは変わらない
const slantRoad = pattern(T, 'slant-road', ['mid', 'high'], (r) => {
    const w = r.int(1, 3);
    const [W, H] = [r.int(5, 9) * 2 + w, r.int(4, 7) * 2 + w];
    const v = until(r, () => ({ x0: r.int(1, W - w - 5), s: r.int(2, 4), y0: r.int(2, H - w - 2) }), x => x.x0 >= 1 && x.x0 + x.s + w <= W - 1);
    const { x0, s, y0 } = v;
    const answer = (W - w) * (H - w);
    return fillQ({
        text: `たて${H}m、横${W}mの長方形の土地に、図のように、横のはばが${w}mのななめの道と、はばが${w}mのまっすぐな道を作りました。色をつけた部分（道をのぞいた部分）の面積は何m²ですか。`,
        figure: shape(W, H, {
            polys: [
                { points: rectPoints(0, 0, W, H), fill: 'shade' },
                { points: [[x0, 0], [x0 + w, 0], [x0 + s + w, H], [x0 + s, H]], fill: 'paper' },
                { points: rectPoints(0, y0, W, w), fill: 'paper' },
            ],
            dims: [
                { from: [0, 0], to: [W, 0], text: `${W}m`, side: 'below' },
                { from: [0, 0], to: [0, H], text: `${H}m`, side: 'left' },
                { from: [x0 + s, H], to: [x0 + s + w, H], text: `${w}m`, side: 'above' },
                { from: [W, y0], to: [W, y0 + w], text: `${w}m`, side: 'right' },
            ],
        }),
        answer,
        unit: 'm²',
        explain: `色をつけた部分を、道をつめるように横とたてに寄せると、すき間なく1つの長方形になります。ななめの道も、横のはばは${w}mです。たて ${H - w}m、横 ${W - w}m なので、${H - w} × ${W - w} = ${answer}（m²）`,
    });
}, { hirameki: true });

const quarter = pattern(T, 'quarter', ['high'], (r) => {
    const a = r.pick([4, 6, 8, 10, 12, 20]);
    const answer = num((a * a * 215) / 1000);
    return fillQ({
        text: `1辺が${a}cmの正方形と、半径${a}cmの円の4分の1を組み合わせた図です。色をつけた部分の面積は何cm²ですか。${PI_NOTE}`,
        figure: shape(a, a, {
            polys: [{ points: rectPoints(0, 0, a, a), fill: 'shade' }],
            sectors: [{ cx: 0, cy: 0, r: a, from: 0, to: 90, fill: 'paper' }],
            dims: [{ from: [0, 0], to: [a, 0], text: `${a}cm`, side: 'below' }],
        }),
        answer,
        unit: 'cm²',
        explain: `正方形の面積から、円の4分の1の面積をひきます。${a} × ${a} − ${a} × ${a} × 3.14 ÷ 4 = ${a * a} − ${num(pi(a * a) / 4)} = ${answer}（cm²）`,
    });
});

// ひらめき: 葉っぱの形。円の4分の1を2つ重ねると、重なったところが葉っぱになる
const leaf = pattern(T, 'leaf', ['high'], (r) => {
    const a = r.int(2, 12);
    const answer = num((a * a * 57) / 100);
    return fillQ({
        text: `1辺が${a}cmの正方形の中に、半径${a}cmの円の4分の1を2つかきました。色をつけた部分の面積は何cm²ですか。${PI_NOTE}`,
        figure: shape(a, a, {
            polys: [{ points: rectPoints(0, 0, a, a) }],
            paths: [{ d: [['M', a, 0], ['A', a, 0, a], ['A', a, a, 0]], fill: 'shade' }],
            sectors: [{ cx: 0, cy: 0, r: a, from: 0, to: 90 }, { cx: a, cy: a, r: a, from: 180, to: 270 }],
            dims: [{ from: [0, 0], to: [a, 0], text: `${a}cm`, side: 'below' }],
        }),
        answer,
        unit: 'cm²',
        explain: `円の4分の1を2つたすと、葉っぱの部分を2回、正方形のほかの部分を1回数えることになります。だから、葉っぱ = 円の4分の1 × 2 − 正方形。${num(pi(a * a) / 4)} × 2 − ${a * a} = ${answer}（cm²）`,
    });
}, { hirameki: true });

const ring = pattern(T, 'ring', ['high'], (r) => {
    const [R, s] = until(r, () => [r.int(3, 10), r.int(1, 8)], ([x, y]) => y < x - 1);
    const answer = pi(R * R - s * s);
    return fillQ({
        text: `同じ点を中心にして、半径${R}cmの円と半径${s}cmの円をかきました。色をつけた部分の面積は何cm²ですか。${PI_NOTE}`,
        figure: shape(2 * R, 2 * R, {
            circles: [{ cx: R, cy: R, r: R, fill: 'shade' }, { cx: R, cy: R, r: s, fill: 'paper' }],
            lines: [{ from: [R, R], to: [2 * R, R] }, { from: [R, R], to: [R, R + s] }],
            // 文字は、図の大きさに合わせて線から少しはなす (半径 R の円を 210px にかくので、1px は 2R / 210)
            labels: [{ at: [R + R * 0.6, R + (R * 2 * 12) / 210], text: `${R}cm` }, { at: [R - (R * 2 * 22) / 210, R + s / 2], text: `${s}cm` }],
            points: [{ at: [R, R], text: '' }],
        }),
        answer,
        unit: 'cm²',
        explain: `大きい円から小さい円をひきます。${R} × ${R} × 3.14 − ${s} × ${s} × 3.14 = (${R * R} − ${s * s}) × 3.14 = ${answer}（cm²）`,
    });
});

// ひらめき: 長方形の上の辺に頂点がある三角形。頂点を動かしても、底辺と高さは変わらない
const triangles = pattern(T, 'triangles', ['high'], (r) => {
    const v = until(r, () => {
        const [W, H] = [r.int(8, 18), r.int(5, 12)];
        const m = r.int(3, W - 3);
        return { W, H, m, P: r.int(1, W - 4), Q: r.int(4, W - 1) };
    }, x => (x.W * x.H) % 2 === 0 && x.Q - x.P >= 3);
    const { W, H, m, P, Q } = v;
    const answer = (W * H) / 2;
    return fillQ({
        text: `たて${H}cm、横${W}cmの長方形の中に、図のように2つの三角形をかきました。三角形の頂点は、長方形の上の辺の上にあります。色をつけた部分の面積は何cm²ですか。`,
        figure: shape(W, H, {
            polys: [
                { points: rectPoints(0, 0, W, H) },
                { points: [[0, 0], [m, 0], [P, H]], fill: 'shade' },
                { points: [[m, 0], [W, 0], [Q, H]], fill: 'shade' },
            ],
            dims: [{ from: [0, 0], to: [W, 0], text: `${W}cm`, side: 'below' }, { from: [0, 0], to: [0, H], text: `${H}cm`, side: 'left' }],
        }),
        answer,
        unit: 'cm²',
        explain: `2つの三角形の高さは、どちらも長方形のたての${H}cmです。底辺をあわせると長方形の横の${W}cmになるので、${W} × ${H} ÷ 2 = ${answer}（cm²）。頂点の場所は関係ありません。`,
    });
}, { hirameki: true });

// ひらめき: 正方形の頂点と、となりでない辺のまん中の点を結ぶと、まん中に面積が5分の1の正方形ができる
const fifth = pattern(T, 'fifth', ['high'], (r) => fifthQuestion(r.pick([5, 10, 15, 20])), { hirameki: true });

export function fifthQuestion(s) {
    const h = s / 2;
    const lines = [[[0, 0], [s, h]], [[s, 0], [h, s]], [[s, s], [0, h]], [[0, s], [h, 0]]];
    const inner = lines.map((l, i) => intersect(...l, ...lines[(i + 1) % 4]));
    const answer = areaOf(inner);
    return fillQ({
        text: `1辺が${s}cmの正方形の、それぞれの頂点と辺のまん中の点を、図のように直線で結びました。色をつけた正方形の面積は何cm²ですか。`,
        figure: shape(s, s, {
            polys: [{ points: rectPoints(0, 0, s, s) }, { points: inner, fill: 'shade' }],
            lines: lines.map(([from, to]) => ({ from, to })),
            points: [[s, h], [h, s], [0, h], [h, 0]].map(at => ({ at, text: '' })),
            dims: [{ from: [0, 0], to: [s, 0], text: `${s}cm`, side: 'below' }],
        }),
        answer,
        unit: 'cm²',
        explain: `まわりの直角三角形を切って動かすと、色をつけた正方形と同じ大きさの正方形が、ほかに4つできます。大きい正方形は、同じ正方形5つ分なので、${s} × ${s} ÷ 5 = ${answer}（cm²）`,
    });
}

export default [hole, frame, slantRoad, quarter, leaf, ring, triangles, fifth];
