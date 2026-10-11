import { defineTopic } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { graph, shape, rectPoints } from '../figures.js';
import { q, until } from '../util.js';

const PI_NOTE = '円周率は3.14とします。';
const pi = v => (v * 314) / 100;

const suisouGraph = defineTopic('g6-suisou-graph', '水そうとグラフ', [
    (r) => {
        const v = until(r, () => {
            const [depth, width, block] = [r.pick([20, 30, 40]), r.pick([50, 60, 80]), r.pick([20, 30, 40])];
            const [h1, height] = [r.pick([10, 15, 20]), r.pick([30, 40, 50])];
            const flow = r.pick([2, 3, 4, 6]) * 1000; // 1分間に入る水（cm³）
            const t1 = ((width - block) * depth * h1) / flow;
            const t2 = t1 + (width * depth * (height - h1)) / flow;
            const up = r.int(1, 3) * 5;
            return { depth, width, block, h1, height, flow, t1, t2, up, t3: t1 + (width * depth * up) / flow };
        }, x => x.block < x.width - 10 && [x.t1, x.t2, x.t3].every(Number.isInteger) && x.h1 + x.up < x.height && x.t1 >= 2);
        return {
            text: [
                `図1のような、直方体の形をしたガラスの水そうがあります。水そうの内のりは、横が${v.width}cm、おく行きが${v.depth}cm、深さが${v.height}cmです。この水そうの底には、左のかべにぴったりつけて、直方体の形をした鉄のブロックが1つ置いてあります。ブロックのおく行きは、水そうのおく行きと同じ${v.depth}cmなので、水そうを正面から見ると、図1のように、底の左がわに段がついているように見えます。`,
                `このからの水そうに、じゃ口から、1分間あたり一定の量の水を入れていきました。水は、はじめ、ブロックのない右がわの部分にたまっていきます。水面がブロックの上の面と同じ高さになると、そのあとは、水そう全体に水が広がるので、水面の上がり方がそれまでよりもゆっくりになります。`,
                `図2のグラフは、水を入れ始めてからの時間（分）と、水そうの底からはかった水の深さ（cm）の関係を表したものです。グラフが折れ曲がっているところは、水面がちょうどブロックの上の面と同じ高さになったときを表しています。グラフの右はしは、水そうがちょうどいっぱいになったときを表しています。`,
                `グラフのかたむきが急なところは、水面が速く上がっていることを表し、かたむきがゆるやかなところは、水面がゆっくり上がっていることを表しています。水そうに入った水の体積は、「水が入っている部分の底面積×水の深さ」でもとめることができます。なお、1Lは1000cm³です。`,
            ],
            figure: [
                shape(v.width, v.height, {
                    polys: [{ points: rectPoints(0, 0, v.block, v.h1), fill: 'shade' }, { points: rectPoints(0, 0, v.width, v.height) }],
                    dims: [
                        { from: [0, 0], to: [v.width, 0], text: `${v.width}cm`, side: 'below' },
                        { from: [v.width, 0], to: [v.width, v.height], text: `${v.height}cm`, side: 'right' },
                        { from: [0, v.h1], to: [v.block, v.h1], text: '？cm', side: 'above' },
                    ],
                    labels: [{ at: [v.block / 2, v.h1 / 2], text: 'ブロック' }, { at: [v.width / 2, v.height + 3], text: '図1（正面から見た図）' }],
                }, 'tank'),
                graph({
                    xLabel: '時間（分）', yLabel: '深さ（cm）　図2', xMax: v.t2 * 1.08, yMax: v.height * 1.12,
                    xTicks: [{ v: 0, text: '0' }, { v: v.t1, text: `${v.t1}` }, { v: v.t2, text: `${v.t2}` }],
                    yTicks: [{ v: v.h1, text: `${v.h1}` }, { v: v.height, text: `${v.height}` }],
                    lines: [{ points: [[0, 0], [v.t1, v.h1], [v.t2, v.height]] }],
                }),
            ],
            questions: [
                q('じゃ口から入れている水の量は、1分間あたり何Lですか。', v.flow / 1000, 'L', [(v.width * v.depth * v.height) / v.t2 / 1000, v.flow / 100, v.flow / 1000 + 1], { step: 0.5 }),
                q('ブロックの横の長さ（図1の？の長さ）は何cmですか。', v.block, 'cm', [v.width - v.block, v.h1, v.block + 5], { step: 5 }),
                q(`水の深さが${v.h1 + v.up}cmになるのは、水を入れ始めてから何分後ですか。`, v.t3, '分後', [(v.width * v.depth * (v.h1 + v.up)) / v.flow, v.t3 + 1, v.t3 - v.t1]),
            ],
        };
    },
]);

