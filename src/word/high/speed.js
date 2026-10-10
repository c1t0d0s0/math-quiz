import { defineTopic } from '../helpers.js';
import { gcd, lcm } from '../../generators/rng.js';
import { names, places, vehicles } from '../vocab.js';

const one = r => r.pick(names);

const hayasa = defineTopic('high-hayasa', '速さ', [
    (r) => {
        const [v, t] = [r.int(6, 16) * 5, r.int(2, 5)];
        return {
            text: `${v * t}kmの道のりを${t}時間で走る${r.pick(vehicles)}があります。速さは時速何kmですか。`,
            answer: v, prefix: '時速', unit: 'km', wrong: [v * t * t, v + 10, v - 5],
        };
    },
    (r) => {
        const [v, t] = [r.int(10, 18) * 5, r.int(8, 25)];
        return {
            text: `${one(r)}さんは分速${v}mで${t}分間歩きました。歩いた道のりは何mですか。`,
            answer: v * t, unit: 'm', wrong: [v + t, v * t + v, v * (t - 2)],
        };
    },
    (r) => {
        const [v, t] = [r.int(12, 18) * 5, r.int(6, 24)];
        return {
            text: `家から${r.pick(places)}までの道のりは${v * t}mです。分速${v}mで歩くと、何分かかりますか。`,
            answer: t, unit: '分', wrong: [t + 5, t - 2, v],
        };
    },
    (r) => {
        const v = r.pick([3, 6, 9, 12, 18, 24, 30, 36, 42, 48, 54, 60, 72, 90]);
        const who = v <= 6 ? '歩く人' : v <= 24 ? '走る自転車' : '走る自動車';
        const ans = (v * 1000) / 60;
        return {
            text: `時速${v}kmで${who}は、1分間に何m進みますか。`,
            answer: ans, unit: 'm', wrong: [v * 60, v * 10, ans * 2],
        };
    },
    (r) => {
        const [a, b, t] = [r.int(12, 16) * 5, r.int(10, 15) * 5, r.int(4, 15)];
        const [p, q] = r.pickN(names, 2);
        return {
            text: `${(a + b) * t}mはなれた2つの地点から、${p}さんは分速${a}m、${q}さんは分速${b}mで、向かい合って同時に出発しました。2人が出会うのは何分後ですか。`,
            answer: t, unit: '分後', wrong: [t * 2, t + 5, t - 2],
        };
    },
    (r) => {
        const [b, a] = r.pick([[60, 80], [60, 90], [60, 100], [50, 75], [80, 100], [70, 105], [60, 75]]);
        const diff = a - b;
        const m = (diff / gcd(b, diff)) * r.int(2, 5);
        return {
            text: `弟が分速${b}mで家を出てから${m}分後に、兄が同じ道を分速${a}mで追いかけました。兄は出発してから何分後に弟に追いつきますか。`,
            answer: (b * m) / diff, unit: '分後', wrong: [m, (b * m) / diff + m, (b * m) / diff - 1],
        };
    },
    (r) => {
        const [a, b] = r.pick([[12, 6], [15, 10], [20, 12], [6, 4], [30, 20], [12, 4], [6, 3]]);
        const d = lcm(a, b) * r.int(1, Math.max(1, Math.floor(60 / lcm(a, b))));
        return {
            text: `${d}kmはなれた町まで、行きは時速${a}km、帰りは時速${b}kmで往復しました。往復にかかった時間は全部で何時間ですか。`,
            answer: d / a + d / b, unit: '時間', wrong: [d / a, d / b, (2 * d) / (a + b)],
        };
    },
    (r) => {
        const v = r.pick([48, 60, 72, 90, 120]);
        let m;
        do {
            m = r.pick([10, 15, 20, 25, 30, 40, 45, 50]);
        } while ((v * m) % 60 !== 0);
        return {
            text: `時速${v}kmで走る電車は、${m}分間に何km進みますか。`,
            answer: (v * m) / 60, unit: 'km', wrong: [v * m, (v * m) / 100, v / m],
        };
    },
]);

const tokushu = defineTopic('high-tsurukame', 'つるかめ算・仕事算', [
    (r) => {
        const n = r.int(6, 15);
        const kame = r.int(1, n - 1);
        return {
            text: `つる（足は2本）とかめ（足は4本）が合わせて${n}匹います。足の数は全部で${2 * n + 2 * kame}本です。かめは何匹いますか。`,
            answer: kame, unit: '匹', wrong: [n - kame, kame + 1, kame + 2, n],
        };
    },
    (r) => {
        const [a, b] = [r.int(10, 18) * 10, r.int(4, 9) * 10];
        const n = r.int(8, 15);
        const x = r.int(2, n - 2);
        const [f1, f2] = r.pickN(['りんご', 'みかん', 'かき', 'なし', 'もも'], 2);
        return {
            text: `1個${a}円の${f1}と1個${b}円の${f2}を合わせて${n}個買ったら、代金は${a * x + b * (n - x)}円でした。${f1}は何個買いましたか。`,
            answer: x, unit: '個', wrong: [n - x, x + 1, x - 1, n],
        };
    },
    (r) => {
        const [a, b] = r.pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [10, 40], [6, 30], [15, 30]]);
        const [p, q] = r.pickN(names, 2);
        return {
            text: `ある仕事をするのに、${p}さん1人では${a}日、${q}さん1人では${b}日かかります。2人でいっしょにすると、何日で終わりますか。`,
            answer: (a * b) / (a + b), unit: '日', wrong: [(a + b) / 2, b - a, a + b, a - 1],
        };
    },
]);

const shukushaku = defineTopic('high-shukushaku', '縮尺', [
    (r) => {
        const [s, c] = [r.pick([1000, 2000, 5000, 10000, 25000, 50000]), r.int(2, 9)];
        return {
            text: `縮尺1:${s}の地図で${c}cmの長さは、実際には何mですか。`,
            answer: (c * s) / 100, unit: 'm', wrong: [c * s, (c * s) / 10, (c * s) / 1000],
        };
    },
    (r) => {
        const [s, c] = [r.pick([1000, 2000, 5000, 10000, 25000, 50000]), r.int(2, 9)];
        return {
            text: `実際の長さが${(c * s) / 100}mの道は、縮尺1:${s}の地図では何cmになりますか。`,
            answer: c, unit: 'cm', wrong: [c * 10, c + 1, c - 1, c * 100],
        };
    },
]);

export default [...hayasa, ...tokushu, ...shukushaku];
