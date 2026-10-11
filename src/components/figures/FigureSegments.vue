<script setup>
import { computed } from 'vue';

const props = defineProps({ figure: { type: Object, required: true } });

const LEFT = 64;
const WIDTH = 260;
const ROW = 46;

const view = computed(() => {
    const bars = props.figure.bars;
    const longest = Math.max(...bars.map(b => b.parts.reduce((s, p) => s + p.len, 0)));
    const scale = WIDTH / longest;
    const rows = bars.map((bar, i) => {
        const y = 30 + i * ROW;
        let x = LEFT;
        const parts = bar.parts.map((p) => {
            const part = { x1: x, x2: x + p.len * scale, note: p.note || '', dashed: !!p.dashed };
            x = part.x2;
            return part;
        });
        return { label: bar.label, y, parts, end: x };
    });
    const height = 30 + bars.length * ROW - 14;
    return { rows, height, right: LEFT + WIDTH + 14 };
});
</script>

<template>
    <svg :viewBox="`0 0 ${figure.total ? 470 : 350} ${view.height}`" class="figure-svg" role="img" aria-label="線分図">
        <g v-for="row in view.rows" :key="row.label">
            <text :x="LEFT - 10" :y="row.y + 5" text-anchor="end" class="fig-text">{{ row.label }}</text>
            <g v-for="(p, i) in row.parts" :key="i">
                <line :x1="p.x1" :y1="row.y" :x2="p.x2" :y2="row.y" class="fig-line" :class="{ dashed: p.dashed }" />
                <line :x1="p.x1" :y1="row.y - 6" :x2="p.x1" :y2="row.y + 6" class="fig-line" />
                <line :x1="p.x2" :y1="row.y - 6" :x2="p.x2" :y2="row.y + 6" class="fig-line" />
                <text :x="(p.x1 + p.x2) / 2" :y="row.y - 10" text-anchor="middle" class="fig-text accent">{{ p.note }}</text>
            </g>
        </g>
        <g v-if="figure.total">
            <path
                :d="`M ${view.right} ${view.rows[0].y - 8} h 8 V ${view.rows[view.rows.length - 1].y + 8} h -8`"
                class="fig-line thin" fill="none"
            />
            <text :x="view.right + 14" :y="(view.rows[0].y + view.rows[view.rows.length - 1].y) / 2 + 5" class="fig-text accent">{{ figure.total }}</text>
        </g>
    </svg>
</template>