const tenIdou = defineTopic('g6-ten-idou', '点の移動と面積', [
    (r) => {
        const v = until(r, () => {
            const sp = r.int(1, 3);
            const [t1, tb] = [r.int(4, 8), r.int(5, 10)];
            const k = r.int(1, t1 - 1);
            return { sp, t1, tb, k, a: sp * t1, b: sp * tb };
        }, x => x.a !== x.b && (x.a * x.b) % 2 === 0 && (x.b * x.sp * x.k) % 2 === 0);
        const max = (v.a * v.b) / 2;
        const t2 = v.t1 + v.tb;
        const end = t2 + v.t1;
        const target = (v.b * (v.a - v.sp * v.k)) / 2;
        return {
            text: [
                `図1のような長方形ABCDがあります。辺ADの長さは${v.b}cmです。辺ABの長さは、図には書かれていません。`,
                `点Pは、頂点Aを出発して、長方形の辺の上を、A→B→C→Dの順に、毎秒一定の速さで動き、頂点Dに着いたところで止まります。点Pは、とちゅうで止まったり、速さを変えたり、もどったりすることはありません。`,
                `点Pが動いている間、3つの点A、P、Dをむすんでできる三角形APDを考えます。図2のグラフは、点Pが頂点Aを出発してからの時間（秒）と、三角形APDの面積（cm²）の関係を表したものです。ただし、点Pが頂点Aや頂点Dの上にあるときは、三角形ができないので、面積は0cm²と考えます。`,
                `三角形APDの面積は、辺ADを底辺と考えると、「底辺×高さ÷2」でもとめることができます。点Pが辺ABの上を動いている間は、APの長さが高さになるので、点Pが進むにつれて、面積は一定の割合でふえていきます。点Pが辺BCの上を動いている間は、高さが辺ABの長さと同じままで変わらないので、面積も変わりません。このとき、グラフは横じくと平行になります。点Pが辺CDの上を動いている間は、PDの長さが高さになるので、点Pが進むにつれて、面積は一定の割合でへっていきます。`,
                `グラフの横じくの目もりのうち、アにあてはまる数は、グラフには書かれていません。`,
            ],
            figure: [
                shape(v.b, v.a, {
                    polys: [{ points: [[0, v.a], [0, v.a * 0.45], [v.b, v.a]], fill: 'shade' }, { points: rectPoints(0, 0, v.b, v.a) }],
                    dims: [{ from: [0, v.a], to: [v.b, v.a], text: `${v.b}cm`, side: 'above' }],
                    points: [
                        { at: [0, v.a], text: 'A', dx: -12, dy: -6 }, { at: [0, 0], text: 'B', dx: -12, dy: 16 },
                        { at: [v.b, 0], text: 'C', dx: 12, dy: 16 }, { at: [v.b, v.a], text: 'D', dx: 12, dy: -6 },
                        { at: [0, v.a * 0.45], text: 'P', dx: -12, dy: 5 },
                    ],
                    labels: [{ at: [v.b / 2, -v.a * 0.12], text: '図1' }],
                }),
                graph({
                    xLabel: '時間（秒）', yLabel: '面積（cm²）　図2', xMax: end * 1.06, yMax: max * 1.15,
                    xTicks: [{ v: 0, text: '0' }, { v: v.t1, text: `${v.t1}` }, { v: t2, text: `${t2}` }, { v: end, text: 'ア' }],
                    yTicks: [{ v: max, text: `${max}` }],
                    lines: [{ points: [[0, 0], [v.t1, max], [t2, max], [end, 0]] }],
                }),
            ],
            questions: [
                q('辺ABの長さは何cmですか。', v.a, 'cm', [max / v.b, v.a * 2, v.b], { step: 1 }),
                q('点Pが動く速さは、毎秒何cmですか。', v.sp, 'cm', [v.a, v.sp + 1, v.sp * 2], { prefix: '毎秒', step: 0.5 }),
                q(`三角形APDの面積が2回目に${target}cm²になるのは、点Pが頂点Aを出発してから何秒後ですか。`, t2 + v.k, '秒後', [v.t1 - v.k, end - v.k, t2]),
            ],
        };
    },
]);

