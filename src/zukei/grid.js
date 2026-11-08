import { grid } from '../long/figures.js';
import { until } from '../long/util.js';
import { pattern, fillQ, fillParts } from './helpers.js';

// マスに数をならべる問題 (魔方陣・数をならべた表・ピラミッド)

const T = 'grid';

const MAGIC = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
// 3×3 の線 (横3本・たて3本・ななめ2本)。[段, 列] の組
const LINES = [
    ...[0, 1, 2].map(y => [0, 1, 2].map(x => [y, x])),
    ...[0, 1, 2].map(x => [0, 1, 2].map(y => [y, x])),
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
];

const magic = pattern(T, 'magic', ['mid', 'high'], (r) => {
    // 回したり裏返したりして、数をかけてたした魔方陣
    const [k, b] = [r.int(1, 3), r.int(0, 9)];
    let m = MAGIC;
    for (let i = r.int(0, 3); i > 0; i--) m = m[0].map((_, x) => m.map(row => row[x]).reverse());
    if (r.bool()) m = m.map(row => [...row].reverse());
    m = m.map(row => row.map(v => v * k + b));
    const key = (y, x) => `${y},${x}`;
    const v = until(r, () => {
        const target = [r.int(0, 2), r.int(0, 2)];
        const hidden = new Set([key(...target)]);
        for (let i = r.int(2, 3); i > 0; i--) hidden.add(key(r.int(0, 2), r.int(0, 2)));
        return { target, hidden };
    }, ({ target, hidden }) => {
        const visible = line => line.every(c => !hidden.has(key(...c)));
        const through = LINES.filter(line => line.some(c => c[0] === target[0] && c[1] === target[1]));
        const solvable = through.some(line => line.filter(c => hidden.has(key(...c))).length === 1);
        return hidden.size >= 3 && LINES.some(visible) && solvable;
    });
    const cells = [];
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const isTarget = y === v.target[0] && x === v.target[1];
            cells.push({ x, y, text: isTarget ? 'ア' : v.hidden.has(key(y, x)) ? '' : String(m[y][x]), mark: isTarget ? 'target' : '' });
        }
    }
    const sum = 15 * k + 3 * b;
    return fillQ({
        text: '3×3のマスに数を入れて、たて・横・ななめのどの3つの数をたしても、同じ数になるようにします。アに入る数は何ですか。',
        figure: grid(3, 3, cells),
        answer: m[v.target[0]][v.target[1]],
        unit: '',
        explain: `数が全部わかっている列の3つの数をたすと${sum}です。アをふくむ列で、${sum}からほかの2つの数をひきます。`,
    });
});

/** 1から順に、1段に n こずつ左から右へならべた表 (はじめの rows 段と、そのあとの「⋮」) */
function rowTable(n, rows) {
    const cells = [];
    for (let x = 0; x < n; x++) cells.push({ x: x + 1, y: 0, text: `${x + 1}`, plain: true });
    for (let y = 0; y < rows; y++) {
        cells.push({ x: 0, y: y + 1, text: `${y + 1}段`, plain: true });
        for (let x = 0; x < n; x++) cells.push({ x: x + 1, y: y + 1, text: String(y * n + x + 1) });
    }
    for (let x = 0; x < n; x++) cells.push({ x: x + 1, y: rows + 1, text: '⋮', plain: true });
    return grid(n + 1, rows + 2, cells);
}

const rowValue = pattern(T, 'row-value', ['mid'], (r) => {
    const [n, R] = [r.int(5, 8), r.int(8, 20)];
    const C = r.int(1, n);
    const answer = (R - 1) * n + C;
    return fillQ({
        text: `1から順に、1つの段に${n}こずつ、左から右へ数をならべていきます。${R}段目の左から${C}番目の数は何ですか。`,
        figure: rowTable(n, 3),
        answer,
        unit: '',
        explain: `${R - 1}段目までに ${n} × ${R - 1} = ${(R - 1) * n}こ ならんでいます。そのあと${C}番目なので、${(R - 1) * n} + ${C} = ${answer}`,
    });
});

const rowPlace = pattern(T, 'row-place', ['mid', 'high'], (r) => {
    const n = r.int(5, 8);
    const value = r.int(4 * n, 25 * n);
    const R = Math.ceil(value / n);
    const C = value - (R - 1) * n;
    return fillParts({
        text: `1から順に、1つの段に${n}こずつ、左から右へ数をならべていきます。${value}は何段目の左から何番目にありますか。`,
        figure: rowTable(n, 3),
        parts: [R, ' 段目の左から ', C, ' 番目'],
        explain: `${value} ÷ ${n} = ${Math.floor(value / n)} あまり ${value % n}。${C === n ? `わり切れるので、${R}段目の右はし（${n}番目）です。` : `${Math.floor(value / n)}段がうまったあとの${R}段目の、左から${C}番目です。`}`,
    });
});

/** 下の段から上へ、となりの2つの数をたしていくピラミッド (下の段は4こ)。hide は数を見せないマス */
function pyramid(bottom, show) {
    const rows = [bottom];
    while (rows[0].length > 1) rows.unshift(rows[0].slice(1).map((v, i) => v + rows[0][i]));
    const cells = rows.flatMap((row, y) => row.map((v, i) => {
        const shown = show(y, i, v);
        return { x: (3 - y) / 2 + i, y, text: shown === true ? String(v) : shown || '', mark: shown === 'ア' ? 'target' : '' };
    }));
    return { rows, figure: grid(4, 4, cells) };
}

