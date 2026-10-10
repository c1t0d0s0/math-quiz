import { defineTopic, clock, clockWrongs, hourMin, compound } from '../helpers.js';
import { names, places } from '../vocab.js';

const one = r => r.pick(names);
const kmM = t => compound(t, 1000, 'km', 'm');
const kgG = t => compound(t, 1000, 'kg', 'g');

const jikan = defineTopic('mid-jikan', '時こくと時間', [
    (r) => {
        const [m, s] = [r.int(1, 5), r.int(5, 55)];
        const what = r.pick(['校庭を1しゅう走りました', 'プールを1往復泳ぎました', '九九を全部言いました']);
        return {
            text: `${one(r)}さんは${m}分${s}秒で${what}。これは何秒ですか。`,
            answer: m * 60 + s, unit: '秒', wrong: [m * 100 + s, m + s, m * 60 + s + 10],
        };
    },
    (r) => {
        const h = r.int(8, 10);
        const m1 = r.int(7, 11) * 5;
        const d = r.int(Math.max(5, (60 - m1) / 5 + 1), 11) * 5;
        const t1 = h * 60 + m1;
        const place = r.pick(places);
        return {
            text: `${clock(t1, '午前')}に家を出て、${clock(t1 + d, '午前')}に${place}に着きました。かかった時間は何分ですか。`,
            answer: d, unit: '分', step: 5, wrong: [d + 40, d + 10],
        };
    },
    (r) => {
        const [a, b] = [r.int(7, 11) * 5, r.int(6, 10) * 5];
        const t = a + b;
        const wrong = [hourMin(t + 10), hourMin(t + 60), hourMin(t + 30), hourMin(t + 20)];
        if (t >= 100) {
            wrong.unshift(`${Math.floor(t / 100)}時間${t % 100}分`);
        }
        const [s1, s2] = r.pickN(['算数', '国語', '理科', '社会', '音読', '漢字'], 2);
        return {
            text: `${one(r)}さんは${s1}を${a}分、${s2}を${b}分勉強しました。合わせて何時間何分勉強しましたか。`,
            answer: hourMin(t), wrong,
        };
    },
    (r) => {
        const h = r.int(1, 8);
        const m = r.int(6, 11) * 5;
        const d = r.int((60 - m) / 5 + 1, 10) * 5;
        const t = h * 60 + m + d;
        const what = r.pick(['テレビを見ました', '本を読みました', 'ピアノの練習をしました', '宿題をしました']);
        return {
            text: `${clock(h * 60 + m, '午後')}から${d}分間、${what}。終わった時こくは午後何時何分ですか。`,
            answer: clock(t, '午後'), wrong: [clock(t - 40, '午後'), ...clockWrongs(t, '午後')],
        };
    },
]);