const korogari = defineTopic('g6-korogari', '図形の転がり', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => ({ rad: r.int(1, 3), a: r.int(6, 12), b: r.int(10, 20) }), x => x.b > x.a + 1 && x.a > 4 * x.rad);
        const peri = 2 * (v.a + v.b);
        const d = 2 * v.rad;
        return {
            text: [
                `${p}さんは、算数の自由研究で、図形が転がるときのようすについて調べました。下の図のように、たて${v.a}cm、横${v.b}cmの長方形があり、その外がわに、半径${v.rad}cmの円がくっついています。この円を、長方形の辺からはなれないように、また、すべらないように、長方形のまわりにそって転がして、ちょうど1しゅうさせて、もとの位置までもどします。${PI_NOTE}`,
                `円が長方形のまっすぐな辺にそって転がっている間、円の中心は、その辺からいつも${v.rad}cmはなれたところを、辺と平行に、まっすぐに動きます。このとき、円の中心が動く長さは、その辺の長さと同じです。`,
                `円が長方形の頂点のところを回るときは、円は頂点にふれたまま、向きを変えます。このとき、円の中心は、長方形の頂点を中心とする半径${v.rad}cmの円の一部をえがきます。長方形の角は直角なので、1つの頂点を回るときに円の中心がえがく線は、円周のちょうど4分の1になります。頂点は4つあるので、4つの頂点で円の中心がえがく線を全部合わせると、半径${v.rad}cmの円1つ分の円周と同じ長さになります。`,
                `次に、${p}さんは、同じ円を、こんどは長方形の内がわに入れて、辺からはなれないように、内がわにそって1しゅうさせることも考えました。内がわを転がるとき、円は角のおくまでは入りこめないので、円の中心は、4つの辺からそれぞれ${v.rad}cmずつ内がわにある、小さな長方形のまわりを動くことになります。`,
            ],
            figure: shape(v.b + 2 * d, v.a + 2 * d, {
                polys: [{ points: rectPoints(d, d, v.b, v.a), fill: 'shade' }, { points: rectPoints(d - v.rad, d - v.rad, v.b + d, v.a + d), dashed: true }],
                circles: [{ cx: d + v.b * 0.3, cy: d + v.a + v.rad, r: v.rad }],
                dims: [{ from: [d, d], to: [d + v.b, d], text: `${v.b}cm`, side: 'above' }, { from: [d, d], to: [d, d + v.a], text: `${v.a}cm`, side: 'right' }],
            }, 'circle'),
            questions: [
                q('円が長方形の外がわを1しゅうするとき、円の中心が動いた長さは何cmですか。', peri + pi(d), 'cm', [peri, peri + pi(v.rad), peri + 8 * v.rad], { step: 0.5 }),
                q('円が長方形の外がわを1しゅうするとき、円が通りすぎた部分の面積は何cm²ですか。', peri * d + pi(d * d), 'cm²', [peri * d, peri * d + pi(v.rad * v.rad), peri * v.rad + pi(d * d)], { step: 1 }),
                q('円が長方形の内がわを1しゅうするとき、円の中心が動いた長さは何cmですか。', peri - 8 * v.rad, 'cm', [peri - 4 * v.rad, peri - 8 * v.rad + 2, peri]),
            ],
        };
    },
]);

