// 問題と答えを、結果の画面などに出す文字にする

/** 推理パズル (ボタンで空欄をうめる問題) の答えを文字にする。順番は「ゆみ → さち → …」、組み合わせは「もえ＝犬、…」 */
export function arrangeText(q, values) {
    return q.arrow ? values.join(' → ') : q.slots.map((s, i) => `${s}＝${values[i] ?? '？'}`).join('、');
}

/** 正しい答え。空欄に数字を入れる問題は、式の空欄に答えを入れた形 (「12 ÷ 4 = 3」) */
export function correctText(q) {
    if (q.type === 'arrange') return arrangeText(q, q.answer);
    if (q.type !== 'fill') return String(q.answer);
    return q.parts.map(p => (typeof p === 'string' ? p : String(q.blanks[p.blank]))).join('').trim();
}

/** 問題文。空欄の問題は、問題文と、空欄を □ にした式 */
export function promptText(q) {
    if (q.type === 'arrange') return `${q.question}　${q.clues.join('　')}`;
    if (q.type !== 'fill') return q.type === 'pick' ? q.text : q.question;
    const equation = q.parts.map(p => (typeof p === 'string' ? p : '□')).join('').trim();
    return q.text ? `${q.text}　${equation}` : equation;
}

/** えらんだ答え・入れた答え。q をわたすと、推理パズルの答えを問題に合わせた形にする */
export function givenText(given, q) {
    if (q?.type === 'arrange' && Array.isArray(given)) return arrangeText(q, given);
    return Array.isArray(given) ? given.join('、') : String(given);
}

/** 推理パズルの答えが合っているか */
export function arrangeCorrect(q, values) {
    return Array.isArray(values) && values.length === q.answer.length && values.every((v, i) => v === q.answer[i]);
}
