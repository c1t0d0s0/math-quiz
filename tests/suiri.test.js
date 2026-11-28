import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { patterns, generateFromPattern } from '../src/word/index.js';
import { suiriPatterns, solveOrdering, solveMatching } from '../src/word/suiri.js';
import { arrangeCorrect, arrangeText } from '../src/answers.js';

const all = [...suiriPatterns.mid, ...suiriPatterns.high];
const RUNS = 300;
// 4人の組み合わせ (オス・メスつき) は、ためす答えが多いので時間がかかる
const TIMEOUT = 60_000;

/** 手がかり (tests) に合う答えの種類 */
const answers = (puzzle, tests) => new Set(puzzle.worlds.filter(w => tests.every(t => t(w))).map(puzzle.key));

describe('推理パズルの登録', () => {
    it('3・4年と5・6年の文章問題に入っていて、1・2年には入っていない', () => {
        expect(patterns.mid.filter(p => p.id.includes('-suiri-')).map(p => p.id)).toEqual(suiriPatterns.mid.map(p => p.id));
        expect(patterns.high.filter(p => p.id.includes('-suiri-')).map(p => p.id)).toEqual(suiriPatterns.high.map(p => p.id));
        expect(patterns.low.some(p => p.id.includes('-suiri-'))).toBe(false);
    });
});

describe.each(all.map(p => [p.id, p]))('%s', (id, pattern) => {
    it(`${RUNS}回作っても、答えはちょうど1つで、いらない手がかりがない`, () => {
        for (let seed = 1; seed <= RUNS; seed++) {
            const puzzle = pattern.puzzle(createRng(seed));
            const where = `${id} seed ${seed}`;
            // 手がかりに全部合うのは、正しい答えだけ
            expect([...answers(puzzle, puzzle.tests)], where).toEqual([puzzle.truth]);
            // どの手がかりをけずっても、答えが2つ以上になる
            puzzle.tests.forEach((_, i) => {
                expect(answers(puzzle, puzzle.tests.filter((__, j) => j !== i)).size, `${where} 手がかり${i + 1}`).toBeGreaterThan(1);
            });
        }
    }, TIMEOUT);

    it(`${RUNS}回作っても、正しい形の問題になる`, () => {
        const r = createRng(2026);
        for (let i = 0; i < RUNS; i++) {
            const q = generateFromPattern(pattern, r);
            const where = `${id}: ${q.clues.join(' ')}`;
            expect(q.type).toBe('arrange');
            expect(q.patternId).toBe(id);
            expect(q.slots.length, where).toBe(q.answer.length);
            // ボタンは答えをならべかえたもので、同じものはない
            expect([...q.tokens].sort(), where).toEqual([...q.answer].sort());
            expect(new Set(q.tokens).size, where).toBe(q.tokens.length);
            expect(new Set(q.slots).size, where).toBe(q.slots.length);
            expect(arrangeCorrect(q, q.answer), where).toBe(true);
            expect(arrangeCorrect(q, [...q.answer].reverse()), where).toBe(false);
            for (const text of [q.question, ...q.clues, q.explain, arrangeText(q, q.answer)]) {
                expect(text, where).not.toMatch(/NaN|undefined|null|\[object/);
            }
            // メモの表: 順番は 人 × 順位、組み合わせは 人 × もの (動物はオス・メスの列も)
            const [people, things] = q.arrow ? [q.tokens, q.slots] : [q.slots, q.tokens];
            expect([...q.table.rows].sort(), where).toEqual([...people].sort());
            const cols = q.table.groups ? q.table.cols.slice(0, q.table.groups[0]) : q.table.cols;
            expect([...cols].sort(), where).toEqual([...things].sort());
            if (q.table.groups) {
                expect(q.table.groups, where).toEqual([things.length, 2]);
                expect(q.table.cols.slice(things.length), where).toEqual(['オス', 'メス']);
            }
            // 解き方に答えが出てくる
            for (const a of q.answer) expect(q.explain, where).toContain(a);
        }
    }, TIMEOUT);
});

describe('例の問題', () => {
    it('背の順: 東・西・北・南さん → 西 → 北 → 南 → 東', () => {
        const [east, west, north, south] = [0, 1, 2, 3];
        const result = solveOrdering(4, [
            w => w[south] === w[east] - 1, // ア. 東さんのすぐ前に南さん
            w => w[north] !== 0 && w[north] !== 3, // イ. 北さんは一番前でも後ろでもない
            w => 3 - w[west] >= 2, // ウ. 西さんの後ろには2人以上
        ]);
        expect(result).toEqual([[west, north, south, east]]);
    });

    it('かけっこ: さち・ゆみ・さとる・こう → ゆみ → さち → さとる → こう', () => {
        const [sachi, yumi, satoru, kou] = [0, 1, 2, 3];
        const result = solveOrdering(4, [
            w => w[sachi] === w[yumi] + 1, // ア. ゆみさんのすぐあとにさちさん
            w => w[satoru] !== 0 && w[satoru] !== 3, // イ. さとる君は1位でも4位でもない
            w => w[kou] >= 2, // ウ. こう君より先にゴールした人は2人以上
        ]);
        expect(result).toEqual([[yumi, sachi, satoru, kou]]);
    });

    it('動物: もえ＝犬、いつき＝ハムスター、さやか＝ネコ', () => {
        const [moe, itsuki, sayaka] = [0, 1, 2];
        const [dog, cat, hamster] = [0, 1, 2];
        const [male, female] = [0, 1];
        const result = solveMatching(3, true, [
            w => w.attr[hamster] === female, // ハムスターはメス
            w => w.attr[w.assign[moe]] === male, // もえさんの動物はオス
            w => w.assign[sayaka] !== dog && w.attr[w.assign[sayaka]] !== female, // さやかさんの動物は犬でもメスでもない
        ]);
        const assign = [];
        assign[moe] = dog;
        assign[itsuki] = hamster;
        assign[sayaka] = cat;
        expect(result).toEqual([assign.join(',')]);
    });
});
