import { segments } from '../long/figures.js';

// 線分図を使った、わり算とあまりの問題 (3・4年)。
// 1つの線分図 (たとえば 13 を 4・4・4・1 に区切った図) を見せながら、次の4問をひと組で出す。
//   1. 13 ÷ 4 = [3] … [1]
//   2. (13 − 1) ÷ 4 = [3]
//   3. [4] × 3 + 1 = 13
//   4. (13 − [1]) ÷ 4 = 3
// 空欄には数字を入力して答える。

export const SET_SIZE = 4;
export const SET_PATTERN_ID = 'mid-senbunzu';

/**
 * 線分図の4問ひと組を作る。
 * 1問は { type: 'fill', figure, parts, blanks, setIndex, setSize, isWord, patternId } で、
 * parts は式を左から順にならべたもの (文字か、空欄 { blank: 番号 })、blanks は空欄の正しい数
 */
export function createSegmentSet(r) {
    const d = r.int(3, 9); // わる数 (区切り1つ分)
    const q = r.int(2, 9); // 商 (同じ長さの区切りの数)
    const m = r.int(1, d - 1); // あまり
    const n = d * q + m; // 全体

    const figure = {
        ...segments([{ label: '', parts: [...Array(q).fill(null).map(() => ({ len: d, note: `${d}` })), { len: m, note: `${m}` }] }], `${n}`),
        brace: 'over',
    };

    const make = (setIndex, items) => {
        let blank = 0;
        const blanks = [];
        const parts = items.map((item) => {
            if (typeof item === 'number') {
                blanks.push(item);
                return { blank: blank++ };
            }
            return item;
        });
        return { type: 'fill', figure, parts, blanks, setIndex, setSize: SET_SIZE, isWord: true, patternId: SET_PATTERN_ID };
    };

    return [
        make(1, [`${n} ÷ ${d} = `, q, ' … ', m]),
        make(2, [`(${n} − ${m}) ÷ ${d} = `, q]),
        make(3, [d, ` × ${q} + ${m} = ${n}`]),
        make(4, [`(${n} − `, m, `) ÷ ${d} = ${q}`]),
    ];
}

/** 式を文字にする (空欄は [ ])。確認用 */
export function fillText(question) {
    return question.parts.map(p => (typeof p === 'string' ? p : '[ ]')).join('');
}
