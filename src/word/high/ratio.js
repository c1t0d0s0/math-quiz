import { defineTopic } from '../helpers.js';
import { gcd } from '../../generators/rng.js';
import { names } from '../vocab.js';

const one = r => r.pick(names);

const wariai = defineTopic('high-wariai', '割合', [
    (r) => {
        const t = r.pick([40, 50, 60, 80, 120]);
        let p;
        do {
            p = r.int(3, 17) * 5;
        } while ((t * p) % 100 !== 0);
        const ride = r.pick(['バス', '電車の車両', '船', '飛行機']);
        return {
            text: `定員${t}人の${ride}に、定員の${p}%の人が乗っています。乗っているのは何人ですか。`,
            answer: (t * p) / 100, unit: '人', wrong: [t - (t * p) / 100, p, (t * p) / 10],
        };
    },
    (r) => {
        const t = r.pick([20, 25, 40, 50]);
        const a = r.int(3, t - 3);
        const what = r.pick(['めがねをかけています', '犬をかっています', '習い事をしています', '自転車で通っています']);
        return {
            text: `${t}人のクラスで、${a}人が${what}。その人数はクラス全体の何%ですか。`,
            answer: (a * 100) / t, unit: '%', wrong: [a, 100 - (a * 100) / t, t - a],
        };
    },
    (r) => {
        const pc = r.pick([20, 25, 40, 50, 60, 75]);
        const t = r.int(4, 15) * 20;
        const a = (t * pc) / 100;
        return {
            text: `${one(r)}さんは本を${a}ページ読みました。これは本全体の${pc}%にあたります。この本は全部で何ページですか。`,
            answer: t, unit: 'ページ', wrong: [(a * pc) / 100, a + pc, t + a],
        };
    },
    (r) => {
        const [t, pc] = [r.int(8, 48) * 100, r.pick([10, 20, 25, 30, 40])];
        const what = r.pick(['シャツ', 'ぼうし', 'くつ', 'かばん', 'セーター']);
        return {
            text: `定価${t}円の${what}が、${pc}%引きで売られています。代金は何円ですか。`,
            answer: (t * (100 - pc)) / 100, unit: '円', wrong: [(t * pc) / 100, t - pc, (t * (100 + pc)) / 100],
        };
    },
    (r) => {
        const [t, pc] = [r.pick([200, 250, 300, 400, 500]), r.pick([10, 20, 30, 50])];
        const what = r.pick(['ジュース', 'シャンプー', 'お茶', 'ドレッシング']);
        return {
            text: `いつもは${t}mL入りの${what}が、${pc}%増量で売られています。何mL入っていますか。`,
            answer: (t * (100 + pc)) / 100, unit: 'mL', wrong: [(t * pc) / 100, t + pc, (t * (100 - pc)) / 100],
        };
    },
    (r) => {
        const [t, w] = [r.int(5, 40) * 100, r.int(1, 4)];
        return {
            text: `${t}円で仕入れた品物に、${w}割の利益を見こんで定価をつけました。定価は何円ですか。`,
            answer: (t * (10 + w)) / 10, unit: '円', wrong: [(t * w) / 10, t + w * 10, (t * (10 - w)) / 10],
        };
    },
    (r) => {
        const t = r.pick([10, 20, 25, 50]);
        const a = r.int(3, t - 2);
        const what = r.pick(['シュート', 'フリースロー', 'サーブ', 'まと当て']);
        return {
            text: `${one(r)}さんは${what}を${t}回して、${a}回成功しました。成功した割合を小数で表すといくつですか。`,
            answer: a / t, step: 0.05, wrong: [(a * 100) / t, 1 - a / t, a / t / 10],
        };
    },
    (r) => {
        const [t, pc] = [r.int(4, 40) * 100, r.pick([10, 20, 25, 30, 40, 50])];
        const paid = (t * (100 - pc)) / 100;
        return {
            text: `ある品物を定価の${pc}%引きで買ったら、代金は${paid}円でした。定価は何円ですか。`,
            answer: t, unit: '円', step: 100, wrong: [(paid * (100 + pc)) / 100, paid + pc],
        };
    },
]);

const RATIOS = [[2, 3], [3, 4], [3, 5], [2, 5], [4, 5], [1, 2], [1, 3], [5, 3], [3, 2], [5, 2]];

