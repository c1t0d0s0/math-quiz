import { names } from './vocab.js';

// 推理パズル。手がかりを読んで、順番 (背の順・かけっこの順位など) や組み合わせ (だれがどの動物をかっているか) を決める。
// どちらも「答えをランダムに決める → 正しい手がかりの候補を作る → 答えが1つにしぼれるまで手がかりを足す →
// いらない手がかりをけずる」で作る。答えが1つかどうかは、ありうる答えを全部ためして数える。
//
// 1問の形 (type: 'arrange'):
//   { type, question, clues: ['ア. …'], slots: ['1位', …], tokens: ['さち', …], answer: ['ゆみ', …], arrow, explain, isWord }
//   slots は空欄の見出し、tokens は空欄に入れるボタン (順番はまぜてある)、answer は空欄ごとの正しい答え。
//   arrow が true なら、順番の問題 (空欄を → でつなぐ)。
//   table は、メモの「表」 ({ rows, cols, groups? }。groups は区切り線を引く列のまとまり) の見出し

const LABELS = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ'];

/** 0〜n-1 のならべ方を全部 */
export function permutations(n) {
    if (n === 0) return [[]];
    return permutations(n - 1).flatMap(p => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
}

/** worlds のうち、clues に全部合うものの答え (key) の種類 */
function answersOf(worlds, clues, key) {
    return new Set(worlds.filter(w => clues.every(c => c.test(w))).map(key));
}

/**
 * 手がかりをえらぶ。候補をまぜた順に、答えがへるものだけ足していき、1つにしぼれたら、いらないものをけずる。
 * 数が min〜max でなければ null
 */
function chooseClues(r, worlds, candidates, key, { min, max }) {
    const chosen = [];
    // 今の手がかりに合う世界だけをのこしていく (毎回はじめからためさないので速い)
    let alive = worlds;
    let left = new Set(alive.map(key)).size;
    for (const c of r.shuffle(candidates)) {
        if (left === 1) break;
        // 「◯番目ではない」のような弱い手がかりは1つまで (ばかりだと、つまらないので)
        if (c.kind === 'notPos' && chosen.some(x => x.kind === 'notPos')) continue;
        // 同じものについての手がかりを2つ出さない (「りんごがすきなのは〜」が2つならぶなど)
        if (c.group && chosen.some(x => x.group === c.group)) continue;
        const rest = alive.filter(w => c.test(w));
        const next = new Set(rest.map(key)).size;
        if (next < left) {
            chosen.push(c);
            alive = rest;
            left = next;
        }
    }
    if (left !== 1) return null;
    for (const c of [...chosen].reverse()) {
        const rest = chosen.filter(x => x !== c);
        if (answersOf(worlds, rest, key).size === 1) chosen.splice(chosen.indexOf(c), 1);
    }
    if (chosen.length < min || chosen.length > max) return null;
    // 同じ種類の手がかりばかりにならないように
    if (new Set(chosen.map(c => c.kind)).size < 2) return null;
    return r.shuffle(chosen);
}

/** 条件を満たすまで作り直す */
function retry(make) {
    for (let i = 0; i < 2000; i++) {
        const v = make();
        if (v) return v;
    }
    throw new Error('推理の問題が作れません');
}

/** 2人に関わる手がかりを合わせる文。before は、その前に1人ずつの手がかりの文があるか */
function pairText(clues, before, join, end) {
    const pair = clues.filter(c => c.person === null).map(c => c.label).join('・');
    if (!pair) return join === '合わせて、' ? `これらと、${end}` : `これらを合わせると、${end}`;
    return `${before ? 'これに' : ''}${pair}を${join}${end}`;
}

const orList = list => (list.length === 1 ? list[0] : `${list.slice(0, -1).join('、')}か${list[list.length - 1]}`);

// ---- 順番の問題 ----

// 苗字で出すときの名前 (例の「東さん・西さん」のように)
const SURNAMES = ['東', '西', '南', '北', '山田', '川口', '森', '林', '木村', '石田', '中野', '大西'];

/**
 * 場面ごとの、問題文・空欄の見出し・手がかりの言い回し。
 * 手がかりの関数は、名前 (「ゆみさん」) と数を受けとって文を返す
 */
const SCENES = [
    {
        id: 'height',
        intro: n => `${n}人が、背の高い順に1列にならんでいます。下の手がかりを読んで、背の高い順に名前をならべましょう。`,
        slot: i => `${i + 1}番目`,
        next: (b, a) => `${a}のすぐ前に${b}がならんでいます。`,
        notEnds: a => `${a}は、一番前でも一番後ろでもありません。`,
        notPos: (a, k) => `${a}は、前から${k}番目ではありません。`,
        before: (a, k) => `${a}の前には、${k}人以上ならんでいます。`,
        after: (a, k) => `${a}の後ろには、${k}人以上ならんでいます。`,
        earlier: (a, b) => `${a}は、${b}より前にならんでいます。`,
        gap: (a, b) => `${a}と${b}の間には、1人だけならんでいます。`,
    },
    {
        id: 'race',
        intro: n => `${n}人でかけっこをしました。下の手がかりを読んで、${n}人の順位を答えましょう。`,
        slot: i => `${i + 1}位`,
        next: (b, a) => `${b}のすぐあとに${a}がゴールしました。`,
        notEnds: (a, n) => `${a}は、1位でも${n}位でもありませんでした。`,
        notPos: (a, k) => `${a}は、${k}位ではありませんでした。`,
        before: (a, k) => `${a}より先にゴールした人は、${k}人以上いました。`,
        after: (a, k) => `${a}よりあとにゴールした人は、${k}人以上いました。`,
        earlier: (a, b) => `${a}は、${b}より先にゴールしました。`,
        gap: (a, b) => `${a}と${b}の間に、1人だけゴールしました。`,
    },
    {
        id: 'school',
        intro: n => `朝、${n}人が学校に着いた順番について、次のことが分かっています。着いた順に名前をならべましょう。`,
        slot: i => `${i + 1}番目`,
        next: (b, a) => `${b}のすぐあとに${a}が着きました。`,
        notEnds: a => `${a}は、一番早く着いたのでも、一番おそく着いたのでもありません。`,
        notPos: (a, k) => `${a}が着いたのは、${k}番目ではありません。`,
        before: (a, k) => `${a}より先に着いた人は、${k}人以上います。`,
        after: (a, k) => `${a}よりあとに着いた人は、${k}人以上います。`,
        earlier: (a, b) => `${a}は、${b}より先に着きました。`,
        gap: (a, b) => `${a}と${b}の間に着いたのは、1人だけです。`,
    },
];

/** 人数分のちがう名前 (「〜さん」) */
function people(r, n) {
    const list = r.bool(0.35) ? SURNAMES : names;
    return r.pickN(list, n).map(x => `${x}さん`);
}

/**
 * 正しい手がかりの候補。world は人ごとの位置 (0 から)、order は位置ごとの人
 * (位置は「前・先・1位」が 0)
 */
function orderingCandidates(scene, who, pos, { gap }) {
    const n = who.length;
    const out = [];
    const add = (kind, person, text, test) => out.push({ kind, person, text, test });
    for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
            if (a === b) continue;
            // b のすぐあとに a
            if (pos[a] === pos[b] + 1) add('next', null, scene.next(who[b], who[a]), w => w[a] === w[b] + 1);
            // a は b より前 (となりではないときだけ。となりなら「すぐ」の手がかりにする)
            if (pos[a] < pos[b] - 1) add('earlier', null, scene.earlier(who[a], who[b]), w => w[a] < w[b]);
            if (gap && a < b && Math.abs(pos[a] - pos[b]) === 2) add('gap', null, scene.gap(who[a], who[b]), w => Math.abs(w[a] - w[b]) === 2);
        }
        if (pos[a] !== 0 && pos[a] !== n - 1) add('notEnds', a, scene.notEnds(who[a], n), w => w[a] !== 0 && w[a] !== n - 1);
        for (let k = 0; k < n; k++) {
            if (k !== pos[a]) add('notPos', a, scene.notPos(who[a], k + 1), w => w[a] !== k);
        }
        // 前に k 人以上 (k は2以上。1人以上は「一番前ではない」と同じなので出さない)
        // (n-1 人以上は「一番後ろ・一番前」と同じなので出さない)
        for (let k = 2; k <= Math.min(pos[a], n - 2); k++) add('before', a, scene.before(who[a], k), w => w[a] >= k);
        for (let k = 2; k <= Math.min(n - 1 - pos[a], n - 2); k++) add('after', a, scene.after(who[a], k), w => n - 1 - w[a] >= k);
    }
    return out;
}

