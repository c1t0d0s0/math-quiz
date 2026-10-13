import { ref, onUnmounted } from 'vue';
import { findMode, createGenerator } from '../modes.js';
import { createDailyQuestions } from '../daily.js';
import { jstDate } from '../rewards.js';

// 正解・不正解を見せてから次の問題に進むまでの時間（ミリ秒）
const CORRECT_DELAY = 400;
const WRONG_DELAY = { calc: 1300, word: 2500 };

/**
 * 計算・文章問題（時間内に何問とけるか）と、今日のチャレンジ（決まった10問。時間はむせいげん）の進行
 */
export function useQuiz(highScores) {
    const screen = ref('start'); // 'start' | 'quiz' | 'result'
    const mode = ref(null);
    const score = ref(0);
    const timeLeft = ref(0);
    const question = ref(null);
    const selected = ref(null); // 選んだ選択肢（未回答なら null）
    const isNewRecord = ref(false);
    const reward = ref(null); // このプレイでもらったスタンプとポイント
    // 今日のチャレンジだけで使う
    const index = ref(0); // 今の問題が何問目か (0 から)
    const total = ref(0); // 問題の数 (今日のチャレンジ以外は 0)
    const elapsed = ref(0); // かかった秒数

    let nextQuestion = null;
    let fixed = null; // 今日のチャレンジの10問
    let timer = null;
    let pending = null;

    function stopTimers() {
        clearInterval(timer);
        clearTimeout(pending);
        timer = null;
        pending = null;
    }

    function showQuestion() {
        selected.value = null;
        if (fixed) {
            question.value = fixed[index.value];
            return;
        }
        const q = nextQuestion();
        question.value = { ...q, options: q.options.map(String), answer: String(q.answer), isWord: mode.value.kind === 'word' };
    }

    function finish() {
        stopTimers();
        const result = fixed
            ? highScores.finish(mode.value.id, score.value, elapsed.value, total.value)
            : highScores.finish(mode.value.id, score.value);
        isNewRecord.value = result.isNewRecord;
        reward.value = result.reward;
        screen.value = 'result';
    }

    /** 答えを見せたあと、次の問題へ進む。今日のチャレンジは、さいごの問題なら結果へ */
    function advance() {
        if (fixed) {
            if (index.value + 1 >= total.value) {
                finish();
                return;
            }
            index.value++;
        }
        showQuestion();
    }

    function start(modeId) {
        const next = findMode(modeId);
        if (!next) return;
        stopTimers();
        mode.value = next;
        score.value = 0;
        index.value = 0;
        elapsed.value = 0;
        if (next.kind === 'daily') {
            fixed = createDailyQuestions(next.level, jstDate());
            total.value = fixed.length;
            timeLeft.value = 0;
            timer = setInterval(() => {
                elapsed.value++;
            }, 1000);
        } else {
            fixed = null;
            total.value = 0;
            timeLeft.value = next.timeLimit;
            nextQuestion = createGenerator(next);
            timer = setInterval(() => {
                timeLeft.value--;
                if (timeLeft.value <= 0) {
                    finish();
                }
            }, 1000);
        }
        showQuestion();
        screen.value = 'quiz';
    }

    function answer(option) {
        if (screen.value !== 'quiz' || selected.value !== null) return;
        selected.value = option;
        const correct = option === question.value.answer;
        if (correct) {
            score.value++;
        }
        // さいごの問題に答えたら、答えを確かめている時間は数えない
        if (fixed && index.value + 1 >= total.value) {
            clearInterval(timer);
            timer = null;
        }
        pending = setTimeout(advance, correct ? CORRECT_DELAY : WRONG_DELAY[question.value.isWord ? 'word' : 'calc']);
    }

    function restart() {
        start(mode.value.id);
    }

    function backToStart() {
        stopTimers();
        screen.value = 'start';
    }

    onUnmounted(stopTimers);

    return {
        screen, mode, score, timeLeft, question, selected, isNewRecord, reward, index, total, elapsed,
        start, answer, restart, backToStart,
    };
}
