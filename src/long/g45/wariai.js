import { defineTopic } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { segments, shape, rectPoints } from '../figures.js';
import { q, until, schools } from '../util.js';

const baibai = defineTopic('g45-baibai', '売買損益', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [cost, up, off] = [r.int(5, 15) * 100, r.int(2, 5), r.int(1, 3)];
            const n = r.int(4, 8) * 10;
            const list = (cost * (10 + up)) / 10;
            const sale = (list * (10 - off)) / 10;
            const n1 = n - r.int(1, 3) * 5;
            return { cost, up, off, n, n1, list, sale, profit: list * n1 + sale * (n - n1) - cost * n };
        }, x => Number.isInteger(x.sale) && x.profit > 0 && x.sale !== x.cost);
        return {
            text: [
                `${p}さんのおじさんは、商店街で小さな雑貨店を開いています。ある月、おじさんは、問屋から、1個${v.cost}円のマグカップを${v.n}個仕入れました。品物を仕入れたときのねだんを「原価」といいます。`,
                `おじさんは、原価の${v.up}割にあたる金額を利益として上乗せして、マグカップの「定価」を決めました。たとえば、原価が1000円で、2割の利益を上乗せするなら、定価は1200円になります。`,
                `マグカップは、はじめの3週間で、定価のまま${v.n1}個売れました。けれども、そのあとはなかなか売れなくなったので、おじさんは、残りのマグカップを、定価の${v.off}割引きのねだんで売ることにしました。すると、残りは1週間で全部売り切れました。`,
                `「利益」とは、売り上げの合計から、仕入れにかかったお金の合計をひいたもののことです。`,
                'おじさんは、売れ残りが出ないように、売れゆきを見ながら、ねだんのつけ方をいつもくふうしています。',
            ],
            questions: [
                q('このマグカップ1個の定価は何円ですか。', v.list, '円', [v.cost + v.up * 10, v.cost + v.up * 100, (v.cost * v.up) / 10], { step: 10 }),
                q(`定価の${v.off}割引きにしたときの、マグカップ1個のねだんは何円ですか。`, v.sale, '円', [v.list - v.off * 100, v.cost, (v.cost * (10 + v.up - v.off)) / 10], { step: 10 }),
                q('マグカップを全部売り終わったとき、おじさんの利益は全部で何円でしたか。', v.profit, '円', [(v.list - v.cost) * v.n, (v.list - v.cost) * v.n1, v.profit + v.cost], { step: 100 }),
            ],
        };
    },
]);

const noudo = defineTopic('g45-noudo', '食塩水のこさ', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [a, x, w] = [r.int(5, 15), r.int(2, 5) * 100, r.int(1, 4) * 50];
            const [b, y] = [r.int(10, 20), r.int(1, 4) * 100];
            const salt = (x * a) / 100;
            const second = (salt * 100) / (x + w);
            const third = ((salt + (y * b) / 100) * 100) / (x + w + y);
            return { a, x, w, b, y, salt, second, third };
        }, z => Number.isInteger(z.salt) && Number.isInteger(z.second) && Number.isInteger(z.third * 10) && z.third !== z.second && z.b !== z.a);
        return {
            text: [
                `${p}さんは、夏休みの自由研究で、食塩水のこさについて調べることにしました。食塩水のこさは、「食塩水全体の重さのうち、とけている食塩の重さがどれだけの割合をしめているか」を百分率（%）で表します。たとえば、食塩10gを水90gにとかすと、食塩水は全部で100gになるので、こさは10%です。`,
                `はじめに、${p}さんは、こさが${v.a}%の食塩水を${v.x}g作って、ビーカーに入れました。これを食塩水Aとします。`,
                `次に、食塩水Aの入ったビーカーに、水を${v.w}g加えて、ガラスぼうでよくかきまぜました。これを食塩水Bとします。`,
                `さいごに、食塩水Bの入ったビーカーに、べつに作っておいたこさ${v.b}%の食塩水${v.y}gを全部加えて、よくかきまぜました。これを食塩水Cとします。`,
                '食塩水に水を加えても、とけている食塩の重さは変わりません。また、2つの食塩水をまぜたときは、食塩の重さも、食塩水全体の重さも、それぞれをたし合わせて考えます。',
            ],
            questions: [
                q('食塩水Aにとけている食塩の重さは何gですか。', v.salt, 'g', [v.a, v.x / v.a, v.salt * 10]),
                q('食塩水Bのこさは何%ですか。', v.second, '%', [v.a - 1, (v.salt * 100) / v.w, v.a / 2]),
                q('食塩水Cのこさは何%ですか。', v.third, '%', [(v.second + v.b) / 2, v.second + v.b, (v.a + v.b) / 2], { step: Number.isInteger(v.third) ? 1 : 0.5 }),
            ],
        };
    },
]);

