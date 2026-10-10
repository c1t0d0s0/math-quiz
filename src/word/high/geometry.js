import { defineTopic } from '../helpers.js';

// 円周率 3.14 のかけ算を誤差なく行う
const pi = v => (v * 314) / 100;
const PI_NOTE = '（円周率は3.14とします）';

const taiseki = defineTopic('high-taiseki', '体積と容積', [
    (r) => {
        const [a, b, c] = [r.int(3, 12), r.int(3, 12), r.int(3, 12)];
        return {
            text: `たて${a}cm、横${b}cm、高さ${c}cmの直方体の箱があります。この箱の体積は何cm³ですか。`,
            answer: a * b * c, unit: 'cm³', wrong: [a + b + c, a * b + c, 2 * (a * b + b * c + c * a)],
        };
    },
    (r) => {
        const [a, b, c] = [r.pick([20, 30, 40, 50]), r.pick([20, 30, 40, 60]), r.pick([10, 15, 20, 25, 30])];
        const v = (a * b * c) / 1000;
        return {
            text: `内のりが、たて${a}cm、横${b}cm、深さ${c}cmの水そうがあります。この水そうには水が何L入りますか。`,
            answer: v, unit: 'L', wrong: [v * 10, v / 10, v * 100],
        };
    },
    (r) => {
        const [a, b, h] = [r.int(2, 6) * 5, r.int(2, 6) * 5, r.int(4, 15)];
        return {
            text: `内のりが、たて${a}cm、横${b}cmの直方体の水そうに、水を${a * b * h}cm³入れました。水の深さは何cmになりますか。`,
            answer: h, unit: 'cm', wrong: [h + 1, h - 1, h * 2],
        };
    },
    (r) => {
        const [a, b, h] = [r.int(2, 5) * 10, r.int(2, 5) * 10, r.int(2, 6)];
        return {
            text: `内のりが、たて${a}cm、横${b}cmの水そうに石をしずめたら、水面が${h}cm上がりました。石の体積は何cm³ですか。`,
            answer: a * b * h, unit: 'cm³', wrong: [a * b, (a + b) * h, a * b * (h + 1)],
        };
    },
]);

const en = defineTopic('high-en', '円', [
    (r) => {
        const d = r.int(2, 20);
        const what = r.pick(['池', '花だん', '土俵', 'テーブル']);
        return {
            text: `直径${d}mの円形の${what}があります。まわりの長さは何mですか。${PI_NOTE}`,
            answer: pi(d), unit: 'm', wrong: [pi(d) / 2, pi(d * 2), pi(d + 1)],
        };
    },
    (r) => {
        const d = r.int(2, 15);
        return {
            text: `まわりの長さが${pi(d)}mの円形の花だんがあります。この花だんの直径は何mですか。${PI_NOTE}`,
            answer: d, unit: 'm', wrong: [d * 2, d + 1, d - 1, d + 2],
        };
    },
    (r) => {
        const rad = r.int(2, 10);
        return {
            text: `半径${rad}cmの円の形をしたコースターがあります。面積は何cm²ですか。${PI_NOTE}`,
            answer: pi(rad * rad), unit: 'cm²', wrong: [pi(rad * 2), pi(rad * rad * 4), pi(rad * rad * 2)],
        };
    },
    (r) => {
        const [d, n] = [r.pick([10, 20, 30, 50, 60]), r.pick([5, 10, 20, 100])];
        return {
            text: `直径${d}cmの車輪が${n}回転すると、何cm進みますか。${PI_NOTE}`,
            answer: pi(d * n), unit: 'cm', wrong: [d * n, pi(d * n) / 2, pi(d * n) / 10],
        };
    },
]);

const menseki = defineTopic('high-menseki', '図形の面積', [
    (r) => {
        let [a, h] = [r.int(4, 16), r.int(3, 12)];
        if ((a * h) % 2 !== 0) a += 1;
        return {
            text: `底辺が${a}cm、高さが${h}cmの三角形があります。面積は何cm²ですか。`,
            answer: (a * h) / 2, unit: 'cm²', wrong: [a * h, a + h, (a * h) / 2 + a],
        };
    },
    (r) => {
        const [a, h] = [r.int(5, 18), r.int(4, 12)];
        return {
            text: `底辺が${a}m、高さが${h}mの平行四辺形の形をした花だんがあります。面積は何m²ですか。`,
            answer: a * h, unit: 'm²', wrong: [(a * h) / 2, 2 * (a + h), a * h + a],
        };
    },
    (r) => {
        const a = r.int(3, 9);
        const b = r.int(a + 2, 14);
        let h = r.int(2, 10);
        if (((a + b) * h) % 2 !== 0) h += 1;
        return {
            text: `上底が${a}cm、下底が${b}cm、高さが${h}cmの台形があります。面積は何cm²ですか。`,
            answer: ((a + b) * h) / 2, unit: 'cm²', wrong: [(a + b) * h, (a * b * h) / 2, a * h + b],
        };
    },
    (r) => {
        let [a, h] = [r.int(4, 14), r.int(3, 12)];
        if ((a * h) % 2 !== 0) h += 1;
        return {
            text: `面積が${(a * h) / 2}cm²で、底辺が${a}cmの三角形があります。この三角形の高さは何cmですか。`,
            answer: h, unit: 'cm', wrong: [h / 2, h + 1, h - 1, h * 2],
        };
    },
]);

export default [...taiseki, ...en, ...menseki];
