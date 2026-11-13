import { defineTopic, fmtNum } from '../helpers.js';
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
            explain: `合わせるので、たし算です。${fmtNum(a / 10)} + ${fmtNum(b / 10)} = ${fmtNum((a + b) / 10)}（L）`,
        };
    },
    (r) => {
        const a = r.int(25, 80);
        const b = r.int(6, a - 8);
        return {
            text: `${a / 10}mのリボンから${b / 10}m使いました。残りのリボンは何mですか。`,
            answer: (a - b) / 10, unit: 'm', wrong: [(a + b) / 10, (a - b + 10) / 10, (a - b) / 100],
            explain: `残りをもとめるので、ひき算です。${fmtNum(a / 10)} − ${fmtNum(b / 10)} = ${fmtNum((a - b) / 10)}（m）`,
        };
    },
    (r) => {
        const [a, n] = [r.int(3, 25), r.int(2, 9)];
        return {
            text: `1本に${a / 10}L入っているペットボトルが${n}本あります。全部で何Lですか。`,
            answer: (a * n) / 10, unit: 'L', wrong: [(a * n) / 100, a * n, a / 10 + n],
            explain: `1本分の${n}本分なので、かけ算です。${fmtNum(a / 10)} × ${n} = ${fmtNum((a * n) / 10)}（L）`,
        };
    },
    (r) => {
        const n = r.int(2, 8);
        let q = r.int(4, 28);
        if (q % 10 === 0) q += 3;
        return {
            text: `${(q * n) / 10}mのテープを、${n}人で同じ長さずつ分けます。1人分は何mになりますか。`,
            answer: q / 10, unit: 'm', wrong: [q, q / 100, (q + 10) / 10],
            explain: `同じ長さずつ分けるので、わり算です。${fmtNum((q * n) / 10)} ÷ ${n} = ${fmtNum(q / 10)}（m）`,
        };
    },
    (r) => {
        const [a, b] = [r.int(4, 18), r.int(3, 15)];
        const p = r.pick(places.filter(x => x !== '学校'));
        return {
            text: `${one(r)}さんの家から学校までは${a / 10}km、学校から${p}までは${b / 10}kmです。家から学校を通って${p}まで行き、同じ道を帰ると、全部で何km歩きますか。`,
            answer: ((a + b) * 2) / 10, unit: 'km', wrong: [(a + b) / 10, (a * 2 + b) / 10, (a + b * 2) / 10],
            explain: `家から${p}までは ${fmtNum(a / 10)} + ${fmtNum(b / 10)} = ${fmtNum((a + b) / 10)}（km）。行きと帰りで2回歩くので、${fmtNum((a + b) / 10)} × 2 = ${fmtNum(((a + b) * 2) / 10)}（km）`,
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
            explain: `分母が同じ分数のたし算は、分子どうしをたします。${a}/${d} + ${b}/${d} = ${fr(a + b, d)}（L）`,
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
            explain: `分母が同じ分数のひき算は、分子どうしをひきます。${a}/${d} − ${b}/${d} = ${a - b}/${d}（m）`,
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
            explain: `1Lは${d}/${d}Lと同じです。${d}/${d} − ${a}/${d} = ${d - a}/${d}（L）`,
        };
    },
    (r) => {
        const d = r.int(4, 9);
        const a = r.int(2, d - 1);
        return {
            text: `1mのテープを${d}等分しました。その${a}こ分の長さは何mですか。`,
            answer: `${a}/${d}m`,
            wrong: [`${d}/${a}m`, `${a}/${d + 1}m`, `${a + 1}/${d + 1}m`, `1/${a}m`],
            explain: `1mを${d}等分した1こ分は1/${d}mです。その${a}こ分なので、${a}/${d}（m）`,
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
            explain: `間の数は ${d * n} ÷ ${d} = ${n}。はしからはしまで${verb.replace('ます', 'る')}ので、${what}の数は間の数より1多くなります。${n} + 1 = ${n + 1}（本）`,
        };
    },
    (r) => {
        const [d, n] = [r.int(3, 8), r.int(6, 15)];
        return {
            text: `まわりの長さが${d * n}mの池があります。池のまわりに${d}mおきに木を植えると、木は何本いりますか。`,
            answer: n, unit: '本', wrong: [n + 1, n - 1, n + 2],
            explain: `池のまわりのように1周つながっているときは、木の数と間の数が同じです。${d * n} ÷ ${d} = ${n}（本）`,
        };
    },
    (r) => {
        const [d, n] = [r.int(2, 6), r.int(6, 15)];
        return {
            text: `${n}本のくいを、${d}mおきにまっすぐ一列に打ちました。はしのくいからはしのくいまでの長さは何mですか。`,
            answer: (n - 1) * d, unit: 'm', wrong: [n * d, (n + 1) * d, (n - 2) * d],
            explain: `くいが${n}本のとき、間の数は ${n} − 1 = ${n - 1}。${n - 1} × ${d} = ${(n - 1) * d}（m）`,
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
            explain: `多いほうの数 = (和 + 差) ÷ 2。(${sum} + ${diff}) ÷ 2 = ${sum + diff} ÷ 2 = ${small + diff}（まい）`,
        };
    },
    (r) => {
        const [k, x] = [r.int(2, 4), r.int(6, 20)];
        const t = x * (k + 1);
        return {
            text: `${t}まいの色紙を、姉のまい数が妹のまい数の${k}倍になるように分けます。妹は何まいもらえますか。`,
            answer: x, unit: 'まい', wrong: [x * k, t / k, x + k],
            explain: `妹のまい数を1とすると、姉は${k}、合わせて ${k} + 1 = ${k + 1} にあたります。${t} ÷ ${k + 1} = ${x}（まい）`,
        };
    },
]);

export default [...shousuu, ...bunsuu, ...ueki, ...wasa];
