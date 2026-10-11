import { defineTopic } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { shape, rectPoints } from '../figures.js';
import { q, until, schools } from '../util.js';

const match = defineTopic('g45-match', '図形のきまり', [
    (r) => {
        const p = r.pick(names);
        const [n, n2, n3] = [r.int(12, 25), r.int(30, 60), r.int(8, 20)];
        const lines = [];
        for (let i = 0; i < 4; i++) {
            lines.push({ from: [i * 2, 0], to: [i * 2 + 2, 0] }, { from: [i * 2, 2], to: [i * 2 + 2, 2] }, { from: [i * 2, 0], to: [i * 2, 2] });
        }
        lines.push({ from: [8, 0], to: [8, 2] });
        return {
            text: [
                `${p}さんは、同じ長さのぼうをたくさん使って、下の図のように、正方形を横に1列につなげた形を作っています。図は、正方形を4個つなげたところです。となり合う正方形は、間にある1本のぼうを共有しています。`,
                `正方形を1個だけ作るには、ぼうが4本いります。正方形を2個つなげた形を作るには、間のぼうが共通なので、ぼうは7本ですみます。3個つなげた形では10本、4個つなげた形では13本というように、正方形を1個ふやすごとに、いるぼうの数は同じ数ずつふえていきます。`,
                `${p}さんは、このきまりを使って、もっとたくさんの正方形をつなげたときのぼうの本数を、計算でもとめることにしました。さらに、正方形を上下2だんに重ねて、同じ数ずつ横につなげた形についても、考えてみることにしました。この形では、上のだんと下のだんの間にあるぼうも共有します。`,
            ],
            figure: shape(8, 2, { lines }),
            questions: [
                q(`正方形を横に1列に${n}個つなげた形を作るには、ぼうは何本いりますか。`, 3 * n + 1, '本', [4 * n, 3 * n, 3 * n + 4]),
                q(`ぼうをちょうど${3 * n2 + 1}本使うと、正方形を横に1列に何個つなげた形ができますか。`, n2, '個', [n2 + 1, n2 - 1, Math.floor((3 * n2 + 1) / 4)]),
                q(`正方形を上下2だんにして、横に${n3}個ずつつなげた形（正方形は全部で${2 * n3}個）を作るには、ぼうは何本いりますか。`, 5 * n3 + 2, '本', [2 * (3 * n3 + 1), 6 * n3 + 1, 5 * n3]),
            ],
        };
    },
]);

