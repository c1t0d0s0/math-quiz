// 文章問題で使う語彙プール。学年帯（low / mid / high）で助数詞の表記を変える

export const names = [
    'ゆうと', 'さくら', 'はると', 'ひなた', 'そうた', 'あおい', 'りく', 'ゆい',
    'けんた', 'みお', 'だいき', 'はな', 'こうき', 'あかり', 'たくみ', 'まい',
];

const UNITS = {
    low: { ko: 'こ', mai: 'まい', hon: '本', satsu: 'さつ', hiki: 'ひき' },
    mid: { ko: 'こ', mai: 'まい', hon: '本', satsu: 'さつ', hiki: 'ひき' },
    high: { ko: '個', mai: '枚', hon: '本', satsu: '冊', hiki: '匹' },
};

// 「なんびき」のように読みが変わるもの
const LOW_QUESTION = { ひき: 'なんびき' };

function withUnit(level, list) {
    return list.map(([name, kind]) => {
        const unit = UNITS[level][kind];
        const q = level === 'low' ? (LOW_QUESTION[unit] || `なん${unit}`) : `何${unit}`;
        return { name, unit, q };
    });
}

const FOODS = [
    ['りんご', 'ko'], ['みかん', 'ko'], ['あめ', 'ko'], ['いちご', 'ko'], ['チョコレート', 'ko'],
    ['クッキー', 'mai'], ['せんべい', 'mai'], ['ドーナツ', 'ko'], ['キャラメル', 'ko'], ['くり', 'ko'],
];

const THINGS = [
    ['おりがみ', 'mai'], ['シール', 'mai'], ['カード', 'mai'], ['えんぴつ', 'hon'], ['どんぐり', 'ko'],
    ['ビーだま', 'ko'], ['おはじき', 'ko'], ['ノート', 'satsu'], ['かいがら', 'ko'], ['クレヨン', 'hon'],
];

const ANIMALS = [
    ['いぬ', 'hiki'], ['ねこ', 'hiki'], ['うさぎ', 'hiki'], ['きんぎょ', 'hiki'], ['かめ', 'hiki'],
    ['かえる', 'hiki'], ['ひつじ', 'hiki'], ['さる', 'hiki'],
];

/** 食べものの一覧（{ name, unit, q }） */
export const foods = level => withUnit(level, FOODS);
/** 食べもの以外の数えられるもの */
export const things = level => withUnit(level, THINGS);
/** 食べもの＋もの */
export const items = level => withUnit(level, [...FOODS, ...THINGS]);
export const animals = level => withUnit(level, ANIMALS);

// 買いもので使う品物
export const lowGoods = ['えんぴつ', 'けしゴム', 'ノート', 'あめ', 'ガム', 'チョコ', 'ラムネ', 'クッキー'];
export const goods = ['ノート', '消しゴム', 'えん筆', '下じき', 'ペン', 'じょうぎ', 'のり', 'はさみ'];
export const sweets = ['ケーキ', 'プリン', 'ドーナツ', 'シュークリーム', 'アイス', 'おにぎり', 'パン'];
export const colors = ['あか', 'あお', 'きいろ', 'しろ', 'みどり', 'ピンク'];
export const colorsKanji = ['赤', '青', '黄色', '白', '緑'];
export const places = ['図書館', '公園', '駅', '学校', 'プール', '体育館', '動物園', '博物館'];
export const vehicles = ['自動車', 'バス', '電車', 'オートバイ', 'トラック'];
