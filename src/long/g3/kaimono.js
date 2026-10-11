import { defineTopic, clock } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { table } from '../figures.js';
import { q, until, schools } from '../util.js';

const kaimono = defineTopic('g3-kaimono', '買い物と料金表', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [a, b, c] = [r.int(11, 16) * 10, r.int(6, 9) * 10, r.int(5, 8) * 10];
            const [n1, n2, n3] = [r.int(2, 4), r.int(3, 6), r.int(1, 3)];
            const d = r.pick([10, 20]);
            const total = a * n1 + b * n2 + c * n3;
            const paid = total - d * n2;
            const bills = Math.ceil(paid / 1000);
            return { a, b, c, n1, n2, n3, d, total, paid, bills, change: bills * 1000 - paid };
        }, x => x.change > x.a && x.change % x.a !== 0);
        return {
            text: [
                `${p}さんは、お母さんにたのまれて、弟といっしょに文ぼう具店へ買い物に行きました。お店のねだんは、下の表のとおりです。`,
                `${p}さんは、ノートを${v.n1}さつ、えん筆を${v.n2}本、消しゴムを${v.n3}こ買うことにしました。レジでお金をはらおうとすると、お店の人が「今日はセールの日なので、えん筆はどれも1本につき${v.d}円引きになりますよ」と教えてくれました。${p}さんは1000円さつを${v.bills}まい出して、おつりを受け取りました。`,
                `帰り道、弟が「ぼくもノートがほしい」と言ったので、${p}さんはお店にもどり、受け取ったおつりで、同じノートを買えるだけ買い足しました。`,
            ],
            figure: table(['品物', 'ねだん'], [['ノート', `1さつ ${v.a}円`], ['えん筆', `1本 ${v.b}円`], ['消しゴム', `1こ ${v.c}円`]], '文ぼう具店のねだん'),
            questions: [
                q('もしセールがなかったとすると、はじめの買い物の代金は何円でしたか。', v.total, '円', [v.paid, v.total - v.d], { step: 10 }),
                q(`${p}さんがはじめに受け取ったおつりは何円ですか。`, v.change, '円', [v.bills * 1000 - v.total, v.change - v.d], { step: 10 }),
                q('ノートを買い足したあと、さいごに手元に残ったお金は何円ですか。', v.change % v.a, '円', [v.change - v.a, (v.bills * 1000 - v.total) % v.a], { step: 10 }),
            ],
        };
    },
]);

const ryougae = defineTopic('g3-chokin', 'ちょ金箱のお金', [
    (r) => {
        const [p, f] = r.pickN(names, 2);
        const v = until(r, () => {
            const [a, b, c, d] = [r.int(2, 4), r.int(3, 8), r.int(1, 5), r.int(2, 9)];
            const total = 500 * a + 100 * b + 50 * c + 10 * d;
            const book = r.int(98, 168) * 10;
            return { a, b, c, d, total, book, rest: total - book };
        }, x => x.rest >= 200 && x.rest % 20 === 0);
        return {
            text: [
                `${p}さんは、ちょ金箱を開けて、中のお金を数えました。中には、500円玉が${v.a}まい、100円玉が${v.b}まい、50円玉が${v.c}まい、10円玉が${v.d}まい入っていました。`,
                `${p}さんは、このお金で、前からほしかった1さつ${v.book}円の図かんを買うことにしました。本屋さんに行くとちゅうで友だちの${f}さんに会ったので、2人でいっしょに行きました。本屋さんでは、ちょ金箱から出したお金だけを使って、図かんの代金をはらいました。`,
                `家に帰ってから、${p}さんは、残ったお金のちょうど半分を妹にあげることにしました。残りの半分は、またちょ金箱にもどしました。`,
            ],
            questions: [
                q('ちょ金箱に入っていたお金は、全部で何円ですか。', v.total, '円', [v.total - 450 * v.a, v.total + 100], { step: 10 }),
                q('図かんを買ったあとに残ったお金は何円ですか。', v.rest, '円', [v.total + v.book - 2000, v.rest + 100], { step: 10 }),
                q(`${p}さんが妹にあげたお金は何円ですか。`, v.rest / 2, '円', [v.rest, v.total / 2], { step: 10 }),
            ],
        };
    },
]);

