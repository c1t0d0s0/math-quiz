import { shape } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, add, sub, mul, dir, intersect, fitPoints, deg } from './helpers.js';

// 角度。図は、問題の角度どおりの座標で作る (図を見てはかっても答えと合う)

const T = 'angle';
const step5 = (r, min, max) => r.int(min / 5, max / 5) * 5;

/** 点の列と角のしるしを、左下が (0, 0) の図にする */
function angleFigure(points, parts) {
    const { move, w, h } = fitPoints(points);
    const m = p => move(p);
    return shape(w, h, {
        polys: (parts.polys ?? []).map(p => ({ ...p, points: p.points.map(m) })),
        lines: (parts.lines ?? []).map(l => ({ ...l, from: m(l.from), to: m(l.to) })),
        angles: (parts.angles ?? []).map(a => ({ ...a, at: m(a.at), from: m(a.from), to: m(a.to) })),
        labels: (parts.labels ?? []).map(l => ({ ...l, at: m(l.at) })),
        points: (parts.points ?? []).map(p => ({ ...p, at: m(p.at) })),
    });
}

/** 底辺 BC (長さ 10) の両はしの角が b と c の三角形の頂点 A */
function apex(b, c, base = 10) {
    const len = (base * Math.sin(deg(c))) / Math.sin(deg(b + c));
    return mul(dir(b), len);
}

const triangle = pattern(T, 'triangle', ['mid', 'high'], (r) => {
    const [b, c] = until(r, () => [step5(r, 30, 85), step5(r, 30, 85)], ([x, y]) => 180 - x - y >= 25);
    const [B, C, A] = [[0, 0], [10, 0], apex(b, c)];
    const a = 180 - b - c;
    return fillQ({
        text: '図の三角形で、アの角の大きさは何度ですか。',
        figure: angleFigure([A, B, C], {
            polys: [{ points: [A, B, C] }],
            angles: [
                { at: B, from: C, to: A, text: `${b}°` },
                { at: C, from: A, to: B, text: `${c}°` },
                { at: A, from: B, to: C, text: 'ア', accent: true },
            ],
        }),
        answer: a,
        unit: '度',
        explain: `三角形の3つの角をたすと180°です。180 − (${b} + ${c}) = ${a}（度）`,
    });
});

const straight = pattern(T, 'straight', ['mid'], (r) => {
    const a = until(r, () => step5(r, 25, 155), x => x !== 90);
    const [L, P, R] = [[0, 0], [6, 0], [12, 0]];
    const Q = add(P, mul(dir(a), 5));
    return fillQ({
        text: '1本の直線に、図のように線をひきました。アの角の大きさは何度ですか。',
        figure: angleFigure([L, R, Q, [6, -1]], {
            lines: [{ from: L, to: R }, { from: P, to: Q }],
            angles: [{ at: P, from: R, to: Q, text: `${a}°` }, { at: P, from: Q, to: L, text: 'ア', accent: true }],
        }),
        answer: 180 - a,
        unit: '度',
        explain: `一直線の角は180°です。180 − ${a} = ${180 - a}（度）`,
    });
});

const isosceles = pattern(T, 'isosceles', ['mid', 'high'], (r) => {
    const top = r.int(2, 14) * 10;
    const base = (180 - top) / 2;
    const [B, C, A] = [[0, 0], [10, 0], apex(base, base)];
    const askTop = r.bool();
    return fillQ({
        text: `図の三角形ABCは、辺ABと辺ACの長さが等しい二等辺三角形です。アの角の大きさは何度ですか。`,
        figure: angleFigure([A, B, C], {
            polys: [{ points: [A, B, C] }],
            angles: askTop
                ? [{ at: B, from: C, to: A, text: `${base}°` }, { at: A, from: B, to: C, text: 'ア', accent: true }]
                : [{ at: A, from: B, to: C, text: `${top}°` }, { at: C, from: A, to: B, text: 'ア', accent: true }],
            points: [{ at: A, text: 'A', dy: -10 }, { at: B, text: 'B', dx: -10, dy: 16 }, { at: C, text: 'C', dx: 10, dy: 16 }],
        }),
        answer: askTop ? top : base,
        unit: '度',
        explain: askTop
            ? `二等辺三角形の2つの底角は等しいので、角Cも${base}°。180 − ${base} × 2 = ${top}（度）`
            : `二等辺三角形の2つの底角は等しいので、(180 − ${top}) ÷ 2 = ${base}（度）`,
    });
});

