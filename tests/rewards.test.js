import { describe, it, expect } from 'vitest';
import {
    BATTLE_DAILY_LIMIT, BATTLE_WIN_POINTS, CLEAR_POINTS, MONTH_POINTS, PERFECT_POINTS, STAMP_POINTS, STAMP_SCORE, WEEK_POINTS,
    addDays, balance, buyCard, currentRun, earnedPoints, emptySummary, jstDate, mergeSummary, monthView, playReward, runLengths, sameSummary,
} from '../src/rewards.js';
import { CARDS } from '../src/data/cards.js';
import { cardSvg, monkeyFace, monkeySvg } from '../src/monkey.js';
import { MODES, findMode } from '../src/modes.js';
import { stampRunText } from '../src/rewardText.js';

/** start から n 日分の日付 */
const days = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i));
const addition = findMode('addition');
const longG3 = findMode('long-g3');

describe('日付', () => {
    it('日本時間の日付になる', () => {
        expect(jstDate(new Date('2026-10-12T14:59:59Z'))).toBe('2026-10-12');
        expect(jstDate(new Date('2026-10-12T15:00:00Z'))).toBe('2026-10-13');
    });

    it('月や年をまたいで日を足せる', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    });
});

describe('スタンプからもらえるポイント', () => {
    it('1日1個で、同じ日は1回だけ数える', () => {
        expect(earnedPoints(['2026-10-13', '2026-10-13']).total).toBe(STAMP_POINTS);
        expect(earnedPoints(['2026-10-13', 'x', '2026-13-99x']).days).toBe(1);
    });

    it('7日つづくたびに 1000pt。とぎれたら数え直し', () => {
        expect(runLengths([...days('2026-10-01', 3), ...days('2026-10-10', 8)])).toEqual([3, 8]);
        expect(earnedPoints(days('2026-10-02', 6)).weeks).toBe(0);
        expect(earnedPoints(days('2026-10-02', 7)).total).toBe(7 * STAMP_POINTS + WEEK_POINTS);
        expect(earnedPoints(days('2026-10-02', 14)).weeks).toBe(2);
        expect(earnedPoints([...days('2026-10-01', 6), ...days('2026-10-08', 6)]).weeks).toBe(0);
    });

    it('1日から末日まで全部そろうと 5000pt (月ごとに数える。うるう年の2月も)', () => {
        expect(earnedPoints(days('2026-11-01', 30)).months).toEqual(['2026-11']);
        expect(earnedPoints(days('2026-11-02', 29)).months).toEqual([]);
        expect(earnedPoints(days('2028-02-01', 29)).months).toEqual(['2028-02']);
        const two = earnedPoints(days('2026-11-01', 61));
        expect(two.months).toEqual(['2026-11', '2026-12']);
        expect(two.total).toBe(61 * STAMP_POINTS + 8 * WEEK_POINTS + 2 * MONTH_POINTS);
    });

    it('今つづいている日数は、今日がまだでも、きのうまで続いていれば数える', () => {
        const stamps = days('2026-10-10', 3);
        expect(currentRun(stamps, '2026-10-12')).toBe(3);
        expect(currentRun(stamps, '2026-10-13')).toBe(3);
        expect(currentRun(stamps, '2026-10-14')).toBe(0);
        expect(stampRunText(0)).toContain(`${STAMP_SCORE}問以上`);
        expect(stampRunText(3)).toContain('あと4日');
        expect(stampRunText(7)).toContain('あと7日');
    });

    it('その月のカレンダーにならべられる', () => {
        const view = monthView(['2026-10-01', '2026-10-31', '2026-11-01'], '2026-10');
        expect(view).toHaveLength(31);
        expect(view.filter(Boolean)).toHaveLength(2);
        expect(view[0] && view[30]).toBe(true);
    });
});