const kage = defineTopic('g6-kage', '相似とかげ', [
    (r) => {
        const p = r.pick(names);
        // [街灯の高さ×10, 身長×10]（高さの差と身長の比がかんたんになる組）
        const [lamp, body] = r.pick([[45, 15], [60, 15], [36, 12], [48, 12], [60, 12], [48, 16], [64, 16]]);
        const ratio = (lamp - body) / body; // 街灯からのきょり ÷ かげの長さ
        const shadow = r.int(2, 6);
        const d1 = shadow * ratio;
        const shadow2 = shadow + r.int(1, 4);
        const sp = r.pick([6, 12]);
        const tip = (sp * lamp) / (lamp - body) / 10;
        const H = lamp / 10;
        const h = body / 10;
        return {
            text: [
                `夜、${p}さんは、公園の広場に立っている街灯の近くで、自分のかげの長さについて調べました。街灯の明かりは、地面から${H}mの高さのところについています。${p}さんの身長は${h}mです。広場の地面は平らで、${p}さんは、いつも地面に対してまっすぐに立っているものとします。`,
                `下の図は、そのようすを真横から見たものです。街灯の明かりから出た光は、まっすぐに進みます。${p}さんの頭の先をかすめた光が地面にとどくところが、かげの先になります。このとき、「街灯の明かり、街灯の根もと、かげの先」をむすんでできる大きな直角三角形と、「${p}さんの頭の先、${p}さんの足もと、かげの先」をむすんでできる小さな直角三角形は、形が同じで大きさだけがちがう三角形になっています。このような2つの図形を「相似」といい、対応する辺の長さの比は、どこも等しくなります。`,
                `はじめ、${p}さんは、街灯の根もとから${d1}mはなれたところに立って、自分のかげの長さをはかりました。次に、街灯からもう少しはなれたところに立つと、かげの長さは${shadow2}mになりました。`,
                `さいごに、${p}さんは、街灯の真下から出発して、街灯からまっすぐに遠ざかるように、毎秒${sp / 10}mの一定の速さで歩きました。このとき、${p}さんのかげの先も、地面の上を、街灯から遠ざかる向きに一定の速さで動いていきました。`,
            ],
            figure: shape(12, 6, {
                lines: [
                    { from: [0, 0], to: [12, 0] }, { from: [1, 0], to: [1, 5.4] }, { from: [6, 0], to: [6, 1.8] },
                    { from: [1, 5.4], to: [8.5, 0], dashed: true },
                ],
                circles: [{ cx: 1, cy: 5.4, r: 0.3, fill: 'shade' }],
                dims: [{ from: [1, 0], to: [6, 0], text: `${d1}m`, side: 'below' }, { from: [6, 0], to: [8.5, 0], text: 'かげ', side: 'below' }],
                labels: [{ at: [3.2, 5.5], text: `街灯 ${H}m` }, { at: [6.9, 2.2], text: `${h}m` }],
            }),
            questions: [
                q(`街灯の根もとから${d1}mはなれたところに立ったとき、${p}さんのかげの長さは何mですか。`, shadow, 'm', [d1, d1 * ratio, shadow + 1], { step: 0.5 }),
                q(`かげの長さが${shadow2}mになったとき、${p}さんは街灯の根もとから何mはなれたところに立っていますか。`, shadow2 * ratio, 'm', [shadow2, shadow2 * (ratio + 1), shadow2 * ratio + 1], { step: 1 }),
                q(`${p}さんが毎秒${sp / 10}mの速さで歩いているとき、かげの先は毎秒何mの速さで動きますか。`, tip, 'm', [sp / 10, (sp * body) / (lamp - body) / 10, tip + 0.3], { prefix: '毎秒', step: 0.1 }),
            ],
        };
    },
]);

const ougi = defineTopic('g6-ougi', '円とおうぎ形', [
    (r) => {
        const p = r.pick(names);
        const a = r.pick([4, 6, 8, 10, 12, 20]);
        const quarter = pi(a * a) / 4;
        const lens = quarter * 2 - a * a;
        return {
            text: [
                `${p}さんは、図工の時間に、コンパスとじょうぎを使って、もようをかきました。まず、1辺の長さが${a}cmの正方形ABCDをかきました。次に、コンパスのはりを頂点Bにさして、半径${a}cmで、頂点Aから頂点Cまで、正方形の内がわに曲線をかきました。同じように、こんどはコンパスのはりを頂点Dにさして、半径${a}cmで、頂点Aから頂点Cまで、正方形の内がわに曲線をかきました。すると、下の図のように、正方形の中に、2本の曲線でかこまれた、木の葉のような形ができました。図では、この木の葉のような形をアで表しています。${PI_NOTE}`,
                `頂点Bを中心としてかいた曲線と、正方形の2つの辺BA、BCでかこまれた形は、半径${a}cm、中心角90度のおうぎ形です。これは、半径${a}cmの円を、ちょうど4等分したうちの1つ分にあたります。頂点Dを中心としてかいた曲線についても、同じように、辺DA、DCとの間に、半径${a}cm、中心角90度のおうぎ形ができています。`,
                `この2つのおうぎ形は、どちらも正方形の中にぴったりおさまっていて、たがいに重なり合っています。その重なっている部分が、アの形です。ですから、2つのおうぎ形の面積をたすと、正方形の面積よりも、アの面積の分だけ多くなります。このことを使うと、曲線でかこまれたアの面積を、計算でもとめることができます。`,
                `${p}さんは、できあがったもようのアの部分に色をぬり、そのふちを、金色の糸でかざることにしました。`,
            ],
            figure: shape(a, a, {
                polys: [{ points: rectPoints(0, 0, a, a) }],
                sectors: [{ cx: 0, cy: 0, r: a, from: 0, to: 90 }, { cx: a, cy: a, r: a, from: 180, to: 270 }],
                points: [
                    { at: [0, a], text: 'A', dx: -12, dy: -6 }, { at: [0, 0], text: 'B', dx: -12, dy: 16 },
                    { at: [a, 0], text: 'C', dx: 12, dy: 16 }, { at: [a, a], text: 'D', dx: 12, dy: -6 },
                ],
                labels: [{ at: [a / 2, a / 2], text: 'ア' }],
                dims: [{ from: [0, 0], to: [a, 0], text: `${a}cm`, side: 'below' }],
            }, 'circle'),
            questions: [
                q('頂点Bを中心とするおうぎ形1つ分の面積は何cm²ですか。', quarter, 'cm²', [pi(a * a), pi(a * a) / 2, pi(2 * a) / 4], { step: 0.5 }),
                q('アの部分の面積は何cm²ですか。', lens, 'cm²', [a * a - quarter, quarter - (a * a) / 2, lens * 2], { step: 0.5 }),
                q('アの部分のまわりの長さ（かざりの糸の長さ）は何cmですか。', pi(a), 'cm', [pi(a) / 2, pi(2 * a), pi(a) + 2 * a], { step: 0.5 }),
            ],
        };
    },
]);

