<script setup>
defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    isNewRecord: { type: Boolean, default: false },
});
defineEmits(['restart', 'back']);
</script>

<template>
    <div id="result-container">
        <h2>結果発表！</h2>
        <div v-if="isNewRecord" id="new-record-banner" class="new-record">🎉 最高記録 更新！</div>
        <p>タイムアップ！</p>
        <p>あなたのスコアは...</p>
        <p id="final-score">{{ score }}問</p>
        <p id="mode-result-info" class="result-info">モード: {{ mode.name }}</p>
        <div class="result-buttons">
            <button id="restart-button" @click="$emit('restart')">もう一回チャレンジ！</button>
            <button id="back-to-start-button" @click="$emit('back')">モードを選び直す</button>
        </div>
    </div>
</template>
