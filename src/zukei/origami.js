import { shape } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, pickQ, intersect } from './helpers.js';

// 折り紙を折って切り、広げる問題。
// 紙は1辺1の正方形 (左下が (0, 0))。折った紙は、広げた紙の一部 (region) と同じ場所にあるものとして考え、
// 切ったところを折り目で鏡のように映す (group の変換をかける) と、広げたときの穴になる。

const T = 'origami';
/** 穴を数えるときに、紙を N × N のマスに分ける */
const N = 64;

const id = p => p;
const Rx = ([x, y]) => [1 - x, y];
const Ry = ([x, y]) => [x, 1 - y];
const S = ([x, y]) => [y, x];
const Tx = ([x, y]) => [x + 0.5, y];
const Ty = ([x, y]) => [x, y + 0.5];
const R90 = ([x, y]) => [1 - y, x];
/** compose(f, g)(p) = f(g(p)) */
const compose = (...fs) => p => fs.reduceRight((q, f) => f(q), p);

const QUARTER = [id, Rx, Ry, compose(Rx, Ry)];
const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1]];

/**
 * 折り方。region は折った紙の形、folds は折った紙の折り目の辺、group は広げたときに切り口を映す変換、
 * lines は広げた紙の折り目、mirror は折った紙の形を自分自身に重ねる裏返し (まちがいの選択肢を作るのに使う)、
 * wrong はほかのまちがった広げ方
 */
export const FOLDS = {
    half: {
        region: [[0, 0], [0.5, 0], [0.5, 1], [0, 1]],
        folds: [[[0.5, 0], [0.5, 1]]],
        group: [id, Rx],
        lines: [[[0.5, 0], [0.5, 1]]],
        mirror: [([x, y]) => [0.5 - x, y], ([x, y]) => [x, 1 - y]],
        wrong: [[id, Tx], [id]],
        layers: 2,
    },
    quarter: {
        region: [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]],
        folds: [[[0.5, 0], [0.5, 0.5]], [[0, 0.5], [0.5, 0.5]]],
        group: QUARTER,
        lines: [[[0.5, 0], [0.5, 1]], [[0, 0.5], [1, 0.5]]],
        mirror: [([x, y]) => [0.5 - x, y], ([x, y]) => [x, 0.5 - y]],
        wrong: [[id, Tx, Ty, compose(Tx, Ty)], [id, Ry], [id, Rx]],
        layers: 4,
    },
    eighth: {
        region: [[0, 0], [0.5, 0], [0.5, 0.5]],
        folds: [[[0.5, 0], [0.5, 0.5]], [[0, 0], [0.5, 0.5]]],
        group: [...QUARTER, ...QUARTER.map(g => compose(g, S))],
        lines: [[[0.5, 0], [0.5, 1]], [[0, 0.5], [1, 0.5]], [[0, 0], [1, 1]], [[1, 0], [0, 1]]],
        mirror: [([x, y]) => [0.5 - y, 0.5 - x]],
        wrong: [QUARTER, [id, S, Ry, compose(Ry, S)], [id, S, Rx, compose(Rx, S)]],
        layers: 8,
    },
};

// 折り方ごとの、折る前の紙と折る線
const STEPS = [
    { figure: () => step(SQUARE, [[0.5, 0], [0.5, 1]], '右半分を左に重ねて折る') },
    { figure: () => step(FOLDS.half.region, [[0, 0.5], [0.5, 0.5]], '上半分を下に重ねて折る') },
    { figure: () => step(FOLDS.quarter.region, [[0, 0], [0.5, 0.5]], '左上を右下に重ねて折る') },
];
const ORDER = ['half', 'quarter', 'eighth'];
const NUMBERS = ['①', '②', '③', '④'];

// 手順の図は小さくならべるので、図を小さめに、文字が入る分だけ余白をとる
const STEP_SIZE = { maxW: 120, maxH: 120, pad: 44 };

