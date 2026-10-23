import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { createCalcGenerator } from '../src/generators/arithmetic.js';
import { MODES, createGenerator, resolveGrade } from '../src/modes.js';

const CALC_MODES = ['addition', 'multiplication', 'division', 'decimals', 'fractions', 'units-low', 'units-mid', 'units-high', 'mixed'];

describe.each(CALC_MODES)('計算モード %s', (mode) => {
    it('正しい形の4択になる', () => {
        const next = createCalcGenerator(mode, createRng(42));
        for (let i = 0; i < 1000; i++) {
            const q = next();
            const options = q.options.map(String);
            const where = `${q.question} / ${options.join(' | ')}`;
            expect(options, where).toHaveLength(4);
            expect(new Set(options).size, where).toBe(4);
            expect(options, where).toContain(String(q.answer));
            expect([q.question, ...options].join(' '), where).not.toMatch(/NaN|undefined/);
        }
    });
});

describe('かけ算の難しさ', () => {
    it('問題数が進むと2けた同士が増える', () => {
        const count = (from, to) => {
            const next = createCalcGenerator('multiplication', createRng(9));
            let big = 0;
            for (let i = 1; i <= to; i++) {
                const [a, b] = next().question.match(/\d+/g).map(Number);
                if (i >= from && a >= 10 && b >= 10) big++;
            }
            return big / (to - from + 1);
        };
        expect(count(21, 400)).toBeGreaterThan(0.6);
    });
});

describe('ミックス', () => {
    it('単位の問題もまざる', () => {
        const next = createCalcGenerator('mixed', createRng(5));
        const qs = Array.from({ length: 300 }, next);
        const units = qs.filter(q => / = \?\D/.test(q.question));
        expect(units.length).toBeGreaterThan(20);
        expect(units.length).toBeLessThan(100);
    });
});

describe('モード定義', () => {
    it('従来の6モードの制限時間とキーを変えていない', () => {
        const limits = Object.fromEntries(MODES.map(m => [m.id, m.timeLimit]));
        expect(limits).toMatchObject({
            addition: 60, multiplication: 180, division: 120, decimals: 120, fractions: 120, mixed: 120,
        });
    });

    it('文章問題は学年帯ごとに3モードあり、5分である', () => {
        const word = MODES.filter(m => m.kind === 'word');
        expect(word.map(m => m.id)).toEqual(['word-low', 'word-mid', 'word-high']);
        expect(word.every(m => m.timeLimit === 300)).toBe(true);
    });

    it('どのモードも出題できる', () => {
        const storage = { getItem: () => null, setItem: () => {} };
        for (const mode of MODES.filter(m => m.kind === 'calc' || m.kind === 'word')) {
            const q = createGenerator(mode, createRng(1), storage)();
            expect(q.options, mode.id).toHaveLength(4);
        }
    });

    it('クエリパラメータの学年を学年タブに変える', () => {
        expect(resolveGrade('1')).toBe('low');
        expect(resolveGrade('2')).toBe('low');
        expect(resolveGrade('3')).toBe('mid');
        expect(resolveGrade('4')).toBe('mid');
        expect(resolveGrade('5')).toBe('high');
        expect(resolveGrade('6')).toBe('high');
        expect(resolveGrade('low')).toBe('low');
        expect(resolveGrade('mid')).toBe('mid');
        expect(resolveGrade('high')).toBe('high');
        expect(resolveGrade('all')).toBe('all');
        expect(resolveGrade(null)).toBe('all');
        expect(resolveGrade('7')).toBe('all');
    });
});
