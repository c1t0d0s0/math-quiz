<script setup>
import Hanamaru from './Hanamaru.vue';
import { computed } from 'vue';
import RewardBox from './RewardBox.vue';
import FigureList from './figures/FigureList.vue';
import { formatTime } from '../modes.js';
import { correctText, givenText, promptText } from '../answers.js';

const props = defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    isNewRecord: { type: Boolean, default: false },
    reward: { type: Object, default: null },
    // 今日のチャレンジ・図形チャレンジのときだけ使う (問題の数と、かかった秒数)
    total: { type: Number, default: 0 },
    elapsed: { type: Number, default: 0 },
    // 1問ずつの答え ({ question, given, correct }。src/composables/useQuiz.js)
    history: { type: Array, default: () => [] },
});
defineEmits(['restart', 'back', 'open']);

// 今日のチャレンジでまちがえた問題 (何問目か・問題・答え・解き方)
const missed = computed(() => (props.mode.kind === 'daily'
    ? props.history.map((h, i) => ({ ...h, number: i + 1 })).filter(h => !h.correct)
    : []));
</script>

<template>
    <main id="result-container" class="result-page">
        <section class="result">
            <div class="result-body">
            <div class="result-main">
            <div class="result-head">
                <Hanamaru v-if="score > 0" animated />
                <div>
                    <h2>結果発表！</h2>
                    <p v-if="mode.kind === 'daily' || mode.kind === 'zukei'" class="result-sub">かかった時間: {{ formatTime(elapsed) }}　／　モード: {{ mode.name }}</p>
                    <p v-else class="result-sub">タイムアップ！　モード: {{ mode.name }}</p>
                </div>
            </div>
            <p v-if="isNewRecord" id="new-record-banner" class="new-record">{{ mode.kind === 'daily' ? '今日の記録 更新！' : '最高記録 更新！' }}</p>
            </div>
            <div class="result-score">
            <p class="result-label">あなたのスコアは...</p>
            <p v-if="mode.kind === 'daily' || mode.kind === 'zukei'" id="final-score">{{ score }}<small> / {{ total }}問</small></p>
            <p v-else id="final-score">{{ score }}問</p>
            </div>
            </div>
            <section v-if="missed.length > 0" id="daily-missed" class="daily-missed" aria-labelledby="daily-missed-title">
                <h3 id="daily-missed-title">まちがえた問題と解き方</h3>
                <ol class="kentei-missed">
                    <li v-for="m in missed" :key="m.number">
                        <span class="kentei-missed-head">第{{ m.number }}問</span>
                        <span class="kentei-missed-question">{{ promptText(m.question) }}</span>
                        <FigureList v-if="m.question.figure" :figure="m.question.figure" />
                        <span class="kentei-missed-answer">正しい答え: <b>{{ correctText(m.question) }}</b></span>
                        <span class="kentei-missed-given">あなたの答え: {{ givenText(m.given) }}</span>
                        <p v-if="m.question.explain" class="daily-explain"><b>解き方</b>{{ m.question.explain }}</p>
                    </li>
                </ol>
            </section>
            <RewardBox :reward="reward" @open="name => $emit('open', name)" />
            <div class="result-actions result-buttons">
                <button id="back-to-start-button" type="button" class="btn" @click="$emit('back')">モードを選び直す</button>
                <button id="restart-button" type="button" class="btn btn-primary" @click="$emit('restart')">もう一回チャレンジ！</button>
            </div>
        </section>
    </main>
</template>
