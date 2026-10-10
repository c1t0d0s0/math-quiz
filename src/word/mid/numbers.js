import { defineTopic } from '../helpers.js';
import { names, goods, sweets } from '../vocab.js';

const one = r => r.pick(names);
const round = (v, unit) => Math.round(v / unit) * unit;

const ookii = defineTopic('mid-ookii', '大きな数のたし算・ひき算', [
    (r) => {
        const [a, b] = [r.int(1200, 4800), r.int(1200, 4800)];
        return {
            text: `ある町の人口は、男の人が${a}人、女の人が${b}人です。合わせて何人ですか。`,
            answer: a + b, unit: '人', wrong: [a + b + 100, a + b - 1000, a + b - 10],
        };
    },
    (r) => {
        const b = r.int(1250, 3800);
        const a = b + r.int(1100, 5200);
        const what = r.pick(['グローブ', 'ゲームソフト', 'スニーカー', '図かん']);
        return {
            text: `${one(r)}さんは${a}円ちょ金しています。${b}円の${what}を買うと、残りは何円になりますか。`,
            answer: a - b, unit: '円', wrong: [a - b + 1000, a - b - 100, a - b + 10],
        };
    },
    (r) => {
        const a = r.int(2100, 6500);
        const b = a + r.int(180, 2400);
        const place = r.pick(['遊園地', '動物園', '水族館', '博物館']);
        return {
            text: `${place}の入場者数は、きのうが${a}人、今日が${b}人でした。今日はきのうより何人多いですか。`,
            answer: b - a, unit: '人', wrong: [b - a + 100, b - a - 10, b - a + 1000],
        };
    },
    (r) => {
        const [a, b, c] = [r.int(105, 380), r.int(105, 380), r.int(105, 380)];
        return {
            text: `${one(r)}さんは物語の本を、1日目に${a}ページ、2日目に${b}ページ、3日目に${c}ページ読みました。3日間で何ページ読みましたか。`,
            answer: a + b + c, unit: 'ページ', wrong: [a + b + c - 100, a + b + c + 10, a + b],
        };
    },
]);

const kakezan = defineTopic('mid-kakezan', '2けたのかけ算', [
    (r) => {
        const [a, b] = [r.int(12, 98), r.int(12, 35)];
        const [what, u] = r.pick([['おかし', 'こ'], ['えん筆', '本'], ['ビーズ', 'こ'], ['シール', 'まい']]);
        return {
            text: `1${u}${a}円の${what}を${b}${u}買います。代金は何円ですか。`,
            answer: a * b, unit: '円', wrong: [a * b + a, a * b - 10 * b, a * b + 100],
        };
    },
    (r) => {
        const [a, b] = [r.pick([12, 24, 36]), r.int(3, 9)];
        const what = r.pick(['えん筆', 'ジュース', 'ボールペン']);
        return {
            text: `1箱に${a}本ずつ入っている${what}が${b}箱あります。${what}は全部で何本ですか。`,
            answer: a * b, unit: '本', wrong: [a + b, a * b + a, a * b - 10],
        };
    },
    (r) => {
        const [a, b] = [r.int(15, 48), r.int(6, 19)];
        const what = r.pick(['画用紙', '色紙', '工作用紙']);
        return {
            text: `1まい${a}円の${what}を${b}まい買って、1000円さつではらいました。おつりは何円ですか。`,
            answer: 1000 - a * b, unit: '円', wrong: [a * b, 1000 - a * b + 100, 1000 - a - b],
        };
    },
    (r) => {
        const [a, b] = [r.int(12, 38) * 10 + r.pick([0, 5]), r.int(3, 9)];
        return {
            text: `1時間に${a}この部品を作るきかいがあります。${b}時間では、部品を何こ作れますか。`,
            answer: a * b, unit: 'こ', wrong: [a * b + a, a * b - 100, a + b],
        };
    },
    (r) => {
        const [a, b, c] = [r.pick([4, 6, 8, 12, 15, 25]), r.int(2, 5), r.int(3, 8)];
        return {
            text: `1箱${a}こ入りのあめを、1人に${b}箱ずつ、${c}人に配ります。あめは全部で何こいりますか。`,
            answer: a * b * c, unit: 'こ', wrong: [a * (b + c), a * b + c, a * b],
        };
    },
]);