const pyramidTop = pattern(T, 'pyramid-top', ['mid'], (r) => {
    const bottom = Array.from({ length: 4 }, () => r.int(1, 15));
    const { rows, figure } = pyramid(bottom, y => (y === 3 ? true : y === 0 ? 'ア' : false));
    return fillQ({
        text: 'となりどうしの2つのマスの数をたして、その上のマスに書いていきます。いちばん上のアに入る数は何ですか。',
        figure,
        answer: rows[0][0],
        unit: '',
        explain: `下から順にたしていきます。2段目は ${rows[2].join('・')}、3段目は ${rows[1].join('・')} なので、アは ${rows[1][0]} + ${rows[1][1]} = ${rows[0][0]}`,
    });
});

// ひらめき: いちばん上の数から、下の段のわからない数をもとめる。下の数が上で何回たされるかを考える
const pyramidMissing = pattern(T, 'pyramid-missing', ['mid', 'high'], (r) => {
    const bottom = Array.from({ length: 4 }, () => r.int(1, 12));
    const at = r.int(1, 2);
    const { rows, figure } = pyramid(bottom, (y, i) => (y === 3 ? (i === at ? 'ア' : true) : y === 0));
    const [a, b, c, d] = bottom;
    return fillQ({
        text: 'となりどうしの2つのマスの数をたして、その上のマスに書いていきます。アに入る数は何ですか。',
        figure,
        answer: bottom[at],
        unit: '',
        explain: `下の段の数は、いちばん上で 左はしと右はしが1回ずつ、まん中の2つが3回ずつたされます。${rows[0][0]} = ${a} + ${at === 1 ? 'ア' : b} × 3 + ${at === 2 ? 'ア' : c} × 3 + ${d} なので、ア = (${rows[0][0]} − ${a + d} − ${(at === 1 ? c : b) * 3}) ÷ 3 = ${bottom[at]}`,
    });
}, { hirameki: true });

const calendar = pattern(T, 'calendar', ['mid', 'high'], (r) => {
    const start = r.int(0, 6);
    const days = r.pick([30, 31]);
    const ok = x => (start + x - 1) % 7 !== 6 && x + 8 <= days;
    const [example, answer] = until(r, () => [r.int(1, 22), r.int(1, 22)], ([e, x]) => e !== x && ok(e) && ok(x));
    const cells = ['日', '月', '火', '水', '木', '金', '土'].map((text, x) => ({ x, y: 0, text, plain: true }));
    const boxed = new Set([example, example + 1, example + 7, example + 8]);
    for (let d = 1; d <= days; d++) {
        const i = start + d - 1;
        cells.push({ x: i % 7, y: Math.floor(i / 7) + 1, text: String(d), mark: boxed.has(d) ? 'shade' : '' });
    }
    const sum = 4 * answer + 16;
    return fillQ({
        text: `カレンダーの中で、図の色をつけたところのように、たて2つ・横2つの4つの数をかこみます。べつの場所でかこんだ4つの数をたすと${sum}になりました。かこんだ4つの数のうち、左上の数は何ですか。`,
        figure: grid(7, Math.ceil((start + days) / 7) + 1, cells),
        answer,
        unit: '',
        explain: `左上の数を□とすると、右は□+1、下は□+7、右下は□+8 です。4つの数の和は □ × 4 + 16 なので、(${sum} − 16) ÷ 4 = ${answer}`,
    });
}, { hirameki: true });

// ひらめき: 右上から左下へななめに数をならべた表
const diagonal = pattern(T, 'diagonal', ['high'], (r) => diagonalQuestion(r.int(2, 5), r.int(10, 25)), { hirameki: true });

/** 上から R 段目、左から C 番目の数 (ななめの列 d = R + C − 1 の、上から R 番目) */
export function diagonalQuestion(R, C) {
    const value = (y, x) => {
        const d = y + x - 1;
        return (d * (d - 1)) / 2 + y;
    };
    const cells = [];
    for (let x = 1; x <= 6; x++) cells.push({ x, y: 0, text: x === 6 ? '…' : `${x}`, plain: true });
    for (let y = 1; y <= 5; y++) {
        cells.push({ x: 0, y, text: `${y}段`, plain: true });
        for (let x = 1; x <= 6; x++) {
            if (x === 6) cells.push({ x, y, text: '…', plain: true });
            else cells.push({ x, y, text: y + x - 1 <= 5 ? String(value(y, x)) : '' });
        }
    }
    const d = R + C - 1;
    const answer = value(R, C);
    const first = value(1, d);
    return fillQ({
        text: `下の表のように、1から順に、右上から左下へななめに数をならべていきます。上から${R}段目、左から${C}番目の数は何ですか。`,
        figure: grid(7, 6, cells),
        answer,
        unit: '',
        explain: `1段目の数は 1, 2, 4, 7, 11, … と、ふえ方が1ずつ大きくなります。${R}段目の${C}番目から右上へ${R - 1}つもどると、1段目の${d}番目で、その数は 1 + (1 + 2 + … + ${d - 1}) = ${first} です。そこから左下へ${R - 1}つ進むので、${first} + ${R - 1} = ${answer}`,
    });
}

export default [magic, rowValue, rowPlace, pyramidTop, pyramidMissing, calendar, diagonal];
