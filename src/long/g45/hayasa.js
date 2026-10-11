import { defineTopic, hourMin } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { route } from '../figures.js';
import { q, until } from '../util.js';

const tabibito = defineTopic('g45-tabibito', '旅人算', [
    (r) => {
        const [p, f] = r.pickN(names, 2);
        const v = until(r, () => {
            const [a, b, t] = [r.int(12, 16) * 5, r.int(10, 14) * 5, r.int(6, 15)];
            const [late, c] = [r.int(4, 10), r.int(15, 25) * 10];
            return { a, b, t, late, c, dist: (a + b) * t, catchUp: (a * late) / (c - a) };
        }, x => x.a !== x.b && Number.isInteger(x.catchUp) && x.catchUp >= 2 && x.a * (x.late + x.catchUp) < x.dist);
        return {
            text: [
                `${p}さんの家から駅までは、まっすぐな1本道で${v.dist}mあります。下の図は、そのようすを表したものです。`,
                `ある日曜日の朝、${p}さんは、駅に着くお姉さんをむかえに行くことにしました。${p}さんは分速${v.a}mの速さで家から駅に向かって歩き始め、ちょうど同じ時こくに、お姉さんは分速${v.b}mの速さで駅から家に向かって歩き始めました。2人は、道のとちゅうで出会いました。`,
                `次の日の朝、${p}さんは、いつもと同じ分速${v.a}mの速さで、家から駅に向かって歩いて出発しました。ところが、${p}さんが家を出てから${v.late}分後に、弟の${f}さんが、${p}さんのわすれ物に気がつきました。${f}さんは、すぐに自転車に乗って、分速${v.c}mの速さで、同じ道を通って${p}さんを追いかけました。`,
                '2人の歩く速さや自転車の速さは、とちゅうで変わらないものとします。また、道はずっと1本道なので、ちがう道を通ったり、行きちがいになったりすることはありません。',
            ],
            figure: route(['家', '駅'], [{ len: 1, text: `${v.dist}m` }], [{ at: 0, dir: 1, text: `${p}さん 分速${v.a}m` }, { at: 1, dir: -1, text: `お姉さん 分速${v.b}m` }]),
            questions: [
                q('日曜日、2人が出会ったのは、歩き始めてから何分後ですか。', v.t, '分後', [v.dist / v.a, v.dist / v.b, v.dist / Math.abs(v.a - v.b)]),
                q('日曜日、2人が出会った地点は、家から何mのところですか。', v.a * v.t, 'm', [v.b * v.t, v.dist / 2], { step: 10 }),
                q(`次の日、${f}さんが${p}さんに追いついたのは、${f}さんが家を出てから何分後ですか。`, v.catchUp, '分後', [v.late, v.catchUp + v.late, (v.a * v.late) / v.c]),
            ],
        };
    },
]);

const tsuuka = defineTopic('g45-tsuuka', '通過算', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const sp = r.pick([15, 20, 25]);
            const len = sp * r.int(6, 10);
            const bridge = sp * r.int(14, 24) - len;
            const tunnel = sp * r.int(30, 50) + len;
            return { sp, len, bridge, tunnel };
        }, x => x.bridge > x.len);
        return {
            text: [
                `夏休みに、${p}さんは、家族といっしょに特急列車に乗って、海の近くのおじいさんの家へ出かけました。${p}さんが乗った列車は、全体の長さが${v.len}mあります。車内の電光けいじ板には、「ただいまの速さは時速${(v.sp * 36) / 10}kmです」と表示されていて、列車はしばらくの間、この速さのまま走り続けました。`,
                `やがて列車は、大きな川にかかる長さ${v.bridge}mの鉄橋をわたりました。列車の先頭が鉄橋にさしかかってから、列車のいちばん後ろが鉄橋をわたり終えるまでの間、まどの外には川が見えていました。`,
                `鉄橋をすぎると、こんどは長さ${v.tunnel}mのトンネルに入りました。列車の全体がすっかりトンネルの中に入ってしまうと、まどの外は真っ暗になり、列車の先頭がトンネルから出始めるまで、その暗さが続きました。`,
                '列車の長さとは、先頭からいちばん後ろまでの長さのことです。鉄橋やトンネルを通りぬける時間を考えるときは、列車自身の長さも考えに入れなければなりません。',
            ],
            questions: [
                q('この列車の速さは、秒速何mですか。', v.sp, 'm', [(v.sp * 36) / 10 / 6, v.sp * 2, v.sp * 6], { prefix: '秒速' }),
                q('列車の先頭が鉄橋にさしかかってから、いちばん後ろが鉄橋をわたり終えるまでに、何秒かかりますか。', (v.len + v.bridge) / v.sp, '秒', [v.bridge / v.sp, (v.bridge - v.len) / v.sp, (v.len + v.bridge) / v.sp + 6]),
                q('列車の全体がすっかりトンネルの中にかくれていた時間は、何秒ですか。', (v.tunnel - v.len) / v.sp, '秒', [v.tunnel / v.sp, (v.tunnel + v.len) / v.sp]),
            ],
        };
    },
]);

