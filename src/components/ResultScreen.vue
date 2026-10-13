<script setup>
import Hanamaru from './Hanamaru.vue';
import RewardBox from './RewardBox.vue';

defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    isNewRecord: { type: Boolean, default: false },
    reward: { type: Object, default: null },
});
defineEmits(['restart', 'back', 'open']);
</script>

<template>
    <main id="result-container" class="result-page">
        <section class="result">
            <div class="result-body">
            <div class="result-main">
            <div class="result-head">
                <Hanamaru v-if="score > 0" animated />
                <div>
                    <h2>結果発表！</h2>
                    <p class="result-sub">タイムアップ！　モード: {{ mode.name }}</p>
                </div>
            </div>
            <p v-if="isNewRecord" id="new-record-banner" class="new-record">最高記録 更新！</p>
            </div>
            <div class="result-score">
            <p class="result-label">あなたのスコアは...</p>
            <p id="final-score">{{ score }}問</p>
            </div>
            </div>
            <RewardBox :reward="reward" @open="name => $emit('open', name)" />
            <div class="result-actions result-buttons">
                <button id="back-to-start-button" type="button" class="btn" @click="$emit('back')">モードを選び直す</button>
                <button id="restart-button" type="button" class="btn btn-primary" @click="$emit('restart')">もう一回チャレンジ！</button>
            </div>
        </section>
    </main>
</template>