/** 人ごとの、ありうる位置 (その人だけの手がかりから) を、解き方の文にする */
function narrowText(clues, n, describe) {
    const lines = [];
    for (const person of [...new Set(clues.filter(c => c.person !== null).map(c => c.person))].sort((a, b) => a - b)) {
        const own = clues.filter(c => c.person === person);
        lines.push(`${own.map(c => c.label).join('と')}より、${describe(person, own)}。`);
    }
    return lines;
}

/**
 * 順番の問題。n 人、手がかりは min〜max こ。gap は「間に1人」の手がかりを使うか。
 * もどり値は { question, worlds, key, tests, truth } (worlds 以下は、答えが1つかをテストでたしかめるため)
 */
export function orderingPuzzle(r, { n, min, max, gap = false, scene = r.pick(SCENES), who = people(r, n) }) {
    return retry(() => {
        const order = r.shuffle([...Array(n).keys()]); // 位置ごとの人
        const pos = [];
        order.forEach((p, i) => { pos[p] = i; });
        const worlds = permutations(n).map((o) => {
            const w = [];
            o.forEach((p, i) => { w[p] = i; });
            return w;
        });
        const picked = chooseClues(r, worlds, orderingCandidates(scene, who, pos, { gap }), w => w.join(','), { min, max });
        if (!picked) return null;
        const key = w => w.join(',');
        return { question: orderingFrom(scene, who, order, picked, n, r), worlds, key, tests: picked.map(c => c.test), truth: key(pos) };
    });
}