const suii = defineTopic('g6-suii', '立体と水位', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [a, b, c] = [r.int(2, 5) * 5, r.int(3, 6) * 5, r.int(1, 2) * 5];
            const [h, height, u] = [r.int(8, 24), r.int(30, 40), r.int(2, 8)];
            const base = a * b;
            const h2 = (base * h) / (base - c * c);
            const h3 = (base * h - c * c * u) / (base - c * c);
            return { a, b, c, h, height, u, base, h2, h3 };
        }, x => x.b > x.a && x.c < x.a && Number.isInteger(x.h2) && Number.isInteger(x.h3) && x.h2 < x.height - 2 && x.h3 > x.u && x.h2 !== x.h);
        return {
            text: [
                `${p}さんは、理科室で、水の体積と深さの関係を調べる実験をしました。使ったのは、直方体の形をした、とうめいな容器です。容器の内のりは、底面がたて${v.a}cm、横${v.b}cmの長方形で、深さは${v.height}cmあります。${p}さんは、まず、この容器に、底から${v.h}cmの深さまで水を入れました。`,
                `次に、底面が1辺${v.c}cmの正方形で、高さが${v.height + 10}cmある、直方体の形をした金ぞくのぼうを用意しました。ぼうは容器の深さよりも長いので、容器の中にまっすぐに立てても、ぼうの上のはしは、いつも水面よりも上に出ています。`,
                `【実験1】このぼうを、底面を下にして、容器の底にぴったりつくまで、まっすぐにしずめました。すると、ぼうが水をおしのけた分だけ、水面が上がりました。水はこぼれていません。下の図は、このときのようすを正面から見たものです。このとき、水が入っているのは、容器の底面からぼうの底面をのぞいた部分の上だけです。水の体積そのものは、ぼうを入れる前と変わっていないので、「水の体積÷水が入っている部分の底面積」で、水の深さをもとめることができます。`,
                `【実験2】実験1の状態から、ぼうをまっすぐに${v.u}cmだけ引き上げて、そのまま手で止めました。すると、ぼうの下にも水が入りこんだので、水面は実験1のときよりも下がりました。このときも、ぼうの上のはしは、水面より上に出ています。`,
            ],
            figure: shape(v.b, v.height, {
                polys: [
                    { points: rectPoints(0, 0, v.b, v.h2), fill: 'water' },
                    { points: rectPoints(v.b * 0.4, 0, v.c, v.height + 3), fill: 'shade' },
                    { points: rectPoints(0, 0, v.b, v.height) },
                ],
                dims: [
                    { from: [0, 0], to: [v.b, 0], text: `${v.b}cm`, side: 'below' },
                    { from: [0, 0], to: [0, v.height], text: `${v.height}cm`, side: 'left' },
                    { from: [v.b, 0], to: [v.b, v.h2], text: '？cm', side: 'right' },
                ],
            }, 'tank'),
            questions: [
                q('容器に入れた水の体積は何cm³ですか。', v.base * v.h, 'cm³', [v.base * v.height, v.base * v.h2, (v.base - v.c * v.c) * v.h], { step: 50 }),
                q('実験1で、ぼうを底までしずめたとき、水の深さは何cmになりましたか。', v.h2, 'cm', [v.h + v.c, v.h + (v.c * v.c * v.h) / v.base, v.h2 + 2], { step: 1 }),
                q(`実験2で、ぼうを${v.u}cm引き上げたとき、水の深さは何cmになりましたか。`, v.h3, 'cm', [v.h2 - v.u, v.h, v.h3 + 1], { step: 1 }),
            ],
        };
    },
]);

export default [...suisouGraph, ...tenIdou, ...korogari, ...kage, ...ougi, ...suii];
