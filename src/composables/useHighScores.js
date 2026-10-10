import { reactive } from 'vue';
import { MODES } from '../modes.js';

// 以前のバージョンと同じキーを使う（記録を引き継ぐため）
const key = modeId => `math_quiz_highscore_${modeId}`;

function read(modeId) {
    try {
        return parseInt(localStorage.getItem(key(modeId)) || '0', 10) || 0;
    } catch {
        return 0;
    }
}

export function useHighScores() {
    const scores = reactive({});
    MODES.forEach(mode => {
        scores[mode.id] = read(mode.id);
    });

    /** スコアを記録する。最高記録を更新したら true を返す */
    function submit(modeId, score) {
        if (score <= read(modeId)) {
            return false;
        }
        scores[modeId] = score;
        try {
            localStorage.setItem(key(modeId), String(score));
        } catch {
            // 保存できなくても、この画面の間は記録を表示する
        }
        return true;
    }

    return { scores, submit };
}
