import { defaultRng } from '../generators/rng.js';
import { createBag } from '../generators/bag.js';
import { buildChoices } from '../word/helpers.js';

import g3Kaimono from './g3/kaimono.js';
import g3Tokushu from './g3/tokushu.js';
import g3Kisoku from './g3/kisoku.js';
import g3Zukei from './g3/zukei.js';
import g45Hayasa from './g45/hayasa.js';
import g45Wariai from './g45/wariai.js';
import g45Tokushu from './g45/tokushu.js';
import g45Zukei from './g45/zukei.js';
import g6Hayasa from './g6/hayasa.js';
import g6Wariai from './g6/wariai.js';
import g6Zukei from './g6/zukei.js';
import g6Kisoku from './g6/kisoku.js';

/** 学年ごとの長文問題 */
export const problems = {
    g3: [...g3Kaimono, ...g3Tokushu, ...g3Kisoku, ...g3Zukei],
    g45: [...g45Hayasa, ...g45Wariai, ...g45Tokushu, ...g45Zukei],
    g6: [...g6Hayasa, ...g6Wariai, ...g6Zukei, ...g6Kisoku],
};

/** 1プレイで出す長文の数と、長文1題あたりの小問の数 */
export const SET_SIZE = 3;
export const QUESTIONS_PER_PROBLEM = 3;
export const CHOICES = 10;

/** 長文1題を、小問ごとの10択つきで作る */
export function generateProblem(problem, r = defaultRng) {
    const res = problem.generate(r);
    if (res.questions.length !== QUESTIONS_PER_PROBLEM) {
        throw new Error(`${problem.id}: 小問は${QUESTIONS_PER_PROBLEM}問にしてください`);
    }
    return {
        id: problem.id,
        topic: problem.topic,
        text: res.text,
        figure: res.figure || null,
        questions: res.questions.map(q => buildChoices(q, r, CHOICES)),
    };
}

/**
 * 1プレイ分（長文3題）を作る。
 * プレイごとに袋を作り直すので、出した題をほぼ全部覚えておくことで、一巡するまで同じ題を出さない
 */
export function createLongSet(level, r = defaultRng, storage) {
    const list = problems[level];
    const key = `math_quiz_long_recent_${level}`;
    const keep = list.length - SET_SIZE;
    const next = storage === undefined
        ? createBag(list, key, r, undefined, keep)
        : createBag(list, key, r, storage, keep);
    return Array.from({ length: SET_SIZE }, () => generateProblem(next(), r));
}
