<script setup>
import { computed } from 'vue';

const props = defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    timeLeft: { type: Number, required: true },
    question: { type: Object, required: true },
    selected: { type: String, default: null },
});
defineEmits(['answer']);

const isWord = computed(() => props.mode.kind === 'word');

const timerText = computed(() => {
    const t = props.timeLeft;
    if (t >= 60) {
        const seconds = t % 60;
        return `残り時間: ${Math.floor(t / 60)}分${seconds < 10 ? '0' + seconds : seconds}秒`;
    }
    return `残り時間: ${t}秒`;
});

// 回答後: 選んだものが合っていれば緑、まちがいなら赤にして正解を緑で示す
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
    <div id="quiz-container" :class="isWord ? ['word-mode', `word-${mode.level}`] : []">
        <div id="game-info-container">
            <div id="score-display">スコア: <span id="score">{{ score }}</span></div>
            <div id="timer">{{ timerText }}</div>
        </div>
        <div id="question-box">
            <p id="question">{{ question.question }}</p>
        </div>
        <div id="options" class="options-container">
            <button
                v-for="option in question.options"
                :key="option"
                class="option"
                :class="optionClass(option)"
                :disabled="selected !== null"
                @click="$emit('answer', option)"
            >{{ option }}</button>
        </div>
    </div>
</template>
