import { defaultRng } from '../generators/rng.js';
import { generateUnitsQuestion } from '../generators/units.js';
import { battleQuestions, isCorrect } from '../battle/questions.js';
import { patterns as wordPatterns, generateFromPattern } from '../word/index.js';
import { patterns as zukeiPatterns, generateZukei } from '../zukei/index.js';
import { examLevel } from './levels.js';

// 算数検定もぎ試験の問題を作る。どの分野も、アプリにある問題の作り方をそのまま使い、学年で習う範囲にしぼる。
//  - 計算: 対戦の問題 (src/battle/questions.js。学年別の暗算できる式) を、数字を入れて答える
//  - 単位: src/generators/units.js の4択 (その学年までに習う単位だけ)
//  - 文章題: src/word/ の4択 (下の表で学年にしぼる)
//  - 図形: 図形チャレンジ (src/zukei/) の、ひらめき問題でない問題を、数字を入れて答える

const LEVEL_OF_GRADE = { 1: 'low', 2: 'low', 3: 'mid', 4: 'mid', 5: 'high', 6: 'high' };

/** パターンの種類 (low-gappei-01 → low-gappei) */
const topicOf = id => id.replace(/-\d+$/, '');

// 文章題: 学年ごとに出す種類 (topics) と、のぞくパターン (except)。
// 植木算・和差算・つるかめ算・旅人算などの受験算数は、検定の範囲ではないので出さない
const WORD = {
    // 1年: 20までのたし算・ひき算と、なんばんめ・時こく (ちょうどの時)。数が20をこえる問題は作り直す
    1: {
        topics: ['low-gappei', 'low-zouka', 'low-kyuzan', 'low-kyusa', 'low-kyuho', 'low-junjo', 'low-yori', 'low-gyaku', 'low-mittsu'],
        only: ['low-jikoku-04'],
        except: ['low-gappei-04', 'low-zouka-04', 'low-kyuzan-03', 'low-kyusa-04', 'low-kyuho-03', 'low-gyaku-03', 'low-gyaku-05'],
        maxNumber: 20,
    },
    2: { except: [] },
    // 3年: 面積・角・計算の順じょ・がい数 (4年) と、小数×整数・小数の倍 (4年) をのぞく
    3: {
        exceptTopics: ['mid-menseki', 'mid-kakudo', 'mid-junjo', 'mid-gaisuu', 'mid-ueki', 'mid-wasa'],
        except: ['mid-shousuu-03', 'mid-shousuu-04', 'mid-bai-04'],
    },
    4: { exceptTopics: ['mid-ueki', 'mid-wasa'], except: [] },
    // 5年: 比・比例・縮尺・場合の数・円の面積・分数のかけ算わり算 (6年) をのぞく
    5: {
        exceptTopics: ['high-hi', 'high-hirei', 'high-shukushaku', 'high-baai', 'high-tsurukame'],
        except: ['high-en-03', 'high-bunsuu-03', 'high-bunsuu-04', 'high-bunsuu-05', 'high-hayasa-05', 'high-hayasa-06', 'high-hayasa-07'],
    },
    6: { exceptTopics: ['high-tsurukame'], except: ['high-hayasa-05', 'high-hayasa-06', 'high-hayasa-07'] },
};

/** その学年の文章題のパターン */
export function wordPatternsOf(grade) {
    const rule = WORD[grade];
    return wordPatterns[LEVEL_OF_GRADE[grade]].filter((p) => {
        const topic = topicOf(p.id);
        if (rule.only?.includes(p.id)) return true;
        if (rule.topics && !rule.topics.includes(topic)) return false;
        if (rule.exceptTopics?.includes(topic)) return false;
        return !rule.except.includes(p.id);
    });
}

// 図形: 3年は、まわりの長さ・マスと数・積み木・折り紙だけ。5年は、円の面積・円柱 (6年) をのぞく
const ZUKEI = {
    3: { level: 'mid', topics: ['perimeter', 'grid', 'volume', 'origami'] },
    4: { level: 'mid' },
    5: { level: 'high', except: ['shaded-quarter', 'shaded-leaf', 'shaded-ring', 'volume-cylinder'] },
    6: { level: 'high' },
};

