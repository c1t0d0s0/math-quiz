<script setup>
import { defineAsyncComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import StartScreen from './components/StartScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ResultScreen from './components/ResultScreen.vue';
import LongQuizScreen from './components/LongQuizScreen.vue';
import LongResultScreen from './components/LongResultScreen.vue';
import KenteiScreen from './components/KenteiScreen.vue';
import KenteiList from './components/KenteiList.vue';
import KenteiResult from './components/KenteiResult.vue';
import StampsPage from './components/StampsPage.vue';
import CardsPage from './components/CardsPage.vue';
import { battleAvailable } from './cloud/config.js';

// 対戦の画面は、開いたときにはじめて読みこむ
const BattlePage = defineAsyncComponent(() => import('./components/battle/BattlePage.vue'));
import { useHighScores } from './composables/useHighScores.js';
import { useQuiz } from './composables/useQuiz.js';
import { useLongQuiz } from './composables/useLongQuiz.js';
import { useKentei } from './composables/useKentei.js';
import { findMode } from './modes.js';

// 開発時だけ使える校正用ページ（?debug=patterns）
const showPatterns = import.meta.env.DEV
    && new URLSearchParams(location.search).get('debug') === 'patterns';
const PatternList = defineAsyncComponent(() => import('./components/PatternList.vue'));

const highScores = useHighScores();
const quiz = useQuiz(highScores);
const { screen, mode, score, timeLeft, question, selected, isNewRecord, reward, index, total, elapsed } = quiz;
const long = useLongQuiz(highScores);
const kentei = useKentei(highScores);

// スタンプカード (#/stamps)・リスザルカード (#/cards)・対戦 (#/battle、#/battle/12345) のページ。
// ブラウザの「もどる」でホームにもどれる
const PAGES = ['stamps', 'cards'];
function readPage() {
    const battle = location.hash.match(/^#\/battle(?:\/(\d+))?$/);
    if (battle && battleAvailable) return { name: 'battle', code: battle[1] ?? null };
    return { name: PAGES.find(name => location.hash === `#/${name}`) ?? 'home', code: null };
}
const route = ref(readPage());
const page = computed(() => route.value.name);
const onHashChange = () => {
    route.value = readPage();
};
onMounted(() => window.addEventListener('hashchange', onHashChange));
onUnmounted(() => window.removeEventListener('hashchange', onHashChange));

/** 結果の画面などから、スタンプカードやリスザルカードのページを開く */
function openPage(name) {
    if (long.screen.value) long.quit();
    if (kentei.screen.value) kentei.quit();
    quiz.backToStart();
    location.hash = `#/${name}`;
}

function goHome() {
    location.hash = '#/';
}

function start(modeId) {
    const kind = findMode(modeId)?.kind;
    if (kind === 'long') {
        long.start(modeId);
    } else if (kind === 'kentei') {
        kentei.start(modeId);
    } else {
        quiz.start(modeId);
    }
}
</script>

<template>
    <PatternList v-if="showPatterns" />
    <LongQuizScreen
        v-else-if="long.screen.value === 'quiz'"
        :mode="long.mode.value"
        :problem="long.problem.value"
        :question="long.question.value"
        :problem-index="long.problemIndex.value"
        :question-index="long.questionIndex.value"
        :problem-count="long.set.value.length"
        :total="long.total.value"
        :elapsed="long.elapsed.value"
        :selected="long.selected.value"
        :is-last="long.isLast.value"
        @answer="long.answer"
        @next="long.next"
        @quit="long.quit"
    />
    <LongResultScreen
        v-else-if="long.screen.value === 'result'"
        :mode="long.mode.value"
        :set="long.set.value"
        :results="long.results.value"
        :score="long.score.value"
        :total="long.total.value"
        :elapsed="long.elapsed.value"
        :is-new-record="long.isNewRecord.value"
        :reward="long.reward.value"
        @restart="long.restart"
        @back="long.quit"
        @open="openPage"
    />
    <KenteiList
        v-else-if="kentei.screen.value === 'exam' && kentei.view.value === 'list'"
        :mode="kentei.mode.value"
        :questions="kentei.questions.value"
        :answers="kentei.answers.value"
        :answered="kentei.answered.value"
        :left="kentei.left.value"
        @open="kentei.open"
        @submit="kentei.submit"
        @quit="kentei.quit"
    />
    <KenteiScreen
        v-else-if="kentei.screen.value === 'exam'"
        :mode="kentei.mode.value"
        :question="kentei.question.value"
        :index="kentei.index.value"
        :total="kentei.total.value"
        :answered="kentei.answered.value"
        :given="kentei.answers.value[kentei.index.value]"
        :left="kentei.left.value"
        @answer="kentei.answer"
        @later="kentei.later"
        @prev="kentei.prev"
        @next="kentei.next"
        @list="kentei.toList"
    />
    <KenteiResult
        v-else-if="kentei.screen.value === 'result'"
        :mode="kentei.mode.value"
        :level="kentei.level.value"
        :result="kentei.result.value"
        @restart="kentei.restart"
        @back="kentei.quit"
        @open="openPage"
    />
    <BattlePage
        v-else-if="page === 'battle' && screen === 'start'"
        :code="route.code"
        :add-battle-result="highScores.addBattleResult"
        @home="goHome"
    />
    <StampsPage
        v-else-if="page === 'stamps' && screen === 'start'"
        :stamps="highScores.rewards.stamps"
        :points="highScores.points.value"
        :loading="highScores.account.loading"
        @home="goHome"
    />
    <CardsPage
        v-else-if="page === 'cards' && screen === 'start'"
        :cards="highScores.rewards.cards"
        :points="highScores.points.value"
        :loading="highScores.account.loading"
        :buy="highScores.buyCard"
        @home="goHome"
    />
    <StartScreen
        v-else-if="screen === 'start'"
        :high-scores="highScores.scores"
        :best-times="highScores.times"
        :record-dates="highScores.dates"
        :perfect-dates="highScores.perfects"
        :account="highScores.account"
        :sign-in="highScores.signIn"
        :sign-out="highScores.signOut"
        :points="highScores.points.value"
        @start="start"
        @open="openPage"
    />
    <QuizScreen
        v-else-if="screen === 'quiz'"
        :mode="mode"
        :score="score"
        :time-left="timeLeft"
        :question="question"
        :selected="selected"
        :index="index"
        :total="total"
        :elapsed="elapsed"
        @answer="quiz.answer"
        @next="quiz.next"
        @quit="quiz.backToStart"
    />
    <ResultScreen
        v-else
        :mode="mode"
        :score="score"
        :is-new-record="isNewRecord"
        :reward="reward"
        :total="total"
        :elapsed="elapsed"
        @restart="quiz.restart"
        @back="quiz.backToStart"
        @open="openPage"
    />
</template>
