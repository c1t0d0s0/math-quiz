<script setup>
import { ref, computed, watch } from 'vue';

// 推理パズル (src/word/suiri.js)。手がかりを読んで、名前や動物のボタンを押し、空欄を左から順にうめて答える。
// 順番の問題は空欄を → でつなぐ。空欄を押すとそこを空け、「けす」で最後に入れたものを1つ消す
const props = defineProps({
    question: { type: Object, required: true },
    selected: { type: Array, default: null }, // 答えた空欄ごとの答え (答える前は null)
    initial: { type: Array, default: null }, // はじめから空欄に入れておく答え (算数検定もぎ試験で開き直したとき)
});
const emit = defineEmits(['answer']);

const values = ref([]);
// 入れた順 (「けす」で最後に入れたものから消すため)
let history = [];

function reset() {
    values.value = props.question.slots.map((_, i) => props.initial?.[i] ?? '');
    history = values.value.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
}
watch(() => props.question, reset, { immediate: true });

const answered = computed(() => props.selected !== null);
const used = computed(() => new Set(values.value.filter(Boolean)));
const full = computed(() => values.value.every(Boolean));

function put(token) {
    if (answered.value || used.value.has(token)) return;
    const i = values.value.findIndex(v => !v);
    if (i < 0) return;
    values.value[i] = token;
    history.push(i);
}

function clearSlot(i) {
    if (answered.value || !values.value[i]) return;
    values.value[i] = '';
    history = history.filter(x => x !== i);
}

function erase() {
    if (answered.value) return;
    const i = history.pop();
    if (i !== undefined) values.value[i] = '';
}

function submit() {
    if (answered.value || !full.value) return;
    emit('answer', [...values.value]);
}

function slotClass(i) {
    if (!answered.value) return { 'is-filled': !!values.value[i] };
    const ok = props.selected[i] === props.question.answer[i];
    return { correct: ok, incorrect: !ok };
}

const shown = i => (answered.value ? props.selected[i] : values.value[i]);
</script>

<template>
    <div id="question-box" class="sheet arrange-sheet">
        <slot name="before" />
        <p class="fill-question-text">{{ question.question }}</p>
        <ul class="arrange-clues">
            <li v-for="(c, i) in question.clues" :key="i">{{ c }}</li>
        </ul>
        <ol class="arrange-slots" :class="{ 'is-order': question.arrow }" aria-label="答え">
            <li v-for="(label, i) in question.slots" :key="i" class="arrange-slot-wrap">
                <span v-if="question.arrow && i > 0" class="arrange-arrow" aria-hidden="true">→</span>
                <span class="arrange-slot-label">{{ label }}</span>
                <button
                    type="button"
                    class="arrange-slot"
                    :class="slotClass(i)"
                    :aria-label="`${label}: ${shown(i) || '空欄'}`"
                    @click="clearSlot(i)"
                >{{ shown(i) }}</button>
                <span v-if="answered && selected[i] !== question.answer[i]" class="fill-correct">{{ question.answer[i] }}</span>
            </li>
        </ol>
    </div>

    <div class="arrange-pad" role="group" aria-label="答えのボタン">
        <button
            v-for="t in question.tokens"
            :key="t"
            type="button"
            class="key arrange-token"
            :disabled="answered || used.has(t)"
            @click="put(t)"
        >{{ t }}</button>
        <button type="button" class="key key-special" :disabled="answered" @click="erase">けす</button>
        <button id="arrange-submit" type="button" class="key key-submit" :disabled="answered || !full" @click="submit">こたえる</button>
    </div>
</template>