const ryuusui = defineTopic('g45-ryuusui', '流水算', [
    (r) => {
        // [静水での速さ, ふだんの流れ, 雨のあとの流れ, 2つの町の間]（どの時間も分の単位で整数になる組）
        const [s, c, c2, d] = r.pick([[10, 2, 5, 30], [10, 2, 5, 60], [12, 3, 4, 36], [15, 3, 5, 30], [15, 3, 5, 60], [9, 1, 3, 24], [9, 1, 3, 36]]);
        const min = speed => (d * 60) / speed;
        const [down, up] = [min(s + c), min(s - c)];
        const rainy = min(s + c2) + min(s - c2);
        return {
            text: [
                `ある川の上流にA町、下流にB町があります。2つの町は、川にそって${d}kmはなれています。この川を、流れのないところでは時速${s}kmで進む遊らん船が、A町とB町の間を行き来しています。`,
                `ふだん、この川は、上流から下流に向かって時速${c}kmの速さで流れています。船が上流から下流に向かって進むときは、川の流れにおされるので、流れのないところを進むときよりも、流れの速さの分だけ速くなります。反対に、下流から上流に向かって進むときは、流れにさからうので、流れの速さの分だけおそくなります。`,
                `ところが、大雨がふった次の日は、川の水がふえて、流れの速さが時速${c2}kmになりました。船は、この日も、流れのないところでの速さを変えずに、A町とB町の間を1往復しました。町での止まっている時間は考えないものとします。`,
                '船の速さも川の流れの速さも、とちゅうで変わることはないものとします。',
            ],
            questions: [
                q('ふだんの日に、船がA町からB町まで下るのにかかる時間は、何時間何分ですか。', down, '', [min(s), up, min(s + c) + 30], { format: hourMin, step: 10 }),
                q('ふだんの日に、船がB町からA町まで上るのにかかる時間は、何時間何分ですか。', up, '', [min(s), down, up + 60], { format: hourMin, step: 10 }),
                q('大雨がふった次の日に、船がA町とB町の間を1往復するのにかかった時間は、何時間何分ですか。', rainy, '', [down + up, 2 * min(s), min(s - c2)], { format: hourMin, step: 10 }),
            ],
        };
    },
]);

const tokei = defineTopic('g45-tokei', '時計算', [
    (r) => {
        const p = r.pick(names);
        const v = until(r, () => {
            const [h, m] = [r.int(1, 11), r.int(1, 5) * 10];
            const raw = Math.abs(30 * h + m / 2 - 6 * m);
            return { h, m, angle: raw > 180 ? 360 - raw : raw, gain: r.int(4, 9) * 5, days: r.int(5, 14) };
        }, x => x.angle >= 20 && x.angle <= 170);
        const fast = v.gain * v.days;
        const minSec = t => `${Math.floor(t / 60)}分${t % 60}秒`;
        const m2 = r.pick([20, 30, 40, 50].filter(x => x !== v.m));
        return {
            text: [
                `${p}さんのおじいさんの家には、古い柱時計があります。時計の長いはりは、1時間でちょうど1回転します。つまり、60分間で360度回るので、長いはりは1分間に6度ずつ回ります。短いはりは、12時間でちょうど1回転します。つまり、1時間に30度ずつ、ゆっくりと回ります。`,
                `${p}さんは、この時計の長いはりと短いはりがつくる角の大きさを、いろいろな時こくについて調べてみることにしました。角の大きさは、2つあるうちの、小さいほうを答えることにします。`,
                `ところで、この柱時計はとても古いので、正しい時こくよりも、1日に${v.gain}秒ずつ進んでしまいます。おじいさんは、ある日の正午に、この時計を正しい時こくにぴったり合わせました。そのあとは、はりにさわっていません。`,
                'たとえば、ちょうど3時のとき、長いはりは12の数字を、短いはりは3の数字をさしているので、2つのはりがつくる角は90度です。',
            ],
            questions: [
                q(`短いはりは、${m2}分間に何度回りますか。`, m2 / 2, '度', [m2 * 6, m2 * 3, m2]),
                q(`時計が${v.h}時${v.m}分をさしているとき、長いはりと短いはりがつくる角の大きさは何度ですか。`, v.angle, '度', [Math.abs(30 * v.h - 6 * v.m) || 30, 360 - v.angle, v.angle + v.m / 2], { step: 5 }),
                q(`時計を合わせてからちょうど${v.days}日後の正午に、この時計は、正しい時こくより何分何秒進んでいますか。`, fast, '', [fast + v.gain, fast - v.gain, fast * 2], { format: minSec, step: 5 }),
            ],
        };
    },
]);

export default [...tabibito, ...tsuuka, ...ryuusui, ...tokei];
