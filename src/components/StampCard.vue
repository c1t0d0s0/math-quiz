<script setup>
import { computed } from 'vue';
import Hanamaru from './Hanamaru.vue';
import { currentRun, jstDate, monthView } from '../rewards.js';
import { STAMP_RULE, pt, stampRunText } from '../rewardText.js';

// スタンプカード。今月のカレンダーに、スタンプをもらった日の花丸をならべる
const props = defineProps({
    stamps: { type: Array, required: true },
    points: { type: Number, required: true },
    loading: { type: Boolean, default: false },
});

const WEEKDAYS = '日月火水木金土';

const view = computed(() => {
    const today = jstDate();
    const month = today.slice(0, 7);
    const todayNum = Number(today.slice(8));
    return {
        monthLabel: `${Number(month.slice(5))}月`,
        blanks: new Date(`${month}-01T00:00:00Z`).getUTCDay(),
        days: monthView(props.stamps, month).map((stamped, i) => ({
            day: i + 1,
            stamped,
            today: i + 1 === todayNum,
            future: i + 1 > todayNum,
        })),
        run: currentRun(props.stamps, today),
    };
});
</script>

<template>
    <section class="stamp" aria-labelledby="stamp-title">
        <div class="stamp-head">
            <h2 id="stamp-title" class="visually-hidden">スタンプカード</h2>
            <span class="stamp-month">{{ view.monthLabel }}</span>
        </div>
        <div class="stamp-grid" role="list">
            <span v-for="w in WEEKDAYS" :key="w" class="stamp-weekday" aria-hidden="true">{{ w }}</span>
            <span v-for="i in view.blanks" :key="`blank-${i}`" aria-hidden="true" />
            <span
                v-for="d in view.days"
                :key="d.day"
                class="stamp-day"
                :class="{ 'is-stamped': d.stamped, 'is-today': d.today, 'is-future': d.future }"
                role="listitem"
                :aria-label="`${d.day}日${d.stamped ? ' スタンプあり' : ''}`"
            >
                <span class="stamp-num" aria-hidden="true">{{ d.day }}</span>
                <Hanamaru v-if="d.stamped" class="stamp-mark" />
            </span>
        </div>
        <p class="stamp-run">{{ loading ? '読みこみ中…' : stampRunText(view.run) }}</p>
        <p class="stamp-rule">{{ STAMP_RULE }}</p>
        <div class="stamp-foot">
            <p class="points">
                <span class="points-label">持っているポイント</span>
                <b class="points-num">{{ loading ? '…' : pt(points) }}</b>
            </p>
        </div>
    </section>
</template>