function step(region, line, caption) {
    const xs = region.map(p => p[0]);
    const ys = region.map(p => p[1]);
    return shape(Math.max(...xs), Math.max(...ys), { polys: [{ points: region }], lines: [{ from: line[0], to: line[1], dashed: true }], caption, ...STEP_SIZE });
}

/** 折るところから切るところまでの図 */
function foldFigures(fold, cuts) {
    const n = ORDER.indexOf(fold) + 1;
    const steps = STEPS.slice(0, n).map((s, i) => {
        const f = s.figure();
        return { ...f, caption: `${NUMBERS[i]} ${f.caption}` };
    });
    const { region, folds } = FOLDS[fold];
    const w = Math.max(...region.map(p => p[0]));
    const h = Math.max(...region.map(p => p[1]));
    // 折り目の辺に「折り目」と書く (辺のまん中から、形の外へ少しはなす)
    const k = Math.min(STEP_SIZE.maxW / w, STEP_SIZE.maxH / h);
    const cx = region.reduce((s, p) => s + p[0], 0) / region.length;
    const cy = region.reduce((s, p) => s + p[1], 0) / region.length;
    const labels = folds.map(([a, b]) => {
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        let [nx, ny] = [b[1] - a[1], a[0] - b[0]];
        const len = Math.hypot(nx, ny);
        [nx, ny] = [nx / len, ny / len];
        if (nx * (m[0] - cx) + ny * (m[1] - cy) < 0) [nx, ny] = [-nx, -ny];
        const off = (Math.abs(nx) > 0.9 ? 24 : Math.abs(ny) > 0.9 ? 12 : 22) / k;
        return { at: [m[0] + nx * off, m[1] + ny * off], text: '折り目', small: true };
    });
    const last = shape(w, h, {
        polys: [{ points: region }, ...cuts.map(points => ({ points, fill: 'cut' }))],
        labels,
        caption: `${NUMBERS[n]} 黒いところを切り取る`,
        ...STEP_SIZE,
    });
    return [...steps, last];
}

/** 広げた紙の図 */
function unfoldedFigure(fold, holes) {
    return shape(1, 1, {
        polys: [{ points: SQUARE }, ...holes.map(points => ({ points, fill: 'cut' }))],
        lines: FOLDS[fold].lines.map(([from, to]) => ({ from, to, dashed: true })),
        maxW: 200,
        maxH: 200,
        pad: 8,
    });
}

// ---- 切り口 ----

function cutShape(kind, [cx, cy], s) {
    if (kind === 'circle') return Array.from({ length: 24 }, (_, i) => [cx + s * Math.cos((Math.PI * i) / 12), cy + s * Math.sin((Math.PI * i) / 12)]);
    if (kind === 'square') return [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
    return [[cx - s, cy - s * 0.8], [cx + s, cy - s * 0.8], [cx, cy + s]];
}

/** 凸多角形 region (反時計回り) の中に入る部分だけを残す (Sutherland–Hodgman) */
export function clip(poly, region) {
    let out = poly;
    region.forEach((a, i) => {
        const b = region[(i + 1) % region.length];
        const inside = p => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-12;
        const input = out;
        out = [];
        input.forEach((p, j) => {
            const q = input[(j + 1) % input.length];
            if (inside(p)) out.push(p);
            if (inside(p) !== inside(q)) out.push(intersect(a, b, p, q));
        });
    });
    return out;
}

/** 切り口を、変換 elements で映した穴の形 */
const spread = (cuts, elements) => elements.flatMap(g => cuts.map(c => c.map(g)));

function inside(p, poly) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
}

/** 広げた紙を N × N のマスに分けて、切り取ったマスを 1 にする */
export function raster(holes) {
    const boxes = holes.map(h => [Math.min(...h.map(p => p[0])), Math.max(...h.map(p => p[0])), Math.min(...h.map(p => p[1])), Math.max(...h.map(p => p[1]))]);
    const cells = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
            // マスのまん中から少しずらして調べる (ななめの折り目の上にちょうどのらないように)
            const p = [(i + 0.5) / N + 1e-5, (j + 0.5) / N + 2.3e-5];
            if (holes.some((h, k) => p[0] >= boxes[k][0] && p[0] <= boxes[k][1] && p[1] >= boxes[k][2] && p[1] <= boxes[k][3] && inside(p, h))) cells[j * N + i] = 1;
        }
    }
    return cells;
}

