import { defineTopic } from '../helpers.js';
import { names, items, foods, things, animals, colors } from '../vocab.js';

const L = 'low';
const two = r => r.pickN(names, 2);

const gappei = defineTopic('low-gappei', 'あわせていくつ', [
    (r) => {
        const [a, b] = [r.int(2, 9), r.int(2, 9)];
        const I = r.pick(items(L));
        const [p, q] = two(r);
        return {
            text: `${p}さんは ${I.name}を ${a}${I.unit}、${q}さんは ${b}${I.unit} もっています。あわせて ${I.q}ですか。`,
            answer: a + b, unit: I.unit, wrong: [Math.abs(a - b), a + b + 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(3, 12), r.int(3, 9)];
        const [c1, c2] = r.pickN(colors, 2);
        return {
            text: `${c1}の はなが ${a}本、${c2}の はなが ${b}本 さいています。はなは ぜんぶで なん本 さいていますか。`,
            answer: a + b, unit: '本', wrong: [Math.abs(a - b), a + b - 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 15), r.int(4, 15)];
        const place = r.pick(['こうえん', 'きょうしつ', 'プール', 'こうてい']);
        return {
            text: `${place}に おとこのこが ${a}人、おんなのこが ${b}人 います。こどもは みんなで なん人 いますか。`,
            answer: a + b, unit: '人', wrong: [Math.abs(a - b), a + b + 2],
        };
    },
    (r) => {
        const [a, b] = [r.int(12, 38), r.int(11, 29)];
        const I = r.pick(items(L));
        return {
            text: `はこの なかに ${I.name}が ${a}${I.unit}、ふくろの なかに ${b}${I.unit} はいっています。${I.name}は ぜんぶで ${I.q} ありますか。`,
            answer: a + b, unit: I.unit, wrong: [a + b - 10, a + b + 10, Math.abs(a - b)],
        };
    },
]);

const zouka = defineTopic('low-zouka', 'ふえるといくつ', [
    (r) => {
        const [a, b] = [r.int(3, 9), r.int(2, 8)];
        const A = r.pick(animals(L));
        return {
            text: `${A.name}が ${a}ひき います。そこへ ${b}ひき やって きました。${A.name}は ぜんぶで なんびきに なりましたか。`,
            answer: a + b, unit: 'ひき', wrong: [Math.abs(a - b), a + b + 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(5, 14), r.int(3, 9)];
        const I = r.pick(items(L));
        const [p] = two(r);
        const from = r.pick(['おかあさん', 'おとうさん', 'おばあさん', 'おねえさん']);
        return {
            text: `${p}さんは ${I.name}を ${a}${I.unit} もっています。${from}から ${b}${I.unit} もらいました。${I.name}は ${I.q}に なりましたか。`,
            answer: a + b, unit: I.unit, wrong: [a - b, a + b - 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(8, 25), r.int(3, 12)];
        return {
            text: `バスに ${a}人 のっています。つぎの バスていで ${b}人 のって きました。バスに のっているのは なん人に なりましたか。`,
            answer: a + b, unit: '人', wrong: [a - b, a + b + 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(21, 58), r.int(12, 35)];
        const [p] = two(r);
        return {
            text: `${p}さんは きのうまでに 本を ${a}ページ よみました。きょう ${b}ページ よみました。ぜんぶで なんページ よみましたか。`,
            answer: a + b, unit: 'ページ', wrong: [a + b - 10, a + b + 10, a - b],
        };
    },
]);

const kyuzan = defineTopic('low-kyuzan', 'のこりはいくつ', [
    (r) => {
        const a = r.int(6, 15);
        const b = r.int(2, a - 2);
        const I = r.pick(foods(L));
        return {
            text: `${I.name}が ${a}${I.unit} あります。${b}${I.unit} たべました。のこりは ${I.q}ですか。`,
            answer: a - b, unit: I.unit, wrong: [a + b, a - b + 1],
        };
    },
    (r) => {
        const a = r.int(8, 18);
        const b = r.int(3, a - 2);
        return {
            text: `こうえんで こどもが ${a}人 あそんでいます。${b}人 かえりました。こうえんに いるのは なん人ですか。`,
            answer: a - b, unit: '人', wrong: [a + b, a - b - 1],
        };
    },
    (r) => {
        const a = r.int(25, 50);
        const b = r.int(6, 19);
        const [p, q] = two(r);
        return {
            text: `${p}さんは おりがみを ${a}まい もっています。${q}さんに ${b}まい あげました。${p}さんの おりがみは なんまいに なりましたか。`,
            answer: a - b, unit: 'まい', wrong: [a + b, a - b + 10, a - b - 10],
        };
    },
    (r) => {
        const a = r.int(7, 16);
        const b = r.int(2, a - 3);
        return {
            text: `ふうせんが ${a}こ あります。${b}こ われて しまいました。われていない ふうせんは なんこですか。`,
            answer: a - b, unit: 'こ', wrong: [a + b, b],
        };
    },
]);

const kyusa = defineTopic('low-kyusa', 'ちがいはいくつ', [
    (r) => {
        const b = r.int(3, 9);
        const a = b + r.int(2, 7);
        const I = r.pick(items(L));
        const [p, q] = two(r);
        return {
            text: `${p}さんは ${I.name}を ${a}${I.unit}、${q}さんは ${b}${I.unit} もっています。${p}さんの ほうが ${I.q} おおいですか。`,
            answer: a - b, unit: I.unit, wrong: [a + b, a - b + 1],
        };
    },
    (r) => {
        const [A1, A2] = r.pickN(animals(L), 2);
        const a = r.int(4, 14);
        let b = r.int(4, 14);
        if (a === b) b += 2;
        const d = Math.abs(a - b);
        const [more, less] = a > b ? [A1.name, A2.name] : [A2.name, A1.name];
        return {
            text: `${A1.name}が ${a}ひき、${A2.name}が ${b}ひき います。どちらが なんびき おおいですか。`,
            answer: `${more}が ${d}ひき`,
            wrong: [`${less}が ${d}ひき`, `${more}が ${d + 1}ひき`, `${less}が ${d + 1}ひき`],
        };
    },
    (r) => {
        const b = r.int(5, 12);
        const a = b + r.int(2, 6);
        return {
            text: `いすが ${a}こ あります。こどもが ${b}人 います。ひとりずつ すわると、いすは なんこ あまりますか。`,
            answer: a - b, unit: 'こ', wrong: [a + b, a - b + 2],
        };
    },
    (r) => {
        const a = r.int(20, 60);
        let b = r.int(20, 60);
        if (Math.abs(a - b) < 3) b = a + 7;
        const [p, q] = two(r);
        return {
            text: `${p}さんは なわとびで ${a}かい、${q}さんは ${b}かい とびました。ふたりの とんだ かずの ちがいは なんかいですか。`,
            answer: Math.abs(a - b), unit: 'かい', wrong: [a + b, Math.abs(a - b) + 10],
        };
    },
]);

const kyuho = defineTopic('low-kyuho', 'ぜんぶとぶぶん', [
    (r) => {
        const t = r.int(9, 18);
        const a = r.int(3, t - 3);
        return {
            text: `こどもが ${t}人 います。そのうち おとこのこは ${a}人です。おんなのこは なん人ですか。`,
            answer: t - a, unit: '人', wrong: [t + a, t - a + 1],
        };
    },
    (r) => {
        const t = r.int(10, 20);
        const a = r.int(3, t - 3);
        const [c1, c2] = r.pickN(colors, 2);
        return {
            text: `${c1}と ${c2}の はなが あわせて ${t}本 さいています。${c1}の はなは ${a}本です。${c2}の はなは なん本ですか。`,
            answer: t - a, unit: '本', wrong: [t + a, a],
        };
    },
    (r) => {
        const t = r.int(20, 40);
        const a = r.int(8, t - 6);
        const I = r.pick(things(L));
        return {
            text: `${I.name}が ${t}${I.unit} あります。そのうち ${a}${I.unit}は はこに はいっています。はこに はいっていない ${I.name}は ${I.q}ですか。`,
            answer: t - a, unit: I.unit, wrong: [t + a, t - a + 10, t - a - 1],
        };
    },
]);

const junjo = defineTopic('low-junjo', 'なんばんめ', [
    (r) => {
        const [a, b] = [r.int(3, 9), r.int(2, 8)];
        const [p] = two(r);
        return {
            text: `こどもが 1れつに ならんでいます。${p}さんは まえから ${a}ばんめです。${p}さんの うしろに ${b}人 います。みんなで なん人 ならんでいますか。`,
            answer: a + b, unit: '人', wrong: [a + b + 1, a + b - 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(2, 8), r.int(2, 8)];
        const [p] = two(r);
        return {
            text: `こどもが 1れつに ならんでいます。${p}さんの まえに ${a}人、うしろに ${b}人 います。みんなで なん人 ならんでいますか。`,
            answer: a + b + 1, unit: '人', wrong: [a + b, a + b + 2],
        };
    },
    (r) => {
        const t = r.int(8, 16);
        const a = r.int(2, t - 2);
        const [p] = two(r);
        return {
            text: `${t}人が 1れつに ならんでいます。${p}さんは まえから ${a}ばんめです。${p}さんは うしろから なんばんめですか。`,
            answer: t - a + 1, unit: 'ばんめ', wrong: [t - a, t - a + 2],
        };
    },
    (r) => {
        const a = r.int(2, 6);
        const b = a + r.int(3, 7);
        const [p, q] = two(r);
        return {
            text: `${p}さんは まえから ${a}ばんめ、${q}さんは まえから ${b}ばんめに ならんでいます。ふたりの あいだには なん人 いますか。`,
            answer: b - a - 1, unit: '人', wrong: [b - a, b - a + 1],
        };
    },
]);

const yori = defineTopic('low-yori', 'おおい・すくない', [
    (r) => {
        const [a, d] = [r.int(5, 14), r.int(2, 7)];
        const I = r.pick(items(L));
        const [p, q] = two(r);
        return {
            text: `${p}さんは ${I.name}を ${a}${I.unit} もっています。${q}さんは ${p}さんより ${d}${I.unit} おおく もっています。${q}さんは ${I.q} もっていますか。`,
            answer: a + d, unit: I.unit, wrong: [a - d, a + d + 1],
        };
    },
    (r) => {
        const d = r.int(2, 7);
        const a = d + r.int(4, 12);
        const [p, q] = two(r);
        return {
            text: `${p}さんは さかなを ${a}ひき つりました。${q}さんは ${p}さんより ${d}ひき すくなかったそうです。${q}さんは なんびき つりましたか。`,
            answer: a - d, unit: 'ひき', wrong: [a + d, a - d - 1],
        };
    },
    (r) => {
        const d = r.int(2, 7);
        const a = d + r.int(4, 12);
        const I = r.pick(things(L));
        const [p, q] = two(r);
        return {
            text: `${p}さんは ${I.name}を ${a}${I.unit} もっています。これは ${q}さんより ${d}${I.unit} おおい かずです。${q}さんは ${I.q} もっていますか。`,
            answer: a - d, unit: I.unit, wrong: [a + d, a - d + 1],
        };
    },
    (r) => {
        const [a, d] = [r.int(6, 15), r.int(2, 8)];
        const [p, q] = two(r);
        return {
            text: `${p}さんは どんぐりを ${a}こ ひろいました。これは ${q}さんより ${d}こ すくない かずです。${q}さんは なんこ ひろいましたか。`,
            answer: a + d, unit: 'こ', wrong: [a - d, a + d - 1],
        };
    },
]);

const gyaku = defineTopic('low-gyaku', 'はじめはいくつ', [
    (r) => {
        const [x, b] = [r.int(4, 12), r.int(3, 9)];
        const I = r.pick(things(L));
        return {
            text: `${I.name}が いくつか あります。${b}${I.unit} もらったので、ぜんぶで ${x + b}${I.unit}に なりました。はじめに ${I.q} ありましたか。`,
            answer: x, unit: I.unit, wrong: [x + b + b, x + 1],
        };
    },
    (r) => {
        const [b, c] = [r.int(3, 9), r.int(3, 12)];
        const I = r.pick(things(L));
        return {
            text: `${I.name}が いくつか ありました。${b}${I.unit} つかったので、のこりが ${c}${I.unit}に なりました。はじめに ${I.q} ありましたか。`,
            answer: b + c, unit: I.unit, wrong: [Math.abs(c - b), b + c + 1],
        };
    },
    (r) => {
        const [a, x] = [r.int(8, 20), r.int(3, 12)];
        return {
            text: `バスに ${a}人 のっていました。バスていで なん人か のって きたので、${a + x}人に なりました。のって きたのは なん人ですか。`,
            answer: x, unit: '人', wrong: [a + x + a, x + 2],
        };
    },
    (r) => {
        const a = r.int(9, 18);
        const x = r.int(3, a - 3);
        const I = r.pick(foods(L));
        return {
            text: `${I.name}が ${a}${I.unit} ありました。いくつか たべたので、のこりが ${a - x}${I.unit}に なりました。たべたのは ${I.q}ですか。`,
            answer: x, unit: I.unit, wrong: [a + a - x, x + 1],
        };
    },
    (r) => {
        const t = r.int(40, 95);
        const a = r.int(12, t - 8);
        const [p] = two(r);
        return {
            text: `${p}さんは ${t}ページの 本を よんでいます。いま ${a}ページまで よみました。あと なんページ のこっていますか。`,
            answer: t - a, unit: 'ページ', wrong: [t + a, t - a + 10, t - a - 10],
        };
    },
]);

const mittsu = defineTopic('low-mittsu', '3つのかずのけいさん', [
    (r) => {
        const a = r.int(10, 20);
        const b = r.int(2, 8);
        const c = r.int(2, 9);
        return {
            text: `バスに ${a}人 のっています。はじめの バスていで ${b}人 おりて、つぎの バスていで ${c}人 のりました。いま バスに なん人 のっていますか。`,
            answer: a - b + c, unit: '人', wrong: [a - b - c, a + b + c, a + b - c],
        };
    },
    (r) => {
        const b = r.int(2, 6);
        const c = r.int(2, 6);
        const a = b + c + r.int(2, 8);
        const I = r.pick(foods(L));
        return {
            text: `${I.name}が ${a}${I.unit} あります。あさに ${b}${I.unit}、ひるに ${c}${I.unit} たべました。のこりは ${I.q}ですか。`,
            answer: a - b - c, unit: I.unit, wrong: [a - b + c, a - b],
        };
    },
    (r) => {
        const [a, b, c] = [r.int(3, 9), r.int(3, 9), r.int(3, 9)];
        const [c1, c2, c3] = r.pickN(colors, 3);
        return {
            text: `${c1}の はなが ${a}本、${c2}の はなが ${b}本、${c3}の はなが ${c}本 さいています。はなは ぜんぶで なん本 さいていますか。`,
            answer: a + b + c, unit: '本', wrong: [a + b, b + c],
        };
    },
    (r) => {
        const a = r.int(10, 25);
        const b = r.int(3, 9);
        const c = r.int(2, 9);
        const [p] = two(r);
        return {
            text: `${p}さんは シールを ${a}まい もっていました。${b}まい もらって、そのあと ${c}まい ともだちに あげました。いま なんまい もっていますか。`,
            answer: a + b - c, unit: 'まい', wrong: [a - b + c, a + b + c, a - b - c],
        };
    },
]);

export default [
    ...gappei, ...zouka, ...kyuzan, ...kyusa, ...kyuho,
    ...junjo, ...yori, ...gyaku, ...mittsu,
];