const hi = defineTopic('high-hi', '比', [
    (r) => {
        const [a, b] = r.pick(RATIOS);
        const k = r.int(4, 15);
        const what = r.pick([['色紙', '枚'], ['カード', '枚'], ['あめ', '個'], ['シール', '枚']]);
        return {
            text: `${k * (a + b)}${what[1]}の${what[0]}を、姉と妹で${a}:${b}の比になるように分けます。姉は何${what[1]}もらえますか。`,
            answer: k * a, unit: what[1], wrong: [k * b, k, k * a + k],
        };
    },
    (r) => {
        const [a, b] = r.pick(RATIOS);
        const k = r.int(2, 8) * 10;
        const [x, y, z] = r.pick([['コーヒー', '牛乳', 'コーヒー牛乳'], ['す', 'サラダ油', 'ドレッシング'], ['めんつゆ', '水', 'そばつゆ']]);
        return {
            text: `${x}と${y}を${a}:${b}の比でまぜて${z}を作ります。${x}を${a * k}mL使うとき、${y}は何mLいりますか。`,
            answer: b * k, unit: 'mL', step: 10, wrong: [a * k, (a + b) * k, a * k + b * 10],
        };
    },
    (r) => {
        const [a, b] = r.pick(RATIOS);
        const k = r.int(2, 9);
        const what = r.pick(['長方形の紙', '花だん', '旗', '写真']);
        return {
            text: `たて${a * k}cm、横${b * k}cmの${what}があります。たてと横の長さの比を、もっとも簡単な整数の比で表しましょう。`,
            answer: `${a}:${b}`,
            wrong: [`${b}:${a}`, `${a * k}:${b * k}`, `${a}:${b + 1}`, `${a + 1}:${b}`],
        };
    },
    (r) => {
        const [a, b] = r.pick([[5, 3], [3, 2], [4, 3], [7, 4], [5, 2], [3, 1], [7, 5]]);
        const k = r.int(2, 9) * 100;
        return {
            text: `兄と弟の持っているお金の比は${a}:${b}で、兄は弟より${k * (a - b)}円多く持っています。兄は何円持っていますか。`,
            answer: k * a, unit: '円', step: 100, wrong: [k * b, k * (a - b) * a, k * (a + b)],
        };
    },
    (r) => {
        const [h1, f, h2] = [r.int(1, 2), r.pick([5, 8, 15, 20]), r.int(4, 12)];
        return {
            text: `高さ${h1}mのぼうのかげの長さが${(h1 * f) / 10}mのとき、かげの長さが${(h2 * f) / 10}mの木があります。この木の高さは何mですか。`,
            answer: h2, unit: 'm', wrong: [(h2 * f * f) / 100, h2 + 1, h2 - 1, h2 + 2],
        };
    },
]);

const hirei = defineTopic('high-hirei', '比例と反比例', [
    (r) => {
        const [a, u] = [r.int(2, 6), r.int(15, 45)];
        const b = r.int(a + 1, 12);
        return {
            text: `${a}mの重さが${a * u}gのはり金があります。このはり金${b}mの重さは何gですか。`,
            answer: b * u, unit: 'g', wrong: [a * u + b, (b - a) * u, a * u * b],
        };
    },
    (r) => {
        const w = r.pick([24, 36, 48, 60, 72]);
        const divisors = [2, 3, 4, 6, 8, 9, 12].filter(x => w % x === 0);
        const [a, b] = r.pickN(divisors, 2);
        const what = r.pick(['草取り', 'かべのペンキぬり', '倉庫の整理', '畑仕事']);
        return {
            text: `${a}人ですると${w / a}日かかる${what}があります。同じ仕事を${b}人ですると、何日かかりますか。`,
            answer: w / b, unit: '日', wrong: [(w / a) * b, w / a + a - b, w / a],
        };
    },
    (r) => {
        const [a, m] = [r.int(3, 12), r.int(6, 20)];
        const what = r.pick(['水そう', 'おふろ', 'タンク', '池']);
        return {
            text: `${what}に毎分${a}Lずつ水を入れます。水が${a * m}Lたまるのは、入れ始めてから何分後ですか。`,
            answer: m, unit: '分後', wrong: [a * m - a, m + a, m + 2],
        };
    },
    (r) => {
        const [a, b] = r.pick([[12, 18], [24, 16], [20, 30], [36, 24], [15, 45], [40, 16], [18, 12]]);
        const n = (b / gcd(a, b)) * r.int(1, 4);
        return {
            text: `歯数${a}の歯車Aと、歯数${b}の歯車Bがかみ合っています。Aが${n}回転するとき、Bは何回転しますか。`,
            answer: (a * n) / b, unit: '回転', wrong: [n, (b * n) / a, n + 1],
        };
    },
]);

const tanni = defineTopic('high-tanni', '単位量あたりの大きさ', [
    (r) => {
        const [s, d] = [r.int(12, 60), r.int(11, 48) * 10];
        return {
            text: `面積${s}km²の町に、${s * d}人が住んでいます。この町の人口密度（1km²あたりの人口）は何人ですか。`,
            answer: d, unit: '人', step: 10, wrong: [d * 10, d + s],
        };
    },
    (r) => {
        const [n1, u] = [r.int(3, 6), r.int(4, 9) * 10];
        const n2 = r.int(n1 + 2, 12);
        const what = r.pick(['えん筆', 'ボールペン', 'クレヨン']);
        return {
            text: `${n1}本で${n1 * u}円の${what}があります。同じ${what}を${n2}本買うと、代金は何円ですか。`,
            answer: n2 * u, unit: '円', step: 10, wrong: [n1 * u * n2, (n2 - n1) * u, n1 * u + n2 * 10],
        };
    },
    (r) => {
        const [e, l] = [r.int(8, 25), r.int(12, 40)];
        return {
            text: `ガソリン1Lあたり${e}km走る自動車があります。${e * l}km走るには、ガソリンは何Lいりますか。`,
            answer: l, unit: 'L', wrong: [e, l + e, l + 2, l - 2],
        };
    },
    (r) => {
        const [a, per] = [r.pick([20, 30, 40, 50]), r.pick([12, 15, 18, 24, 25, 32])];
        const what = r.pick(['じゃがいも', 'さつまいも', 'にんじん', '玉ねぎ']);
        return {
            text: `${a}m²の畑から、${(a * per) / 10}kgの${what}がとれました。1m²あたり何kgとれましたか。`,
            answer: per / 10, unit: 'kg', wrong: [per, per / 100, (per + 10) / 10],
        };
    },
    (r) => {
        const [rate, m] = [r.int(12, 40), r.int(3, 6)];
        const n = r.int(8, 20);
        return {
            text: `${m}分間に${rate * m}枚印刷できるプリンターがあります。${rate * n}枚印刷するには、何分かかりますか。`,
            answer: n, unit: '分', wrong: [(rate * n) / m, n + m, n - 1],
        };
    },
]);

export default [...wariai, ...hi, ...hirei, ...tanni];