/** 穴の数。つながっている切り取ったマスを1つと数え、紙のふちにかかるもの (切りこみ) は数えない */
export function countHoles(cells) {
    const seen = new Uint8Array(N * N);
    let holes = 0;
    for (let start = 0; start < N * N; start++) {
        if (!cells[start] || seen[start]) continue;
        let edge = false;
        const stack = [start];
        seen[start] = 1;
        while (stack.length) {
            const c = stack.pop();
            const [i, j] = [c % N, Math.floor(c / N)];
            if (i === 0 || j === 0 || i === N - 1 || j === N - 1) edge = true;
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const [ni, nj] = [i + di, j + dj];
                const n = nj * N + ni;
                if (ni >= 0 && nj >= 0 && ni < N && nj < N && cells[n] && !seen[n]) {
                    seen[n] = 1;
                    stack.push(n);
                }
            }
        }
        if (!edge) holes++;
    }
    return holes;
}

/** 折り方 fold で、折った紙の上の切り口 cuts を切ったときの、広げた紙の穴の数 */
export function holesAfterUnfold(fold, cuts) {
    return countHoles(raster(spread(cuts.map(c => clip(c, FOLDS[fold].region)), FOLDS[fold].group)));
}

// ---- 切る場所 ----

/**
 * 切り口のまん中の点。where は 'inside' (まわりの辺からはなれたところ)・'fold' (折り目の上)・
 * 'center' (紙のまん中。折り目が集まるところ)・'outer' (紙のふち)
 */
function spot(r, fold, where, s) {
    const m = s + 0.04;
    const u = (a, b) => a + (b - a) * r.next();
    if (fold === 'half') {
        if (where === 'inside') return [u(m, 0.5 - m), u(m, 1 - m)];
        if (where === 'fold' || where === 'center') return [0.5, u(m + 0.02, 1 - m - 0.02)];
        return r.bool() ? [0, u(0.25, 0.75)] : [u(m, 0.5 - m), 0];
    }
    if (fold === 'quarter') {
        if (where === 'inside') return [u(m, 0.5 - m), u(m, 0.5 - m)];
        if (where === 'fold') return r.bool() ? [0.5, u(m, 0.5 - m - 0.02)] : [u(m, 0.5 - m - 0.02), 0.5];
        if (where === 'center') return [0.5, 0.5];
        return r.bool() ? [0, u(m, 0.5 - m)] : [u(m, 0.5 - m), 0];
    }
    // 八つ折り (0 ≤ y ≤ x ≤ 0.5 の直角二等辺三角形)
    if (where === 'inside') {
        return until(r, () => [u(0, 0.5), u(0, 0.5)], ([x, y]) => y >= m && x <= 0.5 - m && (x - y) / Math.SQRT2 >= m);
    }
    if (where === 'fold') {
        if (r.bool()) return [0.5, u(m, 0.5 - m * 1.5 - 0.02)];
        const t = u(m * 1.5 + 0.02, 0.5 - m - 0.02);
        return [t, t];
    }
    if (where === 'center') return [0.5, 0.5];
    return [u(m * 1.5 + 0.02, 0.5 - m), 0];
}

const SIZES = { half: [0.07, 0.11], quarter: [0.06, 0.09], eighth: [0.05, 0.075] };
const KINDS = ['circle', 'square', 'triangle'];

function makeCut(r, fold, where) {
    const [lo, hi] = SIZES[fold];
    const s = lo + (hi - lo) * r.next();
    return clip(cutShape(r.pick(KINDS), spot(r, fold, where, s), s), FOLDS[fold].region);
}

const signature = holes => raster(holes).join('');

