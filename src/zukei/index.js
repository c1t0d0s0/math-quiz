import { defaultRng } from '../generators/rng.js';
import { createBag } from '../generators/bag.js';

import perimeter from './perimeter.js';
import area from './area.js';
import angle from './angle.js';
import gridPatterns from './grid.js';
import shaded from './shaded.js';
import volume from './volume.js';
import origami from './origami.js';

// 図形チャレンジ。種類ごとの問題パターンから、1回10問を作る

/** 種類の名前 (topic → 画面に出す名前) */
export const TOPICS = {
    perimeter: 'まわりの長さ',
    area: '四角形の面積',
    angle: '角度',
    grid: 'マスと数',
    shaded: '色をつけた部分の面積',
    volume: '立体',
    origami: '折り紙',
};

const ALL = [...perimeter, ...area, ...angle, ...gridPatterns, ...shaded, ...volume, ...origami];

/** 学年帯ごとの問題パターン */
export const patterns = {
    mid: ALL.filter(p => p.levels.includes('mid')),
    high: ALL.filter(p => p.levels.includes('high')),
};

/** 1回に出す問題の数と、そのうちのひらめき問題の数 */
export const ZUKEI_COUNT = 10;
export const HIRAMEKI_MIN = 2;
export const HIRAMEKI_MAX = 3;

/** パターン1つから1問を作る */
export function generateZukei(pattern, r = defaultRng) {
    return { ...pattern.generate(r), topic: pattern.topic, topicLabel: TOPICS[pattern.topic], hirameki: pattern.hirameki, patternId: pattern.id };
}

/**
 * 1回分の10問。どの種類も1問は出し、のこりは種類をえらびなおして出す。
 * 種類ごと・ふつうとひらめきごとにシャッフルバッグを作るので、同じ問題がつづけて出にくい
 */
export function createZukeiSet(level, r = defaultRng, storage) {
    const list = patterns[level];
    const topics = Object.keys(TOPICS).filter(t => list.some(p => p.topic === t));
    const bags = new Map();
    const draw = (topic, hirameki) => {
        const key = `${topic}:${hirameki}`;
        if (!bags.has(key)) {
            const items = list.filter(p => p.topic === topic && p.hirameki === hirameki);
            const storageKey = `math_quiz_zukei_recent_${level}_${topic}_${hirameki ? 'h' : 'n'}`;
            bags.set(key, storage === undefined ? createBag(items, storageKey, r) : createBag(items, storageKey, r, storage));
        }
        return bags.get(key)();
    };

    // まず全部の種類から1問ずつ。そのうちいくつかの種類 (ひらめき問題のある種類) は、ひらめき問題にする
    const canHirameki = topics.filter(t => list.some(p => p.topic === t && p.hirameki));
    const hiramekiTopics = new Set(r.shuffle(canHirameki).slice(0, r.int(HIRAMEKI_MIN, HIRAMEKI_MAX)));
    const chosen = r.shuffle(topics).map(t => draw(t, hiramekiTopics.has(t)));
    // のこりは、ふつうの問題を、まだ出していないパターンから出す (同じパターンは2回出さない)
    const used = new Set(chosen.map(p => p.id));
    for (const topic of r.shuffle(topics)) {
        if (chosen.length >= ZUKEI_COUNT) break;
        const size = list.filter(p => p.topic === topic && !p.hirameki).length;
        for (let n = 0; n < size; n++) {
            const pattern = draw(topic, false);
            if (!used.has(pattern.id)) {
                used.add(pattern.id);
                chosen.push(pattern);
                break;
            }
        }
    }
    return r.shuffle(chosen).map(pattern => generateZukei(pattern, r));
}
