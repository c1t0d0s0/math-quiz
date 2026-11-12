<script setup>
import { computed } from 'vue';
import { SECTIONS } from '../kentei/levels.js';

// 算数検定もぎ試験の、問題の一覧 (問題用紙を見わたすところ)。
// 分野ごとに、問題文のはじめと答えた答えをならべ、えらんだ問題を開く
const props = defineProps({
    mode: { type: Object, required: true },
    questions: { type: Array, required: true },
    answers: { type: Array, required: true }, // 問題ごとの答え (undefined は、まだ答えていない)
    answered: { type: Number, required: true }, // 答えた問題の数
    left: { type: Number, required: true }, // のこりの秒数
});
const emit = defineEmits(['open', 'submit', 'quit']);

const clock = computed(() => `${Math.floor(props.left / 60)}:${String(props.left % 60).padStart(2, '0')}`);
const hurry = computed(() => props.left <= 300);
const progress = computed(() => `${(props.answered / Math.max(1, props.questions.length)) * 100}%`);

/** 問題文 (4択は問題文、数字を入れる問題は式か問題文) */
const promptOf = q => (q.type === 'choice' ? q.question : q.label || q.text);

/** 答えた答えを、短い文字にする */
function givenText(value) {
    if (value === undefined) return '';
    if (value === null) return 'わからない';
    return Array.isArray(value) ? value.join('、') : value;
}

// 分野ごとにまとめる (問題は分野の順にならんでいる)
const groups = computed(() => {
    const out = [];
    props.questions.forEach((q, i) => {
        if (out.length === 0 || out[out.length - 1].section !== q.section) {
            out.push({ section: q.section, label: SECTIONS[q.section].label, rows: [] });
        }
        out[out.length - 1].rows.push({ i, prompt: promptOf(q), given: givenText(props.answers[i]), done: props.answers[i] !== undefined });
    });
    return out;
});

function quit() {
    if (window.confirm('試験をとちゅうでやめますか？（記録は残りません）')) {
        emit('quit');
    }
}
</script>

<template>
    <main id="kentei-list" class="quiz kentei-exam kentei-list-page">
        <header class="bar">
            <button type="button" class="back home-btn" @click="quit"><span aria-hidden="true">‹</span>やめる</button>
            <h1>{{ mode.name }}</h1>
            <span class="bar-meta">{{ mode.badge }}</span>
        </header>

        <div class="meter">
            <p class="meter-item"><span id="kentei-answered" class="meter-progress">答えた問題 {{ answered }} / {{ questions.length }}問</span></p>
            <p id="kentei-clock" class="meter-item meter-time" :class="{ 'is-low': hurry }" role="timer">のこり {{ clock }}</p>
        </div>
        <div class="kentei-bar" aria-hidden="true"><span :style="{ width: progress }" /></div>

        <p class="kentei-list-note">解きやすい問題から、好きな順に答えられます。答え合わせをするまでは、何度でも答えを直せます。</p>

        <section v-for="group in groups" :key="group.section" class="kentei-list-group">
            <h2>{{ group.label }}</h2>
            <ol class="kentei-list">
                <li v-for="row in group.rows" :key="row.i">
                    <button type="button" class="kentei-row" :class="{ 'is-done': row.done }" :data-number="row.i + 1" @click="emit('open', row.i)">
                        <span class="kentei-row-number">({{ row.i + 1 }})</span>
                        <span class="kentei-row-prompt">{{ row.prompt }}</span>
                        <span class="kentei-row-given">{{ row.done ? row.given : 'まだ' }}</span>
                    </button>
                </li>
            </ol>
        </section>

        <p class="kentei-submit">
            <button id="kentei-submit" type="button" class="btn btn-primary" @click="emit('submit')">答え合わせをする</button>
        </p>
    </main>
</template>