const shikaku = defineTopic('mid-shikaku', '□を使った式', [
    (r) => {
        const [x, a, b] = [r.int(3, 12), r.int(2, 9), r.int(2, 6)];
        const t = (x + a) * b;
        return {
            text: `ある数に${a}をたしてから${b}をかけると、${t}になりました。ある数はいくつですか。`,
            answer: x, wrong: [t / b + a, x + a, t - a * b],
        };
    },
    (r) => {
        const [a, b, c] = [r.int(2, 6), r.int(2, 9), r.int(2, 9)];
        return {
            text: `ある数を${a}でわってから${b}をひくと、${c}になりました。ある数はいくつですか。`,
            answer: (c + b) * a, wrong: [c * a + b, Math.abs(c - b) * a, c + b],
        };
    },
    (r) => {
        const a = r.int(6, 25);
        const c = r.int(8, 60);
        return {
            text: `ある数に${a}をたすつもりが、まちがえて${a}をひいてしまったので、答えが${c}になりました。正しい答えはいくつですか。`,
            answer: c + 2 * a, wrong: [c + a, c, c + 2 * a + 10],
        };
    },
    (r) => {
        const [a, c] = [r.int(2, 5), r.int(2, 9)];
        return {
            text: `ある数に${a}をかけるつもりが、まちがえて${a}でわってしまったので、答えが${c}になりました。正しい答えはいくつですか。`,
            answer: c * a * a, wrong: [c * a, c, c * a * a + a],
        };
    },
]);

const junjo = defineTopic('mid-junjo', '計算の順じょ', [
    (r) => {
        const [a, n, b] = [r.int(8, 18) * 10, r.int(2, 6), r.int(2, 6) * 50];
        const fruit = r.pick(['りんご', 'なし', 'もも', 'かき']);
        return {
            text: `1こ${a}円の${fruit}を${n}こと、${b}円のかごを1つ買いました。代金は全部で何円ですか。`,
            answer: a * n + b, unit: '円', step: 10, wrong: [(a + b) * n, a + b],
        };
    },
    (r) => {
        const [x, y] = r.pickN(goods, 2);
        const [a, b] = [r.int(12, 38) * 10, r.int(8, 25) * 10];
        return {
            text: `1000円持って買い物に行き、${a}円の${x}と${b}円の${y}を買いました。残りは何円ですか。`,
            answer: 1000 - a - b, unit: '円', step: 10, wrong: [1000 - a + b, 1000 - a, a + b],
        };
    },
    (r) => {
        const [a, b, n] = [r.int(25, 45) * 10, r.int(10, 18) * 10, r.int(2, 6)];
        const s = r.pick(sweets);
        return {
            text: `1こ${a}円の${s}と1本${b}円のジュースを組にして、${n}組買いました。代金は全部で何円ですか。`,
            answer: (a + b) * n, unit: '円', step: 10, wrong: [a + b * n, a * n + b, a + b],
        };
    },
    (r) => {
        const [a, m, b, n] = [r.int(6, 9) * 10, r.int(2, 6), r.int(5, 12) * 10, r.int(2, 5)];
        return {
            text: `1本${a}円のえん筆を${m}本と、1こ${b}円の消しゴムを${n}こ買いました。代金は全部で何円ですか。`,
            answer: a * m + b * n, unit: '円', step: 10, wrong: [(a + b) * (m + n), a * m + b, a + b],
        };
    },
    (r) => {
        const [a, b, each] = [r.int(2, 5), r.int(2, 5), r.int(4, 12)];
        const t = each * (a + b);
        return {
            text: `${t}まいの色紙を、男の子${a}人と女の子${b}人で同じ数ずつ分けます。1人分は何まいになりますか。`,
            answer: each, unit: 'まい', wrong: [t / a, t / b, t - a - b],
        };
    },
]);

const gaisuu = defineTopic('mid-gaisuu', 'がい数', [
    (r) => {
        let n = r.int(12000, 98999);
        if (n % 1000 === 0) n += 380;
        const down = n - (n % 1000);
        return {
            text: `ある市の人口は${n}人です。四捨五入して千の位までのがい数にすると、約何人ですか。`,
            answer: round(n, 1000), prefix: '約', unit: '人', step: 1000,
            wrong: [down, down + 1000, round(n, 10000), round(n, 100)],
        };
    },
    (r) => {
        const [a, b] = [r.int(1210, 4890), r.int(1510, 6890)];
        const down = a - (a % 100) + b - (b % 100);
        return {
            text: `${a}円のシャツと${b}円のズボンを買います。それぞれ四捨五入して百の位までのがい数にしてから、代金の合計を見積もると約何円ですか。`,
            answer: round(a, 100) + round(b, 100), prefix: '約', unit: '円', step: 100,
            wrong: [down, down + 200, round(a, 1000) + round(b, 1000)],
        };
    },
    (r) => {
        const n = r.int(12, 98) * 10;
        return {
            text: `ある学校の児童数は、四捨五入して十の位までのがい数にすると${n}人です。児童数がいちばん多い場合、何人ですか。`,
            answer: n + 4, unit: '人', wrong: [n + 5, n + 9, n - 5],
        };
    },
]);

export default [...ookii, ...kakezan, ...shikaku, ...junjo, ...gaisuu];
