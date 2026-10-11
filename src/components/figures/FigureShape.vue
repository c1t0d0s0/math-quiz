<script setup>
import { computed } from 'vue';

const props = defineProps({ figure: { type: Object, required: true } });

const PAD = 58;
const MAX_W = 320;
const MAX_H = 210;
// 寸法を線のどちら側に書くか（画面上の向き）
const SIDES = { below: [0, 1], above: [0, -1], left: [-1, 0], right: [1, 0] };

const view = computed(() => {
    const f = props.figure;
    const k = Math.min(MAX_W / f.w, MAX_H / f.h);
    const width = f.w * k + PAD * 2;
    const height = f.h * k + PAD * 2;
    const px = x => PAD + x * k;
    const py = y => PAD + (f.h - y) * k;
    const pt = ([x, y]) => [px(x), py(y)];

    const sector = (s) => {
        const rad = d => (d * Math.PI) / 180;
        const [x1, y1] = pt([s.cx + s.r * Math.cos(rad(s.from)), s.cy + s.r * Math.sin(rad(s.from))]);
        const [x2, y2] = pt([s.cx + s.r * Math.cos(rad(s.to)), s.cy + s.r * Math.sin(rad(s.to))]);
        const large = s.to - s.from > 180 ? 1 : 0;
        return `M ${px(s.cx)} ${py(s.cy)} L ${x1} ${y1} A ${s.r * k} ${s.r * k} 0 ${large} 0 ${x2} ${y2} Z`;
    };

    // 寸法: 線から少しはなして平行に細い線を引き、まん中に文字を置く
    const dim = (d) => {
        const [x1, y1] = pt(d.from);
        const [x2, y2] = pt(d.to);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
        // 線に垂直な2つの向きのうち、side で指定された側に近いほうを選ぶ
        const [wx, wy] = SIDES[d.side] || (vertical ? SIDES.left : SIDES.below);
        let [nx, ny] = [-(y2 - y1) / len, (x2 - x1) / len];
        if (nx * wx + ny * wy < 0) [nx, ny] = [-nx, -ny];
        const off = 12;
        return {
            d: `M ${x1 + nx * off} ${y1 + ny * off} L ${x2 + nx * off} ${y2 + ny * off}`,
            x: (x1 + x2) / 2 + nx * (vertical ? 18 : 26),
            y: (y1 + y2) / 2 + ny * (vertical ? 18 : 26) + 5,
            anchor: vertical ? (nx > 0 ? 'start' : 'end') : 'middle',
            text: d.text,
        };
    };

    return {
        width,
        height,
        polys: f.polys.map(p => ({ points: p.points.map(q => pt(q).join(',')).join(' '), fill: p.fill || 'none', dashed: !!p.dashed })),
        circles: f.circles.map(c => ({ cx: px(c.cx), cy: py(c.cy), r: c.r * k, fill: c.fill || 'none', dashed: !!c.dashed })),
        sectors: f.sectors.map(s => ({ d: sector(s), fill: s.fill || 'none' })),
        lines: f.lines.map(l => ({ a: pt(l.from), b: pt(l.to), dashed: !!l.dashed })),
        dims: f.dims.map(dim),
        labels: f.labels.map(l => ({ x: px(l.at[0]), y: py(l.at[1]) + 5, text: l.text })),
        points: f.points.map(p => ({ x: px(p.at[0]), y: py(p.at[1]), tx: px(p.at[0]) + (p.dx ?? 0), ty: py(p.at[1]) + (p.dy ?? 0), text: p.text })),
    };
});
</script>

<template>
    <svg :viewBox="`0 0 ${view.width} ${view.height}`" class="figure-svg" :style="{ maxWidth: view.width + 'px' }" role="img" aria-label="図">
        <polygon v-for="(p, i) in view.polys" :key="'p' + i" :points="p.points" class="fig-line" :class="[`fill-${p.fill}`, { dashed: p.dashed }]" />
        <path v-for="(s, i) in view.sectors" :key="'s' + i" :d="s.d" class="fig-line" :class="`fill-${s.fill}`" />
        <circle v-for="(c, i) in view.circles" :key="'c' + i" :cx="c.cx" :cy="c.cy" :r="c.r" class="fig-line" :class="[`fill-${c.fill}`, { dashed: c.dashed }]" />
        <line v-for="(l, i) in view.lines" :key="'l' + i" :x1="l.a[0]" :y1="l.a[1]" :x2="l.b[0]" :y2="l.b[1]" class="fig-line" :class="{ dashed: l.dashed }" />
        <g v-for="(d, i) in view.dims" :key="'d' + i">
            <path :d="d.d" class="fig-line thin" fill="none" />
            <text :x="d.x" :y="d.y" :text-anchor="d.anchor" class="fig-text accent">{{ d.text }}</text>
        </g>
        <text v-for="(l, i) in view.labels" :key="'t' + i" :x="l.x" :y="l.y" text-anchor="middle" class="fig-text">{{ l.text }}</text>
        <g v-for="(p, i) in view.points" :key="'v' + i">
            <circle :cx="p.x" :cy="p.y" r="3" class="fig-dot" />
            <text :x="p.tx" :y="p.ty" text-anchor="middle" class="fig-text">{{ p.text }}</text>
        </g>
    </svg>
</template>