const soutou = defineTopic('g45-soutou', '相当算', [
    (r) => {
        const p = r.pick(names);
        // [1日目に読んだ割合, 2日目に読んだ「残り」に対する割合]
        const [[n1, d1], [n2, d2]] = r.pick([[[1, 4], [1, 3]], [[1, 3], [1, 4]], [[2, 5], [1, 3]], [[1, 5], [1, 4]], [[1, 4], [2, 5]], [[1, 3], [2, 5]]]);
        const v = until(r, () => {
            const total = r.int(8, 24) * 20;
            const day1 = (total * n1) / d1;
            const day2 = ((total - day1) * n2) / d2;
            return { total, day1, day2, rest: total - day1 - day2, each: r.int(12, 25) };
        }, x => Number.isInteger(x.day1) && Number.isInteger(x.day2) && x.rest % x.each !== 0);
        return {
            text: [
                `${p}さんは、たん生日のプレゼントに、前から読みたかったぼうけん物語の本をもらいました。とても厚い本ですが、${p}さんは、もらったその日から、さっそく読み始めました。`,
                `1日目は、本全体のページ数の${n1}/${d1}を読みました。2日目は、1日目に読み残したページ数の${n2}/${d2}を読みました。2日目を読み終わったとき、まだ読んでいないページは、${v.rest}ページありました。下の図は、本全体のページ数を1本の線で表したものです。`,
                `3日目からは、学校の宿題がいそがしくなったので、${p}さんは、毎日${v.each}ページずつ読むことにしました。そして、残りのページを、とちゅうで休むことなく毎日読み続けて、さいごまで読み終えました。さいごの日は、${v.each}ページより少ないページ数を読んで、読み終わりました。`,
                '図の線全体の長さが、本全体のページ数を表しています。「読み残したページ数の何分のいくつ」というときは、もとにする量が本全体のページ数ではないことに注意しましょう。',
            ],
            figure: segments([{
                label: '本全体',
                parts: [{ len: v.day1, note: '1日目' }, { len: v.day2, note: '2日目' }, { len: v.rest, note: `${v.rest}ページ` }],
            }]),
            questions: [
                q('この本は、全部で何ページありますか。', v.total, 'ページ', [v.rest * d1, v.rest * d2, v.rest * 2 === v.total ? v.rest * 3 : v.rest * 2], { step: 10 }),
                q(`${p}さんが2日目に読んだのは何ページですか。`, v.day2, 'ページ', [v.day1, (v.total * n2) / d2, v.rest]),
                q(`${p}さんは、3日目から数えて何日で、残りのページを読み終わりましたか。`, Math.ceil(v.rest / v.each), '日', [Math.floor(v.rest / v.each), Math.ceil(v.rest / v.each) + 2]),
            ],
        };
    },
]);

