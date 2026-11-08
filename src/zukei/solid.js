// 立体の図。ななめ右上におく行きをかく見取図にして、src/long/figures.js の shape の多角形にする。
// x は右、y は上、z はおく。手前の面ほどあとにかく (紙の色でぬるので、見えない線はかくれる)

export const KX = 0.5;
export const KY = 0.35;

/** 立体の点を、図の上の点にする */
export const proj = ([x, y, z]) => [x + z * KX, y + z * KY];

/** 正面の形 front (反時計回りの点の列) を、おく行き depth だけのばした立体の、見える面 */
export function prism(front, depth, { topFill = 'shade' } = {}) {
    const sides = [];
    front.forEach((p, i) => {
        const q = front[(i + 1) % front.length];
        // 辺の外向きの向きが右か上なら、その面は見える
        const [nx, ny] = [q[1] - p[1], p[0] - q[0]];
        if (nx * KX + ny * KY <= 1e-9) return;
        sides.push({
            points: [p, q, [q[0] + depth * KX, q[1] + depth * KY], [p[0] + depth * KX, p[1] + depth * KY]],
            fill: ny > 0 ? topFill : 'paper',
        });
    });
    return [...sides, { points: front, fill: 'paper' }];
}

/**
 * 立方体の積み木。list は [x, y, z] (1辺 size の立方体の左下手前の角)。
 * おくから手前、下から上、左から右の順にかく
 */
export function cubes(list, size = 1) {
    const sorted = [...list].sort((a, b) => b[2] - a[2] || a[1] - b[1] || a[0] - b[0]);
    return sorted.flatMap(([x, y, z]) => {
        const front = [[x, y], [x + size, y], [x + size, y + size], [x, y + size]].map(([px, py]) => proj([px, py, z]));
        return prism(front, size);
    });
}

/** 図のはば・高さ (点の右はしと上はし) */
export function extent(polys) {
    const pts = polys.flatMap(p => p.points);
    return { w: Math.max(...pts.map(p => p[0])), h: Math.max(...pts.map(p => p[1])) };
}
