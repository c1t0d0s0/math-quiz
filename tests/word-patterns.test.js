import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { patterns, generateFromPattern, createWordGenerator } from '../src/word/index.js';
import { buildQuestion, fmtNum, frac } from '../src/word/helpers.js';

const all = [...patterns.low, ...patterns.mid, ...patterns.high];
const RUNS = 300;

// 低学年の文で使ってよい漢字（1・2年で習い、教科書でも単位として使うもの）
const LOW_KANJI = '円時分本人日';

function memoryStorage() {
    const data = new Map();
    return {
        getItem: k => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
    };
}

describe('文章問題パターンの登録', () => {
    it('全部で200パターン以上ある', () => {
        expect(all.length).toBeGreaterThanOrEqual(200);
    });

    it('学年帯ごとに60パターン以上ある', () => {
        expect(patterns.low.length).toBeGreaterThanOrEqual(60);
        expect(patterns.mid.length).toBeGreaterThanOrEqual(60);
        expect(patterns.high.length).toBeGreaterThanOrEqual(60);
    });

    it('IDが重複していない', () => {
        expect(new Set(all.map(p => p.id)).size).toBe(all.length);
    });
});

describe.each(all.map(p => [p.id, p]))('%s', (id, pattern) => {
    it('何度生成しても正しい形の4択になる', () => {
        const r = createRng(12345);
        for (let i = 0; i < RUNS; i++) {
            const q = generateFromPattern(pattern, r);
            const where = `${id}: ${q.question} / ${q.options.join(' | ')}`;

            expect(q.question.length, where).toBeGreaterThan(5);
            expect(q.options, where).toHaveLength(4);
            expect(new Set(q.options).size, where).toBe(4);
            expect(q.options, where).toContain(q.answer);

            for (const text of [q.question, ...q.options]) {
                expect(text, where).not.toMatch(/NaN|undefined|Infinity|null|\[object/);
                // マイナスの数や、誤差が残った長い小数が出ていない
                expect(text, where).not.toMatch(/-\d/);
                expect(text, where).not.toMatch(/\d\.\d{4,}/);
            }
            // 0 や「0こ」だけの選択肢は出さない
            for (const opt of q.options) {
                expect(opt, where).not.toMatch(/^\D*0(?![.\d])/);
            }
        }
    });
});

describe('学年に合わせた表記', () => {
    it('低学年の問題は決めた漢字以外を使わない', () => {
        const r = createRng(777);
        const kanji = /[一-鿿]/g;
        for (const pattern of patterns.low) {
            for (let i = 0; i < 50; i++) {
                const q = generateFromPattern(pattern, r);
                const used = [q.question, ...q.options].join('').match(kanji) || [];
                const bad = used.filter(c => !LOW_KANJI.includes(c));
                expect(bad, `${pattern.id}: ${q.question}`).toEqual([]);
            }
        }
    });
});

describe('出題キュー', () => {
    it('一巡するまで同じパターンを出さない', () => {
        for (const level of ['low', 'mid', 'high']) {
            const next = createWordGenerator(level, createRng(1), memoryStorage());
            const seen = new Set();
            // 3・4年では線分図の問題がはさまるので、ふつうの文章問題だけを数える
            while (seen.size < patterns[level].length) {
                const q = next();
                if (q.type === 'fill') continue;
                expect(seen.has(q.patternId), `${level}: ${q.patternId}`).toBe(false);
                seen.add(q.patternId);
            }
            expect(seen.size).toBe(patterns[level].length);
        }
    });

    it('前回のプレイで出たパターンは後回しにする', () => {
        const storage = memoryStorage();
        const first = createWordGenerator('low', createRng(1), storage);
        const played = new Set();
        for (let i = 0; i < 20; i++) {
            played.add(first().patternId);
        }
        const second = createWordGenerator('low', createRng(2), storage);
        for (let i = 0; i < 20; i++) {
            expect(played.has(second().patternId)).toBe(false);
        }
    });

    it('保存先がこわれていても出題できる', () => {
        const broken = { getItem: () => '{oops', setItem: () => { throw new Error('full'); } };
        const next = createWordGenerator('mid', createRng(3), broken);
        expect(next().options).toHaveLength(4);
    });
});

describe('ヘルパー', () => {
    it('小数の誤差を落とす', () => {
        expect(fmtNum(0.1 + 0.2)).toBe('0.3');
        expect(fmtNum(12)).toBe('12');
    });

    it('分数を約分する', () => {
        expect(frac(2, 4)).toBe('1/2');
        expect(frac(6, 3)).toBe('2');
    });

    it('典型的な誤答を優先し、足りない分を近い値で補う', () => {
        const q = buildQuestion({ text: 'テスト用の問題です', answer: 12, unit: 'こ', wrong: [4, 12, -3, 2.5] }, createRng(5));
        expect(q.answer).toBe('12こ');
        expect(q.options).toContain('4こ');
        expect(q.options).toHaveLength(4);
        expect(q.options.every(o => /^\d+こ$/.test(o))).toBe(true);
    });

    it('文字列の答えで誤答が足りないときはエラーにする', () => {
        expect(() => buildQuestion({ text: 'テスト', answer: 'A', wrong: ['B', 'A'] }, createRng(5))).toThrow();
    });
});