const setSquares = pattern(T, 'set-squares', ['mid', 'high'], (r) => {
    const [t1, t2] = r.pick([[30, 45], [45, 30], [45, 60], [60, 45], [30, 60]]);
    // 1まい目: 頂点 P に t1 の角、A に直角。2まい目: P に t2 の角、B (1まい目の頂点) に直角
    const P = [0, 0];
    const A = [8, 0];
    const B = mul(dir(t1), 8 / Math.cos(deg(t1)));
    const D = mul(dir(t1 + t2), Math.hypot(...B) / Math.cos(deg(t2)));
    return fillQ({
        text: '1組の三角定規を、図のように組み合わせました。アの角の大きさは何度ですか。',
        figure: angleFigure([P, A, B, D], {
            polys: [{ points: [P, A, B] }, { points: [P, B, D] }],
            angles: [
                { at: A, from: P, to: B, right: true },
                { at: B, from: P, to: D, right: true },
                { at: P, from: A, to: D, text: 'ア', accent: true },
            ],
        }),
        answer: t1 + t2,
        unit: '度',
        explain: `三角定規の角は、30°・60°・90° と 45°・45°・90° です。アは ${t1}° と ${t2}° を合わせた角なので、${t1} + ${t2} = ${t1 + t2}（度）`,
    });
});

const vertical = pattern(T, 'vertical', ['mid'], (r) => {
    const a = until(r, () => step5(r, 30, 150), x => x !== 90);
    const O = [6, 4];
    const [L, R] = [[0, 4], [12, 4]];
    const [Q1, Q2] = [add(O, mul(dir(a), 5)), sub(O, mul(dir(a), 5))];
    const opposite = r.bool();
    return fillQ({
        text: '2本の直線が、図のように交わっています。アの角の大きさは何度ですか。',
        figure: angleFigure([L, R, Q1, Q2], {
            lines: [{ from: L, to: R }, { from: Q2, to: Q1 }],
            angles: [
                { at: O, from: R, to: Q1, text: `${a}°` },
                opposite ? { at: O, from: L, to: Q2, text: 'ア', accent: true } : { at: O, from: Q1, to: L, text: 'ア', accent: true },
            ],
        }),
        answer: opposite ? a : 180 - a,
        unit: '度',
        explain: opposite
            ? `向かい合う角 (対頂角) は等しくなります。どちらも 180° から同じ角をひいた大きさだからです。アは${a}°です。`
            : `一直線の角は180°です。180 − ${a} = ${180 - a}（度）`,
    });
});

/**
 * 角 angles (反時計回りに A, B, C, D) の四角形。AB を長さ 10 の底辺にし、BC の長さを t にする
 */
function quadrilateral(angles, t) {
    const [, b, c, d] = angles;
    const A = [0, 0];
    const B = [10, 0];
    const dBC = 180 - b;
    const C = add(B, mul(dir(dBC), t));
    const dCD = dBC + 180 - c;
    const dDA = dCD + 180 - d;
    const D = intersect(C, add(C, dir(dCD)), A, sub(A, dir(dDA)));
    return [A, B, C, D];
}

const quad = pattern(T, 'quadrilateral', ['high'], (r) => {
    const v = until(r, () => {
        const angles = [step5(r, 60, 125), step5(r, 60, 125), step5(r, 60, 125)];
        const d = 360 - angles[0] - angles[1] - angles[2];
        const pts = quadrilateral([...angles, d], r.int(6, 9));
        return { angles: [...angles, d], pts };
    }, ({ angles, pts }) => {
        if (angles[3] < 60 || angles[3] > 125) return false;
        const { w, h } = fitPoints(pts);
        return w < 18 && h < 14 && h > 4;
    });
    const [A, B, C, D] = v.pts;
    const [a, b, c, d] = v.angles;
    return fillQ({
        text: '図の四角形で、アの角の大きさは何度ですか。',
        figure: angleFigure(v.pts, {
            polys: [{ points: v.pts }],
            angles: [
                { at: A, from: B, to: D, text: `${a}°` },
                { at: B, from: C, to: A, text: `${b}°` },
                { at: C, from: D, to: B, text: `${c}°` },
                { at: D, from: A, to: C, text: 'ア', accent: true },
            ],
        }),
        answer: d,
        unit: '度',
        explain: `四角形は対角線で2つの三角形に分けられるので、4つの角をたすと 180 × 2 = 360°。360 − (${a} + ${b} + ${c}) = ${d}（度）`,
    });
});

const parallel = pattern(T, 'parallel', ['high'], (r) => {
    const a = until(r, () => step5(r, 35, 145), x => x !== 90);
    const h = 6;
    const P = [5, 0];
    const Q = add(P, mul(dir(a), h / Math.sin(deg(a))));
    const [x0, x1] = [Math.min(0, Q[0] - 4), Math.max(14, Q[0] + 4)];
    const alternate = r.bool();
    return fillQ({
        text: '図で、直線あと直線いは平行です。アの角の大きさは何度ですか。',
        figure: angleFigure([[x0, 0], [x1, h], add(P, mul(dir(a), -2)), add(Q, mul(dir(a), 2))], {
            lines: [
                { from: [x0, 0], to: [x1, 0] },
                { from: [x0, h], to: [x1, h] },
                { from: add(P, mul(dir(a), -2)), to: add(Q, mul(dir(a), 2)) },
            ],
            angles: [
                { at: P, from: [x1, 0], to: Q, text: `${a}°` },
                alternate ? { at: Q, from: [x0, h], to: P, text: 'ア', accent: true } : { at: Q, from: P, to: [x1, h], text: 'ア', accent: true },
            ],
            labels: [{ at: [x1 + 0.8, h], text: 'あ' }, { at: [x1 + 0.8, 0], text: 'い' }],
        }),
        answer: alternate ? a : 180 - a,
        unit: '度',
        explain: alternate
            ? `平行な2本の直線に1本の直線が交わると、Z の形になる角 (錯角) は等しくなります。アは${a}°です。`
            : `平行線の錯角は等しいので、上の直線との交わりにも${a}°の角があります。アはその角ととなり合って一直線になるので、180 − ${a} = ${180 - a}（度）`,
    });
});