function orderingFrom(scene, who, order, picked, n, r) {
    const clues = picked.map((c, i) => ({ ...c, label: LABELS[i] }));
    const slots = Array.from({ length: n }, (_, i) => scene.slot(i));
    const allowed = (person, own) => slots.filter((_, k) => own.every(c => c.test(Object.assign([], { [person]: k }))));
    const lines = narrowText(clues, n, (person, own) => `${who[person]}は${orList(allowed(person, own))}`);
    const answer = order.map(p => who[p]);
    return {
        type: 'arrange',
        question: scene.intro(n),
        clues: clues.map(c => `${c.label}. ${c.text}`),
        slots,
        tokens: r.shuffle(who),
        answer,
        arrow: true,
        // メモの「表」 (人 × 順位) の見出し
        table: { rows: [...who], cols: [...slots] },
        explain: [
            ...lines,
            pairText(clues, lines.length > 0, '合わせてためすと、', 'ならび方は1通りに決まります。'),
            `答えは ${answer.join(' → ')} です。`,
        ].join(''),
        isWord: true,
    };
}

/** 順番の問題の、手がかり (人ごとの位置を受けとる関数) に合うならび方 (位置ごとの人の番号) の一覧 (例をたしかめるため) */
export function solveOrdering(n, tests) {
    return permutations(n).filter((o) => {
        const w = [];
        o.forEach((p, i) => { w[p] = i; });
        return tests.every(t => t(w));
    });
}

// ---- 組み合わせの問題 ----

/**
 * 場面ごとの、問題文・ならべるもの・特ちょう (オス・メスなど)・手がかりの言い回し
 */
