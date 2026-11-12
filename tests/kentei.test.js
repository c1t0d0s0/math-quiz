import { describe, it, expect } from 'vitest';
import { createRng } from '../src/generators/rng.js';
import { generateUnitsQuestion } from '../src/generators/units.js';
import { KENTEI_LEVELS, KYUS, countOf, examLevel, kenteiTitle, modeIdOf, passScore, passes } from '../src/kentei/levels.js';
import { answerText, buildExam, isRightAnswer, nextUnanswered, wordPatternsOf, zukeiPatternsOf } from '../src/kentei/exam.js';
import { MODES, findMode } from '../src/modes.js';
import { achievement } from '../src/rewards.js';

const sectionCounts = qs => qs.reduce((m, q) => ({ ...m, [q.section]: (m[q.section] ?? 0) + 1 }), {});

describe('算数検定もぎ試験の級', () => {
    it('11級（1年生）〜6級（6年生）', () => {
        expect(KYUS).toEqual([11, 10, 9, 8, 7, 6]);
        expect(KENTEI_LEVELS.map(l => l.grade)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('本番は 11〜9級が20問・40分、8〜6級が30問・50分。ミニは10問・20分と15問・25分', () => {
        for (const kyu of KYUS) {
            const big = kyu <= 8;
            expect([countOf(examLevel(kyu)), examLevel(kyu).minutes], `${kyu}級`).toEqual(big ? [30, 50] : [20, 40]);
            expect([countOf(examLevel(kyu, true)), examLevel(kyu, true).minutes], `${kyu}級ミニ`).toEqual(big ? [15, 25] : [10, 20]);
        }
    });

    it('ミニ試験は本番と同じ分野を同じ順に出し、どの分野も1問以上', () => {
        for (const kyu of KYUS) {
            const full = examLevel(kyu).sections;
            const mini = examLevel(kyu, true).sections;
            expect(mini.map(x => x.type)).toEqual(full.map(x => x.type));
            expect(mini.every(x => x.count >= 1)).toBe(true);
        }
    });

    it('合格は70%以上', () => {
        expect([passScore(20), passScore(30), passScore(10), passScore(15)]).toEqual([14, 21, 7, 11]);
        expect(passes(examLevel(9), 14)).toBe(true);
        expect(passes(examLevel(9), 13)).toBe(false);
        expect(passes(examLevel(6), 21)).toBe(true);
        expect(passes(examLevel(6), 20)).toBe(false);
    });

    it('本番とミニのモードがあり、時間と学年タブが合っている', () => {
        const kentei = MODES.filter(m => m.kind === 'kentei');
        expect(kentei).toHaveLength(12);
        expect(findMode('kentei-k8')).toMatchObject({ level: 8, mini: false, timeLimit: 50 * 60, grades: ['mid'] });
        expect(findMode('kentei-mini-k11')).toMatchObject({ level: 11, mini: true, timeLimit: 20 * 60, grades: ['low'] });
        expect(findMode('kentei-k6').grades).toEqual(['high']);
    });
});

describe('算数検定もぎ試験の問題', () => {
    it.each(KYUS)('%i級: 分野ごとの数どおりで、どの問題も答えられる形', (kyu) => {
        for (const mini of [false, true]) {
            for (let seed = 1; seed <= 30; seed++) {
                const qs = buildExam(kyu, mini, createRng(seed * 100 + kyu));
                const level = examLevel(kyu, mini);
                expect(qs).toHaveLength(countOf(level));
                expect(sectionCounts(qs)).toEqual(Object.fromEntries(level.sections.map(x => [x.type, x.count])));
                // 分野の順にならぶ
                expect([...new Set(qs.map(q => q.section))]).toEqual(level.sections.map(x => x.type));
                for (const q of qs) {
                    const where = `${kyu}級: ${q.question ?? q.label ?? q.text}`;
                    if (q.type === 'fill') {
                        expect(q.blanks.length, where).toBeGreaterThan(0);
                        expect(q.parts.filter(p => typeof p !== 'string'), where).toHaveLength(q.blanks.length);
                        // 正しい答えを入れたら正解になる
                        expect(isRightAnswer(q, q.blanks), where).toBe(true);
                        expect(q.blanks.every(b => b.length <= q.maxLength), where).toBe(true);
                    } else {
                        expect(q.options, where).toHaveLength(4);
                        expect(new Set(q.options).size, where).toBe(4);
                        expect(q.options, where).toContain(q.answer);
                        expect(isRightAnswer(q, q.answer), where).toBe(true);
                    }
                    expect(isRightAnswer(q, null), where).toBe(false);
                    expect(JSON.stringify(q) + answerText(q), where).not.toMatch(/NaN|undefined/);
                }
                // 同じ試験に同じ問題は出さない
                const texts = qs.map(q => q.question ?? q.label);
                expect(new Set(texts).size, texts.join(' / ')).toBe(texts.length);
            }
        }
    });

    it('11級（1年生）は、20までの数のたし算・ひき算だけ', () => {
        for (let seed = 1; seed <= 50; seed++) {
            for (const q of buildExam(11, false, createRng(seed))) {
                const text = q.type === 'fill' ? q.label : `${q.question} ${q.options.join(' ')}`;
                expect(text).not.toMatch(/[×÷]/);
                expect(Math.max(...text.match(/\d+/g).map(Number)), text).toBeLessThanOrEqual(20);
            }
        }
    });

    it('学年より上の内容は出さない', () => {
        const ids = grade => wordPatternsOf(grade).map(p => p.id);
        expect(ids(1).some(id => /kakezan|nagasa|okane/.test(id))).toBe(false);
        expect(ids(3).some(id => /menseki|kakudo|gaisuu|ueki/.test(id))).toBe(false);
        expect(ids(5).some(id => /high-(hi|hirei|baai|shukushaku)-/.test(id))).toBe(false);
        expect(ids(6).some(id => /tsurukame/.test(id))).toBe(false);
        expect(zukeiPatternsOf(3).every(p => ['perimeter', 'grid', 'volume', 'origami'].includes(p.topic))).toBe(true);
        expect(zukeiPatternsOf(5).some(p => p.id === 'volume-cylinder')).toBe(false);
        for (const grade of [1, 2, 3, 4, 5, 6]) {
            expect(wordPatternsOf(grade).length, `${grade}年`).toBeGreaterThanOrEqual(10);
            if (grade >= 3) expect(zukeiPatternsOf(grade).every(p => !p.hirameki)).toBe(true);
        }
    });

    it('単位の問題は、その学年までに習う単位だけ', () => {
        const r = createRng(3);
        for (let i = 0; i < 500; i++) {
            const g3 = generateUnitsQuestion('mid', r, 3);
            expect(g3.question + g3.options.join(''), g3.question).not.toMatch(/\.|²|ha|\ba\b/);
            const g5 = generateUnitsQuestion('high', r, 5);
            expect(g5.question + g5.options.join(''), g5.question).not.toMatch(/mg|kL|\//);
        }
    });

    it('答えの文字を作る', () => {
        expect(answerText({ type: 'fill', parts: ['7 + 8 = ', { blank: 0 }], blanks: ['15'] })).toBe('7 + 8 = 15');
        expect(answerText({ type: 'fill', parts: ['140を 2:5 に分けると ', { blank: 0 }, ' と ', { blank: 1 }], blanks: ['40', '100'] })).toBe('140を 2:5 に分けると 40 と 100');
        expect(answerText({ type: 'choice', answer: '8こ' })).toBe('8こ');
    });

    it('入力の答えは、全角や 3.50 のような書き方でも正解にする', () => {
        const q = { type: 'fill', parts: [{ blank: 0 }], blanks: ['3.5'] };
        expect(isRightAnswer(q, ['3.50'])).toBe(true);
        expect(isRightAnswer(q, ['３．５'])).toBe(true);
        expect(isRightAnswer(q, ['35'])).toBe(false);
    });
});

describe('称号とポイント', () => {
    const scores = map => id => map[id];

    it('本番で合格した一番上の級を「数検◯級相当」にする', () => {
        expect(kenteiTitle(scores({}))).toBe(null);
        expect(kenteiTitle(scores({ 'kentei-k10': 14 }))).toBe('数検10級相当');
        expect(kenteiTitle(scores({ 'kentei-k10': 20, 'kentei-k8': 21, 'kentei-k7': 20 }))).toBe('数検8級相当');
        // 合格点にとどかない記録・ミニ試験は数えない
        expect(kenteiTitle(scores({ 'kentei-k9': 13, 'kentei-mini-k6': 15 }))).toBe(null);
        expect(modeIdOf(6, true)).toBe('kentei-mini-k6');
    });

    it('はじめて合格したときだけ「やったね」', () => {
        expect(achievement(findMode('kentei-k8'), 21, 30)).toBe('clear:kentei-k8');
        expect(achievement(findMode('kentei-k8'), 20, 30)).toBe(null);
        expect(achievement(findMode('kentei-mini-k11'), 7, 10)).toBe('clear:kentei-mini-k11');
    });
});

describe('好きな順に答える', () => {
    it('次のまだ答えていない問題は、あとから先にさがし、なければはじめにもどる', () => {
        const a = [];
        a[0] = '1';
        a[2] = 'ア';
        expect(nextUnanswered(a, 5, 0)).toBe(1);
        expect(nextUnanswered(a, 5, 1)).toBe(3);
        expect(nextUnanswered(a, 5, 4)).toBe(1);
        // 「わからない」(null) は答えたものとして数える
        a[1] = null;
        a[3] = ['12'];
        expect(nextUnanswered(a, 5, 0)).toBe(4);
        // 今の問題しか残っていないときは、今の問題
        expect(nextUnanswered(a, 5, 4)).toBe(4);
        a[4] = 'ウ';
        expect(nextUnanswered(a, 5, 2)).toBe(-1);
    });
});
