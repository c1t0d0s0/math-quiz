import { createRng, gcd, hashString } from '../generators/rng.js';

// 対戦の問題。暗算の速さを競うので、学年で習う範囲の、暗算できる形だけを出す。
// 同じ学年・出題数・seed なら、どの端末でも同じ問題になる。
//
// 1問: { text: 式 (空欄の前まで), parts: FillQuestion にわたす式, blanks: 正しい答え (文字の配列),
//        keys: テンキーに足すキー ('.' や '/'), hint: 答え方のちゅうい }

export const GRADES = [1, 2, 3, 4, 5, 6];
export const COUNTS = [5, 10, 20];

/** 約分した分数の文字 (整数になるときは整数) */
export function fracText(n, d) {
    const g = gcd(n, d);
    return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`;
}

/** 1/10 の位までの数 (10 倍した整数でわたす) を文字にする */
const tenth = t => String(t / 10);

/** 1/10 の位が 0 でない数 (10 倍した整数) をえらぶ。「4」のような整数にならないように */
function tenths(r, min, max) {
    let t;
    do t = r.int(min, max); while (t % 10 === 0);
    return t;
}

/** 答えの形に合わせて、問題を組み立てる */
function q(text, answer, kind = 'int') {
    return {
        text,
        parts: [`${text} = `, { blank: 0 }],
        blanks: [String(answer)],
        keys: kind === 'dec' ? ['.'] : kind === 'frac' ? ['/'] : [],
        hint: kind === 'frac' ? '分数は「3/4」のように、約分して答えよう' : '',
    };
}

/** 比で分ける問題 (空欄が2つ) */
function ratioQ(total, a, b) {
    const k = total / (a + b);
    return {
        text: `${total}を${a}:${b}に分ける`,
        parts: [`${total}を ${a}:${b} に分けると `, { blank: 0 }, ' と ', { blank: 1 }],
        blanks: [String(k * a), String(k * b)],
        keys: [],
        hint: '',
    };
}

// ---- 学年ごとの問題の作り方 ----

const G = {
    1: [
        // 1桁 + 1桁
        (r) => {
            const [a, b] = [r.int(1, 9), r.int(1, 9)];
            return q(`${a} + ${b}`, a + b);
        },
        // 2桁 − 1桁 (くり下がりあり)
        (r) => {
            const a = r.int(11, 18);
            const b = r.int((a % 10) + 1, 9);
            return q(`${a} − ${b}`, a - b);
        },
    ],
    2: [
        // 2桁 + 2桁 (99まで)
        (r) => {
            const a = r.int(10, 89);
            const b = r.int(10, 99 - a);
            return q(`${a} + ${b}`, a + b);
        },
        // 2桁 − 2桁
        (r) => {
            const a = r.int(20, 99);
            const b = r.int(10, a - 1);
            return q(`${a} − ${b}`, a - b);
        },
        // 九九
        (r) => {
            const [a, b] = [r.int(2, 9), r.int(2, 9)];
            return q(`${a} × ${b}`, a * b);
        },
    ],
    3: [
        // 3桁 + 3桁 (10の倍数どうし)
        (r) => {
            const a = r.int(10, 89) * 10;
            const b = r.int(10, 99 - a / 10) * 10;
            return q(`${a} + ${b}`, a + b);
        },
        // 3桁 − 3桁 (10の倍数どうし)
        (r) => {
            const a = r.int(20, 99) * 10;
            const b = r.int(10, a / 10 - 1) * 10;
            return q(`${a} − ${b}`, a - b);
        },
        // 2桁 × 1桁
        (r) => {
            const [a, b] = [r.int(12, 39), r.int(2, 9)];
            return q(`${a} × ${b}`, a * b);
        },
        // わり算 (九九の逆)
        (r) => {
            const [b, c] = [r.int(2, 9), r.int(2, 9)];
            return q(`${b * c} ÷ ${b}`, c);
        },
    ],
    4: [
        // 3桁の加減 (10の倍数どうし。百の位をまたぐ)
        (r) => {
            const a = r.int(11, 88) * 10;
            const b = r.int(11, 99 - a / 10) * 10;
            return q(`${a} + ${b}`, a + b);
        },
        (r) => {
            const a = r.int(30, 99) * 10;
            const b = r.int(11, a / 10 - 2) * 10;
            return q(`${a} − ${b}`, a - b);
        },
        // 2桁 × 2桁のかんたんな計算 (くふうして暗算できる決まった形だけ)
        (r) => {
            const make = r.pick([
                () => [25, r.pick([12, 16, 24, 28, 32, 36, 44])],
                () => [11, r.int(12, 45)],
                () => [20, r.int(12, 49)],
                () => [50, r.int(12, 19)],
                () => [12, r.pick([15, 25])],
                () => [15, r.pick([12, 14, 16, 18])],
            ]);
            let [a, b] = make();
            if (r.bool()) [a, b] = [b, a];
            return q(`${a} × ${b}`, a * b);
        },
        // 小数のたし算・ひき算 (1/10の位まで)
        (r) => {
            const [a, b] = [tenths(r, 11, 99), tenths(r, 11, 99)];
            return q(`${tenth(a)} + ${tenth(b)}`, tenth(a + b), 'dec');
        },
        (r) => {
            const a = tenths(r, 25, 99);
            const b = tenths(r, 11, a - 1);
            return q(`${tenth(a)} − ${tenth(b)}`, tenth(a - b), 'dec');
        },
    ],
    5: [
        // 小数 × 整数
        (r) => {
            const [a, b] = [tenths(r, 11, 49), r.int(2, 9)];
            return q(`${tenth(a)} × ${b}`, tenth(a * b), 'dec');
        },
        // 小数 ÷ 整数 (わり切れる)
        (r) => {
            let c;
            let b;
            do [c, b] = [tenths(r, 11, 29), r.int(2, 9)]; while ((c * b) % 10 === 0);
            return q(`${tenth(c * b)} ÷ ${b}`, tenth(c), 'dec');
        },
        // 分母が同じ分数のたし算・ひき算
        (r) => {
            const d = r.int(5, 12);
            const a = r.int(1, d - 2);
            const b = r.int(1, d - 1 - a);
            return q(`${a}/${d} + ${b}/${d}`, fracText(a + b, d), 'frac');
        },
        (r) => {
            const d = r.int(5, 12);
            const a = r.int(3, d - 1);
            const b = r.int(1, a - 1);
            return q(`${a}/${d} − ${b}/${d}`, fracText(a - b, d), 'frac');
        },
        // 整数の性質を使った、くふうする計算
        (r) => {
            const k = r.int(2, 9);
            return r.pick([
                () => q('125 × 8', 1000),
                () => q(`25 × ${4 * k}`, 100 * k),
                () => q(`${k} × 25 × 4`, 100 * k),
                () => q(`25 × ${k} × 4`, 100 * k),
                () => q(`125 × ${8 * Math.min(k, 3)}`, 1000 * Math.min(k, 3)),
            ])();
        },
    ],
    6: [
        // 分数 × 分数
        (r) => {
            const [b, d] = [r.int(2, 9), r.int(2, 9)];
            const [a, c] = [r.int(1, b - 1), r.int(1, d - 1)];
            return q(`${fracText(a, b)} × ${fracText(c, d)}`, fracText(a * c, b * d), 'frac');
        },
        // 分数 ÷ 分数 (同じ分数どうしの「答えが1」にはしない)
        (r) => {
            let a;
            let b;
            let c;
            let d;
            do {
                [b, d] = [r.int(2, 9), r.int(2, 9)];
                [a, c] = [r.int(1, b - 1), r.int(1, d - 1)];
            } while (a * d === b * c);
            return q(`${fracText(a, b)} ÷ ${fracText(c, d)}`, fracText(a * d, b * c), 'frac');
        },
        // 割合
        (r) => {
            const p = r.pick([5, 10, 20, 25, 30, 40, 50, 75]);
            let base;
            do base = r.int(2, 45) * 20; while ((base * p) % 100 !== 0);
            const qq = q(`${base}の${p}%`, (base * p) / 100);
            qq.parts = [`${base} の ${p}% は `, { blank: 0 }];
            return qq;
        },
        // 比で分ける
        (r) => {
            const [a, b] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [3, 4], [4, 3], [2, 5], [3, 5]]);
            const total = (a + b) * r.int(2, 20) * 10;
            return ratioQ(total, a, b);
        },
        // かけ算・わり算を先に計算する、複合計算
        (r) => {
            const [a, b, c] = [r.int(2, 20), r.int(2, 9), r.int(2, 9)];
            return r.pick([
                () => q(`${a} + ${b} × ${c}`, a + b * c),
                () => q(`(${b} + ${c}) × ${b}`, (b + c) * b),
                () => q(`${b} × ${c} − ${Math.min(a, b * c - 1)}`, b * c - Math.min(a, b * c - 1)),
                () => q(`(${b * c + a} − ${a}) ÷ ${c}`, b),
                () => q(`${b * c} ÷ ${c} + ${a}`, b + a),
            ])();
        },
    ],
};

/**
 * 対戦の問題を作る。grade は 1〜6、count は出題数、seed は部屋ごとの乱数の種。
 * 問題の種類を順番にまぜ、同じ式は2回出さない
 */
export function battleQuestions(grade, count, seed) {
    const r = createRng(hashString(`math-quiz-battle:${grade}:${count}:${seed}`));
    const makers = G[grade];
    const out = [];
    const seen = new Set();
    let order = [];
    while (out.length < count) {
        if (order.length === 0) order = r.shuffle(makers);
        const make = order.shift();
        let question = make(r);
        for (let i = 0; i < 30 && seen.has(question.text); i++) question = make(r);
        seen.add(question.text);
        out.push(question);
    }
    return out;
}

/**
 * 問題の作り方の指紋。公開をはさんで作り方が変わると、同じ seed でも問題がずれるので、部屋に入れておいて確かめる
 */
export function questionsPrint() {
    const text = GRADES.map(g => battleQuestions(g, 20, 'print').map(x => `${x.text}=${x.blanks.join(',')}`).join('|')).join('\n');
    return hashString(text).toString(36);
}

/** 全角の数字や記号を半角にして、空白を消す */
function normalizeInput(input) {
    return String(input)
        .replace(/[０-９．／]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/\s+/g, '');
}

/**
 * 入力した答えが正しいか。
 * - 整数: 数として同じなら正解 (05 と 5 は同じ)
 * - 小数: 数として同じなら正解 (3.50 と 3.5 は同じ)
 * - 分数: 約分した形で同じときだけ正解 (2/4 は 1/2 の答えとしてはまちがい)
 */
export function isCorrect(input, expected) {
    const s = normalizeInput(input);
    if (expected.includes('/')) {
        const m = s.match(/^(\d+)\/(\d+)$/);
        return !!m && `${Number(m[1])}/${Number(m[2])}` === expected;
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return false;
    return Number(s) === Number(expected);
}
