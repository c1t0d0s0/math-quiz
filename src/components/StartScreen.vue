<script setup>
import { ref, computed } from 'vue';
import { GRADES, MODES, isVisible } from '../modes.js';

defineProps({ highScores: { type: Object, required: true } });
defineEmits(['start']);

const grade = ref('all');
const visibleModes = computed(() => MODES.filter(mode => isVisible(mode, grade.value)));
</script>

<template>
    <div id="start-container">
        <p class="select-title">学年・モードを選んでね！</p>

        <!-- 学年フィルタータブ -->
        <div class="grade-tabs">
            <button
                v-for="g in GRADES"
                :key="g.id"
                class="grade-tab"
                :class="{ active: grade === g.id }"
                @click="grade = g.id"
            >{{ g.label }}</button>
        </div>

        <!-- モード選択グリッド -->
        <div class="mode-select-grid">
            <div v-for="mode in visibleModes" :key="mode.id" class="mode-card">
                <button class="mode-button" :id="`mode-${mode.id}`" @click="$emit('start', mode.id)">
                    <span class="mode-badge">{{ mode.badge }}</span>
                    <span class="mode-title">{{ mode.title }}</span>
                    <span class="mode-desc">{{ mode.desc }}</span>
                    <span class="high-score-tag">最高: <span>{{ highScores[mode.id] }}</span>問</span>
                </button>
            </div>
        </div>
    </div>
</template>
