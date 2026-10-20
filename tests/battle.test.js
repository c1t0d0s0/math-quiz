import { describe, it, expect } from 'vitest';
import { COUNTS, GRADES, battleQuestions, fracText, isCorrect, questionsPrint } from '../src/battle/questions.js';
import {
    MAX_PLAYERS, battleOutcome, cleanName, everyoneDone, formatMs, freeSeat, isCode, makeCode, parseCode, seatOf, standings,
} from '../src/battle/battle.js';
import {
    BATTLE_DAILY_LIMIT, BATTLE_LOSE_POINTS, BATTLE_WIN_POINTS, balance, battleReward, battleTotal, emptySummary, mergeSummary,
} from '../src/rewards.js';

/** 問題の式を、ふつうの計算式として計算する (分数・%・比は別に読む) */
function evaluate(q) {
    const t = q.text;
    let m = t.match(/^(\d+)を(\d+):(\d+)に分ける$/);
    if (m) {
        const [total, a, b] = m.slice(1).map(Number);
        return [String((total * a) / (a + b)), String((total * b) / (a + b))];
    }
    m = t.match(/^(\d+)の(\d+)%$/);
    if (m) return [String((Number(m[1]) * Number(m[2])) / 100)];
    if (/\d\/\d/.test(t)) {
        // 分数の式: a/b ○ c/d
        const f = t.match(/^(\d+)(?:\/(\d+))? ([+−×÷]) (\d+)(?:\/(\d+))?$/);
        const [a, b, op, c, d] = [Number(f[1]), Number(f[2] ?? 1), f[3], Number(f[4]), Number(f[5] ?? 1)];
        const [n, den] = op === '+' ? [a * d + c * b, b * d] : op === '−' ? [a * d - c * b, b * d] : op === '×' ? [a * c, b * d] : [a * d, b * c];
        return [fracText(n, den)];
    }
    const js = t.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    const v = Function(`return (${js})`)();
    return [String(Math.round(v * 1000) / 1000)];
}

/** 式に出てくる数 (分数は分子と分母を別に) */
const numbersIn = t => (t.match(/\d+(\.\d+)?/g) ?? []).map(Number);

const many = (grade, n = 60) => Array.from({ length: n }, (_, i) => battleQuestions(grade, 20, `seed-${i}`)).flat();

