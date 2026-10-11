<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import Figure from './figures/Figure.vue';
import { formatTime } from '../modes.js';
import { QUESTIONS_PER_PROBLEM } from '../long/index.js';

const props = defineProps({
    mode: { type: Object, required: true },
    problem: { type: Object, required: true },
    question: { type: Object, required: true },
    problemIndex: { type: Number, required: true },
    questionIndex: { type: Number, required: true },
    problemCount: { type: Number, required: true },
    total: { type: Number, required: true },
    elapsed: { type: Number, required: true },
    selected: { type: String, default: null },
    isLast: { type: Boolean, default: false },
});
const emit = defineEmits(['answer', 'next', 'quit']);

// 図は1つのことも、図1・図2のように2つあることもある
const figures = computed(() => [props.problem.figure].flat().filter(Boolean));

const passage = ref(null);
const questionBox = ref(null);

// 次の長文に進んだら問題文の先頭へ、次の小問に進んだら小問の位置へ移動する
watch(() => props.problemIndex, async () => {
    await nextTick();
    passage.value?.scrollIntoView({ block: 'start' });
});
watch(() => props.questionIndex, async (index) => {
    await nextTick();
    if (index > 0) questionBox.value?.scrollIntoView({ block: 'nearest' });
});

// 回答後: 選んだものが合っていれば正解の色、まちがいなら赤にして正解も示す
function optionClass(option) {
    if (props.selected === null) return {};
    const isAnswer = option === props.question.answer;
    return { correct: isAnswer, incorrect: option === props.selected && !isAnswer };
}

function quit() {
    if (window.confirm('とちゅうでやめますか？（記録は残りません）')) {
        emit('quit');
    }
}
</script>

<template>
    <main id="long-quiz" class="quiz quiz-long">
        <header class="bar">
            <button type="button" class="back home-btn long-quit" @click="quit"><span aria-hidden="true">‹</span>やめる</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div id="game-info-container" class="meter">
            <p id="score-display" class="meter-item">第{{ problemIndex + 1 }}題 ({{ questionIndex + 1 }})　{{ problemIndex * QUESTIONS_PER_PROBLEM + questionIndex + 1 }} / {{ total }}問</p>
            <p id="timer" class="meter-item meter-time">時間: {{ formatTime(elapsed) }}</p>
        </div>

        <div class="long-layout">
            <section ref="passage" class="long-passage">
                <h2 class="long-heading">第{{ problemIndex + 1 }}題<span>（全{{ problemCount }}題）</span></h2>
                <p v-for="(para, i) in problem.text" :key="i">{{ para }}</p>
                <Figure v-for="(figure, i) in figures" :key="i" :figure="figure" />
            </section>

            <section ref="questionBox" class="long-question">
                <p class="long-question-text"><span class="long-number">({{ questionIndex + 1 }})</span>{{ question.question }}</p>
                <div class="long-options">
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
                <div class="long-actions">
                    <template v-if="selected !== null">
                        <span class="long-verdict" :class="selected === question.answer ? 'ok' : 'ng'">
                            {{ selected === question.answer ? '正解！' : `ざんねん。正解は ${question.answer}` }}
                        </span>
                        <button id="long-next" type="button" class="btn btn-primary" @click="$emit('next')">{{ isLast ? '結果を見る' : '次へ' }}</button>
                    </template>
                    <button v-else type="button" class="btn btn-quiet long-back" @click="passage?.scrollIntoView({ block: 'start', behavior: 'smooth' })">問題文へ戻る</button>
                </div>
            </section>
        </div>
    </main>
</template>