const MATCH_SCENES = [
    {
        id: 'pet',
        items: ['犬', 'ネコ', 'ハムスター', 'うさぎ'],
        attrs: ['オス', 'メス'],
        intro: (who, items) => `${who.join('、')}の${who.length}人がそれぞれかっている動物について、次のことが分かっています。${who.length}人がかっている動物を答えましょう。`,
        rule: (n, items) => `${n}人がかっている動物は${items.join('・')}のどれかで、${n}人ともちがう動物をかっています。`,
        notItem: (a, x) => `${a}は、${x}をかっていません。`,
        oneOf: (a, x, y) => `${a}がかっているのは、${x}か${y}です。`,
        whoOf: (x, a, b) => `${x}をかっているのは、${a}か${b}です。`,
        itemAttr: (x, t) => `${x}は${t}です。`,
        personAttr: (a, t) => `${a}のかっている動物は${t}です。`,
        notBoth: (a, x, t) => `${a}のかっている動物は、${x}でも${t}でもありません。`,
    },
    {
        id: 'fruit',
        items: ['りんご', 'みかん', 'ぶどう', 'もも'],
        attrs: null,
        intro: (who) => `${who.join('、')}の${who.length}人に、すきな果物を聞きました。それぞれのすきな果物を答えましょう。`,
        rule: (n, items) => `すきな果物は${items.join('・')}のどれかで、${n}人ともちがいます。`,
        notItem: (a, x) => `${a}は、${x}がすきではありません。`,
        oneOf: (a, x, y) => `${a}のすきな果物は、${x}か${y}です。`,
        whoOf: (x, a, b) => `${x}がすきなのは、${a}か${b}です。`,
    },
    {
        id: 'lesson',
        items: ['ピアノ', '水泳', 'サッカー', '習字'],
        attrs: null,
        intro: (who) => `${who.join('、')}の${who.length}人は、それぞれちがう習い事をしています。それぞれの習い事を答えましょう。`,
        rule: (n, items) => `習い事は${items.join('・')}のどれかで、${n}人ともちがいます。`,
        notItem: (a, x) => `${a}は、${x}をならっていません。`,
        oneOf: (a, x, y) => `${a}がならっているのは、${x}か${y}です。`,
        whoOf: (x, a, b) => `${x}をならっているのは、${a}か${b}です。`,
    },
];

/** 組み合わせの「世界」: 人ごとのもの (assign) と、ものごとの特ちょう (attr) */
function matchWorlds(n, withAttrs) {
    const attrs = withAttrs ? Array.from({ length: 2 ** n }, (_, m) => Array.from({ length: n }, (__, i) => (m >> i) & 1)) : [null];
    return permutations(n).flatMap(assign => attrs.map(attr => ({ assign, attr })));
}

function matchingCandidates(scene, who, items, assign, attr) {
    const n = who.length;
    const out = [];
    const add = (kind, person, text, test) => out.push({ kind, person, text, test });
    for (let a = 0; a < n; a++) {
        for (let x = 0; x < n; x++) {
            if (assign[a] !== x) add('notItem', a, scene.notItem(who[a], items[x]), w => w.assign[a] !== x);
            for (let y = x + 1; y < n; y++) {
                if ((assign[a] === x || assign[a] === y) && n > 3) {
                    out.push({ kind: 'oneOf', person: a, group: `one-${a}`, text: scene.oneOf(who[a], items[x], items[y]), test: w => w.assign[a] === x || w.assign[a] === y });
                }
            }
        }
        if (attr) {
            const t = attr[assign[a]];
            add('personAttr', a, scene.personAttr(who[a], scene.attrs[t]), w => w.attr[w.assign[a]] === t);
            for (let x = 0; x < n; x++) {
                if (assign[a] !== x) add('notBoth', a, scene.notBoth(who[a], items[x], scene.attrs[1 - t]), w => w.assign[a] !== x && w.attr[w.assign[a]] === t);
            }
        }
    }
    // x のものを持っているのは、a か b
    for (let x = 0; x < n; x++) {
        const owner = assign.indexOf(x);
        for (let a = 0; a < n; a++) {
            for (let b = a + 1; b < n; b++) {
                if (owner === a || owner === b) {
                    out.push({ kind: 'whoOf', person: null, group: `who-${x}`, text: scene.whoOf(items[x], who[a], who[b]), test: w => w.assign[a] === x || w.assign[b] === x });
                }
            }
        }
    }
    if (attr) {
        for (let x = 0; x < n; x++) add('itemAttr', null, scene.itemAttr(items[x], scene.attrs[attr[x]]), w => w.attr[x] === attr[x]);
    }
    return out;
}