const fukugou = defineTopic('g45-fukugou', '複合図形の面積', [
    (r) => {
        const v = until(r, () => {
            const [a, b] = [r.int(8, 14), r.int(15, 24)];
            const [c, d] = [r.int(4, 8), r.int(2, 5)];
            const left = r.int(3, b - c - 3);
            const e = r.int(6, 12);
            const area = a * b - c * d;
            return { a, b, c, d, left, e, area };
        }, x => x.area % x.e === 0 && x.area / x.e !== x.b);
        const pts = [[0, 0], [v.b, 0], [v.b, v.a], [v.left + v.c, v.a], [v.left + v.c, v.a - v.d], [v.left, v.a - v.d], [v.left, v.a], [0, v.a]];
        return {
            text: [
                `${r.pick(schools)}小学校では、学校のうらにある土地を畑にして、5年生が野菜を育てることになりました。畑にする土地は、下の図のような形をしています。`,
                `この土地は、もともと、たて${v.a}m、横${v.b}mの長方形でした。ところが、土地の北側のまん中あたりに、古い物置小屋が建っているので、その部分だけは畑にすることができません。物置小屋の部分は、横${v.c}m、おく行き${v.d}mの長方形で、土地の北側の辺にぴったり接しています。図の角は、すべて直角です。`,
                `5年生は、まず、この畑のまわりに、ぐるりと1しゅう、動物よけのあみをはることにしました。あみは、物置小屋の3つの面にもそって、図の太い線のとおりにはります。`,
                `また、来年は、この畑と同じ面積で、たての長さが${v.e}mの長方形の畑を、べつの場所に作る計画があります。`,
                '畑の面積は、もとの長方形の土地の面積から、物置小屋の部分の面積をひいてもとめることができます。',
            ],
            figure: shape(v.b, v.a, {
                polys: [{ points: pts, fill: 'shade' }],
                dims: [
                    { from: [0, 0], to: [v.b, 0], text: `${v.b}m`, side: 'below' },
                    { from: [0, 0], to: [0, v.a], text: `${v.a}m`, side: 'left' },
                    { from: [v.left, v.a - v.d], to: [v.left + v.c, v.a - v.d], text: `${v.c}m`, side: 'above' },
                    { from: [v.left + v.c, v.a - v.d], to: [v.left + v.c, v.a], text: `${v.d}m`, side: 'right' },
                ],
            }),
            questions: [
                q('畑にする土地の面積は何m²ですか。', v.area, 'm²', [v.a * v.b, v.a * v.b - v.c - v.d, v.area + v.c * v.d * 2]),
                q('畑のまわりにはるあみの長さは、全部で何mですか。', 2 * (v.a + v.b) + 2 * v.d, 'm', [2 * (v.a + v.b), 2 * (v.a + v.b) - 2 * v.d, 2 * (v.a + v.b) + 2 * v.d + v.c]),
                q('来年作る長方形の畑の、横の長さは何mになりますか。', v.area / v.e, 'm', [(v.a * v.b) / v.e, v.area / v.e + 2, v.area / v.a]),
            ],
        };
    },
]);

const rittai = defineTopic('g45-rittai', '直方体の体積と表面積', [
    (r) => {
        const p = r.pick(names);
        const e = r.pick([2, 3, 4, 5]);
        const v = until(r, () => ({ a: e * r.int(2, 5), b: e * r.int(3, 7), c: e * r.int(2, 4) }), x => x.b > x.a);
        const [a, b, c] = [v.a, v.b, v.c];
        const k = 0.45; // おく行きを図にかくときのちぢめ方
        const [dx, dy] = [a * k, a * k * 0.7];
        return {
            text: [
                `${p}さんは、図工の時間に、あつ紙を使って、ふたのついた直方体の箱を作りました。箱は、下の図のような形をしていて、横の長さが${b}cm、おく行きが${a}cm、高さが${c}cmです。あつ紙のあつさは、考えないものとします。`,
                `${p}さんは、この箱の外がわの6つの面すべてに、きれいな色紙をすきまなく、重ならないようにはって、小物入れにすることにしました。直方体では、向かい合う2つの面は、形も大きさも同じです。`,
                `できあがった箱には、弟が遊んでいる、1辺が${e}cmの立方体の積み木をしまうことにしました。積み木は、どれも同じ大きさです。${p}さんは、箱の中に積み木をすきまなくきちんとならべて、できるだけたくさん入れました。`,
                '直方体の体積は、「たて×横×高さ」でもとめることができます。また、直方体の表面積は、6つの面の面積を全部たしたものです。積み木を箱に入れるときは、横、おく行き、高さのそれぞれの向きに、積み木が何個ずつならぶかを考えます。',
            ],
            figure: shape(b + dx, c + dy, {
                polys: [
                    { points: rectPoints(0, 0, b, c), fill: 'shade' },
                    { points: [[0, c], [b, c], [b + dx, c + dy], [dx, c + dy]] },
                    { points: [[b, 0], [b + dx, dy], [b + dx, c + dy], [b, c]] },
                ],
                dims: [
                    { from: [0, 0], to: [b, 0], text: `${b}cm`, side: 'below' },
                    { from: [0, 0], to: [0, c], text: `${c}cm`, side: 'left' },
                    { from: [b, 0], to: [b + dx, dy], text: `${a}cm`, side: 'right' },
                ],
            }),
            questions: [
                q('この箱の体積は何cm³ですか。', a * b * c, 'cm³', [2 * (a * b + b * c + c * a), a * b + c, a * b * c + a * b], { step: 10 }),
                q('箱の外がわにはる色紙の面積は、全部で何cm²ですか。', 2 * (a * b + b * c + c * a), 'cm²', [a * b + b * c + c * a, a * b * c, 2 * (a * b + b * c + c * a) - a * b], { step: 2 }),
                q('この箱には、積み木を全部で何個入れることができますか。', (a / e) * (b / e) * (c / e), '個', [(a * b * c) / e, (a / e) * (b / e), a / e + b / e + c / e]),
            ],
        };
    },
]);

