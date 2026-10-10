import { defineTopic, clock, clockWrongs } from '../helpers.js';
import { names, colors, lowGoods } from '../vocab.js';

const one = r => r.pick(names);

const jikoku = defineTopic('low-jikoku', 'じこくとじかん', [
    (r) => {
        const h = r.int(1, 11);
        const m = r.pick([0, 10, 15, 20, 30]);
        const d = r.pick([10, 15, 20, 25]);
        const t = h * 60 + m + d;
        return {
            text: `いま ${clock(h * 60 + m)}です。${d}分あとは なん時なん分ですか。`,
            answer: clock(t), wrong: clockWrongs(t),
        };
    },
    (r) => {
        const h = r.int(1, 11);
        const m = r.pick([20, 30, 40, 45, 50]);
        const d = r.pick([10, 15, 20]);
        const t = h * 60 + m - d;
        return {
            text: `いま ${clock(h * 60 + m)}です。${d}分まえは なん時なん分でしたか。`,
            answer: clock(t), wrong: [clock(t + 2 * d), ...clockWrongs(t)],
        };
    },
    (r) => {
        const h = r.int(1, 11);
        const m1 = r.pick([0, 5, 10, 15, 20]);
        const d = r.pick([10, 15, 20, 25, 30, 35]);
        const to = r.pick(['こうえん', 'がっこう', 'えき', 'としょかん']);
        return {
            text: `${one(r)}さんは ${clock(h * 60 + m1)}に いえを でて、${clock(h * 60 + m1 + d)}に ${to}に つきました。かかった じかんは なん分ですか。`,
            answer: d, unit: '分', step: 5, wrong: [m1 + m1 + d],
        };
    },
    (r) => {
        const h1 = r.int(1, 5);
        const d = r.int(2, 4);
        const where = r.pick(['としょかん', 'こうえん', 'プール', 'ともだちの いえ']);
        return {
            text: `${one(r)}さんは ${h1}時から ${h1 + d}時まで ${where}に いました。${where}に いたのは なんじかんですか。`,
            answer: d, unit: 'じかん', wrong: [h1 + h1 + d, d + 1, d - 1],
        };
    },
    (r) => {
        const m = r.pick([5, 10, 15, 20, 25, 30, 40, 45]);
        const what = r.pick(['サッカーの れんしゅう', 'ピアノの れんしゅう', 'え', 'おてつだい']);
        const verb = what === 'え' ? 'を かきました' : 'を しました';
        return {
            text: `${one(r)}さんは 1じかん${m}分 ${what}${verb}。これは ぜんぶで なん分ですか。`,
            answer: 60 + m, unit: '分', wrong: [100 + m, 10 + m, 60 + m + 10],
        };
    },
]);

const nagasa = defineTopic('low-nagasa', 'ながさ', [
    (r) => {
        const [a, b] = [r.int(12, 45), r.int(8, 38)];
        const [c1, c2] = r.pickN(colors, 2);
        return {
            text: `${c1}の テープは ${a}cm、${c2}の テープは ${b}cmです。2本の テープを あわせた ながさは なんcmですか。`,
            answer: a + b, unit: 'cm', wrong: [Math.abs(a - b), a + b + 10, a + b - 10],
        };
    },
    (r) => {
        const a = r.int(30, 90);
        const b = r.int(8, a - 10);
        return {
            text: `${a}cmの リボンから ${b}cm きりとって つかいました。のこりの リボンは なんcmですか。`,
            answer: a - b, unit: 'cm', wrong: [a + b, a - b + 10, a - b - 10],
        };
    },
    (r) => {
        const [c, m] = [r.int(5, 18), r.int(1, 9)];
        const what = r.pick(['えんぴつ', 'クレヨン', 'のり', 'けしゴム']);
        return {
            text: `${what}の ながさを はかると ${c}cm ${m}mmでした。これは なんmmですか。`,
            answer: c * 10 + m, unit: 'mm', wrong: [c + m, c * 100 + m, c * 10 + m + 10],
        };
    },
    (r) => {
        const c = r.int(5, 45);
        return {
            text: `${one(r)}さんの しんちょうは 1m ${c}cmです。これは なんcmですか。`,
            answer: 100 + c, unit: 'cm', wrong: [10 + c, 1000 + c, 100 + c + 10],
        };
    },
    (r) => {
        const [c1, c2] = r.pickN(colors, 2);
        const a = r.int(20, 80);
        let b = r.int(20, 80);
        if (Math.abs(a - b) < 2) b = a + 6;
        const d = Math.abs(a - b);
        const [long, short] = a > b ? [c1, c2] : [c2, c1];
        return {
            text: `${c1}の ひもは ${a}cm、${c2}の ひもは ${b}cmです。どちらの ひもが なんcm ながいですか。`,
            answer: `${long}が ${d}cm`,
            wrong: [`${short}が ${d}cm`, `${long}が ${a + b}cm`, `${short}が ${d + 10}cm`],
        };
    },
]);

