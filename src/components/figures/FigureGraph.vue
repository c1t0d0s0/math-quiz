<script setup>
import { computed } from 'vue';

const props = defineProps({ figure: { type: Object, required: true } });

const L = 62;
const T = 30;
const W = 300;
const H = 190;

const view = computed(() => {
    const f = props.figure;
    const px = x => L + (x / f.xMax) * W;
    const py = y => T + H - (y / f.yMax) * H;
    return {
        xTicks: f.xTicks.map(t => ({ ...t, p: px(t.v) })),
        yTicks: f.yTicks.map(t => ({ ...t, p: py(t.v) })),
        lines: f.lines.map((line, i) => {
            const pts = line.points.map(([x, y]) => [px(x), py(y)]);
            const last = pts[pts.length - 1];
            return {
                d: pts.map(([x, y], j) => `${j ? 'L' : 'M'} ${x} ${y}`).join(' '),
                dashed: !!line.dashed,
                label: line.label || '',
                lx: last[0] + 6,
                ly: last[1] + 4,
                color: i % 2 ? 'blue' : 'red',
            };
        }),
    };
});
</script>

<template>
    <svg viewBox="0 0 420 270" class="figure-svg" role="img" aria-label="グラフ">
        <g v-for="t in view.xTicks" :key="'x' + t.v">
            <line v-if="t.v > 0" :x1="t.p" :y1="T" :x2="t.p" :y2="T + H" class="fig-grid" />
            <text :x="t.p" :y="T + H + 18" text-anchor="middle" class="fig-text">{{ t.text }}</text>
        </g>
        <g v-for="t in view.yTicks" :key="'y' + t.v">
            <line v-if="t.v > 0" :x1="L" :y1="t.p" :x2="L + W" :y2="t.p" class="fig-grid" />
            <text :x="L - 8" :y="t.p + 5" text-anchor="end" class="fig-text">{{ t.text }}</text>
        </g>
        <path :d="`M ${L} ${T - 12} V ${T + H} H ${L + W + 14}`" class="fig-line" fill="none" />
        <text :x="L" :y="T - 16" text-anchor="middle" class="fig-text small">{{ figure.yLabel }}</text>
        <text :x="L + W + 16" :y="T + H + 36" text-anchor="end" class="fig-text small">{{ figure.xLabel }}</text>
        <g v-for="(line, i) in view.lines" :key="i">
            <path :d="line.d" class="fig-line graph" :class="[line.color, { dashed: line.dashed }]" fill="none" />
            <text :x="line.lx" :y="line.ly" class="fig-text small" :class="line.color">{{ line.label }}</text>
        </g>
    </svg>
</template>
