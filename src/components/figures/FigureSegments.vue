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
    const over = props.figure.brace === 'over';
    if (over) {
        // 全体のかっこを線の上に書くので、区切りの数は線の下に書く
        rows.forEach((row) => {
            row.y += 30;
        });
    }
    const height = 30 + bars.length * ROW - 14 + (over ? 34 : 0);
    const first = rows[0];
    return {
        rows, height, over, right: LEFT + WIDTH + 14,
        overStart: first.parts[0].x1, overEnd: first.end, overY: first.y - 16,
        noteDy: over ? 22 : -10,
    };
});
</script>

<template>
    <svg :viewBox="`${view.over && !view.rows[0].label ? LEFT - 14 : 0} 0 ${view.over ? 350 - (view.rows[0].label ? 0 : LEFT - 14) : figure.total ? 470 : 350} ${view.height}`" class="figure-svg" role="img" aria-label="線分図">
        <g v-for="row in view.rows" :key="row.label">
            <text :x="LEFT - 10" :y="row.y + 5" text-anchor="end" class="fig-text">{{ row.label }}</text>
            <g v-for="(p, i) in row.parts" :key="i">
                <line :x1="p.x1" :y1="row.y" :x2="p.x2" :y2="row.y" class="fig-line" :class="{ dashed: p.dashed }" />
                <line :x1="p.x1" :y1="row.y - 6" :x2="p.x1" :y2="row.y + 6" class="fig-line" />
                <line :x1="p.x2" :y1="row.y - 6" :x2="p.x2" :y2="row.y + 6" class="fig-line" />
                <text :x="(p.x1 + p.x2) / 2" :y="row.y + view.noteDy" text-anchor="middle" class="fig-text accent">{{ p.note }}</text>
            </g>
        </g>
        <g v-if="figure.total && view.over">
            <path
                :d="`M ${view.overStart} ${view.overY + 6} q 0 -8 8 -8 H ${(view.overStart + view.overEnd) / 2 - 8} q 8 0 8 -8 q 0 8 8 8 H ${view.overEnd - 8} q 8 0 8 8`"
                class="fig-line thin" fill="none"
            />
            <text :x="(view.overStart + view.overEnd) / 2" :y="view.overY - 14" text-anchor="middle" class="fig-text accent">{{ figure.total }}</text>
        </g>
        <g v-else-if="figure.total">
            <path
                :d="`M ${view.right} ${view.rows[0].y - 8} h 8 V ${view.rows[view.rows.length - 1].y + 8} h -8`"
                class="fig-line thin" fill="none"
            />
            <text :x="view.right + 14" :y="(view.rows[0].y + view.rows[view.rows.length - 1].y) / 2 + 5" class="fig-text accent">{{ figure.total }}</text>
        </g>
    </svg>
</template>
