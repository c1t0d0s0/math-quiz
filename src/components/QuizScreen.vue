<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { formatTime } from '../modes.js';
import FillQuestion from './FillQuestion.vue';
import { correctText as answerText } from '../answers.js';
import Figure from './figures/Figure.vue';
import FigureList from './figures/FigureList.vue';
import MemoPad from './MemoPad.vue';

const props = defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    timeLeft: { type: Number, required: true },
    question: { type: Object, required: true },
    // 選んだ選択肢。空欄に数字を入れる問題では、入れた数の配列 (答える前は null)
    selected: { type: [String, Array], default: null },
    // 今日のチャレンジ・図形チャレンジ (決まった数の問題。時間はむせいげん) のときだけ使う
    index: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    elapsed: { type: Number, default: 0 },
});
defineEmits(['answer', 'next', 'quit']);

const isFixed = computed(() => props.mode.kind === 'daily' || props.mode.kind === 'zukei');
// 図形問題 (図形チャレンジと、今日のチャレンジにまざる図形問題)
const isZukei = computed(() => props.mode.kind === 'zukei' || !!props.question.topic);
// 文章問題は、文字を小さめにして左によせる
const isWord = computed(() => props.mode.kind === 'word' || !!props.question.isWord);

const timerText = computed(() => {
    if (isFixed.value) return `時間: ${formatTime(props.elapsed)}`;
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

// 図形チャレンジ: 答えたら、合っていたかと解き方を見せる
const isCorrect = computed(() => {
    const q = props.question;
    if (props.selected === null) return false;
    if (q.type !== 'fill') return props.selected === q.answer;
    return props.selected.length === q.blanks.length && props.selected.every((v, i) => Number(v) === q.blanks[i]);
});
const correctText = computed(() => answerText(props.question));
const isLast = computed(() => props.index + 1 >= props.total);
const after = ref(null);
watch(() => props.selected, async (value) => {
    if (value === null || !isZukei.value) return;
    await nextTick();
    after.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
</script>

<template>
    <main id="quiz-container" class="quiz" :class="isWord ? ['word-mode', `word-${mode.level}`] : isZukei ? ['zukei-mode'] : []">
        <header class="bar">
            <button type="button" class="back home-btn" @click="$emit('quit')"><span aria-hidden="true">‹</span>ホーム</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div id="game-info-container" class="meter">
            <p id="score-display" class="meter-item">
                <span v-if="isFixed" id="progress" class="meter-progress">第{{ index + 1 }}問 / {{ total }}問　</span>
                <span class="meter-label">スコア: </span><b id="score" class="meter-num">{{ score }}</b>
            </p>
            <p id="timer" class="meter-item meter-time" :class="{ 'is-low': !isFixed && timeLeft <= 10 }">{{ timerText }}</p>
        </div>

        <!-- 広い画面では、左に問題、右に選択肢をならべる -->
        <div class="quiz-body">
        <FillQuestion
            v-if="question.type === 'fill'"
            :key="`${index}-${question.patternId ?? ''}`"
            :question="question"
            :selected="selected"
            :max-length="question.maxLength ?? 2"
            @answer="values => $emit('answer', values)"
        >
            <template v-if="isZukei" #before>
                <p class="zukei-topic">{{ question.topicLabel }}<span v-if="question.hirameki" class="zukei-hirameki">ひらめき</span></p>
            </template>
        </FillQuestion>
        <template v-else-if="question.type === 'pick'">
        <div id="question-box" class="sheet zukei-sheet">
            <p class="zukei-topic">{{ question.topicLabel }}<span v-if="question.hirameki" class="zukei-hirameki">ひらめき</span></p>
            <p class="fill-question-text">{{ question.text }}</p>
            <FigureList :figure="question.figure" />
        </div>
        <div id="options" class="options-container figure-options">
            <button
                v-for="option in question.options"
                :key="option"
                type="button"
                class="option option-figure"
                :class="optionClass(option)"
                :disabled="selected !== null"
                @click="$emit('answer', option)"
            >
                <span class="option-label">{{ option }}</span>
                <Figure :figure="question.optionFigures[option]" />
            </button>
        </div>
        </template>
        <template v-else>
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
        </template>
        </div>

        <!-- 図形チャレンジ: 答えたあとの解き方と「つぎへ」 -->
        <section v-if="isZukei && selected !== null" ref="after" class="zukei-after" aria-live="polite">
            <p class="zukei-verdict">{{ isCorrect ? '正解！' : `ざんねん。正解は ${correctText}` }}</p>
            <p v-if="question.explain" class="zukei-explain"><b>解き方</b>{{ question.explain }}</p>
            <button id="zukei-next" type="button" class="btn btn-primary" @click="$emit('next')">{{ isLast ? '結果を見る' : 'つぎへ' }}</button>
        </section>

        <MemoPad :reset-key="question" />
    </main>
</template>
