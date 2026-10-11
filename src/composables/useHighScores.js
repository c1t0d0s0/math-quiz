import { reactive } from 'vue';
import { MODES } from '../modes.js';

// 以前のバージョンと同じキーを使う（記録を引き継ぐため）
const scoreKey = modeId => `math_quiz_highscore_${modeId}`;
// 長文チャレンジで、最高記録を出したときにかかった秒数
const timeKey = modeId => `math_quiz_besttime_${modeId}`;

function read(key) {
    try {
        return parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch {
        return 0;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // 保存できなくても、この画面の間は記録を表示する
    }
}

export function useHighScores() {
    const scores = reactive({});
    const times = reactive({});
    MODES.forEach(mode => {
        scores[mode.id] = read(scoreKey(mode.id));
        times[mode.id] = read(timeKey(mode.id));
    });

    /**
     * スコアを記録する。最高記録を更新したら true を返す。
     * seconds を渡すと、同じ正解数のときは時間が短いほうを最高記録にする
     */
    function submit(modeId, score, seconds) {
        const best = read(scoreKey(modeId));
        const bestTime = read(timeKey(modeId));
        const faster = seconds !== undefined && score > 0 && score === best && (bestTime === 0 || seconds < bestTime);
        if (score <= best && !faster) {
            return false;
        }
        scores[modeId] = score;
        write(scoreKey(modeId), score);
        if (seconds !== undefined) {
            times[modeId] = seconds;
            write(timeKey(modeId), seconds);
        }
        return true;
    }

    return { scores, times, submit };
}
