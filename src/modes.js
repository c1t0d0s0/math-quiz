import { defaultRng } from './generators/rng.js';
import { createCalcGenerator } from './generators/arithmetic.js';
import { createWordGenerator } from './word/index.js';

// 学年タブ
export const GRADES = [
    { id: 'all', label: 'すべて' },
    { id: 'low', label: '1・2年生' },
    { id: 'mid', label: '3・4年生' },
    { id: 'high', label: '5・6年生' },
];

// モード定義。id はハイスコアの保存キーにも使うので変えないこと
export const MODES = [
    { id: 'addition', kind: 'calc', name: '足し算・引き算', title: '➕ 足し算・引き算', badge: '1・2年', desc: '基本の計算（60秒）', grades: ['low'], timeLimit: 60 },
    { id: 'multiplication', kind: 'calc', name: 'かけ算', title: '✖️ かけ算', badge: '2・3年', desc: '九九〜2桁チャレンジ（3分）', grades: ['low', 'mid'], timeLimit: 180 },
    { id: 'division', kind: 'calc', name: '割り算', title: '➗ 割り算', badge: '3・4年', desc: '割り切り＆余り計算（2分）', grades: ['mid'], timeLimit: 120 },
    { id: 'decimals', kind: 'calc', name: '小数', title: '🔢 小数', badge: '4・5年', desc: '小数の四則計算（2分）', grades: ['mid', 'high'], timeLimit: 120 },
    { id: 'fractions', kind: 'calc', name: '分数', title: '🍰 分数', badge: '5・6年', desc: '通分・異分母の足し算引き算（2分）', grades: ['high'], timeLimit: 120 },
    { id: 'mixed', kind: 'calc', name: '全部ミックス', title: '🌟 ミックス', badge: '全学年', desc: '全部混ざった総合問題（2分）', grades: ['all'], timeLimit: 120 },
    { id: 'word-low', kind: 'word', level: 'low', name: '文章問題（1・2年）', title: '📖 文章問題', badge: '1・2年', desc: 'おはなしを よんで こたえよう（5分）', grades: ['low'], timeLimit: 300 },
    { id: 'word-mid', kind: 'word', level: 'mid', name: '文章問題（3・4年）', title: '📖 文章問題', badge: '3・4年', desc: 'わり算・面積・時間などの文章題（5分）', grades: ['mid'], timeLimit: 300 },
    { id: 'word-high', kind: 'word', level: 'high', name: '文章問題（5・6年）', title: '📖 文章問題', badge: '5・6年', desc: '速さ・割合・比などの文章題（5分）', grades: ['high'], timeLimit: 300 },
];

export function findMode(id) {
    return MODES.find(m => m.id === id);
}

/** 学年タブの選択に対して、そのモードを表示するかどうか */
export function isVisible(mode, grade) {
    return grade === 'all' || mode.grades.includes(grade) || mode.grades.includes('all');
}

/** 1プレイ分の出題関数を作る */
export function createGenerator(mode, r = defaultRng, storage) {
    if (mode.kind === 'word') {
        return storage === undefined
            ? createWordGenerator(mode.level, r)
            : createWordGenerator(mode.level, r, storage);
    }
    return createCalcGenerator(mode.id, r);
}
