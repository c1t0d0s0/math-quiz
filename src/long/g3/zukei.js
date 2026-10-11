import { defineTopic } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { route, shape, rectPoints } from '../figures.js';
import { q, until, schools } from '../util.js';

const tenbin = defineTopic('g3-tenbin', 'てんびんと重さ', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [m, k, j] = [r.int(8, 12) * 10, r.int(2, 4), r.pick([2, 3])];
            return { m, k, j, apple: m * k, kaki: (m * k + m) / j, basket: r.int(15, 35) * 10 };
        }, x => Number.isInteger(x.kaki) && x.kaki % 10 === 0 && x.kaki !== x.apple);
        const total = v.apple * 2 + v.kaki * 3 + v.basket;
        return {
            text: [
                `${p}さんは、理科室にあるてんびんを使って、りんご、みかん、かきの重さをくらべました。同じしゅるいのくだものは、どれも同じ重さだとします。`,
                `まず、てんびんの左の皿にりんごを1このせ、右の皿にみかんをのせていくと、みかんを${v.k}このせたときに、ちょうどつり合いました。次に、左の皿にりんご1ことみかん1こをのせ、右の皿にかきをのせていくと、かきを${v.j}このせたときに、ちょうどつり合いました。`,
                `そのあと、みかん1この重さをはかりではかると、${v.m}gでした。さいごに、りんご2ことかき3こをかごに入れて、かごごとはかりにのせると、はりは${total}gをさしました。`,
            ],
            questions: [
                q('りんご1この重さは何gですか。', v.apple, 'g', [v.m, v.apple + v.m], { step: 10 }),
                q('かき1この重さは何gですか。', v.kaki, 'g', [v.apple + v.m, v.apple / v.j], { step: 10 }),
                q('かごだけの重さは何gですか。', v.basket, 'g', [total - v.apple - v.kaki, v.basket + v.kaki], { step: 10 }),
            ],
        };
    },
]);

const kadan = defineTopic('g3-kadan', '長方形のまわり', [
    (r) => {
        const d = r.pick([2, 3]);
        const v = until(r, () => ({ a: d * r.int(2, 5), b: d * r.int(4, 9), w: r.int(1, 2) }), x => x.b > x.a);
        const peri = 2 * (v.a + v.b);
        const outer = 2 * (v.a + v.b + 4 * v.w);
        return {
            text: [
                `${r.pick(schools)}小学校の校庭には、たて${v.a}m、横${v.b}mの長方形の花だんがあります。この花だんに動物が入らないように、花だんのまわりを、ロープでぐるりと1しゅうかこむことになりました。`,
                `ロープをとめるために、花だんの4つの角にくいを1本ずつ打ち、さらに、角から${d}mおきにもくいを打っていきます。`,
                `また、下の図のように、花だんの外がわには、ぐるりとはば${v.w}mの道を作ります。図で色をつけたところが花だんで、そのまわりの白いところが道です。道の外がわのふちには、レンガを1列にならべてかざることにしました。`,
            ],
            figure: shape(v.b + 2 * v.w, v.a + 2 * v.w, {
                polys: [{ points: rectPoints(0, 0, v.b + 2 * v.w, v.a + 2 * v.w) }, { points: rectPoints(v.w, v.w, v.b, v.a), fill: 'shade' }],
                dims: [
                    { from: [v.w, 0], to: [v.w + v.b, 0], text: `${v.b}m`, side: 'below' },
                    { from: [v.b + 2 * v.w, v.w], to: [v.b + 2 * v.w, v.w + v.a], text: `${v.a}m`, side: 'right' },
                    { from: [0, v.a + 2 * v.w], to: [v.w, v.a + 2 * v.w], text: `${v.w}m`, side: 'above' },
                ],
                labels: [{ at: [v.w + v.b / 2, v.w + v.a / 2], text: '花だん' }],
            }),
            questions: [
                q('花だんのまわりをちょうど1しゅうするロープの長さは何mですか。', peri, 'm', [v.a + v.b, v.a * v.b, peri + 4]),
                q('くいは、全部で何本いりますか。', peri / d, '本', [peri / d + 1, peri / d + 4, peri / d - 4]),
                q('道の外がわのふちを1しゅうする長さは何mですか。', outer, 'm', [peri + 4 * v.w, peri + 2 * v.w, 2 * (v.a + v.b + 2 * v.w)]),
            ],
        };
    },
]);

