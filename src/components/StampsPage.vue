<script setup>
import StampCard from './StampCard.vue';

// スタンプカードを大きく見るページ
defineProps({
    stamps: { type: Array, required: true },
    points: { type: Number, required: true },
    loading: { type: Boolean, default: false },
});
defineEmits(['home']);
</script>

<template>
    <div class="stamps-page">
        <header class="bar">
            <button type="button" class="back home-btn" @click="$emit('home')"><span aria-hidden="true">‹</span>ホーム</button>
            <h1>スタンプカード</h1>
            <span />
        </header>
        <main class="stamps-main">
            <StampCard :stamps="stamps" :points="points" :loading="loading" />
            <p class="page-foot"><button type="button" class="btn btn-primary" @click="$emit('home')">ホームへ</button></p>
        </main>
    </div>
</template>
