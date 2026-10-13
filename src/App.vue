<script setup>
import { defineAsyncComponent } from 'vue';
import StartScreen from './components/StartScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ResultScreen from './components/ResultScreen.vue';
import LongQuizScreen from './components/LongQuizScreen.vue';
import LongResultScreen from './components/LongResultScreen.vue';
import { useHighScores } from './composables/useHighScores.js';
import { useQuiz } from './composables/useQuiz.js';
import { useLongQuiz } from './composables/useLongQuiz.js';
import { findMode } from './modes.js';

// 開発時だけ使える校正用ページ（?debug=patterns）
const showPatterns = import.meta.env.DEV
    && new URLSearchParams(location.search).get('debug') === 'patterns';
const PatternList = defineAsyncComponent(() => import('./components/PatternList.vue'));

const highScores = useHighScores();
const quiz = useQuiz(highScores);
const { screen, mode, score, timeLeft, question, selected, isNewRecord } = quiz;
const long = useLongQuiz(highScores);

function start(modeId) {
    if (findMode(modeId)?.kind === 'long') {
        long.start(modeId);
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
        @restart="long.restart"
        @back="long.quit"
    />
    <StartScreen
        v-else-if="screen === 'start'"
        :high-scores="highScores.scores"
        :best-times="highScores.times"
        :account="highScores.account"
        :sign-in="highScores.signIn"
        :sign-out="highScores.signOut"
        @start="start"
    />
    <QuizScreen
        v-else-if="screen === 'quiz'"
        :mode="mode"
        :score="score"
        :time-left="timeLeft"
        :question="question"
        :selected="selected"
        @answer="quiz.answer"
        @quit="quiz.backToStart"
    />
    <ResultScreen
        v-else
        :mode="mode"
        :score="score"
        :is-new-record="isNewRecord"
        @restart="quiz.restart"
        @back="quiz.backToStart"
    />
</template>
