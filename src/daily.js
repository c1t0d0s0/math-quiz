import { createRng, hashString } from './generators/rng.js';

export { hashString };
import {
    generateAdditionQuestion, generateDecimalsQuestion, generateDivisionQuestion,
    generateFractionsQuestion, generateMultiplicationQuestion,
} from './generators/arithmetic.js';
import { generateUnitsLow, generateUnitsMid, generateUnitsHigh } from './generators/units.js';
import { patterns, generateFromPattern } from './word/index.js';
import { patterns as zukeiPatterns, generateZukei } from './zukei/index.js';

// 今日のチャレンジ。1・2年は計算5問と文章問題5問、3・4年と5・6年は計算4問・文章問題4問・図形問題2問の10問を出す。
// 問題は日付と学年帯だけから決まるので、同じ日に開けば、だれでも同じ問題になる
// (保存してある記録や、前に出た問題には左右されない)。

export const DAILY_COUNT = 10;

// 学年帯ごとの計算問題の作り方
const mul = r => generateMultiplicationQuestion(r, 8);
const CALC = {
    low: [generateAdditionQuestion, generateAdditionQuestion, generateAdditionQuestion, generateAdditionQuestion, generateUnitsLow],
    mid: [mul, generateDivisionQuestion, generateDecimalsQuestion, generateUnitsMid],
    high: [generateDecimalsQuestion, generateFractionsQuestion, generateFractionsQuestion, generateUnitsHigh],
};

/** 学年帯ごとの図形問題の数 (1・2年向けの図形問題はない) */
export const DAILY_ZUKEI = { low: 0, mid: 2, high: 2 };

/**
 * 図形問題。ちがう種類から1問ずつ出し、ひらめき問題は1問まで (1問目はふつうの問題、2問目はどれでもよい)。
 * 前に出た問題を保存しないので、日付と学年帯だけから決まる
 */
function zukeiQuestions(level, r) {
    const list = zukeiPatterns[level];
    const out = [];
    for (let i = 0; i < DAILY_ZUKEI[level]; i++) {
        const topics = new Set(out.map(p => p.topic));
        const choices = list.filter(p => !topics.has(p.topic) && (i > 0 || !p.hirameki));
        out.push(r.pick(choices));
    }
    return out.map(pattern => generateZukei(pattern, r));
}

/**
 * その日・その学年帯の10問。date は YYYY-MM-DD、level は 'low' | 'mid' | 'high'。
 * もどり値は、計算・文章問題が { question, options, answer, isWord, explain }、
 * 図形問題が src/zukei/index.js の generateZukei の1問 (topic をもつ) の配列
 */
export function createDailyQuestions(level, date) {
    const r = createRng(hashString(`daily:${date}:${level}`));
    // 計算。同じ式が2回出たら、作り直す
    const seen = new Set();
    const calc = CALC[level].map((generate) => {
        let q = generate(r);
        for (let i = 0; i < 20 && seen.has(q.question); i++) q = generate(r);
        seen.add(q.question);
        return { ...q, isWord: false };
    });
    // 文章問題。ちがうパターンから1問ずつ
    const word = r.pickN(patterns[level], DAILY_COUNT - calc.length - DAILY_ZUKEI[level]).map(pattern => ({ ...generateFromPattern(pattern, r), isWord: true }));
    // 図形問題 (1・2年は作らないので、乱数の使い方も前と同じ)
    const zukei = zukeiQuestions(level, r);
    // 計算と文章問題と図形問題をまぜてならべる
    return r.shuffle([...calc, ...word, ...zukei]).map(q => (q.topic ? q : {
        question: q.question,
        options: q.options.map(String),
        answer: String(q.answer),
        isWord: q.isWord,
        explain: q.explain,
    }));
}
