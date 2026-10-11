import { defineTopic } from '../../word/helpers.js';
import { names } from '../../word/vocab.js';
import { table, shape } from '../figures.js';
import { q, until } from '../util.js';

const shuuki = defineTopic('g3-shuuki', '周期算', [
    (r) => {
        const p = r.pick(names);
        // 赤・青・白の順に、それぞれ何こずつならべるか
        const [red, blue, white] = r.pick([[2, 1, 3], [3, 1, 2], [1, 2, 3], [2, 2, 1], [3, 2, 1], [1, 1, 3]]);
        const period = red + blue + white;
        const order = [...Array(red).fill('赤'), ...Array(blue).fill('青'), ...Array(white).fill('白')];
        const n = until(r, () => r.int(40, 75), x => x % period !== 0);
        const count = color => Math.floor(n / period) * order.filter(c => c === color).length
            + order.slice(0, n % period).filter(c => c === color).length;
        const [pr, pb, pw] = [r.int(3, 5) * 10, r.int(6, 8) * 10, r.int(1, 2) * 10];
        const kth = r.int(4, 7);
        // 左から kth こ目の青が何番目か（blue は1組に1こか2こ）
        const bluePos = Math.floor((kth - 1) / blue) * period + red + ((kth - 1) % blue) + 1;
        const cost = count('赤') * pr + count('青') * pb + count('白') * pw;
        return {
            text: [
                `${p}さんは、赤、青、白の3色のビーズを使って、かざりを作っています。ビーズは、左から「${order.join('、')}」の${period}こを1組として、この順番を何度もくり返して、1列にならべていきます。`,
                `${p}さんは、ビーズを全部で${n}こならべたところで、ひと休みしました。ビーズは手芸店で買ったもので、ねだんは、赤が1こ${pr}円、青が1こ${pb}円、白が1こ${pw}円でした。${p}さんは、ここまでに使ったビーズの数と代金を、色ごとに調べてみることにしました。`,
                'できあがったかざりは、教室のまどべにつるして、みんなに見てもらうつもりです。',
            ],
            questions: [
                q(`ならべた${n}このビーズのうち、白のビーズは何こですか。`, count('白'), 'こ', [Math.floor(n / period) * white, count('赤'), count('青')]),
                q(`左から数えて${kth}こ目の青のビーズは、ビーズ全体の左から何番目にありますか。`, bluePos, '番目', [kth * period, bluePos - 1, bluePos + period]),
                q(`ならべた${n}このビーズの代金は、全部で何円ですか。`, cost, '円', [Math.floor(n / period) * (red * pr + blue * pb + white * pw), cost + pb], { step: 10 }),
            ],
        };
    },
]);

const houjin = defineTopic('g3-houjin', '方陣算', [
    (r) => {
        const p = r.pick(names);
        const n = r.int(6, 12);
        const dots = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) dots.push({ cx: 1 + i * 1.4, cy: 1 + j * 1.4, r: 0.45, fill: i % 3 === 0 || j % 3 === 0 ? 'shade' : 'none' });
        }
        return {
            text: [
                `${p}さんは、ご石をたくさん使って、たてと横に同じ数ずつ、すきまなくならべ、中までつまった正方形の形を作りました。下の図は、1辺に4こずつならべたときのようすで、色をつけたご石が、いちばん外がわのひとまわりです。`,
                `${p}さんが作った正方形は、図よりも大きく、いちばん外がわのひとまわりにならんでいるご石を数えると、全部で${4 * (n - 1)}こありました。`,
                `次に${p}さんは、この正方形のまわりを、ぐるりともうひとまわりご石でかこんで、ひとまわり大きい、中までつまった正方形を作ることにしました。`,
            ],
            figure: shape(6.2, 6.2, { circles: dots }),
            questions: [
                q(`${p}さんがはじめに作った正方形の1辺には、ご石が何こならんでいますか。`, n, 'こ', [n - 1, n + 1, 4 * (n - 1) / 4]),
                q(`${p}さんがはじめに作った正方形には、ご石が全部で何こ使われていますか。`, n * n, 'こ', [(n - 1) * (n - 1), 4 * (n - 1), n * (n - 1)]),
                q('ひとまわり大きい正方形にするには、ご石はあと何こいりますか。', 4 * (n + 1), 'こ', [4 * n, 4 * (n - 1) + 4, 4 * (n + 2)]),
            ],
        };
    },
]);

const suuretsu = defineTopic('g3-kisoku', '数のならびのきまり', [
    (r) => {
        const p = r.pick(names);
        const [a, d] = [r.int(3, 8) * 10, r.int(1, 4) * 10];
        const term = k => a + (k - 1) * d;
        const kx = r.int(8, 11);
        const border = term(r.int(13, 17)) - d / 2;
        const firstWeek = Math.ceil((border - a) / d) + 1;
        const sum6 = 6 * a + 15 * d;
        return {
            text: [
                `${p}さんは、ほしい本を買うために、毎週日曜日に、おこづかいの中からちょ金箱にお金を入れることにしました。1週目は${a}円、2週目は${term(2)}円、3週目は${term(3)}円というように、毎週、前の週よりも${d}円ずつ多く入れていくことに決めました。下の表は、4週目までに入れる金がくをまとめたものです。`,
                `${p}さんは、このきまりをずっと守って、ちょ金を続けていきます。と中でお金を取り出すことはありません。お母さんは、「毎週きちんと続けられたら、ごほうびに本だなを買ってあげるね」とやくそくしてくれました。`,
            ],
            figure: table(['週', '1週目', '2週目', '3週目', '4週目'], [['入れる金がく', `${a}円`, `${term(2)}円`, `${term(3)}円`, `${term(4)}円`]]),
            questions: [
                q(`${kx}週目に、ちょ金箱に入れる金がくは何円ですか。`, term(kx), '円', [a + kx * d, term(kx - 1)], { step: 10 }),
                q(`1回に入れる金がくが、はじめて${border}円より多くなるのは何週目ですか。`, firstWeek, '週目', [firstWeek - 1, firstWeek + 1]),
                q('1週目から6週目までに、ちょ金箱に入れたお金は全部で何円ですか。', sum6, '円', [term(6), sum6 - a, 6 * a + 6 * d], { step: 10 }),
            ],
        };
    },
]);

export default [...shuuki, ...houjin, ...suuretsu];