const kasa = defineTopic('low-kasa', 'かさ', [
    (r) => {
        const b = r.int(1, 5);
        const a = b + r.int(1, 5);
        return {
            text: `みずが おおきい バケツに ${a}L、ちいさい バケツに ${b}L はいっています。あわせて なんLですか。`,
            answer: a + b, unit: 'L', wrong: [Math.abs(a - b), a + b + 1],
        };
    },
    (r) => {
        const a = r.int(6, 18);
        const b = r.int(2, a - 2);
        const what = r.pick(['ジュース', 'ぎゅうにゅう', 'おちゃ']);
        return {
            text: `${what}が ${a}dL あります。${b}dL のみました。のこりは なんdLですか。`,
            answer: a - b, unit: 'dL', wrong: [a + b, a - b + 1],
        };
    },
    (r) => {
        const [a, b] = [r.int(1, 5), r.int(1, 9)];
        const what = r.pick(['やかん', 'なべ', 'すいとう', 'ペットボトル']);
        return {
            text: `${what}に みずが ${a}L ${b}dL はいっています。これは なんdLですか。`,
            answer: a * 10 + b, unit: 'dL', wrong: [a + b, a * 100 + b, a * 10 + b + 10],
        };
    },
    (r) => {
        const b = r.int(2, 8);
        const what = r.pick(['ぎゅうにゅう', 'ジュース', 'おちゃ']);
        return {
            text: `1Lの ${what}が あります。${b}dL のむと、のこりは なんdLですか。`,
            answer: 10 - b, unit: 'dL', wrong: [10 + b, b, 100 - b],
        };
    },
]);

const okane = defineTopic('low-okane', 'おかね', [
    (r) => {
        const [x, y] = r.pickN(lowGoods, 2);
        const [a, b] = [r.int(3, 9) * 10, r.int(2, 8) * 10];
        return {
            text: `${a}円の ${x}と ${b}円の ${y}を かいました。あわせて なん円ですか。`,
            answer: a + b, unit: '円', step: 10, wrong: [Math.abs(a - b)],
        };
    },
    (r) => {
        const x = r.pick(lowGoods);
        const a = r.int(2, 18) * 5;
        return {
            text: `${a}円の ${x}を かって、100円だまで はらいました。おつりは なん円ですか。`,
            answer: 100 - a, unit: '円', step: 5, wrong: [100 + a, 100 - a + 10],
        };
    },
    (r) => {
        const x = r.pick(lowGoods);
        const a = r.int(3, 8) * 10;
        const t = a + r.int(1, 6) * 10;
        return {
            text: `${one(r)}さんは ${a}円 もっています。${t}円の ${x}を かうには、あと なん円 たりませんか。`,
            answer: t - a, unit: '円', step: 10, wrong: [t + a],
        };
    },
    (r) => {
        const [a, b, c] = [r.int(2, 8), r.int(1, 3), r.int(1, 4)];
        return {
            text: `10円だまが ${a}まい、5円だまが ${b}まい、1円だまが ${c}まい あります。ぜんぶで なん円ですか。`,
            answer: a * 10 + b * 5 + c, unit: '円', wrong: [a + b + c, a * 10 + b + c, a * 10 + b * 5 + c + 5],
        };
    },
    (r) => {
        const [x, y] = r.pickN(lowGoods, 2);
        const [a, b] = [r.int(12, 38) * 10, r.int(12, 38) * 10];
        const pay = a + b < 500 ? r.pick([500, 1000]) : 1000;
        return {
            text: `${a}円の ${x}と ${b}円の ${y}を かって、${pay}円 はらいました。おつりは なん円ですか。`,
            answer: pay - a - b, unit: '円', step: 10, wrong: [pay - a, a + b, pay - a - b + 100],
        };
    },
]);

export default [...jikoku, ...nagasa, ...kasa, ...okane];
