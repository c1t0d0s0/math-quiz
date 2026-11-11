import { describe, it, expect } from 'vitest';
import { DAILY_COUNT, DAILY_ZUKEI, createDailyQuestions, hashString } from '../src/daily.js';
import { MODES, findMode } from '../src/modes.js';
import { addDays, balance, emptySummary, mergeSummary, playReward, STAMP_POINTS } from '../src/rewards.js';
import { isBetter, mergeRecords, toProgressDoc, fromProgressDoc, toAppDoc, fromAppDoc } from '../src/cloud/records.js';

const LEVELS = ['low', 'mid', 'high'];
const LOW_KANJI = '円時分本人日';

describe('今日のチャレンジの問題', () => {
    it('学年帯ごとにモードがある', () => {
        const daily = MODES.filter(m => m.kind === 'daily');
        expect(daily.map(m => m.level)).toEqual(LEVELS);
        expect(daily.map(m => m.grades)).toEqual([['low'], ['mid'], ['high']]);
    });

    it('同じ日・同じ学年帯なら、何回作っても同じ10問になる', () => {
        for (const level of LEVELS) {
            const a = createDailyQuestions(level, '2026-10-13');
            const b = createDailyQuestions(level, '2026-10-13');
            expect(a).toHaveLength(DAILY_COUNT);
            expect(b).toEqual(a);
        }
    });

    it('日がちがえば、また学年帯がちがえば、ちがう問題になる', () => {
        const key = qs => qs.map(q => q.question ?? q.text).join('|');
        const base = key(createDailyQuestions('mid', '2026-10-13'));
        expect(key(createDailyQuestions('mid', '2026-10-14'))).not.toBe(base);
        expect(key(createDailyQuestions('high', '2026-10-13'))).not.toBe(base);
        // 1年分で、まったく同じ組み合わせの日がない
        const all = new Set();
        let date = '2026-01-01';
        for (let i = 0; i < 365; i++) {
            all.add(key(createDailyQuestions('low', date)));
            date = addDays(date, 1);
        }
        expect(all.size).toBe(365);
    });

    it('1・2年は計算5問・文章問題5問、3・4年と5・6年は計算4問・文章問題4問・図形問題2問', () => {
        expect(DAILY_ZUKEI).toEqual({ low: 0, mid: 2, high: 2 });
        const counts = { low: [5, 5, 0], mid: [4, 4, 2], high: [4, 4, 2] };
        let date = '2026-10-01';
        for (let i = 0; i < 120; i++) {
            for (const level of LEVELS) {
                const qs = createDailyQuestions(level, date);
                const zukei = qs.filter(q => q.topic);
                const got = [qs.filter(q => !q.topic && !q.isWord).length, qs.filter(q => q.isWord).length, zukei.length];
                expect(got, `${date} ${level}`).toEqual(counts[level]);
                // 図形問題は、ちがう種類から1問ずつで、ひらめき問題は1問まで
                expect(new Set(zukei.map(q => q.topic)).size, `${date} ${level}`).toBe(zukei.length);
                expect(zukei.filter(q => q.hirameki).length, `${date} ${level}`).toBeLessThanOrEqual(1);
                for (const q of zukei) {
                    if (q.type === 'fill') expect(q.blanks.every(v => Number.isFinite(v) && v > 0), q.text).toBe(true);
                    else expect(q.options, q.text).toContain(q.answer);
                }
            }
            date = addDays(date, 1);
        }
    });

    it('計算と文章問題は、どれも正しい形の4択。同じ問題は重ならない', () => {
        let date = '2026-10-01';
        for (let i = 0; i < 120; i++) {
            for (const level of LEVELS) {
                const qs = createDailyQuestions(level, date);
                const where = `${date} ${level}`;
                expect(new Set(qs.map(q => q.question ?? q.text)).size, where).toBe(DAILY_COUNT);
                for (const q of qs.filter(x => !x.topic)) {
                    expect(q.options, `${where}: ${q.question}`).toHaveLength(4);
                    expect(new Set(q.options).size, `${where}: ${q.question}`).toBe(4);
                    expect(q.options, `${where}: ${q.question}`).toContain(q.answer);
                    expect([q.question, ...q.options].join(' ')).not.toMatch(/NaN|undefined/);
                }
            }
            date = addDays(date, 1);
        }
    });

    it('1・2年の問題は、決めた漢字以外を使わない。計算はたし算・ひき算4問と単位1問', () => {
        let date = '2026-10-01';
        for (let i = 0; i < 60; i++) {
            const qs = createDailyQuestions('low', date);
            for (const q of qs) {
                const kanji = (q.question + q.options.join('')).match(/[一-鿿]/g) || [];
                expect(kanji.filter(c => !LOW_KANJI.includes(c)), q.question).toEqual([]);
            }
            const calc = qs.filter(q => !q.isWord).map(q => q.question);
            expect(calc.filter(t => /^\d+ [+-] \d+ = \?$/.test(t)), date).toHaveLength(4);
            expect(calc.filter(t => /^\S+ = \?\D+$/.test(t)), date).toHaveLength(1);
            date = addDays(date, 1);
        }
    });

    it('文字列から決まった数を作る', () => {
        expect(hashString('daily:2026-10-13:low')).toBe(hashString('daily:2026-10-13:low'));
        expect(hashString('daily:2026-10-13:low')).not.toBe(hashString('daily:2026-10-14:low'));
    });
});

