import { defineTopic, frac, fracWrongs } from '../helpers.js';
import { gcd, lcm } from '../../generators/rng.js';
import { names, foods } from '../vocab.js';

const H = 'high';
const one = r => r.pick(names);

const shousuu = defineTopic('high-shousuu', '小数のかけ算・わり算', [
    (r) => {
        const [a, b] = [r.int(12, 48), r.int(15, 65)];
        const what = r.pick(['パイプ', 'はり金', '鉄のぼう', 'ホース']);
        return {
            text: `1mの重さが${a / 10}kgの${what}があります。この${what}${b / 10}mの重さは何kgですか。`,
            answer: (a * b) / 100, unit: 'kg', wrong: [(a * b) / 10, (a * b) / 1000, (a + b) / 10],
        };
    },
    (r) => {
        const [a, n] = [r.pick([2, 3, 4, 5, 6, 8]), r.int(6, 15)];
        const what = r.pick(['ジュース', 'お茶', '牛乳', 'スープ']);
        return {
            text: `${(a * n) / 10}Lの${what}を、${a / 10}Lずつコップに分けます。コップは何個いりますか。`,
            answer: n, unit: '個', wrong: [n * 10, n + 1, n - 1],
        };
    },
    (r) => {
        const [w, b] = [r.int(12, 48), r.pick([15, 24, 25, 32, 35, 45])];
        return {
            text: `長さ${b / 10}mの重さが${(w * b) / 100}kgのロープがあります。このロープ1mの重さは何kgですか。`,
            answer: w / 10, unit: 'kg', wrong: [(w * b * b) / 1000, w / 100, (w + 10) / 10],
        };
    },
    (r) => {
        const a = r.pick([4, 6, 7, 8, 9]);
        let t = r.int(43, 95);
        if (t % a === 0) t += 1;
        const [q, m] = [Math.floor(t / a), t % a];
        const fmt = (x, y) => `${x}本とれて、${y}mあまる`;
        return {
            text: `${t / 10}mのリボンを${a / 10}mずつ切っていきます。${a / 10}mのリボンは何本とれて、何mあまりますか。`,
            answer: fmt(q, m / 10),
            wrong: [fmt(q, m), fmt(q + 1, m / 10), fmt(q - 1, (m + a) / 10), fmt(q, (m + 1) / 10)],
        };
    },
    (r) => {
        const [a, k] = [r.int(2, 15) * 2, r.pick([4, 6, 8, 12, 14, 15, 25])];
        const [c1, c2] = r.pickN(['赤', '青', '黄色', '白'], 2);
        return {
            text: `${c1}のテープは${a}mです。${c2}のテープの長さは、${c1}のテープの${k / 10}倍です。${c2}のテープは何mですか。`,
            answer: (a * k) / 10, unit: 'm', wrong: [(a * k) / 100, a + k / 10, a * k],
        };
    },
]);

const DENOMS = [[2, 3], [2, 4], [3, 4], [3, 6], [2, 5], [4, 6], [3, 5], [4, 8], [2, 6], [5, 10]];

// 分母 d に対して、約分できない真分数になる分子を選ぶ
function numerator(r, d) {
    let n;
    do {
        n = r.int(1, d - 1);
    } while (gcd(n, d) !== 1);
    return n;
}

// 分母のちがう真分数を2つ作る
function twoFractions(r) {
    let [b, d] = r.pick(DENOMS);
    if (r.bool()) [b, d] = [d, b];
    return { a: numerator(r, b), b, c: numerator(r, d), d };
}

