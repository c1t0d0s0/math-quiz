import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { FIGURE_TYPES } from '../src/long/figures.js';
import { MODES } from '../src/modes.js';
import { patterns, generateZukei, createZukeiSet, TOPICS, ZUKEI_COUNT, HIRAMEKI_MIN, HIRAMEKI_MAX } from '../src/zukei/index.js';
import { perimeterOf, areaOf } from '../src/zukei/helpers.js';
import { threeSquaresQuestion } from '../src/zukei/area.js';
import { square45Question } from '../src/zukei/angle.js';
import { diagonalQuestion } from '../src/zukei/grid.js';
import { fifthQuestion } from '../src/zukei/shaded.js';
import { cutQuestion } from '../src/zukei/volume.js';
import { FOLDS, holesAfterUnfold, raster } from '../src/zukei/origami.js';
import perimeterPatterns from '../src/zukei/perimeter.js';

const LEVELS = ['mid', 'high'];
const RUNS = 300;

function memoryStorage() {
    const data = new Map();
    return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
}

// 図のデータの中に、数でない値（NaN など）がまぎれていないか
function badNumbers(value, path = 'figure') {
    if (typeof value === 'number') return Number.isFinite(value) ? [] : [path];
    if (Array.isArray(value)) return value.flatMap((v, i) => badNumbers(v, `${path}[${i}]`));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => badNumbers(v, `${path}.${k}`));
    return [];
}

const figuresOf = q => [q.figure, ...Object.values(q.optionFigures ?? {})].flat().filter(Boolean);
const decimals = v => (String(v).split('.')[1] ?? '').length;