describe('今日のチャレンジの記録', () => {
    const rec = (score, seconds, date) => ({ score, seconds, date });

    it('新しい日の記録は、点が低くても前の日の記録を置きかえる', () => {
        expect(isBetter(rec(3, 200, '2026-10-14'), rec(10, 50, '2026-10-13'))).toBe(true);
        expect(isBetter(rec(10, 50, '2026-10-13'), rec(3, 200, '2026-10-14'))).toBe(false);
    });

    it('同じ日なら、正解数が多いほう、同じなら時間が短いほう', () => {
        expect(isBetter(rec(8, 90, '2026-10-13'), rec(7, 60, '2026-10-13'))).toBe(true);
        expect(isBetter(rec(8, 60, '2026-10-13'), rec(8, 90, '2026-10-13'))).toBe(true);
        expect(isBetter(rec(8, 90, '2026-10-13'), rec(8, 60, '2026-10-13'))).toBe(false);
    });

    it('2か所の記録を合わせると、新しい日のほうが残る。Firestore の形でも日付を持つ', () => {
        const a = { 'daily-low': rec(10, 50, '2026-10-12'), addition: { score: 9, seconds: 0 } };
        const b = { 'daily-low': rec(6, 80, '2026-10-13'), addition: { score: 12, seconds: 0 } };
        const merged = mergeRecords(a, b);
        expect(merged).toEqual({ addition: { score: 12, seconds: 0 }, 'daily-low': rec(6, 80, '2026-10-13') });
        expect(mergeRecords(b, a)).toEqual(merged);
        const doc = toProgressDoc(merged['daily-low'], 1);
        expect(doc.data).toEqual({ score: 6, seconds: 80, date: '2026-10-13' });
        expect(fromProgressDoc(doc)).toEqual(rec(6, 80, '2026-10-13'));
        expect(fromProgressDoc({ data: { score: 6, seconds: 80, date: 'x' } })).toEqual({ score: 6, seconds: 80 });
    });

    it('5問以上正解するとスタンプをもらえる。「はじめて」のポイントはつかない', () => {
        const r = playReward(emptySummary(), findMode('daily-mid'), 10, 10, '2026-10-13');
        expect(r).toMatchObject({ stampAdded: true, clearPoints: 0, gained: STAMP_POINTS });
        expect(r.summary.clears).toEqual(['daily:2026-10-13']);
        expect(playReward(emptySummary(), findMode('daily-mid'), 4, 10, '2026-10-13').stampAdded).toBe(false);
    });

    it('最後まで解いた日を、点数に関係なく1日1個だけ記録する。ポイントは変わらない', () => {
        const mid = findMode('daily-mid');
        const first = playReward(emptySummary(), mid, 0, 10, '2026-10-13');
        expect(first).toMatchObject({ dailyAdded: true, stampAdded: false, gained: 0 });
        expect(first.summary.clears).toEqual(['daily:2026-10-13']);
        expect(balance(first.summary)).toBe(0);

        // 同じ日のやり直しや、ほかの学年のチャレンジでは増えない
        const again = playReward(first.summary, findMode('daily-low'), 10, 10, '2026-10-13');
        expect(again.dailyAdded).toBe(false);
        expect(again.summary.clears).toEqual(['daily:2026-10-13']);

        const next = playReward(again.summary, mid, 3, 10, '2026-10-14');
        expect(next.summary.clears).toEqual(['daily:2026-10-13', 'daily:2026-10-14']);

        // 今日のチャレンジ以外のモードでは記録しない
        expect(playReward(emptySummary(), findMode('addition'), 3, 0, '2026-10-13')).toMatchObject({ dailyAdded: false, summary: emptySummary() });
    });

    it('解いた日の記録は、2か所の記録を合わせても、Firestore を通しても残る', () => {
        const a = { ...emptySummary(), clears: ['daily:2026-10-13'] };
        const b = { ...emptySummary(), clears: ['daily:2026-10-14', 'daily:x', 'clear:mixed'] };
        expect(mergeSummary(a, b).clears).toEqual(['clear:mixed', 'daily:2026-10-13', 'daily:2026-10-14']);
        expect(fromAppDoc(toAppDoc(a, 1)).clears).toEqual(['daily:2026-10-13']);
    });
});
