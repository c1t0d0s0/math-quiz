import { defineTopic } from '../helpers.js';
import { names, foods, colors } from '../vocab.js';

const L = 'low';
const two = r => r.pickN(names, 2);

const kakezan = defineTopic('low-kakezan', 'かけざん', [
    (r) => {
        const [a, b] = [r.int(2, 9), r.int(2, 9)];
        const I = r.pick(foods(L));
        return {
            text: `1さらに ${I.name}が ${a}${I.unit}ずつ のっています。${b}さらでは、${I.name}は ぜんぶで ${I.q}ですか。`,
            answer: a * b, unit: I.unit, wrong: [a + b, a * (b + 1), a * (b - 1)],
            explain: `1さらに ${a}${I.unit}ずつ ${b}さらなので かけざん。${a} × ${b} = ${a * b}（${I.unit}）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(2, 6), r.int(3, 9)];
        const ride = r.pick([['ボート', 'そう'], ['ゴーカート', 'だい'], ['のりもの', 'だい']]);
        return {
            text: `${a}人のりの ${ride[0]}が ${b}${ride[1]} あります。ぜんぶで なん人 のれますか。`,
            answer: a * b, unit: '人', wrong: [a + b, a * b + a, a * b - a],
            explain: `1${ride[1]}に ${a}人ずつ ${b}${ride[1]}なので かけざん。${a} × ${b} = ${a * b}（人）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(5, 9), r.int(2, 9)];
        const what = r.pick(['がようし', 'いろがみ', 'シール', 'ふうせん']);
        return {
            text: `1まい ${a}円の ${what}を ${b}まい かいます。だいきんは なん円ですか。`,
            answer: a * b, unit: '円', wrong: [a + b, a * b + a, a * b - a],
            explain: `1まい ${a}円の ものを ${b}まいなので かけざん。${a} × ${b} = ${a * b}（円）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(3, 9), r.int(2, 8)];
        const what = r.pick(['いす', 'つくえ', 'うえきばち']);
        return {
            text: `${what}が 1れつに ${a}こずつ、${b}れつ ならんでいます。${what}は ぜんぶで なんこ ありますか。`,
            answer: a * b, unit: 'こ', wrong: [a + b, a * b + b, a * b - b],
            explain: `1れつに ${a}こずつ ${b}れつなので かけざん。${a} × ${b} = ${a * b}（こ）`,
        };
    },
    (r) => {
        const b = r.int(2, 9);
        return {
            text: `1しゅうかんは 7日です。${b}しゅうかんは なん日ですか。`,
            answer: 7 * b, unit: '日', wrong: [7 + b, 7 * b + 7, 7 * b - 7],
            explain: `7日の ${b}しゅうかんぶんなので かけざん。7 × ${b} = ${7 * b}（日）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 9), r.int(3, 8)];
        return {
            text: `ながさ ${a}cmの テープを ${b}本 つくります。テープは ぜんぶで なんcm いりますか。`,
            answer: a * b, unit: 'cm', wrong: [a + b, a * b + a, a * b - a],
            explain: `${a}cmの テープが ${b}本なので かけざん。${a} × ${b} = ${a * b}（cm）`,
        };
    },
]);

const bai = defineTopic('low-bai', 'ばい', [
    (r) => {
        const [a, k] = [r.int(3, 9), r.int(2, 5)];
        const [c1, c2] = r.pickN(colors, 2);
        return {
            text: `${c1}の テープは ${a}cmです。${c2}の テープの ながさは ${c1}の テープの ${k}ばいです。${c2}の テープは なんcmですか。`,
            answer: a * k, unit: 'cm', wrong: [a + k, a * k + a],
            explain: `${k}ばいは かけざん。${a} × ${k} = ${a * k}（cm）`,
        };
    },
    (r) => {
        const [a, k] = [r.int(3, 9), r.int(2, 4)];
        const [p, q] = two(r);
        return {
            text: `${p}さんは どんぐりを ${a}こ ひろいました。${q}さんは ${p}さんの ${k}ばい ひろいました。ふたり あわせて なんこ ひろいましたか。`,
            answer: a + a * k, unit: 'こ', wrong: [a * k, a + k],
            explain: `${q}さんは ${a} × ${k} = ${a * k}（こ）。ふたり あわせて ${a} + ${a * k} = ${a + a * k}（こ）`,
        };
    },
    (r) => {
        const [a, k] = [r.int(3, 9), r.int(3, 5)];
        const [p, q] = two(r);
        return {
            text: `${p}さんは シールを ${a}まい もっています。${q}さんは ${p}さんの ${k}ばい もっています。${q}さんは ${p}さんより なんまい おおく もっていますか。`,
            answer: a * k - a, unit: 'まい', wrong: [a * k, a * k + a],
            explain: `${q}さんは ${a} × ${k} = ${a * k}（まい）。ちがいは ひきざん。${a * k} − ${a} = ${a * k - a}（まい）`,
        };
    },
]);

