// 図のデータを作るヘルパー。問題側は「種類＋数値」だけを返し、描画は
// src/components/figures/ のコンポーネントが行う（問題生成を Node だけでテストできるようにするため）

export const FIGURE_TYPES = ['table', 'segments', 'route', 'graph', 'shape', 'tank', 'circle', 'grid'];

/** 表。head: 見出しの配列、rows: 行（セルの配列）の配列 */
export function table(head, rows, caption = '') {
    return { type: 'table', caption, head, rows };
}

/**
 * 線分図。bars: [{ label, parts: [{ len, note?, dashed? }] }]
 * total: 右側のかっこに書く文字（合計など）
 */
export function segments(bars, total = '') {
    // brace: 'over' を足すと、全体の数を線の上の横向きのかっこに書く (src/word/segments.js)
    return { type: 'segments', bars, total };
}

/**
 * 道のりの図。points: 地点名の配列、legs: [{ len, text }]（地点の間）、
 * movers: [{ at: 地点の番号, dir: 1 | -1, text }]
 */
export function route(points, legs, movers = []) {
    return { type: 'route', points, legs, movers };
}

/**
 * 折れ線グラフ。xTicks / yTicks: [{ v, text }]、lines: [{ points: [[x, y], ...], label?, dashed? }]
 */
export function graph({ xLabel, yLabel, xMax, yMax, xTicks, yTicks, lines }) {
    return { type: 'graph', xLabel, yLabel, xMax, yMax, xTicks, yTicks, lines };
}

/**
 * 図形。座標は左下が原点（右が x、上が y）で、w × h の範囲に収める
 *  polys:   [{ points: [[x, y], ...], fill?: 'shade' | 'water' | 'paper' | 'cut' | 'none', dashed? }]
 *           ('paper' は紙の色でぬって下の図をかくす。'cut' は折り紙の切り取ったところ)
 *  circles: [{ cx, cy, r, fill? }]
 *  sectors: [{ cx, cy, r, from, to, fill? }]（角度は度。右向きを0として反時計回り）
 *  lines:   [{ from, to, dashed? }]
 *  dims:    [{ from, to, text, side? }]（寸法。side は線のどちら側に書くか 'below' | 'above' | 'left' | 'right'）
 *  labels:  [{ at, text }]
 *  points:  [{ at, text, dx?, dy? }]（頂点の名前）
 *  angles:  [{ at, from, to, text?, right?, accent? }]（角のしるし。at が頂点で、from と to の向きの間に弧をかく。right で直角のしるし）
 *  paths:   [{ d: [['M', x, y], ['L', x, y], ['A', r, x, y, ccw?]], fill?, dashed? }]（円の弧をふくむ形。A は半径 r の弧）
 *  ellipses:[{ cx, cy, rx, ry, half?: 'front' | 'back', dashed? }]（円柱の底面。front は手前の半分）
 *  caption: 図の下に書く文字
 *  maxW / maxH / pad: 図を小さく出すときの、図の大きさと余白 (ふだんは 320 / 210 / 58)
 *  labels の small: 小さい文字
 * polys → paths → sectors → circles の順にかくので、あとのものが上にのる
 */
export function shape(w, h, parts, type = 'shape') {
    return {
        type, w, h, polys: [], circles: [], sectors: [], lines: [], dims: [], labels: [], points: [], angles: [], paths: [], ellipses: [], ...parts,
    };
}

/**
 * マス目。cells: [{ x, y, text, mark?: 'target' | 'shade', plain? }]（x は左からの列、y は上からの段。半マスずらしてもよい）
 * plain は線をかかない見出しのマス
 */
export function grid(w, h, cells, caption = '') {
    return { type: 'grid', w, h, cells, caption };
}

export const rectPoints = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
