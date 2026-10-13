import { ref, onUnmounted } from 'vue';
import { findMode, createGenerator } from '../modes.js';

// 正解・不正解を見せてから次の問題に進むまでの時間（ミリ秒）
const CORRECT_DELAY = 400;
const WRONG_DELAY = { calc: 1300, word: 2500 };

export function useQuiz(highScores) {
    const screen = ref('start'); // 'start' | 'quiz' | 'result'
    const mode = ref(null);
    const score = ref(0);
    const timeLeft = ref(0);
    const question = ref(null);
    const selected = ref(null); // 選んだ選択肢（未回答なら null）
    const isNewRecord = ref(false);
    const reward = ref(null); // このプレイでもらったスタンプとポイント

    let nextQuestion = null;
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
        const q = nextQuestion();
        question.value = { ...q, options: q.options.map(String), answer: String(q.answer) };
    }

    function finish() {
        stopTimers();
        const result = highScores.finish(mode.value.id, score.value);
        isNewRecord.value = result.isNewRecord;
        reward.value = result.reward;
        screen.value = 'result';
    }

    function start(modeId) {
        const next = findMode(modeId);
        if (!next) return;
        stopTimers();
        mode.value = next;
        score.value = 0;
        timeLeft.value = next.timeLimit;
        nextQuestion = createGenerator(next);
        showQuestion();
        screen.value = 'quiz';
        timer = setInterval(() => {
            timeLeft.value--;
            if (timeLeft.value <= 0) {
                finish();
            }
        }, 1000);
    }

    function answer(option) {
        if (screen.value !== 'quiz' || selected.value !== null) return;
        selected.value = option;
        const correct = option === question.value.answer;
        if (correct) {
            score.value++;
        }
        pending = setTimeout(showQuestion, correct ? CORRECT_DELAY : WRONG_DELAY[mode.value.kind]);
    }

    function restart() {
        start(mode.value.id);
    }

    function backToStart() {
        stopTimers();
        screen.value = 'start';
    }

    onUnmounted(stopTimers);

    return { screen, mode, score, timeLeft, question, selected, isNewRecord, reward, start, answer, restart, backToStart };
}
