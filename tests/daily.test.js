import { describe, it, expect } from 'vitest';
import { DAILY_COUNT, createDailyQuestions, hashString } from '../src/daily.js';
import { MODES, findMode } from '../src/modes.js';
import { addDays, emptySummary, playReward, STAMP_POINTS } from '../src/rewards.js';
import { isBetter, mergeRecords, toProgressDoc, fromProgressDoc } from '../src/cloud/records.js';

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
        const key = qs => qs.map(q => q.question).join('|');
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

    it('計算5問と文章問題5問で、どれも正しい形の4択。同じ問題は重ならない', () => {
        let date = '2026-10-01';
        for (let i = 0; i < 120; i++) {
            for (const level of LEVELS) {
                const qs = createDailyQuestions(level, date);
                const where = `${date} ${level}`;
                expect(qs.filter(q => q.isWord), where).toHaveLength(5);
                expect(new Set(qs.map(q => q.question)).size, where).toBe(DAILY_COUNT);
                for (const q of qs) {
                    expect(q.options, `${where}: ${q.question}`).toHaveLength(4);
                    expect(new Set(q.options).size, `${where}: ${q.question}`).toBe(4);
                    expect(q.options, `${where}: ${q.question}`).toContain(q.answer);
                    expect([q.question, ...q.options].join(' ')).not.toMatch(/NaN|undefined/);
                }
            }
            date = addDays(date, 1);
        }
    });

    it('1・2年の問題は、決めた漢字以外を使わない。計算はたし算・ひき算だけ', () => {
        let date = '2026-10-01';
        for (let i = 0; i < 60; i++) {
            for (const q of createDailyQuestions('low', date)) {
                const kanji = (q.question + q.options.join('')).match(/[一-鿿]/g) || [];
                expect(kanji.filter(c => !LOW_KANJI.includes(c)), q.question).toEqual([]);
                if (!q.isWord) expect(q.question).toMatch(/^\d+ [+-] \d+ = \?$/);
            }
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
        expect(r.summary.clears).toEqual([]);
        expect(playReward(emptySummary(), findMode('daily-mid'), 4, 10, '2026-10-13').stampAdded).toBe(false);
    });
});