const omosa = defineTopic('mid-nagasa-omosa', '長さと重さ', [
    (r) => {
        const [a, b] = [r.int(55, 95) * 10, r.int(50, 95) * 10];
        const t = a + b;
        const [p1, p2] = r.pickN(places, 2);
        return {
            text: `家から${p1}までは${a}m、${p1}から${p2}までは${b}mです。家から${p1}を通って${p2}まで行くと、道のりは何km何mですか。`,
            answer: kmM(t), wrong: [kmM(t + 100), kmM(t + 1000), kmM(t - 100 > 1000 ? t - 100 : t + 200), `${Math.floor(t / 100)}km${t % 100}m`],
        };
    },
    (r) => {
        const [k, m] = [r.int(1, 4), r.int(1, 19) * 50];
        return {
            text: `${one(r)}さんの家から${r.pick(places)}までの道のりは${k}km${m}mです。これは何mですか。`,
            answer: k * 1000 + m, unit: 'm', wrong: [k * 100 + m, k * 10000 + m, k + m],
        };
    },
    (r) => {
        const [a, b] = [r.int(15, 45) * 10, r.int(60, 180) * 10];
        const fruit = r.pick(['みかん', 'りんご', 'くり', 'じゃがいも']);
        return {
            text: `${fruit}をかごに入れて重さをはかると、${a + b}gでした。かごだけの重さは${a}gです。${fruit}だけの重さは何gですか。`,
            answer: b, unit: 'g', wrong: [a + b + a, b + 100, b - 100],
        };
    },
    (r) => {
        const g = r.pick([150, 250, 350, 450]);
        const n = r.int(Math.ceil(1001 / g), 9);
        const t = g * n;
        const what = r.pick(['かんづめ', 'ねん土', 'さとうのふくろ']);
        return {
            text: `1こ${g}gの${what}が${n}こあります。全部の重さは何kg何gですか。`,
            answer: kgG(t), wrong: [kgG(t + g), kgG(t + 1000), kgG(t + 100), kgG(t - 100)],
        };
    },
    (r) => {
        const [w, ns] = r.pick([[500, [4, 6, 8, 10, 12]], [250, [8, 12, 16]], [200, [5, 10, 15, 20]]]);
        const n = r.pick(ns);
        const t = (w * n) / 1000;
        return {
            text: `トラックに、1こ${w}kgの荷物を${n}こ積みます。荷物の重さは全部で何tですか。`,
            answer: t, unit: 't', wrong: [t * 10, n, t + 1],
        };
    },
    (r) => {
        const a = r.int(85, 190) * 10;
        const b = a - r.int(12, 60) * 10;
        return {
            text: `家から学校までの道のりは${a}mで、まっすぐにはかったきょりは${b}mです。道のりはきょりより何m長いですか。`,
            answer: a - b, unit: 'm', step: 10, wrong: [a + b, a - b + 100],
        };
    },
]);

const menseki = defineTopic('mid-menseki', '面積', [
    (r) => {
        const a = r.int(4, 15);
        let b = r.int(5, 20);
        if (a === b) b += 3;
        const what = r.pick(['花だん', '畑', 'すな場', '教室']);
        return {
            text: `たて${a}m、横${b}mの長方形の${what}があります。面積は何m²ですか。`,
            answer: a * b, unit: 'm²', wrong: [2 * (a + b), a + b, a * b + a],
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 12), r.int(5, 15)];
        return {
            text: `面積が${a * b}cm²の長方形があります。たての長さが${a}cmのとき、横の長さは何cmですか。`,
            answer: b, unit: 'cm', wrong: [a * b - a, b + 1, b - 1],
        };
    },
    (r) => {
        const a = r.int(3, 12);
        return {
            text: `まわりの長さが${4 * a}cmの正方形があります。この正方形の面積は何cm²ですか。`,
            answer: a * a, unit: 'cm²', wrong: [4 * a, 2 * a * a, a * a + a],
        };
    },
    (r) => {
        const [a, b, c] = [r.int(8, 15), r.int(10, 20), r.int(2, 6)];
        return {
            text: `たて${a}m、横${b}mの長方形の土地があります。その中に1辺${c}mの正方形の池があります。池をのぞいた土地の面積は何m²ですか。`,
            answer: a * b - c * c, unit: 'm²', wrong: [a * b, a * b - 4 * c, a * b - c],
        };
    },
    (r) => {
        const [a, b] = [r.int(2, 9) * 10, r.int(2, 9) * 10];
        return {
            text: `たて${a}m、横${b}mの長方形の畑があります。この畑の面積は何a（アール）ですか。`,
            answer: (a * b) / 100, unit: 'a', wrong: [(a * b) / 10, a * b, (a + b) / 10],
        };
    },
]);

const kakudo = defineTopic('mid-kakudo', '角の大きさ', [
    (r) => {
        const a = r.int(5, 31) * 5;
        return {
            text: `一直線（180°）を2つの角に分けました。一方の角が${a}°のとき、もう一方の角は何°ですか。`,
            answer: 180 - a, unit: '°', step: 5, wrong: [360 - a, Math.abs(90 - a)],
        };
    },
    (r) => {
        const m = r.pick([5, 10, 15, 20, 25, 30, 40, 45, 50]);
        return {
            text: `時計の長いはりは、${m}分間に何°回りますか。`,
            answer: m * 6, unit: '°', wrong: [m, m * 5, m * 3],
        };
    },
]);

export default [...jikan, ...omosa, ...menseki, ...kakudo];
