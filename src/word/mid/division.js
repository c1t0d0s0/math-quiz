import { defineTopic, fmtNum } from '../helpers.js';
import { names, items, foods, colorsKanji } from '../vocab.js';

const M = 'mid';
const one = r => r.pick(names);

const warizan = defineTopic('mid-warizan', 'わり算', [
    (r) => {
        const [a, b] = [r.int(3, 9), r.int(3, 9)];
        const I = r.pick(items(M));
        return {
            text: `${I.name}が${a * b}${I.unit}あります。${b}人で同じ数ずつ分けると、1人分は${I.q}になりますか。`,
            answer: a, unit: I.unit, wrong: [a * b - b, a + 1, b === a ? a + 2 : b],
            explain: `1人分をもとめるので、わり算です。${a * b} ÷ ${b} = ${a}（${I.unit}）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(3, 9), r.int(3, 9)];
        const I = r.pick(foods(M));
        return {
            text: `${I.name}が${a * b}${I.unit}あります。1人に${a}${I.unit}ずつ配ると、何人に配れますか。`,
            answer: b, unit: '人', wrong: [a * b - a, b + 1, b - 1],
            explain: `何人に配れるかをもとめるので、わり算です。${a * b} ÷ ${a} = ${b}（人）`,
        };
    },
    (r) => {
        const [a, n] = [r.int(4, 9), r.int(4, 9)];
        return {
            text: `長さ${a * n}cmのリボンを、${a}cmずつに切ります。${a}cmのリボンは何本できますか。`,
            answer: n, unit: '本', wrong: [a * n - a, n + 1, n - 1],
            explain: `${a}cmがいくつ分あるかをもとめるので、わり算です。${a * n} ÷ ${a} = ${n}（本）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 9) * 10, r.int(3, 8)];
        const what = r.pick([['えん筆', '本'], ['消しゴム', 'こ'], ['おかし', 'こ'], ['画用紙', 'まい']]);
        return {
            text: `同じねだんの${what[0]}を${b}${what[1]}買ったら、代金は${a * b}円でした。${what[0]}1${what[1]}のねだんは何円ですか。`,
            answer: a, unit: '円', step: 10, wrong: [a * b - b],
            explain: `代金を買った数でわると、1${what[1]}のねだんが出ます。${a * b} ÷ ${b} = ${a}（円）`,
        };
    },
    (r) => {
        const b = r.int(2, 4);
        const a = r.int(11, Math.floor(99 / b));
        return {
            text: `${a * b}まいの色紙を、${b}人で同じ数ずつ分けます。1人分は何まいになりますか。`,
            answer: a, unit: 'まい', wrong: [a + 10, a - 10, a * b - b],
            explain: `同じ数ずつ分けるので、わり算です。${a * b} ÷ ${b} = ${a}（まい）`,
        };
    },
]);

// あまりの出るわり算。q: 商、m: あまり（1以上）
function withRemainder(r, divMin, divMax, qMin, qMax) {
    const a = r.int(divMin, divMax);
    const q = r.int(qMin, qMax);
    const m = r.int(1, a - 1);
    return { a, q, m, t: a * q + m };
}

const amari = defineTopic('mid-amari', 'あまりのあるわり算', [
    (r) => {
        const { a, q, m, t } = withRemainder(r, 3, 9, 3, 9);
        const I = r.pick(foods(M));
        const fmt = (x, y) => `${x}ふくろできて、${y}${I.unit}あまる`;
        return {
            text: `${I.name}が${t}${I.unit}あります。1ふくろに${a}${I.unit}ずつ入れると、何ふくろできて、何${I.unit}あまりますか。`,
            answer: fmt(q, m),
            wrong: [fmt(q + 1, m), fmt(q - 1, m + a), fmt(q, m + 1), fmt(m, q)],
            explain: `${a}${I.unit}ずついくつ分とれるかをもとめるので、わり算です。${t} ÷ ${a} = ${q} あまり ${m} だから、${fmt(q, m)}。`,
        };
    },
    (r) => {
        const { a, q, m, t } = withRemainder(r, 3, 6, 4, 9);
        return {
            text: `${t}人の子どもが、長いす1きゃくに${a}人ずつすわります。全員がすわるには、長いすは何きゃくいりますか。`,
            answer: q + 1, unit: 'きゃく', wrong: [q, q + 2],
            explain: `${t} ÷ ${a} = ${q} あまり ${m}。${q}きゃくにすわると${m}人のこるので、もう1きゃくいります。${q} + 1 = ${q + 1}（きゃく）`,
        };
    },
    (r) => {
        const { a, q, m, t } = withRemainder(r, 2, 6, 5, 12);
        return {
            text: `はば${t}cmの本立てに、あつさ${a}cmの本を立てていきます。本は何さつまで立てられますか。`,
            answer: q, unit: 'さつ', wrong: [q + 1, q - 1],
            explain: `${t} ÷ ${a} = ${q} あまり ${m}。のこりの${m}cmには${a}cmの本は立てられないので、${q}さつです。`,
        };
    },
    (r) => {
        const { a, q, m, t } = withRemainder(r, 4, 9, 3, 9);
        return {
            text: `${t}このにもつを、1回に${a}こずつ運びます。全部運び終わるには、何回運べばよいですか。`,
            answer: q + 1, unit: '回', wrong: [q, q + 2],
            explain: `${t} ÷ ${a} = ${q} あまり ${m}。のこりの${m}こを運ぶのにもう1回いるので、${q} + 1 = ${q + 1}（回）`,
        };
    },
    (r) => {
        const a = r.int(3, 8) * 10;
        const q = r.int(3, 9);
        const t = a * q + r.int(1, a / 10 - 1) * 10;
        const what = r.pick(['あめ', 'ガム', 'チョコ', 'ラムネ']);
        return {
            text: `${t}円持っています。1こ${a}円の${what}は、何こまで買えますか。`,
            answer: q, unit: 'こ', wrong: [q + 1, q - 1],
            explain: `${t} ÷ ${a} = ${q} あまり ${t - a * q}。のこりの${t - a * q}円では${a}円の${what}は買えないので、${q}こです。`,
        };
    },
    (r) => {
        const { a, q, m, t } = withRemainder(r, 4, 9, 4, 9);
        const what = r.pick(['カード', '色紙', 'シール']);
        return {
            text: `${t}まいの${what}を、${a}人で同じ数ずつできるだけ多く分けます。何まいあまりますか。`,
            answer: m, unit: 'まい', wrong: [q, m + 1, a],
            explain: `${t} ÷ ${a} = ${q} あまり ${m}。1人${q}まいずつ分けると、${m}まいあまります。`,
        };
    },
]);

