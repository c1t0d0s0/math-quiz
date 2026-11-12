<script setup>
import { computed } from 'vue';
import FillQuestion from './FillQuestion.vue';
import Figure from './figures/Figure.vue';
import FigureList from './figures/FigureList.vue';
import { SECTIONS } from '../kentei/levels.js';

// 算数検定もぎ試験の1問。答えても、その場では正解かどうかを見せずに次の問題へ進む
const props = defineProps({
    mode: { type: Object, required: true },
    question: { type: Object, required: true },
    index: { type: Number, required: true },
    total: { type: Number, required: true },
    left: { type: Number, required: true }, // のこりの秒数
});
const emit = defineEmits(['answer', 'skip', 'quit']);

const section = computed(() => SECTIONS[props.question.section].label);
const progress = computed(() => `${(props.index / Math.max(1, props.total)) * 100}%`);
// のこり時間を 39:58 の形で。のこり5分からは色を変える
const clock = computed(() => `${Math.floor(props.left / 60)}:${String(props.left % 60).padStart(2, '0')}`);
const hurry = computed(() => props.left <= 300);

function quit() {
    if (window.confirm('試験をとちゅうでやめますか？（記録は残りません）')) {
        emit('quit');
    }
}
</script>

<template>
    <main id="kentei-exam" class="quiz kentei-exam" :class="question.type === 'choice' ? ['word-mode'] : ['zukei-mode']">
        <header class="bar">
            <button type="button" class="back home-btn" @click="quit"><span aria-hidden="true">‹</span>やめる</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div class="meter">
            <p class="meter-item"><span id="kentei-progress" class="meter-progress">第{{ index + 1 }}問 / {{ total }}問</span></p>
            <p id="kentei-clock" class="meter-item meter-time" :class="{ 'is-low': hurry }" role="timer">のこり {{ clock }}</p>
        </div>
        <div class="kentei-bar" aria-hidden="true"><span :style="{ width: progress }" /></div>

        <div class="quiz-body">
        <FillQuestion
            v-if="question.type === 'fill'"
            :key="index"
            :question="question"
            :selected="null"
            :max-length="question.maxLength"
            @answer="values => emit('answer', values)"
        >
            <template #before>
                <p class="zukei-topic">{{ section }}</p>
            </template>
        </FillQuestion>
        <template v-else-if="question.type === 'pick'">
        <div id="question-box" class="sheet zukei-sheet">
            <p class="zukei-topic">{{ section }}</p>
            <p class="fill-question-text">{{ question.text }}</p>
            <FigureList :figure="question.figure" />
        </div>
        <div id="options" class="options-container figure-options">
            <button v-for="option in question.options" :key="option" type="button" class="option option-figure" @click="emit('answer', option)">
                <span class="option-label">{{ option }}</span>
                <Figure :figure="question.optionFigures[option]" />
            </button>
        </div>
        </template>
        <template v-else>
        <div id="question-box" class="sheet">
            <p class="zukei-topic">{{ section }}</p>
            <p id="question">{{ question.question }}</p>
        </div>
        <div id="options" class="options-container">
            <button v-for="option in question.options" :key="option" type="button" class="option" @click="emit('answer', option)">{{ option }}</button>
        </div>
        </template>
        </div>

        <p class="kentei-skip">
            <button id="kentei-skip" type="button" class="btn" @click="emit('skip')">わからない（つぎの問題へ）</button>
        </p>
    </main>
</template>