const norishiro = defineTopic('g3-norishiro', 'テープののりしろ', [
    (r) => {
        const p = r.pick(names);
        const [a, g, n] = [r.int(12, 20), r.int(1, 3), r.int(6, 12)];
        const len = a * n - g * (n - 1);
        const n2 = n + r.int(3, 8);
        const len2 = a * n2 - g * (n2 - 1);
        return {
            text: [
                `${p}さんは、お楽しみ会のかざりを作るために、長さ${a}cmの紙テープをたくさん用意しました。この紙テープを、下の図のように、はしとはしを${g}cmずつ重ねて、のりではり合わせ、まっすぐに長くつないでいきます。重ねてはり合わせる部分を「のりしろ」といいます。`,
                `${p}さんは、まず紙テープを${n}本つないで、1本の長いテープを作りました。ところが、教室のかべにはるには長さが足りなかったので、同じつなぎ方で、さらに紙テープをつなぎ足していくことにしました。`,
                `また、友だちは、同じ紙テープを${n}本使い、はしとはしも同じように${g}cm重ねてはり合わせて、大きな輪を作りました。`,
            ],
            figure: shape(30, 6, {
                polys: [
                    { points: rectPoints(0, 2, 11, 2), fill: 'shade' },
                    { points: rectPoints(9.5, 2.4, 11, 2) },
                    { points: rectPoints(19, 2, 11, 2), fill: 'shade' },
                ],
                dims: [{ from: [0, 4], to: [11, 4], text: `${a}cm`, side: 'above' }, { from: [9.5, 2], to: [11, 2], text: `${g}cm`, side: 'below' }],
            }),
            questions: [
                q(`紙テープを${n}本つないだとき、全体の長さは何cmになりますか。`, len, 'cm', [a * n, a * n - g * n, len - g]),
                q(`全体の長さがちょうど${len2}cmになるのは、紙テープを全部で何本つないだときですか。`, n2, '本', [n2 - 1, n2 + 1, Math.round(len2 / a)]),
                q(`友だちが作った輪の、1しゅうの長さは何cmですか。`, n * (a - g), 'cm', [len, a * n, len + g]),
            ],
        };
    },
]);

const michinori = defineTopic('g3-michinori', '道のりの図', [
    (r) => {
        const p = r.pick(names);
        const speed = r.pick([50, 60]);
        const v = until(r, () => {
            const [a, b, c] = [r.int(3, 9) * 50, r.int(3, 9) * 50, r.int(3, 9) * 50];
            return { a, b, c, walked: a + b + b + b + c };
        }, x => x.walked % speed === 0 && new Set([x.a, x.b, x.c]).size === 3);
        const total = v.a + v.b + v.c;
        return {
            text: [
                `${p}さんの家、公園、図書館、駅は、下の図のように、この順に1本のまっすぐな道にそってならんでいます。家から公園までの道のりは${v.a}m、公園から図書館までの道のりは${v.b}mです。また、家から駅までの道のりは${total}mです。`,
                `ある日、${p}さんは家を出て、まず図書館まで歩いて行き、かりていた本を返しました。次に、来た道を公園までもどって、友だちと遊びました。そのあと、公園から駅まで歩いて、仕事から帰ってくるお父さんをむかえに行きました。`,
                `${p}さんは、いつも分速${speed}mの速さで歩きます。`,
            ],
            figure: route(['家', '公園', '図書館', '駅'], [{ len: v.a, text: `${v.a}m` }, { len: v.b, text: `${v.b}m` }, { len: v.c, text: '？m' }]),
            questions: [
                q('図書館から駅までの道のりは何mですか。', v.c, 'm', [total - v.a, total - v.b, v.c + v.b], { step: 50 }),
                q(`この日、${p}さんが家を出てから駅に着くまでに歩いた道のりは、全部で何mですか。`, v.walked, 'm', [total, total + v.b, v.walked - v.b], { step: 50 }),
                q(`この日、${p}さんが歩いていた時間は、全部で何分ですか。`, v.walked / speed, '分', [total / speed, v.walked / 100]),
            ],
        };
    },
]);

export default [...tenbin, ...kadan, ...norishiro, ...michinori];
