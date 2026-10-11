<script setup>
// 赤ペンの花丸。うずまきのあとに花びらをかく
defineProps({ animated: { type: Boolean, default: false } });

function hanamaruPoints() {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
        const t = i / 140;
        const a = t * 3 * Math.PI * 2 - Math.PI / 2;
        const r = 3 + t * 24;
        pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
    }
    for (let i = 1; i <= 120; i++) {
        const t = i / 120;
        const a = t * Math.PI * 2 - Math.PI / 2;
        const r = 27 + 13 * Math.abs(Math.sin(t * Math.PI * 6));
        pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
}
const points = hanamaruPoints();
</script>

<template>
    <svg viewBox="0 0 100 100" class="hanamaru" :class="{ 'is-drawn': animated }" aria-hidden="true">
        <polyline :points="points" pathLength="1" />
    </svg>
</template>