const baisuu = defineTopic('g45-baisuu', '倍数算', [
    (r) => {
        const [p, f] = r.pickN(names, 2);
        // はじめ兄は弟の k1 倍、わたしたあと k2 倍、同じねだんの本を買ったあと k3 倍
        const [k1, k2, k3] = r.pick([[3, 2, 3], [5, 3, 5], [4, 2, 4], [4, 3, 5], [5, 2, 3], [4, 2, 3]]);
        const v = until(r, () => {
            const x = r.int(2, 12) * 50;
            const y = (x * (1 + k2)) / (k1 - k2);
            const after = y + x;
            return { x, y, after, book: (after * (k3 - k2)) / (k3 - 1) };
        }, z => Number.isInteger(z.y) && Number.isInteger(z.book) && z.y % 10 === 0 && z.book % 10 === 0 && z.y >= 300);
        return {
            text: [
                `${p}さんと弟の${f}さんは、お正月に、親せきの人たちからお年玉をもらいました。もらったお年玉をそれぞれ数えてみると、${p}さんの持っているお金は、${f}さんの持っているお金のちょうど${k1}倍でした。`,
                `${f}さんが「お兄ちゃんばっかり多くてずるい」と言ったので、${p}さんは、自分のお金の中から${v.x}円を${f}さんにわたしました。すると、${p}さんの持っているお金は、${f}さんの持っているお金のちょうど${k2}倍になりました。`,
                `次の日、2人はいっしょに本屋さんへ行き、同じまんがの本を1さつずつ買いました。2人が買った本は、まったく同じねだんです。本を買ったあと、残ったお金をくらべてみると、${p}さんの残りのお金は、${f}さんの残りのお金のちょうど${k3}倍になっていました。`,
                'お金をわたしても、2人の持っているお金の合計は変わりません。また、2人が同じ金額ずつお金を使っても、2人の持っているお金の差は変わりません。',
            ],
            questions: [
                q(`はじめに${f}さんがもらったお年玉は何円でしたか。`, v.y, '円', [v.after, v.x * k1, v.y + 2 * v.x], { step: 50 }),
                q(`はじめに${p}さんがもらったお年玉は何円でしたか。`, v.y * k1, '円', [v.after * k2, v.y * k2, v.y * k1 + v.x], { step: 100 }),
                q('2人が買ったまんがの本は、1さつ何円でしたか。', v.book, '円', [v.after - v.book, v.x, v.book + 100], { step: 50 }),
            ],
        };
    },
]);

const obi = defineTopic('g45-obigraph', '割合と帯グラフ', [
    (r) => {
        const school = r.pick(schools);
        const v = until(r, () => {
            const total = r.int(3, 8) * 100;
            const pct = [r.int(28, 36), r.int(18, 24), r.int(14, 17), r.int(10, 13)];
            const [g, h] = [r.pick([15, 16, 20]), r.pick([25, 30, 40, 45])];
            return { total, pct, other: 100 - pct.reduce((s, x) => s + x, 0), g, h, six: (total * g) / 100, sixSoccer: (total * g * h) / 10000 };
        }, x => x.other >= 12 && Number.isInteger(x.six) && Number.isInteger(x.sixSoccer));
        const sports = ['サッカー', '野球', 'バスケ', '水泳', 'その他'];
        const all = [...v.pct, v.other];
        let x = 0;
        const polys = [];
        const labels = [];
        all.forEach((pc, i) => {
            polys.push({ points: rectPoints(x, 0, pc, 16), fill: i % 2 === 0 ? 'shade' : 'none' });
            labels.push({ at: [x + pc / 2, 10.5], text: sports[i] });
            labels.push({ at: [x + pc / 2, 4.5], text: i === 4 ? '？%' : `${pc}%` });
            x += pc;
        });
        const people = i => (v.total * v.pct[i]) / 100;
        return {
            text: [
                `${school}小学校の児童会では、全校児童${v.total}人に、「いちばんすきなスポーツは何ですか」というアンケートをとりました。全員が、1人1つずつ答えました。`,
                `児童会の役員たちは、その結果を、スポーツごとの人数が全体のどれだけの割合にあたるかがひと目でわかるように、下のような帯グラフにまとめました。帯全体の長さが全校児童${v.total}人を表していて、それぞれの部分の長さが、そのスポーツを選んだ人数の割合を表しています。「その他」の割合は、まだ書きこまれていません。`,
                `さらにくわしく調べてみると、6年生の人数は全校児童の${v.g}%にあたり、その6年生のうちの${v.h}%が、「サッカー」と答えていたことがわかりました。`,
                '帯グラフでは、それぞれの部分の割合を全部たすと、かならず100%になります。また、ある部分の人数は、「全体の人数×その部分の割合」でもとめることができます。たとえば、全体が200人で、ある部分の割合が30%のとき、その部分の人数は60人です。',
            ],
            figure: shape(100, 16, { polys, labels }),
            questions: [
                q('「その他」と答えた人は何人ですか。', (v.total * v.other) / 100, '人', [v.other, people(3), (v.total * (v.other + 10)) / 100]),
                q('「サッカー」と答えた人は、「野球」と答えた人より何人多いですか。', people(0) - people(1), '人', [v.pct[0] - v.pct[1], people(0), people(0) + people(1)]),
                q('6年生で「サッカー」と答えた人は何人ですか。', v.sixSoccer, '人', [v.six, (people(0) * v.h) / 100, (v.six * v.pct[0]) / 100]),
            ],
        };
    },
]);

export default [...baibai, ...noudo, ...soutou, ...baisuu, ...obi];