const bunsuu = defineTopic('high-bunsuu', '分数の計算', [
    (r) => {
        const { a, b, c, d } = twoFractions(r);
        const [n, m] = [a * d + c * b, b * d];
        const [x, y] = r.pickN(['牛乳', 'ジュース', 'お茶', '水'], 2);
        return {
            text: `${x}が${a}/${b}L、${y}が${c}/${d}Lあります。合わせて何Lですか。`,
            answer: `${frac(n, m)}L`,
            wrong: [frac(a + c, b + d), ...fracWrongs(n, m)].map(f => `${f}L`),
        };
    },
    (r) => {
        let f = twoFractions(r);
        while (f.a * f.d === f.c * f.b) f = twoFractions(r);
        // 大きいほうから小さいほうをひく
        const big = f.a * f.d > f.c * f.b ? [f.a, f.b, f.c, f.d] : [f.c, f.d, f.a, f.b];
        const [a, b, c, d] = big;
        const [n, m] = [a * d - c * b, b * d];
        return {
            text: `${a}/${b}mのリボンのうち、${c}/${d}mを使いました。残りは何mですか。`,
            answer: `${frac(n, m)}m`,
            wrong: [frac(a + c, b + d), ...fracWrongs(n, m)].map(x => `${x}m`),
        };
    },
    (r) => {
        const [b, d] = [r.int(3, 7), r.int(2, 5)];
        const [a, c] = [numerator(r, b), numerator(r, d)];
        const [n, m] = [a * c, b * d];
        return {
            text: `1dLで${a}/${b}m²のかべをぬれるペンキがあります。このペンキ${c}/${d}dLでは、何m²のかべをぬれますか。`,
            answer: `${frac(n, m)}m²`,
            wrong: [frac(a * d, b * c), frac(a + c, b + d), ...fracWrongs(n, m)].map(x => `${x}m²`),
        };
    },
    (r) => {
        const [b, d] = [r.int(3, 7), r.int(3, 5)];
        const [a, c] = [numerator(r, b), numerator(r, d)];
        const [n, m] = [a * d, b * c];
        return {
            text: `${a}/${b}m²のかべをぬるのに、ペンキを${c}/${d}dL使いました。このペンキ1dLでは、何m²のかべをぬれますか。`,
            answer: `${frac(n, m)}m²`,
            wrong: [frac(a * c, b * d), frac(b * c, a * d), ...fracWrongs(n, m)].map(x => `${x}m²`),
        };
    },
    (r) => {
        const [v, m] = [r.pick([3, 4, 6, 12, 15, 18]), r.pick([10, 15, 20, 25, 40, 45, 50])];
        const how = v <= 6 ? '歩く' : '自転車で走る';
        return {
            text: `時速${v}kmで${m}分間${how}と、何km進みますか。`,
            answer: `${frac(v * m, 60)}km`,
            wrong: [frac(v * m, 100), frac(v * 60, m), ...fracWrongs(v * m, 60)].map(x => `${x}km`),
        };
    },
    (r) => {
        let f = twoFractions(r);
        while (f.a * f.d + f.c * f.b >= f.b * f.d) f = twoFractions(r);
        const { a, b, c, d } = f;
        const [n, m] = [a * d + c * b, b * d];
        return {
            text: `${one(r)}さんはある本を、きのうは全体の${a}/${b}、今日は全体の${c}/${d}読みました。残りは全体のどれだけですか。`,
            answer: frac(m - n, m),
            wrong: [frac(n, m), frac(a + c, b + d), ...fracWrongs(m - n, m)],
        };
    },
]);

const heikin = defineTopic('high-heikin', '平均', [
    (r) => {
        let avg, s;
        do {
            avg = r.int(62, 88);
            s = [avg + r.int(-12, 12), avg + r.int(-12, 12), avg + r.int(-12, 12)];
            s.push(avg * 4 - s[0] - s[1] - s[2]);
        } while (s[3] < 40 || s[3] > 100);
        const subject = r.pick(['算数', '国語', '理科', '社会']);
        return {
            text: `${one(r)}さんの${subject}のテスト4回の点数は、${s.join('点、')}点でした。平均は何点ですか。`,
            answer: avg, unit: '点', wrong: [(Math.max(...s) + Math.min(...s)) / 2, avg + 2],
        };
    },
    (r) => {
        const [n, avg] = [r.int(5, 12), r.int(52, 68)];
        const what = r.pick(['たまご', 'みかん', 'じゃがいも', 'トマト']);
        return {
            text: `${what}${n}個の重さの平均は${avg}gでした。${n}個全部の重さは何gですか。`,
            answer: n * avg, unit: 'g', wrong: [n + avg, n * avg + avg, n * avg - 10],
        };
    },
    (r) => {
        const [n, avg, diff] = [r.int(3, 4), r.int(70, 84), r.int(1, 3)];
        const target = avg + diff;
        return {
            text: `${one(r)}さんの${n}回のテストの平均点は${avg}点でした。次のテストで何点とれば、${n + 1}回の平均が${target}点になりますか。`,
            answer: target * (n + 1) - avg * n, unit: '点', wrong: [target, avg + diff * n, target + 1],
        };
    },
    (r) => {
        let avg, s;
        do {
            avg = r.int(6, 20);
            const base = Math.round((avg * 5) / 4);
            s = [base + r.int(-4, 4), base + r.int(-4, 4), base + r.int(-4, 4)];
            s.push(avg * 5 - s[0] - s[1] - s[2]);
        } while (s.some(v => v <= 0));
        const days = r.shuffle([...s, 0]);
        return {
            text: `${one(r)}さんが5日間に読んだ本のページ数は、${days.join('ページ、')}ページでした。1日平均何ページ読みましたか。`,
            answer: avg, unit: 'ページ', wrong: [(avg * 5) / 4, avg + 1, avg - 1],
        };
    },
    (r) => {
        let m, f, a, b;
        do {
            [m, f] = r.pick([[2, 3], [3, 2], [4, 6], [6, 4], [12, 8], [8, 12], [3, 7], [1, 4]]);
            a = r.int(32, 44);
            b = r.int(30, 42);
        } while (a === b || (m * a + f * b) % (m + f) !== 0);
        return {
            text: `男子${m}人の平均体重は${a}kg、女子${f}人の平均体重は${b}kgです。全員の平均体重は何kgですか。`,
            answer: (m * a + f * b) / (m + f), unit: 'kg', wrong: [(a + b) / 2, a, b],
        };
    },
]);