const kakeTasu = defineTopic('low-kaketasu', 'かけざんと たしざん・ひきざん', [
    (r) => {
        const [a, b, c] = [r.int(3, 9), r.int(2, 6), r.int(2, 8)];
        return {
            text: `${a}こいりの あめの ふくろが ${b}ふくろと、ばらの あめが ${c}こ あります。あめは ぜんぶで なんこ ありますか。`,
            answer: a * b + c, unit: 'こ', wrong: [a * b, a + b + c],
            explain: `ふくろの あめは ${a} × ${b} = ${a * b}（こ）。ばらの あめを たして ${a * b} + ${c} = ${a * b + c}（こ）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(5, 9), r.int(2, 6)];
        const c = r.int(3, a * b - 4);
        return {
            text: `1はこ ${a}本いりの えんぴつを ${b}はこ かいました。${c}本 つかうと、のこりは なん本ですか。`,
            answer: a * b - c, unit: '本', wrong: [a * b, a * b + c],
            explain: `えんぴつは ${a} × ${b} = ${a * b}（本）。つかった ぶんを ひいて ${a * b} − ${c} = ${a * b - c}（本）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 9), r.int(3, 7)];
        const t = a * b + r.int(6, 30);
        return {
            text: `${r.pick(names)}さんは 本を 1日に ${a}ページずつ ${b}日かん よみました。本は ぜんぶで ${t}ページ あります。のこりは なんページですか。`,
            answer: t - a * b, unit: 'ページ', wrong: [a * b, t - a - b],
            explain: `よんだ ページは ${a} × ${b} = ${a * b}（ページ）。のこりは ${t} − ${a * b} = ${t - a * b}（ページ）`,
        };
    },
]);

const nanjuu = defineTopic('low-nanjuu', '10や100のまとまり', [
    (r) => {
        const a = r.int(12, 45);
        return {
            text: `おりがみを 10まいずつ たばに したら、ちょうど ${a}たば できました。おりがみは ぜんぶで なんまい ありますか。`,
            answer: a * 10, unit: 'まい', wrong: [a + 10, a * 100, a],
            explain: `10まいの たばが ${a}たばなので かけざん。10 × ${a} = ${a * 10}（まい）`,
        };
    },
    (r) => {
        const a = r.int(12, 60);
        return {
            text: `${a * 10}まいの がようしを 10まいずつ たばに します。たばは いくつ できますか。`,
            answer: a, unit: 'たば', wrong: [a * 10, a + 10, a * 100],
            explain: `${a * 10}は 10が ${a}こ あつまった かずです。10 × ${a} = ${a * 10} なので、${a}（たば）`,
        };
    },
    (r) => {
        const a = r.int(2, 7) * 100;
        const b = r.int(1, (1000 - a) / 100 - 1) * 100;
        const [p, q] = two(r);
        return {
            text: `${p}さんは ${a}円、${q}さんは ${b}円 ちょきんしています。ふたりの ちょきんを あわせると なん円ですか。`,
            answer: a + b, unit: '円', step: 100, wrong: [(a + b) / 10, Math.abs(a - b)],
            explain: `あわせるので たしざん。100が ${a / 100}こと ${b / 100}こで ${(a + b) / 100}こ。${a} + ${b} = ${a + b}（円）`,
        };
    },
]);

export default [...kakezan, ...bai, ...kakeTasu, ...nanjuu];
