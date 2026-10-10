<script setup>
import { defineAsyncComponent } from 'vue';
import StartScreen from './components/StartScreen.vue';
import QuizScreen from './components/QuizScreen.vue';
import ResultScreen from './components/ResultScreen.vue';
import { useHighScores } from './composables/useHighScores.js';
import { useQuiz } from './composables/useQuiz.js';

// 開発時だけ使える校正用ページ（?debug=patterns）
const showPatterns = import.meta.env.DEV
    && new URLSearchParams(location.search).get('debug') === 'patterns';
const PatternList = defineAsyncComponent(() => import('./components/PatternList.vue'));

const highScores = useHighScores();
const quiz = useQuiz(highScores);
const { screen, mode, score, timeLeft, question, selected, isNewRecord } = quiz;
</script>

<template>
    <PatternList v-if="showPatterns" />
    <div v-else class="container">
        <h1>算数チャレンジ</h1>

        <StartScreen
            v-if="screen === 'start'"
            :high-scores="highScores.scores"
            @start="quiz.start"
        />
        <QuizScreen
            v-else-if="screen === 'quiz'"
            :mode="mode"
            :score="score"
            :time-left="timeLeft"
            :question="question"
            :selected="selected"
            @answer="quiz.answer"
        />
        <ResultScreen
            v-else
            :mode="mode"
            :score="score"
            :is-new-record="isNewRecord"
            @restart="quiz.restart"
            @back="quiz.backToStart"
        />
    </div>
</template>
