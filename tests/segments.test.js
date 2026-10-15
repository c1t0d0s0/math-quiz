import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { createSegmentSet, fillText, SET_SIZE } from '../src/word/segments.js';
import { createWordGenerator, SEGMENT_EVERY } from '../src/word/index.js';

function memoryStorage() {
    const data = new Map();
    return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
}

/** 空欄に数を入れた式を計算して、左辺と右辺が等しいか (… はあまり) */
function holds(question, values) {
    let i = 0;
    const text = question.parts.map(p => (typeof p === 'string' ? p : String(values[i++]))).join('');
    const [left, right] = text.split(' = ');
    const calc = expr => Function(`return (${expr.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')})`)();
    if (right.includes('…')) {
        // a ÷ b = q … r  →  a = b × q + r で、0 ≤ r < b
        const [a, b] = left.split(' ÷ ').map(Number);
        const [q, r] = right.split(' … ').map(Number);
        return a === b * q + r && r >= 0 && r < b;
    }
    if (left.includes('÷')) {
        const [num, den] = left.split(' ÷ ');
        return calc(num) % calc(den) === 0 && calc(num) / calc(den) === calc(right);
    }
    return calc(left) === calc(right);
}

describe('線分図の問題', () => {
    it('例と同じ4問を、同じ順に作る', () => {
        // 13 = 4 × 3 + 1 になる組を探して、例の4問とくらべる
        let set;
        for (let seed = 1; !set; seed++) {
            const s = createSegmentSet(createRng(seed));
            if (s[0].parts[0] === '13 ÷ 4 = ') set = s;
        }
        expect(set.map(fillText)).toEqual(['13 ÷ 4 = [ ] … [ ]', '(13 − 1) ÷ 4 = [ ]', '[ ] × 3 + 1 = 13', '(13 − [ ]) ÷ 4 = 3']);
        expect(set.map(q => q.blanks)).toEqual([[3, 1], [3], [4], [1]]);
        expect(set.map(q => q.setIndex)).toEqual([1, 2, 3, 4]);
    });

    it('何度作っても、空欄に正解を入れると式が成り立ち、ちがう数では成り立たない', () => {
        const r = createRng(42);
        for (let i = 0; i < 2000; i++) {
            const set = createSegmentSet(r);
            expect(set).toHaveLength(SET_SIZE);
            for (const q of set) {
                expect(q.type).toBe('fill');
                expect(q.blanks.every(v => Number.isInteger(v) && v > 0 && v < 100), fillText(q)).toBe(true);
                expect(holds(q, q.blanks), `${fillText(q)} に ${q.blanks}`).toBe(true);
                const wrong = q.blanks.map((v, j) => (j === 0 ? v + 1 : v));
                expect(holds(q, wrong), `${fillText(q)} に ${wrong}`).toBe(false);
            }
        }
    });

    it('線分図は、わる数の区切りが商の数だけと、あまりの区切り1つで、合計が全体の数になる', () => {
        const r = createRng(7);
        for (let i = 0; i < 500; i++) {
            const [first] = createSegmentSet(r);
            const [n, d] = first.parts[0].match(/\d+/g).map(Number);
            const [q, m] = first.blanks;
            const parts = first.figure.bars[0].parts;
            expect(parts).toHaveLength(q + 1);
            expect(parts.slice(0, q).every(p => p.len === d && p.note === `${d}`)).toBe(true);
            expect(parts[q]).toEqual({ len: m, note: `${m}` });
            expect(parts.reduce((s, p) => s + p.len, 0)).toBe(n);
            expect(first.figure.total).toBe(`${n}`);
            expect(m).toBeGreaterThanOrEqual(1);
            expect(m).toBeLessThan(d);
            expect(n).toBeLessThanOrEqual(89);
        }
    });
});

describe('文章問題 (3・4年) への混ぜ方', () => {
    it('ふつうの問題4問ごとに、線分図の4問ひと組をはさむ', () => {
        const next = createWordGenerator('mid', createRng(3), memoryStorage());
        const kinds = Array.from({ length: 24 }, () => (next().type === 'fill' ? 'F' : 'w')).join('');
        expect(SEGMENT_EVERY).toBe(4);
        expect(kinds).toBe('wwwwFFFFwwwwFFFFwwwwFFFF');
    });

    it('ひと組の4問は、同じ線分図を使う', () => {
        const next = createWordGenerator('mid', createRng(4), memoryStorage());
        for (let i = 0; i < 4; i++) next();
        const set = [next(), next(), next(), next()];
        expect(new Set(set.map(q => q.figure)).size).toBe(1);
        expect(set.map(q => q.setIndex)).toEqual([1, 2, 3, 4]);
    });

    it('1・2年と5・6年には出ない', () => {
        for (const level of ['low', 'high']) {
            const next = createWordGenerator(level, createRng(5), memoryStorage());
            for (let i = 0; i < 40; i++) expect(next().type, level).not.toBe('fill');
        }
    });
});
