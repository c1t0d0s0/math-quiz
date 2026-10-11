import { defineTopic } from '../../word/helpers.js';
import { lcm } from '../../generators/rng.js';
import { names } from '../../word/vocab.js';
import { segments, shape, rectPoints } from '../figures.js';
import { q, until, schools } from '../util.js';

const ueki = defineTopic('g3-ueki', '植木算', [
    (r) => {
        const k = r.int(2, 4);
        const { d, d2, len } = until(r, () => {
            const [x, y] = [r.pick([4, 5, 6, 8]), r.pick([10, 12, 15, 20])];
            return { d: x, d2: y, len: lcm(x, y) * r.int(1, 6) };
        }, v => v.len <= 240 && v.len / v.d2 >= 4);
        const gaps = len / d;
        return {
            text: [
                `${r.pick(schools)}小学校には、校門から体育館まで、まっすぐにのびる長さ${len}mの道があります。この道のかた側に、道のはしからはしまで、${d}mおきにさくらの木を植えることになりました。道の両はしにも、さくらの木を植えます。`,
                `さらに、となり合うさくらの木と木の間には、どこにも同じように、チューリップを${k}本ずつ植えます。`,
                `また、道の反対側には、${d2}mおきに外灯を立てます。ただし、外灯は、校門と体育館の入口にはもともと明かりがあるので、道の両はしには立てません。`,
                '外灯の明かりは、夜でも道を明るくてらして、歩く人の安全を守ります。',
            ],
            questions: [
                q('さくらの木は、全部で何本いりますか。', gaps + 1, '本', [gaps, gaps - 1]),
                q('チューリップは、全部で何本いりますか。', gaps * k, '本', [(gaps + 1) * k, (gaps - 1) * k]),
                q('外灯は、全部で何本いりますか。', len / d2 - 1, '本', [len / d2, len / d2 + 1]),
            ],
        };
    },
]);

const wasa = defineTopic('g3-wasa', '和差算', [
    (r) => {
        const [p, f] = r.pickN(names, 2);
        const small = r.int(18, 40);
        const diff = r.int(3, 9) * 2;
        const sum = small * 2 + diff;
        const give = r.int(3, 9);
        return {
            text: [
                `${p}さんと${f}さんは、秋の遠足で、いっしょにくり拾いをしました。2人が拾ったくりを合わせると、全部で${sum}こありました。数えてみると、${p}さんのほうが${f}さんよりも${diff}こ多く拾っていました。下の図は、2人が拾ったくりの数を線の長さで表したものです。`,
                `帰りのバスの中で、2人は、拾ったくりの数が同じになるように、${p}さんから${f}さんへくりをいくつかわたしました。`,
                `家に帰ってから、${f}さんは、自分のくりのうち${give}こを、おとなりのおばあさんにあげました。`,
            ],
            figure: segments([
                { label: p, parts: [{ len: small }, { len: diff, note: `${diff}こ` }] },
                { label: f, parts: [{ len: small }] },
            ], `合わせて${sum}こ`),
            questions: [
                q(`${p}さんがはじめに拾ったくりは何こですか。`, small + diff, 'こ', [small, sum / 2, sum - diff]),
                q(`2人のくりの数を同じにするために、${p}さんは${f}さんにくりを何こわたしましたか。`, diff / 2, 'こ', [diff, diff * 2]),
                q(`おばあさんにあげたあと、${f}さんのくりは何こになりましたか。`, sum / 2 - give, 'こ', [small - give, sum / 2, small + diff - give]),
            ],
        };
    },
]);

const bunpai = defineTopic('g3-bunpai', '分配算', [
    (r) => {
        const p = r.pick(names);
        const e = r.int(2, 4);
        const k = r.pick([2, 3]);
        const x = until(r, () => e * r.int(3, 8), v => (v * k) % 2 === 0);
        const m = r.int(3, 9);
        const total = x * (k + 2) + m;
        return {
            text: [
                `${p}さんの家では、庭の木からみかんが${total}ことれました。このみかんを、お父さん、お母さん、${p}さんの3人で分けることにしました。`,
                `お父さんの分は${p}さんの分のちょうど${k}倍、お母さんの分は${p}さんの分より${m}こ多くなるように分けます。下の図は、3人の分を線の長さで表したものです。`,
                `分け終わったあと、お父さんは、自分の分のちょうど半分を、会社の人たちに持っていくことにしました。${p}さんは、自分の分のみかんを、1日に${e}こずつ食べることにしました。`,
                '家族3人は、どの人もみかんが大すきなので、みんなが楽しみにしています。',
            ],
            figure: segments([
                { label: p, parts: [{ len: x, note: '①' }] },
                { label: 'お父さん', parts: [{ len: x * k, note: `①の${k}倍` }] },
                { label: 'お母さん', parts: [{ len: x, note: '①' }, { len: Math.max(m, x / 3), note: `${m}こ` }] },
            ], `全部で${total}こ`),
            questions: [
                q(`${p}さんの分のみかんは何こですか。`, x, 'こ', [x + m, (total - m) / (k + 1), x * k]),
                q('お父さんが会社に持っていくみかんは何こですか。', (x * k) / 2, 'こ', [x * k, x / 2, (x + m) / 2]),
                q(`${p}さんは、自分の分のみかんを何日で食べ終わりますか。`, x / e, '日', [x, (x + m) / e, x / e + 1]),
            ],
        };
    },
]);

