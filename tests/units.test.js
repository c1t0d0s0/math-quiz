import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { generateUnitsQuestion, UNIT_TOPICS } from '../src/generators/units.js';

const LEVELS = ['low', 'mid', 'high'];
const LOW_KANJI = '円時分本人日';

// 単位 → [量の種類, いちばん小さい単位での大きさ]
const UNITS = {
    mm: ['length', 1], cm: ['length', 10], m: ['length', 1000], km: ['length', 1000000],
    mg: ['weight', 1], g: ['weight', 1000], kg: ['weight', 1e6], t: ['weight', 1e9],
    mL: ['volume', 1], 'cm³': ['volume', 1], dL: ['volume', 100], L: ['volume', 1000], kL: ['volume', 1e6], 'm³': ['volume', 1e6],
    'cm²': ['area', 1], 'm²': ['area', 1e4], a: ['area', 1e6], ha: ['area', 1e8], 'km²': ['area', 1e10],
    秒: ['time', 1], 分: ['time', 60], 時間: ['time', 3600], じかん: ['time', 3600], 日: ['time', 86400],
};
// 長い名前から先にためす（「mm」を「m」と読まないように）
const NAMES = Object.keys(UNITS).sort((a, b) => b.length - a.length).map(u => u.replace(/[³²]/, '\\$&'));
const QUANTITY = new RegExp(`(\\d+(?:\\.\\d+)?(?:/\\d+)?)(${NAMES.join('|')})`, 'gy');

/** 「1m30cm」「1/3時間」などを [量の種類, いちばん小さい単位での量] にする */
function measure(text) {
    QUANTITY.lastIndex = 0;
    let total = 0;
    let kind = null;
    let m;
    while ((m = QUANTITY.exec(text))) {
        const [n, d = 1] = m[1].split('/').map(Number);
        const [k, size] = UNITS[m[2]];
        if (kind && kind !== k) throw new Error(`量の種類がまざっています: ${text}`);
        kind = k;
        total += (n / d) * size;
    }
    if (QUANTITY.lastIndex !== 0 || !kind) throw new Error(`読めません: ${text}`);
    return [kind, total];
}

function sample(level, n, seed = 1) {
    const r = createRng(seed);
    return Array.from({ length: n }, () => generateUnitsQuestion(level, r));
}

describe.each(LEVELS)('単位の問題 %s', (level) => {
    const qs = sample(level, 1000);

    it('正しい形の4択になる', () => {
        for (const q of qs) {
            const where = `${q.question} / ${q.options.join(' | ')}`;
            expect(q.question, where).toMatch(/^\S+ = \?\S+$/);
            expect(q.options, where).toHaveLength(4);
            expect(new Set(q.options).size, where).toBe(4);
            expect(q.options, where).toContain(q.answer);
            expect([q.question, ...q.options].join(' '), where).not.toMatch(/NaN|undefined|e[+-]/);
        }
    });

    it('答えは、左の量を、たずねた単位で表したもの', () => {
        for (const q of qs) {
            const [left, right] = q.question.split(' = ');
            // 「?m?cm」なら答えは「1m30cm」の形
            expect(q.answer.replace(/[\d./]+/g, '?'), q.question).toBe(right);
            const [k1, a] = measure(left);
            const [k2, b] = measure(q.answer);
            expect(k2, q.question).toBe(k1);
            expect(Math.abs(a - b) / a, `${q.question} → ${q.answer}`).toBeLessThan(1e-9);
        }
    });

    it('どの量の種類からも出る', () => {
        const kinds = new Set(qs.map(q => measure(q.question.split(' = ')[0])[0]));
        expect([...kinds].sort()).toEqual(Object.keys(UNIT_TOPICS[level]).sort());
    });
});

describe('学年に合った単位', () => {
    it('1・2年は整数だけで、2年までに習う単位と漢字だけ', () => {
        for (const q of sample('low', 1000, 2)) {
            const all = q.question + q.options.join('');
            expect(all, q.question).not.toMatch(/[.²³]|km|kg|秒/);
            const kanji = all.match(/[一-鿿]/g) || [];
            expect(kanji.filter(c => !LOW_KANJI.includes(c)), q.question).toEqual([]);
        }
    });

    it('3・4年は、体積・mg・kL・分数を出さない', () => {
        for (const q of sample('mid', 1000, 3)) {
            expect(q.question + q.options.join(''), q.question).not.toMatch(/³|mg|kL|\//);
        }
    });

    it('5・6年は、小数や分数の換算が出る', () => {
        const qs = sample('high', 500, 4);
        expect(qs.some(q => q.answer.includes('/'))).toBe(true);
        expect(qs.some(q => q.question.includes('cm³'))).toBe(true);
    });
});