const PAIRS = [[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [4, 10], [6, 10], [9, 12], [12, 18]];

const baisuu = defineTopic('high-baisuu', '倍数と約数', [
    (r) => {
        const [a, b] = r.pick(PAIRS);
        return {
            text: `${a}分おきに出る電車と、${b}分おきに出るバスがあります。午前8時に同時に出発しました。次に同時に出発するのは何分後ですか。`,
            answer: lcm(a, b), unit: '分後', wrong: [a * b, a + b, gcd(a, b)],
        };
    },
    (r) => {
        const g = r.pick([4, 6, 8, 9, 12]);
        const [x, y] = r.pick([[2, 3], [3, 4], [3, 5], [2, 5], [4, 5]]);
        const [f1, f2] = r.pickN(foods(H), 2);
        return {
            text: `${f1.name}${g * x}${f1.unit}と${f2.name}${g * y}${f2.unit}を、それぞれ同じ数ずつ、あまりが出ないように、できるだけ多くの子どもに分けます。何人に分けられますか。`,
            answer: g, unit: '人', wrong: [g * (y - x), g / 2, g * x, g + 1],
        };
    },
    (r) => {
        const [a, b] = r.pick(PAIRS);
        const side = lcm(a, b);
        return {
            text: `たて${a}cm、横${b}cmの長方形のタイルを同じ向きにすきまなくならべて、できるだけ小さい正方形を作ります。タイルは何枚いりますか。`,
            answer: (side / a) * (side / b), unit: '枚', wrong: [side, a * b, side / a + side / b],
        };
    },
    (r) => {
        const [n, k] = [r.int(50, 100), r.int(3, 9)];
        const q = Math.floor(n / k);
        return {
            text: `1から${n}までの整数のうち、${k}の倍数は何個ありますか。`,
            answer: q, unit: '個', wrong: [q + 1, q - 1, n - k],
        };
    },
]);

const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));

const baai = defineTopic('high-baai', '場合の数', [
    (r) => {
        const n = r.int(3, 5);
        const scene = n === 5
            ? '5人が横一列にならんで写真をとります。ならび方'
            : `${n}人でリレーのチームを作ります。走る順番`;
        return {
            text: `${scene}は全部で何通りありますか。`,
            answer: factorial(n), unit: '通り', wrong: [n * n, n * (n - 1), factorial(n) / 2, n],
        };
    },
    (r) => {
        const n = r.int(4, 8);
        const sport = r.pick(['サッカー', 'ドッジボール', 'バスケットボール', '野球']);
        return {
            text: `${n}チームで${sport}の試合をします。どのチームとも1回ずつ当たるようにすると、試合は全部で何試合になりますか。`,
            answer: (n * (n - 1)) / 2, unit: '試合', wrong: [n * (n - 1), n * n, n],
        };
    },
    (r) => {
        const n = r.int(3, 5);
        const zero = r.bool();
        const cards = Array.from({ length: n }, (_, i) => (zero ? i : i + 1));
        return {
            text: `${cards.join('、')} の${n}枚のカードから2枚を選んでならべ、2けたの整数を作ります。整数は全部で何通りできますか。`,
            answer: zero ? (n - 1) * (n - 1) : n * (n - 1),
            unit: '通り',
            wrong: zero ? [n * (n - 1), n * n] : [n * n, (n * (n - 1)) / 2, n * 2],
        };
    },
]);

export default [...shousuu, ...bunsuu, ...heikin, ...baisuu, ...baai];
