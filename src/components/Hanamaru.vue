<script setup>
import { hanamaruPoints } from '../monkey.js';

// 赤ペンの花丸。うずまきのあとに花びらをかく
defineProps({ animated: { type: Boolean, default: false } });

const points = hanamaruPoints();
</script>

<template>
    <svg viewBox="0 0 100 100" class="hanamaru" :class="{ 'is-drawn': animated }" aria-hidden="true">
        <polyline :points="points" pathLength="1" />
    </svg>
</template>
