import { ref, computed, onUnmounted } from 'vue';
import { findMode } from '../modes.js';
import { createLongSet, QUESTIONS_PER_PROBLEM } from '../long/index.js';

/** 長文チャレンジの進行（長文3題 × 小問3問、時間制限なし） */
export function useLongQuiz(highScores) {
    const screen = ref(null); // null（プレイしていない）| 'quiz' | 'result'
    const mode = ref(null);
    const set = ref([]);
    const problemIndex = ref(0);
    const questionIndex = ref(0);
    const selected = ref(null); // 今の小問で選んだ選択肢（未回答なら null）
    const results = ref([]); // 小問ごとの正誤（true / false）
    const elapsed = ref(0); // 秒
    const isNewRecord = ref(false);

    let timer = null;

    const problem = computed(() => set.value[problemIndex.value] || null);
    const question = computed(() => problem.value?.questions[questionIndex.value] || null);
    const total = computed(() => set.value.length * QUESTIONS_PER_PROBLEM);
    const answered = computed(() => results.value.length);
    const score = computed(() => results.value.filter(Boolean).length);
    const isLast = computed(() => answered.value === total.value);

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

    function start(modeId) {
        const next = findMode(modeId);
        if (!next) return;
        stopTimer();
        mode.value = next;
        set.value = createLongSet(next.level);
        problemIndex.value = 0;
        questionIndex.value = 0;
        selected.value = null;
        results.value = [];
        elapsed.value = 0;
        isNewRecord.value = false;
        screen.value = 'quiz';
        timer = setInterval(() => {
            elapsed.value++;
        }, 1000);
    }

    function answer(option) {
        if (screen.value !== 'quiz' || selected.value !== null) return;
        selected.value = option;
        results.value = [...results.value, option === question.value.answer];
        if (isLast.value) {
            stopTimer(); // 最後の答えを確かめている時間は数えない
        }
    }

    /** 答えを確かめたあと、次の小問（または次の長文、結果）へ進む */
    function next() {
        if (selected.value === null) return;
        if (isLast.value) {
            isNewRecord.value = highScores.submit(mode.value.id, score.value, elapsed.value);
            screen.value = 'result';
            return;
        }
        selected.value = null;
        if (questionIndex.value + 1 < QUESTIONS_PER_PROBLEM) {
            questionIndex.value++;
        } else {
            questionIndex.value = 0;
            problemIndex.value++;
        }
    }

    function restart() {
        start(mode.value.id);
    }

    function quit() {
        stopTimer();
        screen.value = null;
    }

    onUnmounted(stopTimer);

    return {
        screen, mode, set, problem, question, problemIndex, questionIndex, selected, results,
        elapsed, total, answered, score, isLast, isNewRecord, start, answer, next, restart, quit,
    };
}