const shoukyo = defineTopic('g3-shoukyo', '消去算', [
    (r) => {
        const [p, f] = r.pickN(names, 2);
        const v = until(r, () => {
            const [pen, note] = [r.int(4, 8) * 10, r.int(10, 15) * 10];
            const [a1, extra, b1] = [r.int(2, 3), r.int(2, 3), r.int(1, 2)];
            const [a3, b3] = [r.int(2, 3), r.int(1, 2)];
            return { pen, note, a1, a2: a1 + extra, b1, a3, b3, cost3: pen * a3 + note * b3 };
        }, x => x.cost3 < 480 && (x.a3 !== x.a1 || x.b3 !== x.b1));
        const [p1, p2] = [v.pen * v.a1 + v.note * v.b1, v.pen * v.a2 + v.note * v.b1];
        return {
            text: [
                `${p}さんと${f}さんは、同じお店で、えん筆とノートを買いました。${p}さんは、えん筆${v.a1}本とノート${v.b1}さつを買って、${p1}円はらいました。${f}さんは、えん筆${v.a2}本とノート${v.b1}さつを買って、${p2}円はらいました。`,
                `2人が買ったえん筆は、どれも同じねだんです。ノートも、どれも同じねだんです。2人は、レシートを見くらべて、えん筆1本のねだんとノート1さつのねだんを考えてみました。`,
                `次の日、${p}さんの妹が、500円玉を1まい持って同じお店に行き、同じえん筆を${v.a3}本と、同じノートを${v.b3}さつ買いました。`,
            ],
            questions: [
                q('えん筆1本のねだんは何円ですか。', v.pen, '円', [p2 - p1, v.note - v.pen], { step: 10 }),
                q('ノート1さつのねだんは何円ですか。', v.note, '円', [p1 - v.pen, v.note + v.pen], { step: 10 }),
                q(`${p}さんの妹が受け取ったおつりは何円ですか。`, 500 - v.cost3, '円', [v.cost3, 500 - v.pen - v.note], { step: 10 }),
            ],
        };
    },
]);

const tsurukame = defineTopic('g3-tsurukame', 'つるかめ算', [
    (r) => {
        const p = r.pick(names);
        const [a, b] = [r.int(12, 15) * 10, r.int(8, 10) * 10];
        const n = r.int(20, 40);
        const x = r.int(5, n - 5);
        const total = a * x + b * (n - x);
        return {
            text: [
                `${p}さんは、町のお祭りで、のみ物を売るお手つだいをしました。売っていたのは、ジュースとお茶の2しゅるいです。ジュースは1本${a}円、お茶は1本${b}円です。`,
                `お祭りが終わってから数えてみると、ジュースとお茶は合わせて${n}本売れていて、売り上げは全部で${total}円でした。ところが、ジュースとお茶がそれぞれ何本売れたのかは、メモをするのをわすれてしまいました。`,
                `そこで${p}さんは、「もし${n}本が全部お茶だったとしたら、売り上げはいくらになるかな」と考えて、そこから、売れたジュースの本数をもとめることにしました。`,
            ],
            questions: [
                q(`もし売れた${n}本が全部お茶だったとすると、売り上げは何円になりますか。`, b * n, '円', [a * n, total - b * n], { step: 10 }),
                q('売れたジュースは何本ですか。', x, '本', [n - x, (total - b * n) / a]),
                q('お茶の売り上げは何円ですか。', b * (n - x), '円', [b * x, a * x, a * (n - x)], { step: 10 }),
            ],
        };
    },
]);

const kabusoku = defineTopic('g3-kabusoku', '過不足算', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [n, a, up] = [r.int(8, 20), r.int(3, 5), r.int(1, 2)];
            const r1 = r.int(3, n - 1);
            return { n, a, b: a + up, r1, r2: up * n - r1, k: r.int(4, 6), price: r.int(10, 16) * 10 };
        }, x => x.r2 >= 2 && x.r2 % x.k !== 0);
        const bags = Math.ceil(v.r2 / v.k);
        const cookies = v.a * v.n + v.r1;
        return {
            text: [
                `子ども会のお楽しみ会で、あつまった子どもたちにクッキーを配ります。世話役の${p}さんが用意したクッキーを、1人に${v.a}まいずつ配ると、${v.r1}まいあまります。そこで、1人に${v.b}まいずつ配ろうとしたところ、こんどは${v.r2}まい足りなくなることがわかりました。`,
                `${p}さんは、足りない分のクッキーを買い足して、子どもたち全員に、1人${v.b}まいずつ配ることにしました。同じクッキーは、1ふくろに${v.k}まい入っていて、1ふくろ${v.price}円で売られています。ふくろをばらばらにして買うことはできません。`,
            ],
            questions: [
                q('お楽しみ会にあつまった子どもは何人ですか。', v.n, '人', [v.r1 + v.r2, v.r2 - v.r1 > 0 ? v.r2 - v.r1 : v.n + 2]),
                q(`${p}さんがはじめに用意したクッキーは何まいですか。`, cookies, 'まい', [v.a * v.n, v.b * v.n, cookies - 2 * v.r1 > 0 ? cookies - 2 * v.r1 : cookies + 5]),
                q('クッキーを買い足すのに、お金は少なくとも何円かかりますか。', bags * v.price, '円', [(bags - 1) * v.price, v.r2 * v.price, (bags + 1) * v.price], { step: 10 }),
            ],
        };
    },
]);

