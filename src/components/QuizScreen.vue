<script setup>
import { computed } from 'vue';

const props = defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    timeLeft: { type: Number, required: true },
    question: { type: Object, required: true },
    selected: { type: String, default: null },
});
defineEmits(['answer', 'quit']);

const isWord = computed(() => props.mode.kind === 'word');

const timerText = computed(() => {
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
            <p id="score-display" class="meter-item"><span class="meter-label">スコア: </span><b id="score" class="meter-num">{{ score }}</b></p>
            <p id="timer" class="meter-item meter-time" :class="{ 'is-low': timeLeft <= 10 }">{{ timerText }}</p>
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
