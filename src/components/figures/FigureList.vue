<script setup>
import Figure from './Figure.vue';

// 図を1つ、または順番のある図 (折り紙の「折る → 折る → 切る」) を矢印でつないでならべる
defineProps({ figure: { type: [Object, Array], required: true } });
</script>

<template>
    <div v-if="Array.isArray(figure)" class="figure-steps">
        <template v-for="(f, i) in figure" :key="i">
            <span v-if="i > 0" class="figure-arrow" aria-hidden="true">→</span>
            <Figure :figure="f" />
        </template>
    </div>
    <Figure v-else :figure="figure" />
</template>