const suisou = defineTopic('g45-suisou', '水そうと水の深さ', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [a, b, h] = [r.int(2, 5) * 10, r.int(4, 8) * 10, r.int(30, 50)];
            const h1 = r.int(10, 20);
            const rise = r.int(2, 6);
            const flow = r.int(2, 6);
            return { a, b, h, h1, rise, flow, minutes: (a * b * (h - h1 - rise)) / 1000 / flow };
        }, x => x.b > x.a && Number.isInteger(x.minutes) && x.minutes >= 2);
        const liters = (v.a * v.b * v.h1) / 1000;
        const top = v.h1 + v.rise;
        return {
            text: [
                `${p}さんの教室では、直方体の形をしたガラスの水そうで、メダカをかうことになりました。水そうの内のりは、たて${v.a}cm、横${v.b}cm、深さ${v.h}cmです。下の図は、この水そうを正面から見たようすです。なお、1Lは1000cm³です。`,
                `はじめに、${p}さんたちは、からの水そうに、底から${v.h1}cmの深さまで水を入れました。`,
                `次に、メダカのかくれ場所にするために、大きな石を1つ、水の中にしずめました。石は、全体がすっかり水の中にしずみました。すると、水面が上がって、水の深さは${top}cmになりました。水そうから水はこぼれていません。`,
                `そうじ当番の人が、うっかりして、じゃ口の水を出したままにしてしまいました。石をしずめたままの水そうに、1分間に${v.flow}Lの割合で水が入り続けています。`,
                '石を水の中にすっかりしずめると、石の体積と同じ体積の分だけ、水面がおし上げられます。',
            ],
            figure: shape(v.b, v.h, {
                polys: [{ points: rectPoints(0, 0, v.b, top), fill: 'water' }, { points: [[0, v.h], [0, 0], [v.b, 0], [v.b, v.h]] }],
                dims: [
                    { from: [0, 0], to: [v.b, 0], text: `${v.b}cm`, side: 'below' },
                    { from: [0, 0], to: [0, v.h], text: `${v.h}cm`, side: 'left' },
                    { from: [v.b, 0], to: [v.b, top], text: `${top}cm`, side: 'right' },
                ],
            }, 'tank'),
            questions: [
                q('はじめに水そうに入れた水は、何Lですか。', liters, 'L', [liters * 10, (v.a * v.b * v.h) / 1000, liters / 10], { step: Number.isInteger(liters) ? 1 : 0.5 }),
                q('しずめた石の体積は何cm³ですか。', v.a * v.b * v.rise, 'cm³', [v.a * v.b * top, v.a * v.b, v.a * v.b * v.rise + v.a * v.b], { step: 100 }),
                q('このまま水が入り続けると、水そうから水があふれ始めるのは、水を出しっぱなしにしてから何分後ですか。', v.minutes, '分後', [(v.a * v.b * (v.h - v.h1)) / 1000 / v.flow, (v.a * v.b * v.h) / 1000 / v.flow, v.minutes + 2]),
            ],
        };
    },
]);

export default [...match, ...fukugou, ...rittai, ...suisou];
