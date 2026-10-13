<script setup>
import Hanamaru from './Hanamaru.vue';
import RewardBox from './RewardBox.vue';
import { formatTime } from '../modes.js';
import { QUESTIONS_PER_PROBLEM } from '../long/index.js';

defineProps({
    mode: { type: Object, required: true },
    set: { type: Array, required: true },
    results: { type: Array, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    elapsed: { type: Number, required: true },
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
                    <p class="result-sub">かかった時間: {{ formatTime(elapsed) }}　／　モード: {{ mode.name }}</p>
                </div>
            </div>
            <p v-if="isNewRecord" id="new-record-banner" class="new-record">最高記録 更新！</p>
            <p class="result-label">あなたのスコアは...</p>
            <p id="final-score">{{ score }}<small> / {{ total }}問</small></p>
            </div>
            <table class="long-result-table">
                <tbody>
                    <tr v-for="(problem, i) in set" :key="problem.id">
                        <th>第{{ i + 1 }}題<span>{{ problem.topic }}</span></th>
                        <td v-for="j in QUESTIONS_PER_PROBLEM" :key="j" :class="results[i * QUESTIONS_PER_PROBLEM + j - 1] ? 'ok' : 'ng'">
                            ({{ j }}) <b>{{ results[i * QUESTIONS_PER_PROBLEM + j - 1] ? '○' : '×' }}</b>
                        </td>
                    </tr>
                </tbody>
            </table>
            </div>
            <RewardBox :reward="reward" is-long @open="name => $emit('open', name)" />
            <div class="result-actions result-buttons">
                <button id="back-to-start-button" type="button" class="btn" @click="$emit('back')">モードを選び直す</button>
                <button id="restart-button" type="button" class="btn btn-primary" @click="$emit('restart')">もう一回チャレンジ！</button>
            </div>
        </section>
    </main>
</template>