describe('図形チャレンジのモード', () => {
    it('3・4年と5・6年のモードがある', () => {
        const zukei = MODES.filter(m => m.kind === 'zukei');
        expect(zukei.map(m => [m.id, m.level])).toEqual([['zukei-mid', 'mid'], ['zukei-high', 'high']]);
    });

    it('どの学年帯にも、7つの種類がすべてある', () => {
        for (const level of LEVELS) {
            expect(new Set(patterns[level].map(p => p.topic)), level).toEqual(new Set(Object.keys(TOPICS)));
        }
    });

    it('パターンの id は重ならない', () => {
        const ids = [...new Set([...patterns.mid, ...patterns.high])].map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe.each(LEVELS.flatMap(level => patterns[level].map(p => [p.id, level, p])))('%s (%s)', (id, level, pattern) => {
    it(`${RUNS}回作っても、答えと図が正しい形になる`, () => {
        for (let seed = 1; seed <= RUNS; seed++) {
            const q = generateZukei(pattern, createRng(seed));
            expect(q.text, `${id} seed ${seed}`).toBeTruthy();
            expect(q.explain, `${id} seed ${seed}`).toBeTruthy();
            for (const figure of figuresOf(q)) {
                expect(FIGURE_TYPES, id).toContain(figure.type);
                expect(badNumbers(figure), `${id} seed ${seed}`).toEqual([]);
            }
            if (q.type === 'fill') {
                expect(q.blanks.length, id).toBe(q.parts.filter(p => typeof p !== 'string').length);
                for (const v of q.blanks) {
                    expect(Number.isFinite(v) && v > 0, `${id} seed ${seed}: ${v}`).toBe(true);
                    expect(String(v).length, `${id} seed ${seed}: ${v}`).toBeLessThanOrEqual(q.maxLength);
                    // 小数の答えは 2けたまで。小数のときだけ「.」のキーを出す
                    expect(decimals(v), `${id} seed ${seed}: ${v}`).toBeLessThanOrEqual(2);
                }
                expect(q.keys.includes('.'), id).toBe(q.blanks.some(v => !Number.isInteger(v)));
            } else {
                expect(q.type, id).toBe('pick');
                expect(q.options, id).toEqual(['ア', 'イ', 'ウ', 'エ']);
                expect(q.options, id).toContain(q.answer);
            }
        }
    });
});

describe('答えが図と合う', () => {
    it('まわりの長さは、図の多角形の辺の長さの和', () => {
        for (const p of perimeterPatterns.filter(x => ['perimeter-rect', 'perimeter-stairs', 'perimeter-notch', 'perimeter-combined'].includes(x.id))) {
            for (let seed = 1; seed <= 100; seed++) {
                const q = p.generate(createRng(seed));
                expect(q.blanks[0], `${p.id} seed ${seed}`).toBe(perimeterOf(q.figure.polys[0].points));
            }
        }
    });

    it('階段の形のまわりは、外の長方形のまわりと同じ', () => {
        const stairs = perimeterPatterns.find(x => x.id === 'perimeter-stairs');
        for (let seed = 1; seed <= 100; seed++) {
            const q = stairs.generate(createRng(seed));
            expect(q.blanks[0]).toBe(2 * (q.figure.w + q.figure.h));
        }
    });

    it('面積の問題の答えは、色をつけた多角形の面積', () => {
        for (const id of ['area-rect', 'area-lshape']) {
            const p = patterns.mid.find(x => x.id === id);
            for (let seed = 1; seed <= 100; seed++) {
                const q = p.generate(createRng(seed));
                expect(q.blanks[0], `${id} seed ${seed}`).toBe(areaOf(q.figure.polys[0].points));
            }
        }
    });
});

describe('例の問題と同じ数で、同じ答えになる', () => {
    it('3つの正方形 (BC+CF+FI=19cm, DE=2cm, HG=4cm) → 81cm²', () => {
        const q = threeSquaresQuestion(9, 7, 3);
        expect(q.text).toContain('19cm');
        expect(q.blanks).toEqual([81]);
    });

    it('正方形の中の角 (角AEB=77°, 角DAF=32°) → 58°', () => {
        const q = square45Question(77);
        expect(q.text).toContain('32°');
        expect(q.blanks).toEqual([58]);
    });

    it('ななめにならべた表の、3段目・左から19番目 → 213', () => {
        expect(diagonalQuestion(3, 19).blanks).toEqual([213]);
    });

    it('正方形の中の正方形 (1辺10cm) → 20cm²', () => {
        expect(fifthQuestion(10).blanks).toEqual([20]);
    });

    it('ななめに切った直方体 (底面 5cm × 4cm, AE=9cm, CG=7cm) → 160cm³', () => {
        expect(cutQuestion(5, 4, 9, 7).blanks).toEqual([160]);
    });
});

describe('折り紙', () => {
    const circle = (cx, cy, r) => Array.from({ length: 24 }, (_, i) => [cx + r * Math.cos((Math.PI * i) / 12), cy + r * Math.sin((Math.PI * i) / 12)]);

    it('折り目からはなれたところを切ると、重なった紙の数だけ穴ができる', () => {
        expect(holesAfterUnfold('half', [circle(0.25, 0.5, 0.08)])).toBe(2);
        expect(holesAfterUnfold('quarter', [circle(0.25, 0.25, 0.08)])).toBe(4);
        expect(holesAfterUnfold('eighth', [circle(0.35, 0.15, 0.05)])).toBe(8);
    });

    it('折り目にかかる切り口は、広げるとつながる', () => {
        expect(holesAfterUnfold('half', [circle(0.5, 0.5, 0.08)])).toBe(1);
        expect(holesAfterUnfold('quarter', [circle(0.5, 0.25, 0.08)])).toBe(2);
        // 八つ折りで、ななめの折り目にかかる
        expect(holesAfterUnfold('eighth', [circle(0.25, 0.25, 0.05)])).toBe(4);
        // 紙のまん中 (折り目が全部集まるところ) は1つの穴
        expect(holesAfterUnfold('eighth', [circle(0.5, 0.5, 0.06)])).toBe(1);
    });

    it('紙のふちにかかる切り口は、穴ではない', () => {
        expect(holesAfterUnfold('quarter', [circle(0, 0.25, 0.08)])).toBe(0);
        expect(holesAfterUnfold('quarter', [circle(0, 0.25, 0.08), circle(0.25, 0.25, 0.05)])).toBe(4);
    });

    it('広げた形をえらぶ問題の4つの図は、どれもちがう形', () => {
        for (const level of LEVELS) {
            const p = patterns[level].find(x => x.id.startsWith('origami-pick'));
            for (let seed = 1; seed <= 100; seed++) {
                const q = generateZukei(p, createRng(seed));
                const shapes = q.options.map(o => raster(q.optionFigures[o].polys.filter(x => x.fill === 'cut').map(x => x.points)).join(''));
                expect(new Set(shapes).size, `${p.id} seed ${seed}`).toBe(4);
            }
        }
    });

    it('すべての折り方に、紙をしきつめる映し方がある', () => {
        for (const [name, fold] of Object.entries(FOLDS)) {
            expect(fold.group.length, name).toBe(fold.layers);
        }
    });
});

describe('1回分の10問', () => {
    it.each(LEVELS)('%s: 7つの種類がすべて入り、同じパターンは出ず、ひらめき問題は2〜3問', (level) => {
        for (let seed = 1; seed <= 200; seed++) {
            const set = createZukeiSet(level, createRng(seed), memoryStorage());
            expect(set.length).toBe(ZUKEI_COUNT);
            expect(new Set(set.map(q => q.topic))).toEqual(new Set(Object.keys(TOPICS)));
            expect(new Set(set.map(q => q.patternId)).size, `seed ${seed}`).toBe(ZUKEI_COUNT);
            const hirameki = set.filter(q => q.hirameki).length;
            expect(hirameki, `seed ${seed}`).toBeGreaterThanOrEqual(HIRAMEKI_MIN);
            expect(hirameki, `seed ${seed}`).toBeLessThanOrEqual(HIRAMEKI_MAX);
        }
    });

    it('つづけて遊ぶと、ちがうパターンから出る', () => {
        const storage = memoryStorage();
        const r = createRng(1);
        const first = createZukeiSet('high', r, storage).map(q => q.patternId);
        const second = createZukeiSet('high', r, storage).map(q => q.patternId);
        expect(second).not.toEqual(first);
    });
});