/** その学年の図形のパターン (ひらめき問題はのぞく) */
export function zukeiPatternsOf(grade) {
    const rule = ZUKEI[grade];
    if (!rule) return [];
    return zukeiPatterns[rule.level].filter(p => !p.hirameki
        && (!rule.topics || rule.topics.includes(p.topic))
        && !(rule.except ?? []).includes(p.id));
}

const maxNumberIn = text => Math.max(...(text.match(/\d+/g) ?? ['0']).map(Number));

/** 4択の問題 */
function choice(section, q) {
    return { type: 'choice', section, question: q.question, options: q.options.map(String), answer: String(q.answer) };
}

/** 数字を入れる問題。blanks は文字にそろえる。label は答え合わせのときに出す問題文 */
function fill(section, q, label) {
    return {
        type: 'fill',
        section,
        text: q.text ?? '',
        figure: q.figure,
        parts: q.parts,
        blanks: q.blanks.map(String),
        keys: q.keys ?? [],
        hint: q.hint ?? '',
        maxLength: q.maxLength ?? 6,
        label,
    };
}

/** 同じ問題文が出ないように、何回か作り直す */
function unique(make, seen, key) {
    let q = make();
    for (let i = 0; i < 30 && seen.has(key(q)); i++) q = make();
    seen.add(key(q));
    return q;
}

const MAKERS = {
    calc(grade, count, r) {
        // 対戦の問題は seed から決まるので、乱数で seed を作る
        return battleQuestions(grade, count, `kentei:${r.int(0, 2 ** 30)}`)
            .map(q => fill('calc', { ...q, text: '' }, q.parts.map(p => (typeof p === 'string' ? p : '□')).join('')));
    },
    units(grade, count, r, seen) {
        return Array.from({ length: count }, () => choice('units',
            unique(() => generateUnitsQuestion(LEVEL_OF_GRADE[grade], r, grade), seen, q => q.question)));
    },
    word(grade, count, r) {
        const list = wordPatternsOf(grade);
        const { maxNumber } = WORD[grade];
        const chosen = r.pickN(list, count);
        while (chosen.length < count) chosen.push(r.pick(list));
        return chosen.map((pattern) => {
            let q = generateFromPattern(pattern, r);
            for (let i = 0; maxNumber && i < 200 && maxNumberIn(q.question + q.options.join(' ')) > maxNumber; i++) {
                q = generateFromPattern(pattern, r);
            }
            return choice('word', q);
        });
    },
    zukei(grade, count, r) {
        const list = zukeiPatternsOf(grade);
        const chosen = r.pickN(list, count);
        while (chosen.length < count) chosen.push(r.pick(list));
        return chosen.map((pattern) => {
            const q = generateZukei(pattern, r);
            // 図をえらぶ問題 (折り紙) は、そのまま4択
            if (q.type === 'pick') {
                return { type: 'pick', section: 'zukei', text: q.text, figure: q.figure, options: q.options, optionFigures: q.optionFigures, answer: q.answer };
            }
            return fill('zukei', q, q.text);
        });
    },
};

/**
 * 1回分の試験。分野の順に問題をならべる (本物の検定も、計算から始まる)。
 * 1問: 4択は { type: 'choice', section, question, options, answer }、
 *      図をえらぶ問題は { type: 'pick', section, text, figure, options, optionFigures, answer }、
 *      数字を入れる問題は { type: 'fill', section, text, figure, parts, blanks, keys, hint, maxLength, label }
 */
export function buildExam(kyu, mini = false, r = defaultRng) {
    const level = examLevel(kyu, mini);
    const seen = new Set();
    return level.sections.flatMap(({ type, count }) => MAKERS[type](level.grade, count, r, seen));
}

/** 答えが合っているか。value は、4択ならえらんだ文字、数字を入れる問題なら入れた数の配列 (わからないときは null) */
export function isRightAnswer(q, value) {
    if (value === null || value === undefined) return false;
    if (q.type !== 'fill') return value === q.answer;
    return value.length === q.blanks.length && value.every((v, i) => isCorrect(v, q.blanks[i]));
}

/** その問題の正しい答え (結果の画面に出す) */
export function answerText(q) {
    if (q.type !== 'fill') return q.answer;
    return q.parts.map(p => (typeof p === 'string' ? p : q.blanks[p.blank])).join('').trim();
}
