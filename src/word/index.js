import { defaultRng } from '../generators/rng.js';
import { buildQuestion } from './helpers.js';

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

const RECENT_KEY = level => `math_quiz_word_recent_${level}`;

function browserStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function loadRecent(storage, level) {
    try {
        const list = JSON.parse(storage?.getItem(RECENT_KEY(level)) || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function saveRecent(storage, level, recent) {
    try {
        storage?.setItem(RECENT_KEY(level), JSON.stringify(recent));
    } catch {
        // 保存できなくても出題は続ける
    }
}

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
export function createWordGenerator(level, r = defaultRng, storage = browserStorage()) {
    const list = patterns[level];
    const keep = Math.floor(list.length / 2);
    let recent = loadRecent(storage, level);
    let bag = [];

    const refill = () => {
        const seen = new Set(recent);
        const shuffled = r.shuffle(list);
        bag = [...shuffled.filter(p => !seen.has(p.id)), ...shuffled.filter(p => seen.has(p.id))];
    };

    return () => {
        if (bag.length === 0) {
            refill();
        }
        const pattern = bag.shift();
        recent = [...recent.filter(id => id !== pattern.id), pattern.id].slice(-keep);
        saveRecent(storage, level, recent);
        return generateFromPattern(pattern, r);
    };
}
