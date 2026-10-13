<script setup>
import { monkeySvg } from '../monkey.js';

// ホーム画面のリスザル
const svg = monkeySvg();
</script>

<template>
    <!-- eslint-disable-next-line vue/no-v-html -- 中身は src/monkey.js が作る決まった絵だけ -->
    <div class="monkey" v-html="svg" />
</template>