const bai = defineTopic('mid-bai', '倍の計算', [
    (r) => {
        const [a, k] = [r.int(4, 15), r.int(2, 8)];
        const [c1, c2] = r.pickN(colorsKanji, 2);
        return {
            text: `${c1}のテープは${a * k}cm、${c2}のテープは${a}cmです。${c1}のテープの長さは、${c2}のテープの長さの何倍ですか。`,
            answer: k, unit: '倍', wrong: [a * k - a, k + 1, k - 1],
            explain: `何倍かをもとめるので、わり算です。${a * k} ÷ ${a} = ${k}（倍）`,
        };
    },
    (r) => {
        const [a, k] = [r.int(18, 32), r.int(2, 3)];
        const who = r.pick(['お父さん', 'お母さん', 'お兄さん']);
        const p = one(r);
        return {
            text: `${who}の体重は${a * k}kgで、これは${p}さんの体重の${k}倍です。${p}さんの体重は何kgですか。`,
            answer: a, unit: 'kg', wrong: [a * k * k, a * k - k, a + k],
            explain: `${p}さんの体重を□kgとすると、□ × ${k} = ${a * k}。□ = ${a * k} ÷ ${k} = ${a}（kg）`,
        };
    },
    (r) => {
        const [a, j, k] = [r.int(3, 12), r.int(2, 4), r.int(2, 4)];
        const [c1, c2, c3] = r.pickN(colorsKanji, 3);
        return {
            text: `${c1}のリボンは${a}cmです。${c2}のリボンは${c1}のリボンの${j}倍、${c3}のリボンは${c2}のリボンの${k}倍の長さです。${c3}のリボンは何cmですか。`,
            answer: a * j * k, unit: 'cm', wrong: [a * (j + k), a * j, a * j + k],
            explain: `${c2}のリボンは ${a} × ${j} = ${a * j}（cm）。${c3}のリボンは ${a * j} × ${k} = ${a * j * k}（cm）`,
        };
    },
    (r) => {
        const a = r.int(1, 6) * 2;
        const k10 = r.pick([5, 15, 25, 35]);
        const [p, q] = r.pickN(names, 2);
        return {
            text: `${p}さんのテープは${a}m、${q}さんのテープは${(a * k10) / 10}mです。${q}さんのテープの長さは、${p}さんのテープの長さの何倍ですか。`,
            answer: k10 / 10, unit: '倍', wrong: [(a * k10) / 10 - a, k10 / 10 + 1],
            explain: `何倍かをもとめるので、わり算です。${fmtNum((a * k10) / 10)} ÷ ${a} = ${fmtNum(k10 / 10)}（倍）`,
        };
    },
    (r) => {
        const [a, k] = [r.int(6, 25), r.int(2, 5)];
        const I = r.pick(foods(M));
        return {
            text: `大きい箱には、小さい箱の${k}倍の${I.name}が入っています。小さい箱には${a}${I.unit}入っています。2つの箱の${I.name}は合わせて${I.q}ですか。`,
            answer: a * (k + 1), unit: I.unit, wrong: [a * k, a + k, a * (k + 2)],
            explain: `大きい箱は ${a} × ${k} = ${a * k}（${I.unit}）。合わせて ${a} + ${a * k} = ${a * (k + 1)}（${I.unit}）`,
        };
    },
]);

export default [...warizan, ...amari, ...bai];
