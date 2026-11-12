<script setup>
import { computed } from 'vue';
import FillQuestion from './FillQuestion.vue';
import Figure from './figures/Figure.vue';
import FigureList from './figures/FigureList.vue';
import MemoPad from './MemoPad.vue';
import { SECTIONS } from '../kentei/levels.js';

// 算数検定もぎ試験の1問。答えても、その場では正解かどうかを見せずに、次のまだ答えていない問題へ進む。
// 前に答えた問題を開いたときは、その答えを出す (答え合わせまでは、何度でも直せる)
const props = defineProps({
    mode: { type: Object, required: true },
    question: { type: Object, required: true },
    index: { type: Number, required: true },
    total: { type: Number, required: true },
    answered: { type: Number, required: true }, // 答えた問題の数
    given: { type: [String, Array], default: undefined }, // この問題に前に答えた答え
    left: { type: Number, required: true }, // のこりの秒数
});
const emit = defineEmits(['answer', 'later', 'prev', 'next', 'list']);

const section = computed(() => SECTIONS[props.question.section].label);
const progress = computed(() => `${(props.answered / Math.max(1, props.total)) * 100}%`);
// のこり時間を 39:58 の形で。のこり5分からは色を変える
const clock = computed(() => `${Math.floor(props.left / 60)}:${String(props.left % 60).padStart(2, '0')}`);
const hurry = computed(() => props.left <= 300);
const chosen = option => props.given === option;
</script>

<template>
    <main id="kentei-exam" class="quiz kentei-exam" :class="question.type === 'choice' ? ['word-mode'] : ['zukei-mode']">
        <header class="bar">
            <button id="kentei-to-list" type="button" class="back home-btn" @click="emit('list')"><span aria-hidden="true">‹</span>一覧へ</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div class="meter">
            <p class="meter-item">
                <span id="kentei-progress" class="meter-progress">第{{ index + 1 }}問 / {{ total }}問</span>
                <span v-if="given !== undefined" class="kentei-done-tag">答えた</span>
            </p>
            <p id="kentei-clock" class="meter-item meter-time" :class="{ 'is-low': hurry }" role="timer">のこり {{ clock }}</p>
        </div>
        <div class="kentei-bar" aria-hidden="true"><span :style="{ width: progress }" /></div>

        <div class="quiz-body">
        <FillQuestion
            v-if="question.type === 'fill'"
            :key="index"
            :question="question"
            :selected="null"
            :initial="Array.isArray(given) ? given : null"
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
            <button
                v-for="option in question.options"
                :key="option"
                type="button"
                class="option option-figure"
                :class="{ 'is-chosen': chosen(option) }"
                :aria-pressed="chosen(option)"
                @click="emit('answer', option)"
            >
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
            <button
                v-for="option in question.options"
                :key="option"
                type="button"
                class="option"
                :class="{ 'is-chosen': chosen(option) }"
                :aria-pressed="chosen(option)"
                @click="emit('answer', option)"
            >{{ option }}</button>
        </div>
        </template>
        </div>

        <nav class="kentei-nav" aria-label="問題の移動">
            <button id="kentei-prev" type="button" class="btn" :disabled="index === 0" @click="emit('prev')">‹ 前の問題</button>
            <button id="kentei-later" type="button" class="btn" @click="emit('later')">あとで解く</button>
            <button id="kentei-next" type="button" class="btn" :disabled="index + 1 >= total" @click="emit('next')">次の問題 ›</button>
        </nav>

        <!-- 計算や考えたことのメモ。ほかの問題に移ると消える -->
        <MemoPad :reset-key="index" />
    </main>
</template>
