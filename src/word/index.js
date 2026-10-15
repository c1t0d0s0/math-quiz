import { defaultRng } from '../generators/rng.js';
import { createBag } from '../generators/bag.js';
import { buildQuestion } from './helpers.js';
import { createSegmentSet } from './segments.js';

import lowAddSub from './low/addsub.js';
import lowMeasure from './low/measure.js';
import lowKakezan from './low/kakezan.js';
import midDivision from './mid/division.js';
import midNumbers from './mid/numbers.js';
import midMeasure from './mid/measure.js';
import midFractions from './mid/fractions.js';
import highNumbers from './high/numbers.js';
import highRatio from './high/ratio.js';
import highSpeed from './high/speed.js';
import highGeometry from './high/geometry.js';

/** 学年帯ごとの文章問題パターン */
export const patterns = {
    low: [...lowAddSub, ...lowMeasure, ...lowKakezan],
    mid: [...midDivision, ...midNumbers, ...midMeasure, ...midFractions],
    high: [...highNumbers, ...highRatio, ...highSpeed, ...highGeometry],
};

/** パターン1つから4択問題を作る */
export function generateFromPattern(pattern, r = defaultRng) {
    return { ...buildQuestion(pattern.generate(r), r), patternId: pattern.id };
}

/**
 * 文章問題の出題関数を作る（シャッフルバッグ方式）
 *
 * 全パターンを一巡するまで同じパターンは出さない。最近出したパターンは保存しておき、
 * 次に袋を作るとき後ろに回すので、プレイのたびに違う問題から始まる。
 */
export function createWordGenerator(level, r = defaultRng, storage) {
    const key = `math_quiz_word_recent_${level}`;
    const next = storage === undefined
        ? createBag(patterns[level], key, r)
        : createBag(patterns[level], key, r, storage);
    if (level !== 'mid') {
        return () => generateFromPattern(next(), r);
    }

    // 3・4年は、ふつうの文章問題を SEGMENT_EVERY 問出すごとに、線分図の4問ひと組をはさむ
    let count = 0;
    let set = [];
    return () => {
        if (set.length > 0) return set.shift();
        if (count === SEGMENT_EVERY) {
            count = 0;
            set = createSegmentSet(r);
            return set.shift();
        }
        count++;
        return generateFromPattern(next(), r);
    };
}

/** 3・4年の文章問題で、線分図の問題をはさむまでの、ふつうの問題の数 */
export const SEGMENT_EVERY = 4;