// ひらめき: 正方形ABCDの中で、角EAF が 45° になる図。三角形ABEを、Aを中心に回してADに重ねる
const square45 = pattern(T, 'square-45', ['high'], (r) => {
    const a = r.int(50, 85);
    return square45Question(a);
}, { hirameki: true });

/** ∠AEB = a、∠DAF = a − 45 のとき、∠AFE = 180 − 45 − a */
export function square45Question(a) {
    const b = a - 45;
    const s = 10;
    const [A, B, C, D] = [[0, s], [0, 0], [s, 0], [s, s]];
    const E = [s / Math.tan(deg(a)), 0];
    const F = [s, s - s * Math.tan(deg(b))];
    const answer = 180 - 45 - a;
    return fillQ({
        text: `図のように、正方形ABCDの辺BC上に点E、辺CD上に点Fをとりました。角AEBは${a}°、角DAFは${b}°です。アの角（角AFE）の大きさは何度ですか。`,
        figure: angleFigure([A, B, C, D], {
            polys: [{ points: [A, B, C, D] }],
            lines: [{ from: A, to: E }, { from: A, to: F }, { from: E, to: F }],
            angles: [
                { at: E, from: A, to: B, text: `${a}°` },
                { at: A, from: D, to: F, text: `${b}°` },
                { at: F, from: A, to: E, text: 'ア', accent: true },
            ],
            points: [
                { at: A, text: 'A', dx: -10, dy: -6 }, { at: B, text: 'B', dx: -10, dy: 16 },
                { at: C, text: 'C', dx: 10, dy: 16 }, { at: D, text: 'D', dx: 10, dy: -6 },
                { at: E, text: 'E', dy: 18 }, { at: F, text: 'F', dx: 12, dy: 4 },
            ],
        }),
        answer,
        unit: '度',
        explain: `角BAE = 180 − 90 − ${a} = ${90 - a}°、角EAF = 90 − ${90 - a} − ${b} = 45° です。三角形ABEを、Aを中心に回してABをADに重ねると、Eは辺CDをのばした線の上にきます (Eがきた点をE'とします)。三角形AEFとAE'Fは、2つの辺とその間の角 (45°) が等しいので合同です。角AFE = 角AFE' = 180 − 45 − ${a} = ${answer}（度）`,
    });
}

// ひらめき: へこんだ四角形 (ブーメラン形)。へこんだところの角は、ほかの3つの角の和
const boomerang = pattern(T, 'boomerang', ['high'], (r) => {
    const v = until(r, () => {
        const [B0, C0] = [step5(r, 45, 75), step5(r, 45, 75)];
        const [b, c] = [step5(r, 15, 35), step5(r, 15, 35)];
        return { B0, C0, b, c, a: 180 - B0 - C0 };
    }, x => x.a >= 35 && x.B0 - x.b >= 15 && x.C0 - x.c >= 15);
    const { B0, C0, b, c, a } = v;
    const [B, C] = [[0, 0], [10, 0]];
    const A = apex(B0, C0);
    const D = intersect(B, dir(B0 - b), C, add(C, dir(180 - (C0 - c))));
    const answer = a + b + c;
    return fillQ({
        text: '図のようなへこんだ四角形ABDCがあります。アの角（角BDC）の大きさは何度ですか。',
        figure: angleFigure([A, B, C, D], {
            polys: [{ points: [A, B, D, C] }],
            lines: [{ from: B, to: C, dashed: true }],
            angles: [
                { at: A, from: B, to: C, text: `${a}°` },
                { at: B, from: D, to: A, text: `${b}°` },
                { at: C, from: A, to: D, text: `${c}°` },
                { at: D, from: C, to: B, text: 'ア', accent: true },
            ],
            points: [{ at: A, text: 'A', dy: -10 }, { at: B, text: 'B', dx: -10, dy: 16 }, { at: C, text: 'C', dx: 10, dy: 16 }, { at: D, text: 'D', dy: -10 }],
        }),
        answer,
        unit: '度',
        explain: `点線BCをひくと、三角形ABCの角の和から、角DBC + 角DCB = 180 − ${a} − ${b} − ${c} です。三角形DBCで、アの角 = 180 − (角DBC + 角DCB) = ${a} + ${b} + ${c} = ${answer}（度）。へこんだところの角は、ほかの3つの角の和になります。`,
    });
}, { hirameki: true });

export default [triangle, straight, isosceles, setSquares, vertical, quad, parallel, square45, boomerang];
