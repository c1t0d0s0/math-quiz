<script setup>
import { computed } from 'vue';
import { CLEAR_SCORE, MONTH_POINTS, STAMP_SCORE, WEEK_POINTS, jstDate } from '../rewards.js';
import { pt } from '../rewardText.js';

// 結果の画面に出す、このプレイでもらったスタンプとポイント
const props = defineProps({
    reward: { type: Object, default: null }, // src/rewards.js の playReward のもどり値
    isLong: { type: Boolean, default: false },
});
defineEmits(['open']);

const month = computed(() => Number(jstDate().slice(5, 7)));
</script>

<template>
    <div v-if="reward" class="result-stamp">
        <template v-if="reward.stampAdded">
            <p class="result-stamp-title">スタンプをおしたよ</p>
            <p class="result-reward">今日のスタンプ +{{ pt(reward.stampPoints) }}</p>
        </template>
        <p v-if="reward.weekPoints > 0" class="result-reward">{{ reward.run }}日つづいた！ +{{ pt(WEEK_POINTS) }}</p>
        <p v-if="reward.monthPoints > 0" class="result-reward">{{ month }}月のスタンプが全部そろった！ +{{ pt(MONTH_POINTS) }}</p>
        <p v-if="reward.clearPoints > 0" class="result-reward">
            {{ isLong ? 'はじめて全問正解！' : `はじめて${CLEAR_SCORE}問以上正解！` }} +{{ pt(reward.clearPoints) }}
        </p>
        <!-- 今日のスタンプがまだのときは、もらい方を知らせる -->
        <p v-if="reward.run === 0" class="result-stamp-title">あと少し！ 1回のプレイで{{ STAMP_SCORE }}問以上正解すると、今日のスタンプがもらえるよ。</p>
        <p v-else-if="reward.gained === 0" class="result-balance">今日のスタンプは、もうもらっているよ。</p>
        <p class="result-balance">持っているポイント {{ pt(reward.balance) }}</p>
        <div class="result-links">
            <button type="button" class="btn" @click="$emit('open', 'stamps')">スタンプカードを見る</button>
            <button type="button" class="btn" @click="$emit('open', 'cards')">カードを見る</button>
        </div>
    </div>
</template>