const jikoku = defineTopic('g3-jikokuhyou', '時こく表と待ち合わせ', [
    (r) => {
        const p = r.pick(names);
        const buses = [545, 565, 585, 605, 625, 645, 665, 685]; // 午前9時5分から20分おき
        const v = until(r, () => {
            const start = 540 + r.int(0, 8) * 5;
            const walk = r.int(8, 16);
            const arrive = start + walk;
            const bus = buses.find(t => t > arrive);
            const [ride, walk2, early] = [r.int(15, 25), r.int(4, 9), r.int(6, 20)];
            const home = bus + ride + walk2;
            return { start, walk, arrive, bus, ride, walk2, early, home, promise: home + early };
        }, x => x.bus - x.arrive >= 2 && !buses.includes(x.arrive) && x.promise % 5 === 0 && x.promise < 720);
        const am = t => clock(t, '午前');
        return {
            text: [
                `${p}さんは、日曜日に、1人でおばあさんの家へ遊びに行きます。${p}さんの家から駅前のバスていまでは、歩いて${v.walk}分かかります。駅前からおばあさんの家の近くのバスていまでは、バスに乗って${v.ride}分かかり、そこからおばあさんの家までは、歩いて${v.walk2}分です。`,
                `駅前を出るバスの時こくは、下の表のとおりです。${p}さんは、${am(v.start)}に家を出ました。そして、駅前のバスていに着いてから、いちばん早く来たバスに乗りました。おばあさんとは、${am(v.promise)}におばあさんの家で会うやくそくをしています。`,
            ],
            figure: table(['時', '分'], [['午前9時', '05　25　45'], ['午前10時', '05　25　45'], ['午前11時', '05　25'] ], '駅前を出るバスの時こく'),
            questions: [
                q(`${p}さんが駅前のバスていに着いたのは、午前何時何分ですか。`, v.arrive, '', [v.start - v.walk, v.bus, v.arrive + 10], { format: am }),
                q(`${p}さんは、バスていでバスを何分待ちましたか。`, v.bus - v.arrive, '分', [v.bus - v.start, 20 - (v.bus - v.arrive)]),
                q(`${p}さんがおばあさんの家に着いたのは、やくそくの時こくの何分前ですか。`, v.early, '分前', [v.early + v.walk2, v.promise - v.bus - v.ride - v.walk2 + 5]),
            ],
        };
    },
]);

const hyou = defineTopic('g3-hyou', '表の読み取り', [
    (r) => {
        const p = r.pick(names);
        const school = r.pick(schools);
        const v = until(r, () => {
            const story = [0, 1, 2, 3, 4].map(i => (i === 2 ? r.int(30, 38) : r.int(13, 25)));
            const zukan = [0, 1, 2, 3, 4].map(i => (i === 2 ? r.int(14, 18) : r.int(5, 11)));
            const day = story.map((s, i) => s + zukan[i]);
            return { story, zukan, day, min: Math.min(...day) };
        }, x => x.day.filter(d => d === x.min).length === 1);
        const sum = a => a.reduce((s, x) => s + x, 0);
        const [s, z] = [sum(v.story), sum(v.zukan)];
        return {
            text: [
                `${school}小学校の図書委員の${p}さんは、先週の月曜日から金曜日までの5日間に、図書室でかし出された本の数を調べて、下の表にまとめました。本は「物語」と「図かん」の2つのしゅるいに分けて数えています。`,
                `調べてみると、物語の本は、どの曜日も図かんより多くかし出されていました。また、水曜日は一日中雨がふって外で遊べなかったので、ほかの曜日よりもたくさんの本がかし出されました。`,
                `${p}さんは、この結果を図書委員会で発表して、来週は図かんのコーナーにおすすめの本をならべることにしました。`,
            ],
            figure: table(['', '月', '火', '水', '木', '金'], [['物語（さつ）', ...v.story], ['図かん（さつ）', ...v.zukan]], '先週かし出された本の数'),
            questions: [
                q('5日間にかし出された物語の本は、全部で何さつですか。', s, 'さつ', [s + z, s - v.story[2], s + 10]),
                q('水曜日にかし出された本の数は、いちばん少なかった曜日にかし出された本の数より何さつ多いですか。', v.day[2] - v.min, 'さつ', [v.story[2] - Math.min(...v.story), v.day[2]]),
                q('5日間にかし出された物語の本は、図かんより何さつ多いですか。', s - z, 'さつ', [s + z, s - z + 10, s - z - 10]),
            ],
        };
    },
]);

const amari = defineTopic('g3-amari', 'あまりの利用', [
    (r) => {
        const v = until(r, () => {
            const [n, t, c] = [r.int(52, 78), r.int(3, 5), r.int(6, 8)];
            const [k, bag] = [r.int(12, 18), r.int(9, 14)];
            return { n, t, c, k, bag, boats: Math.ceil((n + t) / c), fee: r.int(6, 9) * 100 };
        }, x => (x.n + x.t) % x.c !== 0 && (x.k * x.bag) % x.n !== 0 && x.k * x.bag > x.n * 2);
        const candy = v.k * v.bag;
        return {
            text: [
                `${r.pick(schools)}小学校の3年生${v.n}人が、先生${v.t}人といっしょに、遠足で湖に行きました。湖では、みんなでボートに乗ります。ボートには、1そうに${v.c}人まで乗ることができます。先生も子どもたちといっしょに、どのボートにも乗れるだけつめて乗ることにしました。ボートのかし出し料金は、1そうにつき${v.fee}円です。`,
                `お昼ごはんのあと、先生が、1ふくろに${v.k}こ入っているあめを${v.bag}ふくろ開けました。そして、子どもたち全員に、同じ数ずつ、できるだけ多くなるように配りました。あまったあめは、先生たちで分けました。`,
            ],
            questions: [
                q('先生と子どもたちの全員がボートに乗るには、ボートは少なくとも何そういりますか。', v.boats, 'そう', [v.boats - 1, Math.ceil(v.n / v.c)]),
                q('そのとき、ボートのかし出し料金は全部で何円になりますか。', v.boats * v.fee, '円', [(v.boats - 1) * v.fee, (v.boats + 1) * v.fee], { step: 100 }),
                q('あめは何こあまりましたか。', candy % v.n, 'こ', [Math.floor(candy / v.n), candy % (v.n + v.t)]),
            ],
        };
    },
]);

export default [...kaimono, ...ryougae, ...jikoku, ...hyou, ...amari];
