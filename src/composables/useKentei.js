import { ref, computed, onUnmounted } from 'vue';
import { findMode } from '../modes.js';
import { buildExam, isRightAnswer } from '../kentei/exam.js';
import { SECTIONS, examLevel, kenteiTitle, passScore } from '../kentei/levels.js';

/**
 * 算数検定もぎ試験の進行。本物の検定と同じく時間のせいげんがあり、答え合わせはさいごにまとめてする。
 * 時間切れになったら、そこで答え合わせ (答えていない問題はまちがい)
 */
export function useKentei(highScores) {
    const screen = ref(null); // null（受けていない）| 'exam' | 'result'
    const mode = ref(null);
    const questions = ref([]);
    const index = ref(0);
    const left = ref(0); // のこりの秒数
    const result = ref(null);

    let answers = [];
    let timer = null;
    let startedAt = 0;
    let endsAt = 0;

    const question = computed(() => questions.value[index.value] ?? null);
    const total = computed(() => questions.value.length);
    const level = computed(() => (mode.value ? examLevel(mode.value.level, mode.value.mini) : null));

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

    function start(modeId) {
        const next = findMode(modeId);
        if (!next) return;
        stopTimer();
        mode.value = next;
        questions.value = buildExam(next.level, next.mini);
        index.value = 0;
        answers = [];
        result.value = null;
        startedAt = Date.now();
        endsAt = startedAt + next.timeLimit * 1000;
        left.value = next.timeLimit;
        // 画面がうしろにあっても時間がずれないように、のこり時間は時計から計算する
        timer = setInterval(() => {
            left.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            if (left.value === 0) finish();
        }, 250);
        screen.value = 'exam';
        window.scrollTo(0, 0);
    }

    /** value: 4択ならえらんだ文字、数字を入れる問題なら入れた数の配列、わからないときは null */
    function answer(value) {
        if (screen.value !== 'exam') return;
        answers[index.value] = value;
        if (index.value + 1 >= total.value) {
            finish();
            return;
        }
        index.value++;
        window.scrollTo(0, 0);
    }

    function skip() {
        answer(null);
    }

    function finish() {
        if (screen.value !== 'exam') return;
        stopTimer();
        const lv = level.value;
        const right = questions.value.map((q, i) => isRightAnswer(q, answers[i]));
        const score = right.filter(Boolean).length;
        const seconds = Math.min(mode.value.timeLimit, Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
        const scoreOf = id => highScores.scores[id];
        const titleBefore = kenteiTitle(scoreOf);
        const { isNewRecord, reward } = highScores.finish(mode.value.id, score, seconds, total.value);
        const titleAfter = kenteiTitle(scoreOf);
        result.value = {
            score,
            total: total.value,
            pass: passScore(total.value),
            passed: score >= passScore(total.value),
            seconds,
            // 時間切れで、答えていない問題があった
            timedOut: answers.length < total.value,
            isNewRecord,
            reward,
            newTitle: titleAfter && titleAfter !== titleBefore ? titleAfter : '',
            sections: lv.sections.map(({ type }) => {
                const inSection = questions.value.map((q, i) => ({ q, ok: right[i] })).filter(x => x.q.section === type);
                return { label: SECTIONS[type].label, got: inSection.filter(x => x.ok).length, max: inSection.length };
            }),
            missed: questions.value
                .map((q, i) => ({ q, number: i + 1, given: answers[i], answered: i < answers.length }))
                .filter((_, i) => !right[i]),
        };
        screen.value = 'result';
        window.scrollTo(0, 0);
    }

    function restart() {
        start(mode.value.id);
    }

    function quit() {
        stopTimer();
        screen.value = null;
    }

    onUnmounted(stopTimer);

    return { screen, mode, questions, question, index, total, left, level, result, start, answer, skip, restart, quit };
}
