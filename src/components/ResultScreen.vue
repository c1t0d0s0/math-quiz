<script setup>
import Hanamaru from './Hanamaru.vue';
import RewardBox from './RewardBox.vue';
import { formatTime } from '../modes.js';

defineProps({
    mode: { type: Object, required: true },
    score: { type: Number, required: true },
    isNewRecord: { type: Boolean, default: false },
    reward: { type: Object, default: null },
    // 今日のチャレンジのときだけ使う (問題の数と、かかった秒数)
    total: { type: Number, default: 0 },
    elapsed: { type: Number, default: 0 },
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
                    <p v-if="mode.kind === 'daily'" class="result-sub">かかった時間: {{ formatTime(elapsed) }}　／　モード: {{ mode.name }}</p>
                    <p v-else class="result-sub">タイムアップ！　モード: {{ mode.name }}</p>
                </div>
            </div>
            <p v-if="isNewRecord" id="new-record-banner" class="new-record">{{ mode.kind === 'daily' ? '今日の記録 更新！' : '最高記録 更新！' }}</p>
            </div>
            <div class="result-score">
            <p class="result-label">あなたのスコアは...</p>
            <p v-if="mode.kind === 'daily'" id="final-score">{{ score }}<small> / {{ total }}問</small></p>
            <p v-else id="final-score">{{ score }}問</p>
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
