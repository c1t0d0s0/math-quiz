<script setup>
import { computed } from 'vue';

const props = defineProps({ figure: { type: Object, required: true } });

const LEFT = 40;
const WIDTH = 340;
const Y = 70;

const view = computed(() => {
    const { points, legs, movers } = props.figure;
    // 短い区間もつぶれないよう、長さの差をやわらげて配置する
    const weights = legs.map(l => Math.sqrt(l.len));
    const sum = weights.reduce((s, w) => s + w, 0);
    const xs = [LEFT];
    weights.forEach(w => xs.push(xs[xs.length - 1] + (w / sum) * WIDTH));
    return {
        points: points.map((name, i) => ({ name, x: xs[i] })),
        legs: legs.map((l, i) => ({ text: l.text, x: (xs[i] + xs[i + 1]) / 2 })),
        movers: movers.map(m => ({ ...m, x: xs[m.at] })),
        right: xs[xs.length - 1],
    };
});
</script>

<template>
    <svg viewBox="0 0 420 110" class="figure-svg" role="img" aria-label="道のりの図">
        <line :x1="LEFT" :y1="Y" :x2="view.right" :y2="Y" class="fig-line" />
        <g v-for="p in view.points" :key="p.name">
            <circle :cx="p.x" :cy="Y" r="5" class="fig-dot" />
            <text :x="p.x" :y="Y + 26" text-anchor="middle" class="fig-text">{{ p.name }}</text>
        </g>
        <text v-for="(l, i) in view.legs" :key="i" :x="l.x" :y="Y + 22" text-anchor="middle" class="fig-text accent">{{ l.text }}</text>
        <g v-for="(m, i) in view.movers" :key="'m' + i">
            <path
                :d="`M ${m.x} ${Y - 22} h ${m.dir * 36} m ${-m.dir * 8} -5 l ${m.dir * 8} 5 l ${-m.dir * 8} 5`"
                class="fig-line blue" fill="none"
            />
            <text :x="m.x + m.dir * 4" :y="Y - 32" :text-anchor="m.dir > 0 ? 'start' : 'end'" class="fig-text blue">{{ m.text }}</text>
        </g>
    </svg>
</template>
