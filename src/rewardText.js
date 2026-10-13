import {
    CLEAR_POINTS, CLEAR_SCORE, MONTH_POINTS, PERFECT_POINTS, STAMP_POINTS, STAMP_SCORE, WEEK_LENGTH, WEEK_POINTS,
} from './rewards.js';

/** ポイントの書き方 (1,000pt) */
export const pt = n => `${n.toLocaleString('ja-JP')}pt`;

export const STAMP_RULE = `1回のプレイで${STAMP_SCORE}問以上正解すると、その日のスタンプが1個もらえて${STAMP_POINTS}pt。`
    + `${WEEK_LENGTH}日つづけるたびに${pt(WEEK_POINTS)}、1日から月のさいごの日まで全部そろうと${pt(MONTH_POINTS)}。`
    + `計算・文章問題ではじめて${CLEAR_SCORE}問以上正解すると${CLEAR_POINTS}pt、長文チャレンジではじめて全問正解すると${PERFECT_POINTS}pt`
    + `（どちらもモードごとに1回だけ）。`;

/** 今つづいている日数と、次のごほうびまでの日数 */
export function stampRunText(run) {
    if (run <= 0) return `1回のプレイで${STAMP_SCORE}問以上正解して、今日のスタンプをもらおう。`;
    return `${run}日つづいているよ。あと${WEEK_LENGTH - (run % WEEK_LENGTH)}日つづけると${pt(WEEK_POINTS)}！`;
}
