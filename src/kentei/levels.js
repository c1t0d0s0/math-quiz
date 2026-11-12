// 算数検定もぎ試験の級の決まり（画面には関係しない）。
// 11級（1年生）〜6級（6年生）。本物の算数検定と同じく、11〜9級は20問・40分、8〜6級は30問・50分で、
// 全体の70%以上の正解で合格。1問1点。問題の作り方は src/kentei/exam.js。
// ミニ試験は、同じ分野を同じ順に、問題数を約半分にしたもの（称号には数えない）。

/** 分野 → 画面に出す名前と答え方（fill: 数字を入れる、choice: 4択） */
export const SECTIONS = {
    calc: { label: '計算', answer: 'fill' },
    units: { label: '単位', answer: 'choice' },
    word: { label: '文章題', answer: 'choice' },
    zukei: { label: '図形', answer: 'fill' },
};

const s = (type, count) => ({ type, count });

/** 級の一覧（数の大きい級＝低い学年から）。sections は出題の順 */
export const KENTEI_LEVELS = [
    { kyu: 11, grade: 1, minutes: 40, sections: [s('calc', 10), s('word', 10)] },
    { kyu: 10, grade: 2, minutes: 40, sections: [s('calc', 8), s('units', 4), s('word', 8)] },
    { kyu: 9, grade: 3, minutes: 40, sections: [s('calc', 8), s('units', 3), s('word', 6), s('zukei', 3)] },
    { kyu: 8, grade: 4, minutes: 50, sections: [s('calc', 12), s('units', 3), s('word', 9), s('zukei', 6)] },
    { kyu: 7, grade: 5, minutes: 50, sections: [s('calc', 12), s('units', 3), s('word', 9), s('zukei', 6)] },
    { kyu: 6, grade: 6, minutes: 50, sections: [s('calc', 12), s('units', 3), s('word', 9), s('zukei', 6)] },
];

export const KYUS = KENTEI_LEVELS.map(level => level.kyu);

/** 問題の数 */
export const countOf = level => level.sections.reduce((n, x) => n + x.count, 0);

/** 合格に必要な正解の数（70%以上） */
export const passScore = count => Math.ceil((count * 7) / 10);

export const passes = (level, score) => score >= passScore(countOf(level));

/**
 * ミニ試験: 11〜9級は10問・20分、8〜6級は15問・25分。
 * 分野ごとの問題数は本番に比例させ（あまりの大きい分野から1問ずつ足す）、どの分野も1問以上にする
 */
function miniLevel(full) {
    const big = countOf(full) > 20;
    const total = big ? 15 : 10;
    const all = countOf(full);
    const shares = full.sections.map(x => ({ type: x.type, exact: (x.count * total) / all, count: Math.max(1, Math.floor((x.count * total) / all)) }));
    let left = total - shares.reduce((n, x) => n + x.count, 0);
    for (const x of [...shares].sort((a, b) => (b.exact - Math.floor(b.exact)) - (a.exact - Math.floor(a.exact)))) {
        if (left <= 0) break;
        if (x.count > x.exact) continue;
        x.count++;
        left--;
    }
    return { ...full, minutes: big ? 25 : 20, sections: shares.map(x => s(x.type, x.count)) };
}

const FULL = new Map(KENTEI_LEVELS.map(level => [level.kyu, level]));
const MINI = new Map(KENTEI_LEVELS.map(level => [level.kyu, miniLevel(level)]));

/** 級の決まり。mini なら、ミニ試験のもの */
export const examLevel = (kyu, mini = false) => (mini ? MINI : FULL).get(kyu);

/** 記録に使うモードの id（src/modes.js の MODES にある） */
export const modeIdOf = (kyu, mini = false) => (mini ? `kentei-mini-k${kyu}` : `kentei-k${kyu}`);

/**
 * 本番の試験で合格した一番上の級の称号（「数検6級相当」）。なければ null。
 * scoreOf(modeId) は、そのモードの最高記録（正解の数）
 */
export function kenteiTitle(scoreOf) {
    const passed = [...KENTEI_LEVELS].sort((a, b) => a.kyu - b.kyu).find(level => passes(level, scoreOf(modeIdOf(level.kyu)) ?? 0));
    return passed ? `数検${passed.kyu}級相当` : null;
}
