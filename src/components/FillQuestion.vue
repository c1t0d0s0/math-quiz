<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Figure from './figures/Figure.vue';

// 空欄に数字を入れて答える問題 (線分図の問題・対戦の問題)。左に図と式、右にテンキーを出す
const props = defineProps({
    question: { type: Object, required: true }, // src/word/segments.js や src/battle/questions.js の1問
    selected: { type: Array, default: null }, // 答えた数 (答える前は null)
    maxLength: { type: Number, default: 2 }, // 1つの空欄に入れられる文字の数
    // ふえるたびに「まちがい」を見せて、入れた数を消す (対戦で、正解するまで同じ問題を解くとき)
    wrongSignal: { type: Number, default: 0 },
});
const emit = defineEmits(['answer']);

// 問題によって足すキー (小数点・分数の線)
const extraKeys = computed(() => props.question.keys ?? []);
const wrongFlash = ref(false);
let flashTimer = null;
watch(() => props.wrongSignal, () => {
    reset();
    wrongFlash.value = true;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
        wrongFlash.value = false;
    }, 600);
});
const values = ref([]);
const active = ref(0);

function reset() {
    values.value = props.question.blanks.map(() => '');
    active.value = 0;
}
watch(() => props.question, reset, { immediate: true });

const answered = computed(() => props.selected !== null);

function blankClass(i) {
    if (!answered.value) return { 'is-active': i === active.value };
    const ok = String(props.selected[i]) === String(props.question.blanks[i]);
    return { correct: ok, incorrect: !ok };
}

function input(ch) {
    if (answered.value) return;
    const v = values.value[active.value];
    if (v.length >= props.maxLength) return;
    if (ch === '.' || ch === '/') {
        // 小数点と分数の線は、その問題で使えるときだけ。数のあとに1回だけ
        if (!extraKeys.value.includes(ch) || v === '' || v.includes('.') || v.includes('/')) return;
    } else if (v === '0' || v.endsWith('/0')) {
        return; // 0 のあとに数字は続けない (0.5 の「.」は入れられる)
    }
    values.value[active.value] = v + ch;
}

function erase() {
    if (answered.value) return;
    const v = values.value[active.value];
    if (v) values.value[active.value] = v.slice(0, -1);
    else if (active.value > 0) active.value--;
}

/** 「こたえる」: まだ空いているマスがあればそこへ進み、全部うまっていれば答え合わせ */
function submit() {
    if (answered.value || values.value[active.value] === '') return;
    const empty = values.value.findIndex(v => v === '');
    if (empty >= 0) {
        active.value = empty;
        return;
    }
    emit('answer', [...values.value]);
}

function select(i) {
    if (!answered.value) active.value = i;
}

// PC ではキーボードでも入力できる
function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9./]$/.test(e.key)) input(e.key);
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') submit();
    else if (e.key === 'Tab' || e.key === 'ArrowRight') {
        if (values.value.length > 1) active.value = (active.value + 1) % values.value.length;
    } else if (e.key === 'ArrowLeft') {
        if (values.value.length > 1) active.value = (active.value + values.value.length - 1) % values.value.length;
    } else return;
    e.preventDefault();
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => {
    window.removeEventListener('keydown', onKey);
    clearTimeout(flashTimer);
});
</script>

<template>
    <div id="question-box" class="sheet fill-sheet">
        <p v-if="question.setIndex" class="fill-step">線分図 {{ question.setIndex }}/{{ question.setSize }}</p>
        <slot name="before" />
        <Figure v-if="question.figure" :figure="question.figure" />
        <p id="question" class="fill-equation" :aria-label="question.parts.map(p => (typeof p === 'string' ? p : '□')).join('')">
            <template v-for="(part, i) in question.parts" :key="i">
                <span v-if="typeof part === 'string'" class="fill-text">{{ part }}</span>
                <span v-else class="fill-blank-wrap">
                    <button
                        type="button"
                        class="fill-blank"
                        :class="[blankClass(part.blank), { incorrect: wrongFlash }]"
                        :aria-label="`空欄${part.blank + 1}`"
                        @click="select(part.blank)"
                    >{{ answered ? selected[part.blank] : values[part.blank] }}</button>
                    <span v-if="answered && selected[part.blank] !== question.blanks[part.blank]" class="fill-correct">{{ question.blanks[part.blank] }}</span>
                </span>
            </template>
        </p>
        <p v-if="question.hint" class="fill-hint">{{ question.hint }}</p>
    </div>

    <div class="number-pad" role="group" aria-label="数字の入力">
        <button v-for="k in extraKeys" :key="k" type="button" class="key key-extra" :disabled="answered" @click="input(k)">{{ k }}</button>
        <button v-for="d in ['7', '8', '9', '4', '5', '6', '1', '2', '3']" :key="d" type="button" class="key" :disabled="answered" @click="input(d)">{{ d }}</button>
        <button type="button" class="key key-special" :disabled="answered" @click="erase">けす</button>
        <button type="button" class="key" :disabled="answered" @click="input('0')">0</button>
        <button id="fill-submit" type="button" class="key key-submit" :disabled="answered" @click="submit">こたえる</button>
    </div>
</template>