describe('1回のプレイのごほうび', () => {
    const today = '2026-10-13';

    it('5問以上正解すると、その日のスタンプと 20pt をもらえる。同じ日の2回目はもらえない', () => {
        const first = playReward(emptySummary(), addition, STAMP_SCORE, 0, today);
        expect(first).toMatchObject({ stampAdded: true, run: 1, stampPoints: STAMP_POINTS, gained: STAMP_POINTS, balance: STAMP_POINTS });
        expect(first.summary.stamps).toEqual([today]);
        const second = playReward(first.summary, addition, 8, 0, today);
        expect(second).toMatchObject({ stampAdded: false, run: 1, gained: 0, balance: STAMP_POINTS });
        expect(second.summary).toBe(first.summary);
    });

    it('4問以下ではスタンプをもらえない', () => {
        const r = playReward(emptySummary(), addition, STAMP_SCORE - 1, 0, today);
        expect(r).toMatchObject({ stampAdded: false, run: 0, gained: 0 });
        expect(r.summary).toEqual(emptySummary());
    });

    it('7日目のスタンプで 1000pt、月の最後の1個で 5000pt が足される', () => {
        const week = playReward({ ...emptySummary(), stamps: days('2026-10-07', 6) }, addition, 6, 0, today);
        expect(week).toMatchObject({ run: 7, weekPoints: WEEK_POINTS, monthPoints: 0, gained: STAMP_POINTS + WEEK_POINTS });
        const month = playReward({ ...emptySummary(), stamps: days('2026-11-01', 29) }, addition, 6, 0, '2026-11-30');
        expect(month.monthPoints).toBe(MONTH_POINTS);
        expect(month.gained).toBe(STAMP_POINTS + MONTH_POINTS);
    });

    it('計算・文章問題ではじめて10問以上正解すると 20pt (モードごとに1回)', () => {
        const first = playReward(emptySummary(), addition, 10, 0, today);
        expect(first.clearPoints).toBe(CLEAR_POINTS);
        expect(first.summary.clears).toEqual(['clear:addition']);
        expect(first.gained).toBe(STAMP_POINTS + CLEAR_POINTS);
        expect(playReward(first.summary, addition, 15, 0, today).clearPoints).toBe(0);
        expect(playReward(first.summary, findMode('word-low'), 10, 0, today).clearPoints).toBe(CLEAR_POINTS);
        expect(playReward(emptySummary(), addition, 9, 0, today).clearPoints).toBe(0);
    });

    it('長文チャレンジではじめて全問正解すると 200pt。10問に届かなくてよい', () => {
        expect(playReward(emptySummary(), longG3, 8, 9, today).clearPoints).toBe(0);
        const perfect = playReward(emptySummary(), longG3, 9, 9, today);
        expect(perfect.clearPoints).toBe(PERFECT_POINTS);
        expect(perfect.summary.clears).toEqual(['perfect:long-g3']);
        expect(playReward(perfect.summary, longG3, 9, 9, today).clearPoints).toBe(0);
    });
});

describe('ポイントの残高とカード', () => {
    it('残高は、もらった分からカードに使った分をひいたもの。知らない記録は数えない', () => {
        const summary = { stamps: days('2026-10-07', 7), clears: ['clear:addition', 'perfect:long-g6', 'bogus', 'clear:addition'], cards: [{ id: 'm01', paid: 40 }] };
        expect(balance(summary)).toBe(7 * STAMP_POINTS + WEEK_POINTS + CLEAR_POINTS + PERFECT_POINTS - 40);
    });

    it('足りないとき・もう持っているときは交換できない', () => {
        const summary = { ...emptySummary(), stamps: days('2026-10-12', 2) }; // 40pt
        expect(buyCard(summary, CARDS[1])).toBeNull();
        const bought = buyCard(summary, CARDS[0]);
        expect(bought.cards).toEqual([{ id: 'm01', paid: 40 }]);
        expect(balance(bought)).toBe(0);
        expect(buyCard(bought, CARDS[0])).toBeNull();
        expect(summary.cards).toEqual([]);
    });

    it('2か所の記録を合わせても、何回やっても同じになる', () => {
        const a = { stamps: ['2026-10-12', '2026-10-10'], clears: ['clear:mixed'], cards: [{ id: 'm02', paid: 80 }] };
        const b = { stamps: ['2026-10-12', '2026-10-13'], clears: ['perfect:long-g3', 'x'], cards: [{ id: 'm02', paid: 60 }, { id: 'm01', paid: 40 }] };
        const merged = mergeSummary(a, b);
        expect(merged).toEqual({
            stamps: ['2026-10-10', '2026-10-12', '2026-10-13'],
            clears: ['clear:mixed', 'perfect:long-g3'],
            cards: [{ id: 'm01', paid: 40 }, { id: 'm02', paid: 60 }],
        });
        expect(mergeSummary(b, a)).toEqual(merged);
        expect(mergeSummary(merged, a)).toEqual(merged);
        expect(sameSummary(merged, mergeSummary(merged, merged))).toBe(true);
        expect(sameSummary(a, b)).toBe(false);
    });
});

