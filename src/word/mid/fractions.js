import { defineTopic } from '../helpers.js';
import { names, places } from '../vocab.js';

const one = r => r.pick(names);
// 3・4年は約分しないので、分母はそのまま（1になるときだけ整数にする）
const fr = (n, d) => (n === d ? '1' : `${n}/${d}`);

const shousuu = defineTopic('mid-shousuu', '小数', [
    (r) => {
        const [a, b] = [r.int(11, 38), r.int(6, 29)];
        const [x, y] = r.pickN(['ジュース', 'お茶', '牛にゅう', '水'], 2);
        return {
            text: `${x}が${a / 10}L、${y}が${b / 10}Lあります。合わせて何Lですか。`,
            answer: (a + b) / 10, unit: 'L', wrong: [(a + b) / 100, (a + b + 10) / 10, Math.abs(a - b) / 10],
        };
    },
    (r) => {
        const a = r.int(25, 80);
        const b = r.int(6, a - 8);
        return {
            text: `${a / 10}mのリボンから${b / 10}m使いました。残りのリボンは何mですか。`,
            answer: (a - b) / 10, unit: 'm', wrong: [(a + b) / 10, (a - b + 10) / 10, (a - b) / 100],
        };
    },
    (r) => {
        const [a, n] = [r.int(3, 25), r.int(2, 9)];
        return {
            text: `1本に${a / 10}L入っているペットボトルが${n}本あります。全部で何Lですか。`,
            answer: (a * n) / 10, unit: 'L', wrong: [(a * n) / 100, a * n, a / 10 + n],
        };
    },
    (r) => {
        const n = r.int(2, 8);
        let q = r.int(4, 28);
        if (q % 10 === 0) q += 3;
        return {
            text: `${(q * n) / 10}mのテープを、${n}人で同じ長さずつ分けます。1人分は何mになりますか。`,
            answer: q / 10, unit: 'm', wrong: [q, q / 100, (q + 10) / 10],
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 18), r.int(3, 15)];
        const p = r.pick(places.filter(x => x !== '学校'));
        return {
            text: `${one(r)}さんの家から学校までは${a / 10}km、学校から${p}までは${b / 10}kmです。家から学校を通って${p}まで行き、同じ道を帰ると、全部で何km歩きますか。`,
            answer: ((a + b) * 2) / 10, unit: 'km', wrong: [(a + b) / 10, (a * 2 + b) / 10, (a + b * 2) / 10],
        };
    },
]);

const bunsuu = defineTopic('mid-bunsuu', '分数', [
    (r) => {
        const d = r.int(5, 9);
        const a = r.int(1, d - 2);
        const b = r.int(1, d - a - 1);
        const what = r.pick(['ジュース', '牛にゅう', 'お茶']);
        return {
            text: `${what}がびんに${a}/${d}L入っています。そこへ${b}/${d}L入れると、合わせて何Lになりますか。`,
            answer: `${fr(a + b, d)}L`,
            wrong: [`${a + b}/${d * 2}L`, `${fr(a + b + 1, d)}L`, `${a + b - 1 || a + b + 2}/${d}L`],
        };
    },
    (r) => {
        const d = r.int(5, 9);
        const a = r.int(3, d - 1);
        const b = r.int(1, a - 1);
        return {
            text: `${a}/${d}mのテープから${b}/${d}m切り取ると、残りは何mですか。`,
            answer: `${a - b}/${d}m`,
            wrong: [`${a + b === d ? a + b + 1 : a + b}/${d}m`, `${a - b + 1}/${d}m`, `${a - b}/${d + 1}m`],
        };
    },
    (r) => {
        const d = r.int(4, 9);
        const a = r.int(1, d - 1);
        const what = r.pick(['牛にゅう', 'ジュース', 'スープ']);
        return {
            text: `1Lの${what}のうち、${a}/${d}Lを飲みました。残りは何Lですか。`,
            answer: `${d - a}/${d}L`,
            wrong: [`${fr(d - a + 1, d)}L`, `${d - a}/${d + 1}L`, `${d - a + 2}/${d}L`, `${a}/${d + 2}L`],
        };
    },
    (r) => {
        const d = r.int(4, 9);
        const a = r.int(2, d - 1);
        return {
            text: `1mのテープを${d}等分しました。その${a}こ分の長さは何mですか。`,
            answer: `${a}/${d}m`,
            wrong: [`${d}/${a}m`, `${a}/${d + 1}m`, `${a + 1}/${d + 1}m`, `1/${a}m`],
        };
    },
]);

const ueki = defineTopic('mid-ueki', '植木算', [
    (r) => {
        const [d, n] = [r.int(3, 8), r.int(5, 12)];
        const [what, verb] = r.pick([['木', '植えます'], ['はた', '立てます'], ['花', '植えます'], ['電灯', '立てます']]);
        return {
            text: `長さ${d * n}mの道のかた側に、はしからはしまで${d}mおきに${what}を${verb}。${what}は何本いりますか。`,
            answer: n + 1, unit: '本', wrong: [n, n - 1, n + 2],
        };
    },
    (r) => {
        const [d, n] = [r.int(3, 8), r.int(6, 15)];
        return {
            text: `まわりの長さが${d * n}mの池があります。池のまわりに${d}mおきに木を植えると、木は何本いりますか。`,
            answer: n, unit: '本', wrong: [n + 1, n - 1, n + 2],
        };
    },
    (r) => {
        const [d, n] = [r.int(2, 6), r.int(6, 15)];
        return {
            text: `${n}本のくいを、${d}mおきにまっすぐ一列に打ちました。はしのくいからはしのくいまでの長さは何mですか。`,
            answer: (n - 1) * d, unit: 'm', wrong: [n * d, (n + 1) * d, (n - 2) * d],
        };
    },
]);

const wasa = defineTopic('mid-wasa', '和差算・分配算', [
    (r) => {
        const [small, diff] = [r.int(8, 30), r.int(2, 12)];
        const sum = small * 2 + diff;
        const [p, q] = r.pickN(names, 2);
        return {
            text: `${p}さんと${q}さんは、合わせて${sum}まいのカードを持っています。${p}さんは${q}さんより${diff}まい多く持っています。${p}さんは何まい持っていますか。`,
            answer: small + diff, unit: 'まい', wrong: [small, sum - diff, small + diff + diff],
        };
    },
    (r) => {
        const [k, x] = [r.int(2, 4), r.int(6, 20)];
        const t = x * (k + 1);
        return {
            text: `${t}まいの色紙を、姉のまい数が妹のまい数の${k}倍になるように分けます。妹は何まいもらえますか。`,
            answer: x, unit: 'まい', wrong: [x * k, t / k, x + k],
        };
    },
]);

export default [...shousuu, ...bunsuu, ...ueki, ...wasa];
