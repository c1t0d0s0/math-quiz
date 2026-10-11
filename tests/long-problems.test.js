import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { problems, generateProblem, createLongSet, SET_SIZE, QUESTIONS_PER_PROBLEM, CHOICES } from '../src/long/index.js';
import { FIGURE_TYPES } from '../src/long/figures.js';
import { buildChoices } from '../src/word/helpers.js';
import { MODES } from '../src/modes.js';

const LEVELS = ['g3', 'g45', 'g6'];
const all = LEVELS.flatMap(level => problems[level].map(p => [p.id, level, p]));
const RUNS = 300;
// 本文（小問の文はふくめない）の最低文字数
const MIN_LENGTH = { g3: 220, g45: 350, g6: 550 };

function memoryStorage() {
    const data = new Map();
    return {
        getItem: k => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
    };
}

// 図のデータの中に、数でない値（NaN など）がまぎれていないか
function badNumbers(value, path = 'figure') {
    if (typeof value === 'number') return Number.isFinite(value) ? [] : [path];
    if (Array.isArray(value)) return value.flatMap((v, i) => badNumbers(v, `${path}[${i}]`));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => badNumbers(v, `${path}.${k}`));
    return [];
}

describe('長文問題の登録', () => {
    it('学年ごとに20題以上、合計60題以上ある', () => {
        for (const level of LEVELS) {
            expect(problems[level].length, level).toBeGreaterThanOrEqual(20);
        }
        expect(all.length).toBeGreaterThanOrEqual(60);
    });

    it('IDが重複していない', () => {
        expect(new Set(all.map(([id]) => id)).size).toBe(all.length);
    });

    it('長文チャレンジのモードが学年ごとにある', () => {
        const long = MODES.filter(m => m.kind === 'long');
        expect(long.map(m => m.level)).toEqual(LEVELS);
    });

    it('図つきの題が20題以上ある', () => {
        const r = createRng(1);
        const withFigure = all.filter(([, , p]) => generateProblem(p, r).figure).length;
        expect(withFigure).toBeGreaterThanOrEqual(20);
    });
});

describe.each(all)('%s', (id, level, problem) => {
    it('何度生成しても、小問3問・10択の正しい形になる', () => {
        const r = createRng(2024);
        let shortest = Infinity;
        for (let i = 0; i < RUNS; i++) {
            const p = generateProblem(problem, r);
            const body = p.text.join('');
            shortest = Math.min(shortest, body.length);

            expect(p.questions).toHaveLength(QUESTIONS_PER_PROBLEM);
            for (const q of p.questions) {
                const where = `${id}: ${q.question} / ${q.options.join(' | ')}`;
                expect(q.options, where).toHaveLength(CHOICES);
                expect(new Set(q.options).size, where).toBe(CHOICES);
                expect(q.options, where).toContain(q.answer);
            }

            const texts = [body, ...p.questions.flatMap(q => [q.question, ...q.options])];
            for (const text of texts) {
                expect(text, id).not.toMatch(/NaN|undefined|Infinity|null|\[object/);
                expect(text, id).not.toMatch(/\d\.\d{4,}/);
                expect(text, id).not.toMatch(/(^|[^\d~〜])-\d/);
            }

            for (const figure of [p.figure].flat().filter(Boolean)) {
                expect(FIGURE_TYPES, id).toContain(figure.type);
                expect(badNumbers(figure), id).toEqual([]);
                expect(JSON.stringify(figure), id).not.toMatch(/NaN|undefined|null/);
            }
        }
        expect(shortest, `${id} の本文がいちばん短いとき ${shortest} 字`).toBeGreaterThanOrEqual(MIN_LENGTH[level]);
    });
});

describe('10択の作り方', () => {
    it('選択肢は小さい順にならび、典型的な誤りがふくまれる', () => {
        const r = createRng(7);
        let withTypical = 0;
        for (let i = 0; i < 200; i++) {
            const q = buildChoices({ text: 'テスト', answer: 120, unit: 'm', wrong: [60, 240] }, r);
            const values = q.options.map(o => parseFloat(o));
            expect([...values].sort((a, b) => a - b)).toEqual(values);
            expect(q.answer).toBe('120m');
            if (q.options.includes('60m') || q.options.includes('240m')) withTypical++;
        }
        expect(withTypical).toBeGreaterThan(150);
    });

    it('正解の位置が10か所にほぼ均等に散らばる', () => {
        const r = createRng(99);
        const counts = Array(CHOICES).fill(0);
        let total = 0;
        for (const [, , problem] of all) {
            for (let i = 0; i < 40; i++) {
                for (const q of generateProblem(problem, r).questions) {
                    counts[q.options.indexOf(q.answer)]++;
                    total++;
                }
            }
        }
        // 均等なら各位置10%。答えが小さい数のときは前のほうに寄るので、少しゆるめに見る
        for (const [i, c] of counts.entries()) {
            expect(c / total, `位置${i + 1}: ${(c / total * 100).toFixed(1)}%`).toBeGreaterThan(0.06);
            expect(c / total, `位置${i + 1}: ${(c / total * 100).toFixed(1)}%`).toBeLessThan(0.16);
        }
    });

    it('format を使った答え（時こくなど）でも10択になる', () => {
        const fmt = v => `${Math.floor(v / 60)}時${v % 60}分`;
        const q = buildChoices({ text: 'テスト', answer: 615, format: fmt, wrong: [600, 630], step: 5 }, createRng(3));
        expect(q.answer).toBe('10時15分');
        expect(new Set(q.options).size).toBe(CHOICES);
    });
});

describe('1プレイ分の出題', () => {
    it('長文3題を出し、一巡するまで同じ題を出さない', () => {
        for (const level of LEVELS) {
            const storage = memoryStorage();
            const r = createRng(5);
            const seen = new Set();
            const rounds = Math.floor(problems[level].length / SET_SIZE);
            for (let i = 0; i < rounds; i++) {
                const set = createLongSet(level, r, storage);
                expect(set).toHaveLength(SET_SIZE);
                set.forEach(p => seen.add(p.id));
            }
            expect(seen.size).toBe(rounds * SET_SIZE);
        }
    });
});