/** 組み合わせの問題。n 人、手がかりは min〜max こ。attrs は特ちょうのある場面 (動物) を使うか。もどり値は orderingPuzzle と同じ形 */
export function matchingPuzzle(r, { n, min, max, attrs = r.bool() }) {
    const scene = attrs ? MATCH_SCENES[0] : r.pick(MATCH_SCENES.slice(1));
    return retry(() => {
        const who = r.pickN(names, n).map(x => `${x}さん`);
        const items = r.pickN(scene.items, n);
        const assign = r.shuffle([...Array(n).keys()]);
        const attr = attrs ? Array.from({ length: n }, () => r.int(0, 1)) : null;
        const worlds = matchWorlds(n, attrs);
        const candidates = matchingCandidates(scene, who, items, assign, attr);
        const picked = chooseClues(r, worlds, candidates, w => w.assign.join(','), { min, max });
        if (!picked) return null;
        // 特ちょうの問題は、特ちょうの手がかりを1つ以上使う (動物の場面でオス・メスが出てこないのはさびしいので)
        if (attrs && !picked.some(c => c.kind === 'itemAttr')) return null;
        const clues = picked.map((c, i) => ({ ...c, label: LABELS[i] }));
        const answer = assign.map(x => items[x]);
        const allowed = (person, own) => items.filter((_, x) => worlds.some(w => w.assign[person] === x && own.every(c => c.test(w))));
        const lines = narrowText(clues, n, (person, own) => {
            const list = allowed(person, own);
            return list.length === 1 ? `${who[person]}は${list[0]}` : `${who[person]}は${orList(list)}`;
        });
        const question = {
            type: 'arrange',
            question: scene.intro(who, items),
            clues: [`・${scene.rule(n, items)}`, ...clues.map(c => `${c.label}. ${c.text}`)],
            slots: who,
            tokens: r.shuffle(items),
            answer,
            arrow: false,
            // メモの「表」 (人 × もの。特ちょうのある場面は、オス・メスの列も足す) の見出し
            table: attr
                ? { rows: [...who], cols: [...items, ...scene.attrs], groups: [n, scene.attrs.length] }
                : { rows: [...who], cols: [...items] },
            explain: [
                ...lines,
                pairText(clues, lines.length > 0, '合わせて、', `${n}人ともちがうことを使うと、1通りに決まります。`),
                `答えは ${who.map((p, i) => `${p}＝${answer[i]}`).join('、')} です。`,
            ].join(''),
            isWord: true,
        };
        const key = w => w.assign.join(',');
        return { question, worlds, key, tests: picked.map(c => c.test), truth: assign.join(',') };
    });
}

/** 組み合わせの、手がかりに合う答え (人ごとのものの番号) の一覧 (テスト用) */
export function solveMatching(n, withAttrs, clues) {
    return [...answersOf(matchWorlds(n, withAttrs), clues.map(test => ({ test })), w => w.assign.join(','))];
}

/** パターンを1つ作る。puzzle は、テスト用に手がかりのしらべ方もふくめて返す */
const suiri = (id, topic, puzzle) => ({ id, topic, puzzle, generate: r => puzzle(r).question });

/** 推理パターン。学年帯ごとに、generate が arrange の1問を返す */
export const suiriPatterns = {
    mid: [
        suiri('mid-suiri-01', '推理（順番）', r => orderingPuzzle(r, { n: 4, min: 3, max: 4 })),
        suiri('mid-suiri-02', '推理（組み合わせ）', r => matchingPuzzle(r, { n: 3, min: 2, max: 4, attrs: true })),
        suiri('mid-suiri-03', '推理（組み合わせ）', r => matchingPuzzle(r, { n: 3, min: 2, max: 3, attrs: false })),
    ],
    high: [
        suiri('high-suiri-01', '推理（順番）', r => orderingPuzzle(r, { n: 5, min: 4, max: 5, gap: true })),
        suiri('high-suiri-02', '推理（順番）', r => orderingPuzzle(r, { n: 4, min: 3, max: 4, gap: true })),
        suiri('high-suiri-03', '推理（組み合わせ）', r => matchingPuzzle(r, { n: 4, min: 3, max: 5, attrs: true })),
        suiri('high-suiri-04', '推理（組み合わせ）', r => matchingPuzzle(r, { n: 4, min: 3, max: 5, attrs: false })),
    ],
};
