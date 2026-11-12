import { ref, computed, onUnmounted } from 'vue';
import { findMode } from '../modes.js';
import { buildExam, isRightAnswer, nextUnanswered } from '../kentei/exam.js';
import { SECTIONS, examLevel, kenteiTitle, passScore } from '../kentei/levels.js';

/**
 * 算数検定もぎ試験の進行。本物の検定と同じく時間のせいげんがあり、答え合わせはさいごにまとめてする。
 * 問題の一覧から好きな問題をえらんで答えられ、答え合わせをするまでは何度でも答えを直せる。
 * 時間切れになったら、そこで答え合わせ (答えていない問題はまちがい)
 */
export function useKentei(highScores) {
    const screen = ref(null); // null（受けていない）| 'exam' | 'result'
    const mode = ref(null);
    const questions = ref([]);
    const index = ref(0);
    const view = ref('list'); // 試験中に出す画面: 'list' (問題の一覧) | 'question' (1問)
    // 問題ごとの答え。undefined は、まだ答えていない問題
    const answers = ref([]);
    const left = ref(0); // のこりの秒数
    const result = ref(null);

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
        view.value = 'list';
        answers.value = [];
        result.value = null;
        startedAt = Date.now();
        endsAt = startedAt + next.timeLimit * 1000;
        left.value = next.timeLimit;
        // 画面がうしろにあっても時間がずれないように、のこり時間は時計から計算する
        timer = setInterval(() => {
            left.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            if (left.value === 0) finish(true);
        }, 250);
        screen.value = 'exam';
        window.scrollTo(0, 0);
    }

    /** 第 i 問 (0 から) を開く */
    function open(i) {
        if (screen.value !== 'exam' || i < 0 || i >= total.value) return;
        index.value = i;
        view.value = 'question';
        window.scrollTo(0, 0);
    }

    function toList() {
        if (screen.value !== 'exam') return;
        view.value = 'list';
        window.scrollTo(0, 0);
    }

    /** 今の問題よりあとの、まだ答えていない問題へ。全部答えていたら一覧へ */
    function goNextUnanswered() {
        const i = nextUnanswered(answers.value, total.value, index.value);
        if (i < 0) toList();
        else open(i);
    }

    /** value: 4択ならえらんだ文字、数字を入れる問題なら入れた数の配列 */
    function answer(value) {
        if (screen.value !== 'exam') return;
        answers.value[index.value] = value;
        goNextUnanswered();
    }

    /** 答えずに、ほかのまだ答えていない問題へ */
    function later() {
        if (screen.value !== 'exam') return;
        // 今の問題しか残っていないときは、一覧へ
        const i = nextUnanswered(answers.value, total.value, index.value);
        if (i < 0 || i === index.value) toList();
        else open(i);
    }

    const prev = () => open(index.value - 1);
    const next = () => open(index.value + 1);

    /** 答え合わせ。まだ答えていない問題があれば、確かめてから */
    function submit() {
        if (screen.value !== 'exam') return;
        const rest = total.value - answered.value;
        if (rest > 0 && !window.confirm(`まだ答えていない問題が ${rest}問 あります。答え合わせをしますか？`)) return;
        finish();
    }

    /** 答えた問題の数 */
    const answered = computed(() => questions.value.filter((_, i) => answers.value[i] !== undefined).length);

    function finish(timeUp = false) {
        if (screen.value !== 'exam') return;
        stopTimer();
        const lv = level.value;
        const given = answers.value;
        const right = questions.value.map((q, i) => isRightAnswer(q, given[i]));
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
            // 時間切れで終わった
            timedOut: timeUp,
            isNewRecord,
            reward,
            newTitle: titleAfter && titleAfter !== titleBefore ? titleAfter : '',
            sections: lv.sections.map(({ type }) => {
                const inSection = questions.value.map((q, i) => ({ q, ok: right[i] })).filter(x => x.q.section === type);
                return { label: SECTIONS[type].label, got: inSection.filter(x => x.ok).length, max: inSection.length };
            }),
            missed: questions.value
                .map((q, i) => ({ q, number: i + 1, given: given[i], answered: given[i] !== undefined }))
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

    return {
        screen, mode, questions, question, index, total, view, answers, answered, left, level, result,
        start, open, toList, answer, later, prev, next, submit, restart, quit,
    };
}