const nenrei = defineTopic('g3-nenrei', '年令算', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [c, y] = [r.int(8, 10), r.int(2, 6)];
            const f = 3 * (c + y) - y;
            const m = f - r.int(1, 4);
            const s = c - r.int(2, 4);
            return { c, y, f, m, s, sum: c + f + m + s };
        }, x => x.sum < 100 && (100 - x.sum) % 4 === 0 && (100 - x.sum) / 4 !== x.y);
        return {
            text: [
                `今年、${p}さんは${v.c}才で、お父さんは${v.f}才、お母さんは${v.m}才です。${p}さんには、${v.s}才の妹が1人います。${p}さんは、算数の時間に年令の問題を習ったので、自分の家族の年令についても、いろいろと調べてみることにしました。`,
                `まず、${p}さんは、「何年かたつと、お父さんの年令が、わたしの年令のちょうど3倍になるときがある」ということに気がつきました。次に、自分が生まれたとき、お母さんは何才だったのかを考えました。さいごに、家族4人の年令を全部たした数についても調べました。どの人も、1年たつと1才ずつ年をとります。`,
            ],
            questions: [
                q(`お父さんの年令が${p}さんの年令のちょうど3倍になるのは、今から何年後ですか。`, v.y, '年後', [v.f - 3 * v.c, v.c + v.y]),
                q(`${p}さんが生まれたとき、お母さんは何才でしたか。`, v.m - v.c, '才', [v.m + v.c, v.f - v.c, v.m - v.s]),
                q('家族4人の年令の合計がちょうど100才になるのは、今から何年後ですか。', (100 - v.sum) / 4, '年後', [100 - v.sum, (100 - v.sum) / 2]),
            ],
        };
    },
]);

const shugo = defineTopic('g3-shugo', '重なりのある数', [
    (r) => {
        const v = until(r, () => {
            const n = r.int(30, 38);
            const [a, b, c] = [r.int(16, 24), r.int(12, 20), r.int(4, 9)];
            return { n, a, b, c, either: a + b - c };
        }, x => x.n - x.either >= 2 && x.a !== x.b);
        return {
            text: [
                `${r.pick(schools)}小学校の3年1組は、${v.n}人のクラスです。学級会で、犬とねこのどちらがすきかを調べることになりました。先生が「犬がすきな人」と聞くと${v.a}人が手をあげ、「ねこがすきな人」と聞くと${v.b}人が手をあげました。`,
                `犬もねこもすきで、両方に手をあげた人は${v.c}人いました。また、どちらにも手をあげなかった人もいました。先生は、この結果を、下のような図にかいて黒板にはりました。左の円は犬がすきな人、右の円はねこがすきな人を表していて、2つの円が重なっているところは、両方ともすきな人を表しています。`,
            ],
            figure: shape(10, 7, {
                polys: [{ points: rectPoints(0, 0, 10, 7) }],
                circles: [{ cx: 3.8, cy: 3, r: 2.4 }, { cx: 6.2, cy: 3, r: 2.4 }],
                labels: [{ at: [2.6, 3], text: '犬' }, { at: [7.4, 3], text: 'ねこ' }, { at: [5, 3], text: `${v.c}人` }, { at: [5, 6.3], text: `クラス全体 ${v.n}人` }],
            }, 'circle'),
            questions: [
                q('犬はすきだけれど、ねこには手をあげなかった人は何人ですか。', v.a - v.c, '人', [v.a, v.b - v.c, v.a - v.b > 0 ? v.a - v.b : v.a + 1]),
                q('犬とねこの、少なくともどちらかに手をあげた人は何人ですか。', v.either, '人', [v.a + v.b, v.a + v.b + v.c]),
                q('どちらにも手をあげなかった人は何人ですか。', v.n - v.either, '人', [v.n - v.a - v.b > 0 ? v.n - v.a - v.b : v.c, v.n - v.either + v.c]),
            ],
        };
    },
]);

export default [...ueki, ...wasa, ...bunpai, ...shoukyo, ...tsurukame, ...kabusoku, ...nenrei, ...shugo];
