<script setup>
import { computed } from 'vue';
import { formatTime } from '../modes.js';

const props = defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    timeLeft: { type: Number, required: true },
    question: { type: Object, required: true },
    selected: { type: String, default: null },
    // 今日のチャレンジ (決まった数の問題。時間はむせいげん) のときだけ使う
    index: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    elapsed: { type: Number, default: 0 },
});
defineEmits(['answer', 'quit']);

const isDaily = computed(() => props.mode.kind === 'daily');
// 文章問題は、文字を小さめにして左によせる
const isWord = computed(() => props.mode.kind === 'word' || !!props.question.isWord);

const timerText = computed(() => {
    if (isDaily.value) return `時間: ${formatTime(props.elapsed)}`;
    const t = props.timeLeft;
    if (t >= 60) {
        const seconds = t % 60;
        return `残り時間: ${Math.floor(t / 60)}分${seconds < 10 ? '0' + seconds : seconds}秒`;
    }
    return `残り時間: ${t}秒`;
});

// 回答後: 選んだものが合っていれば正解の色、まちがいなら赤にして正解も示す
function optionClass(option) {
    if (props.selected === null) return {};
    const isAnswer = option === props.question.answer;
    return {
        correct: isAnswer,
        incorrect: option === props.selected && !isAnswer,
    };
}
</script>

<template>
    <main id="quiz-container" class="quiz" :class="isWord ? ['word-mode', `word-${mode.level}`] : []">
        <header class="bar">
            <button type="button" class="back home-btn" @click="$emit('quit')"><span aria-hidden="true">‹</span>ホーム</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div id="game-info-container" class="meter">
            <p id="score-display" class="meter-item">
                <span v-if="isDaily" id="progress" class="meter-progress">第{{ index + 1 }}問 / {{ total }}問　</span>
                <span class="meter-label">スコア: </span><b id="score" class="meter-num">{{ score }}</b>
            </p>
            <p id="timer" class="meter-item meter-time" :class="{ 'is-low': !isDaily && timeLeft <= 10 }">{{ timerText }}</p>
        </div>

        <!-- 広い画面では、左に問題、右に選択肢をならべる -->
        <div class="quiz-body">
        <div id="question-box" class="sheet">
            <p id="question">{{ question.question }}</p>
        </div>

        <div id="options" class="options-container">
            <button
                v-for="option in question.options"
                :key="option"
                type="button"
                class="option"
                :class="optionClass(option)"
                :disabled="selected !== null"
                @click="$emit('answer', option)"
            >{{ option }}</button>
        </div>
        </div>
    </main>
</template>