// ---- 問題 ----

/** 広げた形を4つの図からえらぶ */
function pickQuestion(r, fold) {
    const { group, mirror, wrong } = FOLDS[fold];
    const v = until(r, () => {
        const cuts = [makeCut(r, fold, r.pick(['inside', 'inside', 'fold', 'outer']))];
        const right = spread(cuts, group);
        const candidates = r.shuffle([
            ...wrong.map(els => spread(cuts, els)),
            ...mirror.map(m => spread(cuts.map(c => c.map(m)), group)),
            spread(cuts, group.map(g => compose(R90, g))),
        ]);
        const seen = new Set([signature(right)]);
        const others = [];
        for (const c of candidates) {
            const sig = signature(c);
            if (others.length < 3 && !seen.has(sig)) {
                seen.add(sig);
                others.push(c);
            }
        }
        return { cuts, right, others };
    }, x => x.others.length === 3);
    const correct = r.int(0, 3);
    const choices = [...v.others];
    choices.splice(correct, 0, v.right);
    return pickQ({
        text: '折り紙を、図のように折ってから、黒いところを切り取りました。紙を広げると、どんな形になりますか。ア〜エから1つえらびましょう。（点線は折り目です）',
        figure: foldFigures(fold, v.cuts),
        choices: choices.map(holes => unfoldedFigure(fold, holes)),
        correct,
        explain: `折った紙を広げるときは、折り目を線にして、切ったところが鏡にうつしたように（線対称に）うつります。最後に折った折り目から順に、1回ずつ広げて考えましょう。紙は${FOLDS[fold].layers}まい重なっています。`,
    });
}

/** 広げたときの穴の数 */
function holesQuestion(r, fold, count) {
    const v = until(r, () => {
        const cuts = Array.from({ length: count }, () => makeCut(r, fold, r.pick(['inside', 'fold', 'center', 'outer'])));
        // 切り口どうしが重なったり、くっついたりしないようにする
        const separate = cuts.every((c, i) => cuts.every((d, j) => j <= i || apart(c, d)));
        return { cuts, separate };
    }, x => x.separate && holesAfterUnfold(fold, x.cuts) > 0);
    const answer = holesAfterUnfold(fold, v.cuts);
    return fillQ({
        text: '折り紙を、図のように折ってから、黒いところを切り取りました。紙を広げると、穴はいくつできますか。（紙のふちが切れて、へこんだところは、穴に数えません）',
        figure: foldFigures(fold, v.cuts),
        answer,
        unit: 'こ',
        explain: `紙は${FOLDS[fold].layers}まい重なっているので、折り目にかからない切り口は、広げると${FOLDS[fold].layers}この穴になります。折り目にかかった切り口は、広げると両側がつながって1つの穴になります。紙のふちにかかった切り口は、穴ではなく、へこみになります。`,
    });
}

/** 2つの切り口が、はなれているか (まわりを少し広げても重ならない) */
function apart(c, d) {
    const box = p => [Math.min(...p.map(q => q[0])), Math.max(...p.map(q => q[0])), Math.min(...p.map(q => q[1])), Math.max(...p.map(q => q[1]))];
    const [a, b] = [box(c), box(d)];
    const gap = 0.04;
    return a[1] + gap < b[0] || b[1] + gap < a[0] || a[3] + gap < b[2] || b[3] + gap < a[2];
}

const pickMid = pattern(T, 'pick-mid', ['mid'], r => pickQuestion(r, r.pick(['half', 'quarter'])));
const pickHigh = pattern(T, 'pick-high', ['high'], r => pickQuestion(r, r.pick(['quarter', 'eighth'])));
const holesMid = pattern(T, 'holes-mid', ['mid'], r => holesQuestion(r, r.pick(['half', 'quarter']), 1));
const holesHigh = pattern(T, 'holes-high', ['high'], r => holesQuestion(r, r.pick(['quarter', 'eighth']), 2), { hirameki: true });

export default [pickMid, pickHigh, holesMid, holesHigh];