describe('リスザルカード', () => {
    it('20枚あり、id が重ならず、値段の安い順にならんでいる', () => {
        expect(CARDS).toHaveLength(20);
        expect(new Set(CARDS.map(c => c.id)).size).toBe(20);
        expect(new Set(CARDS.map(c => c.name)).size).toBe(20);
        const prices = CARDS.map(c => c.price);
        expect([...prices].sort((a, b) => a - b)).toEqual(prices);
        expect(CARDS.every(c => c.name.includes('リスザル'))).toBe(true);
    });

    it('どのカードも絵をかける', () => {
        for (const card of CARDS) {
            const svg = cardSvg(card);
            expect(svg, card.id).toMatch(/^<svg viewBox="0 0 120 156"/);
            expect(svg, card.id).not.toMatch(/undefined|NaN|null/);
            expect(svg, card.id).toContain(`aria-label="${card.name}"`);
            for (const item of card.look.items ?? []) {
                expect(monkeyFace({ items: [item] }).length, `${card.id} ${item}`).toBeGreaterThan(monkeyFace().length);
            }
        }
        expect(monkeySvg()).toContain('リスザルのキャラクター');
        // 背景の指定がまちがっていると、どれも同じ「紙」になってしまう
        expect(new Set(CARDS.map(c => c.bg)).size).toBeGreaterThanOrEqual(12);
    });
});

// ---- カードの値段のバランス ----
// ポイントのもらい方から、「何日目に何枚持てるか」を計算して確かめる

const TOTAL = CARDS.reduce((sum, c) => sum + c.price, 0);

/** 安い順に買っていったとき、points で何枚持てるか */
function affordable(points) {
    let left = points;
    let count = 0;
    for (const card of CARDS) {
        if (left < card.price) break;
        left -= card.price;
        count++;
    }
    return count;
}

// 毎日スタンプだけをもらう人 (「やったね」のポイントはなし)。月の途中の 10/16 から始める
const daily = n => earnedPoints(days('2026-10-16', n)).total;
// いちばん多くもらえる人: 毎日スタンプをもらい、全部のモードの「やったね」を最初の日にもらう
const ALL_CLEARS = MODES.reduce((sum, m) => sum + (m.kind === 'long' ? PERFECT_POINTS : m.kind === 'daily' ? 0 : CLEAR_POINTS), 0);
const maxPlayer = (start, n) => earnedPoints(days(start, n)).total + ALL_CLEARS;

describe('カードの値段のバランス', () => {
    it('合計は 28,420pt', () => {
        expect(TOTAL).toBe(28420);
    });

    it('毎日スタンプをもらう人は、はじめの5枚を2週間以内に手に入れられる', () => {
        const owned = day => affordable(daily(day));
        expect(owned(1)).toBe(0);
        expect(owned(2)).toBe(1);
        expect(owned(6)).toBe(2);
        expect(owned(7)).toBe(4);
        expect(owned(13)).toBe(4);
        expect(owned(14)).toBe(5);
    });

    it('そのあとは、1枚ごとに少しずつ時間がかかる', () => {
        // 月そろいの 5000pt が入らない、いちばんおそい場合で数える (1日 20pt と7日ごとの 1000pt だけ)
        const slow = n => n * STAMP_POINTS + Math.floor(n / 7) * WEEK_POINTS;
        const dayOf = (count) => {
            let day = 1;
            while (affordable(slow(day)) < count) day++;
            return day;
        };
        expect([6, 7, 8, 9, 10].map(dayOf)).toEqual([21, 28, 35, 42, 49]);
        const gaps = Array.from({ length: 15 }, (_, i) => dayOf(i + 6) - dayOf(i + 5)); // 6〜20枚目
        for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(7);
        const average = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
        expect(average(gaps.slice(10))).toBeGreaterThan(average(gaps.slice(5, 10)));
        expect(average(gaps.slice(5, 10))).toBeGreaterThan(average(gaps.slice(0, 5)));
    });

    it('いちばん多くもらえる人でも、いつ始めても 88 日目までには全部そろわない', () => {
        // うるう年もふくめ、2年分の開始日をすべて試す
        let start = '2027-01-01';
        let fastest = Infinity;
        for (let i = 0; i < 731; i++) {
            // 日がたつほどポイントはふえるので、88 日目で足りなければ、それより前も足りない
            expect(maxPlayer(start, 88), `${start} から 88 日目`).toBeLessThan(TOTAL);
            let n = 89;
            while (maxPlayer(start, n) < TOTAL) n++;
            fastest = Math.min(fastest, n);
            start = addDays(start, 1);
        }
        // いちばん早いのは、3か月分の「1か月そろった」が入る 89 日目
        expect(fastest).toBe(89);
    }, 30000);

    it('対戦のポイントも毎日いちばん多くもらう人 (1日5回とも勝つ) は、いちばん早くて 70 日目に全部そろう', () => {
        // 対戦のポイントを入れると「全部集めるには3か月」より早くなる。値段を変えるときの目安としてのこしておく
        const perDay = BATTLE_DAILY_LIMIT * BATTLE_WIN_POINTS;
        let start = '2027-01-01';
        let fastest = Infinity;
        for (let i = 0; i < 731; i++) {
            let n = 60;
            while (maxPlayer(start, n) + perDay * n < TOTAL) n++;
            fastest = Math.min(fastest, n);
            start = addDays(start, 1);
        }
        expect(fastest).toBe(70);
    }, 30000);
});
