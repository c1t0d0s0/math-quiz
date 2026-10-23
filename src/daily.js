import { createRng, hashString } from './generators/rng.js';

export { hashString };
import {
    generateAdditionQuestion, generateDecimalsQuestion, generateDivisionQuestion,
    generateFractionsQuestion, generateMultiplicationQuestion,
} from './generators/arithmetic.js';
import { generateUnitsLow, generateUnitsMid, generateUnitsHigh } from './generators/units.js';
import { patterns, generateFromPattern } from './word/index.js';

// 今日のチャレンジ。学年帯ごとに、計算5問と文章問題5問の10問を出す。
// 問題は日付と学年帯だけから決まるので、同じ日に開けば、だれでも同じ問題になる
// (保存してある記録や、前に出た問題には左右されない)。

export const DAILY_COUNT = 10;

// 学年帯ごとの計算問題5問の作り方
const mul = r => generateMultiplicationQuestion(r, 8);
const CALC = {
    low: [generateAdditionQuestion, generateAdditionQuestion, generateAdditionQuestion, generateAdditionQuestion, generateUnitsLow],
    mid: [mul, mul, generateDivisionQuestion, generateDecimalsQuestion, generateUnitsMid],
    high: [generateDecimalsQuestion, generateDecimalsQuestion, generateFractionsQuestion, generateFractionsQuestion, generateUnitsHigh],
};

/**
 * その日・その学年帯の10問。date は YYYY-MM-DD、level は 'low' | 'mid' | 'high'。
 * もどり値は { question, options, answer, isWord } の配列
 */
export function createDailyQuestions(level, date) {
    const r = createRng(hashString(`daily:${date}:${level}`));
    // 計算5問。同じ式が2回出たら、作り直す
    const seen = new Set();
    const calc = CALC[level].map((generate) => {
        let q = generate(r);
        for (let i = 0; i < 20 && seen.has(q.question); i++) q = generate(r);
        seen.add(q.question);
        return { ...q, isWord: false };
    });
    // 文章問題5問。ちがうパターンから1問ずつ
    const word = r.pickN(patterns[level], DAILY_COUNT - calc.length).map(pattern => ({ ...generateFromPattern(pattern, r), isWord: true }));
    // 計算と文章問題をまぜてならべる
    return r.shuffle([...calc, ...word]).map(q => ({
        question: q.question,
        options: q.options.map(String),
        answer: String(q.answer),
        isWord: q.isWord,
    }));
}