describe('対戦の問題', () => {
    it('同じ学年・出題数・seed なら同じ問題、seed がちがえばちがう問題', () => {
        for (const grade of GRADES) {
            for (const count of COUNTS) {
                const a = battleQuestions(grade, count, 'abc');
                expect(a).toHaveLength(count);
                expect(battleQuestions(grade, count, 'abc')).toEqual(a);
                expect(battleQuestions(grade, count, 'xyz').map(x => x.text)).not.toEqual(a.map(x => x.text));
                expect(new Set(a.map(x => x.text)).size, `${grade}年 ${count}問`).toBe(count);
            }
        }
        expect(questionsPrint()).toBe(questionsPrint());
    });

    it('どの問題も、答えが式の計算と合っていて、正の数', () => {
        for (const grade of GRADES) {
            for (const q of many(grade)) {
                expect(q.blanks, `${grade}年: ${q.text}`).toEqual(evaluate(q));
                for (const b of q.blanks) {
                    expect(isCorrect(b, b), `${grade}年: ${q.text} = ${b}`).toBe(true);
                    expect(b).toMatch(/^[1-9]\d*(\.\d+)?$|^0\.\d+$|^[1-9]\d*\/[1-9]\d*$/);
                }
            }
        }
    });

    it('1年: 1桁＋1桁と、2桁−1桁 (くり下がり) だけ', () => {
        for (const q of many(1)) {
            const m = q.text.match(/^(\d+) ([+−]) (\d+)$/);
            expect(m, q.text).not.toBeNull();
            const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
            if (op === '+') expect(a <= 9 && b <= 9, q.text).toBe(true);
            else expect(a >= 11 && a <= 18 && b <= 9 && b > a % 10, q.text).toBe(true);
        }
    });

    it('2年: 2桁の加減 (99まで) と九九', () => {
        for (const q of many(2)) {
            const [a, b] = numbersIn(q.text);
            if (q.text.includes('×')) expect(a <= 9 && b <= 9, q.text).toBe(true);
            else expect(a >= 10 && a <= 99 && b >= 10 && b <= 99 && Number(q.blanks[0]) <= 99, q.text).toBe(true);
        }
    });

    it('3年: 10の倍数の3桁の加減、2桁×1桁、九九の逆のわり算', () => {
        for (const q of many(3)) {
            const [a, b] = numbersIn(q.text);
            if (q.text.includes('×')) expect(a >= 10 && a <= 99 && b <= 9, q.text).toBe(true);
            else if (q.text.includes('÷')) expect(b <= 9 && Number(q.blanks[0]) <= 9, q.text).toBe(true);
            else expect(a % 10 === 0 && b % 10 === 0 && a < 1000 && b < 1000 && Number(q.blanks[0]) < 1000, q.text).toBe(true);
        }
    });

    it('4年: 2桁×2桁は、くふうして暗算できる決まった形だけ。小数は 1/10 の位まで', () => {
        const easy = [11, 12, 15, 20, 25, 50];
        for (const q of many(4)) {
            const nums = numbersIn(q.text);
            if (q.text.includes('×')) {
                expect(nums.every(n => n >= 10 && n <= 99), q.text).toBe(true);
                expect(nums.some(n => easy.includes(n)), q.text).toBe(true);
            } else if (q.text.includes('.')) {
                expect(q.keys).toEqual(['.']);
                expect(q.text).toMatch(/^\d\.\d [+−] \d\.\d$/);
                expect(q.blanks[0]).toMatch(/^\d+(\.\d)?$/);
            } else {
                expect(nums.every(n => n % 10 === 0 && n >= 100 && n < 1000), q.text).toBe(true);
            }
        }
    });

    it('5年: 小数の乗除・同じ分母の分数・くふうする計算。2桁×2桁のような重い計算は出ない', () => {
        for (const q of many(5)) {
            if (q.text.includes('/')) {
                const [, d1, , d2] = numbersIn(q.text);
                expect(d1, q.text).toBe(d2);
                expect(q.keys).toEqual(['/']);
            } else if (q.text.includes('.')) {
                expect(q.keys).toEqual(['.']);
                const ints = numbersIn(q.text).filter(Number.isInteger);
                expect(ints.every(n => n <= 9), q.text).toBe(true);
            } else {
                expect(q.text, q.text).toMatch(/25|125/);
                expect(Number(q.blanks[0]) % 100, q.text).toBe(0);
            }
        }
    });

    it('6年: 分数の乗除、割合、比 (空欄2つ)、複合計算', () => {
        const kinds = new Set();
        for (const q of many(6)) {
            if (q.text.includes('%')) kinds.add('割合');
            else if (q.text.includes(':')) {
                kinds.add('比');
                expect(q.blanks).toHaveLength(2);
                expect(q.parts.filter(p => typeof p !== 'string')).toHaveLength(2);
            } else if (q.text.includes('/')) kinds.add('分数');
            else {
                kinds.add('複合');
                expect(q.text, q.text).toMatch(/[+−].*[×÷]|[×÷].*[+−]|\(/);
            }
        }
        expect([...kinds].sort()).toEqual(['分数', '割合', '比', '複合'].sort());
    });
});

describe('答えの判定', () => {
    it('整数・小数は数として同じなら正解', () => {
        expect(isCorrect('12', '12')).toBe(true);
        expect(isCorrect('012', '12')).toBe(true);
        expect(isCorrect('１２', '12')).toBe(true);
        expect(isCorrect('13', '12')).toBe(false);
        expect(isCorrect('3.5', '3.5')).toBe(true);
        expect(isCorrect('3.50', '3.5')).toBe(true);
        expect(isCorrect('6.0', '6')).toBe(true);
        expect(isCorrect('', '12')).toBe(false);
        expect(isCorrect('1/2', '0.5')).toBe(false);
    });

    it('分数は約分した形だけが正解', () => {
        expect(isCorrect('1/2', '1/2')).toBe(true);
        expect(isCorrect('2/4', '1/2')).toBe(false);
        expect(isCorrect('0.5', '1/2')).toBe(false);
        expect(isCorrect('5/8', '5/8')).toBe(true);
        expect(fracText(4, 8)).toBe('1/2');
        expect(fracText(6, 3)).toBe('2');
    });
});

describe('部屋と順位', () => {
    const player = (uid, extra = {}) => ({ uid, name: uid, joinedAt: 0, online: true, round: 1, solved: 0, misses: 0, ...extra });

    it('対戦コードと名前', () => {
        expect(isCode(makeCode())).toBe(true);
        expect(parseCode('１２３４５')).toBe('12345');
        expect(parseCode('12-345')).toBe('12345');
        expect(parseCode('01234')).toBeNull();
        expect(cleanName('  たろう\u0000  くん  ')).toBe('たろう くん');
        expect([...cleanName('あいうえおかきくけこさしす')]).toHaveLength(10);
        expect(formatMs(65000)).toBe('1:05');
    });

    it('席は8つまで', () => {
        const players = {};
        for (let i = 0; i < MAX_PLAYERS; i++) players[i] = player(`u${i}`);
        expect(freeSeat({ players })).toBeNull();
        delete players[3];
        expect(freeSeat({ players })).toBe('3');
        expect(seatOf({ players }, 'u5')).toBe('5');
    });

    it('タイムの速い順。同じタイムは同じ順位。リタイア・退出はあと', () => {
        const room = {
            round: 1, startAt: 1000, status: 'playing',
            players: {
                0: player('a', { finishedAt: 31000, solved: 10 }),
                1: player('b', { finishedAt: 21000, solved: 10 }),
                2: player('c', { finishedAt: 31000, solved: 10 }),
                3: player('d', { retired: true, solved: 4 }),
                4: player('e', { online: false, solved: 2 }),
            },
        };
        const rows = standings(room);
        expect(rows.map(r => [r.uid, r.status, r.rank])).toEqual([
            ['b', 'done', 1], ['a', 'done', 2], ['c', 'done', 2], ['d', 'retired', null], ['e', 'left', null],
        ]);
        expect(everyoneDone(room)).toBe(true);
        expect(battleOutcome(room, 'b')).toBe('win');
        expect(battleOutcome(room, 'a')).toBe('lose');
        expect(battleOutcome(room, 'd')).toBeNull();
    });

    it('まだ解いている人がいるあいだは、勝ち負けを決めない', () => {
        const room = { round: 1, startAt: 0, status: 'playing', players: { 0: player('a', { finishedAt: 5000 }), 1: player('b', { solved: 3 }) } };
        expect(everyoneDone(room)).toBe(false);
        expect(battleOutcome(room, 'a')).toBeNull();
        expect(battleOutcome({ ...room, status: 'finished' }, 'a')).toBe('win');
        expect(battleOutcome({ ...room, status: 'finished' }, 'b')).toBeNull();
    });

    it('前の回の記録は、今の回に数えない', () => {
        const room = { round: 2, startAt: 0, status: 'playing', players: { 0: player('a', { round: 1, finishedAt: 100 }) } };
        expect(standings(room)[0]).toMatchObject({ status: 'playing', solved: 0 });
    });
});

describe('対戦のポイント', () => {
    const today = '2026-10-20';

    it('勝ち 20pt、負け 10pt。同じ回は1回だけ', () => {
        const win = battleReward(emptySummary(), today, '12345', 1, 'win');
        expect(win).toMatchObject({ points: BATTLE_WIN_POINTS, remaining: BATTLE_DAILY_LIMIT - 1 });
        expect(balance(win.summary)).toBe(BATTLE_WIN_POINTS);
        const again = battleReward(win.summary, today, '12345', 1, 'lose');
        expect(again).toMatchObject({ points: 0, already: true });
        const lose = battleReward(win.summary, today, '12345', 2, 'lose');
        expect(lose.points).toBe(BATTLE_LOSE_POINTS);
        expect(balance(lose.summary)).toBe(BATTLE_WIN_POINTS + BATTLE_LOSE_POINTS);
    });

    it('1日5回まで。次の日はまたもらえる', () => {
        let s = emptySummary();
        for (let i = 1; i <= BATTLE_DAILY_LIMIT; i++) s = battleReward(s, today, '12345', i, 'win').summary;
        expect(balance(s)).toBe(BATTLE_DAILY_LIMIT * BATTLE_WIN_POINTS);
        const sixth = battleReward(s, today, '12345', 6, 'win');
        expect(sixth).toMatchObject({ points: 0, already: false, remaining: 0 });
        expect(battleReward(s, '2026-10-21', '12345', 6, 'win').points).toBe(BATTLE_WIN_POINTS);
    });

    it('2台の記録を合わせて6回以上になっても、1日5回分までしか数えない (勝ちを先に数える)', () => {
        let a = emptySummary();
        let b = emptySummary();
        for (let i = 1; i <= 4; i++) a = battleReward(a, today, '11111', i, 'lose').summary;
        for (let i = 1; i <= 3; i++) b = battleReward(b, today, '22222', i, 'win').summary;
        const merged = mergeSummary(a, b);
        expect(battleTotal(merged.clears)).toBe(3 * BATTLE_WIN_POINTS + 2 * BATTLE_LOSE_POINTS);
        expect(mergeSummary(merged, a)).toEqual(merged);
    });

    it('同じ回に勝ちと負けの両方が入っていたら、1回として数える', () => {
        const clears = ['battle:2026-10-20:12345-1:win', 'battle:2026-10-20:12345-1:lose'];
        expect(battleTotal(clears)).toBe(BATTLE_WIN_POINTS);
        expect(battleTotal(['battle:2026-10-20:1234-1:win', 'battle:x:12345-1:win'])).toBe(0);
    });
});
