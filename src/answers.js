// 問題と答えを、結果の画面などに出す文字にする

/** 正しい答え。空欄に数字を入れる問題は、式の空欄に答えを入れた形 (「12 ÷ 4 = 3」) */
export function correctText(q) {
    if (q.type !== 'fill') return String(q.answer);
    return q.parts.map(p => (typeof p === 'string' ? p : String(q.blanks[p.blank]))).join('').trim();
}

/** 問題文。空欄の問題は、問題文と、空欄を □ にした式 */
export function promptText(q) {
    if (q.type !== 'fill') return q.type === 'pick' ? q.text : q.question;
    const equation = q.parts.map(p => (typeof p === 'string' ? p : '□')).join('').trim();
    return q.text ? `${q.text}　${equation}` : equation;
}

/** えらんだ答え・入れた答え */
export function givenText(given) {
    return Array.isArray(given) ? given.join('、') : String(given);
}
