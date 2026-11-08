<script setup>
import { computed } from 'vue';

// マス目 (魔方陣・数をならべた表・ピラミッド)。座標は左上が原点で、1マスが1
const props = defineProps({ figure: { type: Object, required: true } });

const CELL = 40;
const PAD = 4;

const view = computed(() => {
    const f = props.figure;
    return {
        width: f.w * CELL + PAD * 2,
        height: f.h * CELL + PAD * 2,
        cells: f.cells.map(c => ({
            x: PAD + c.x * CELL,
            y: PAD + c.y * CELL,
            cx: PAD + (c.x + 0.5) * CELL,
            cy: PAD + (c.y + 0.5) * CELL + 6,
            text: c.text ?? '',
            mark: c.mark ?? '',
            plain: !!c.plain,
            small: String(c.text ?? '').length > 3,
        })),
    };
});
</script>

<template>
    <svg :viewBox="`0 0 ${view.width} ${view.height}`" class="figure-svg figure-grid" :style="{ maxWidth: view.width + 'px' }" role="img" aria-label="マスの図">
        <g v-for="(c, i) in view.cells" :key="i">
            <rect v-if="!c.plain" :x="c.x" :y="c.y" :width="CELL" :height="CELL" class="fig-cell" :class="c.mark && `is-${c.mark}`" />
            <text :x="c.cx" :y="c.cy" text-anchor="middle" class="fig-cell-text" :class="{ plain: c.plain, small: c.small, accent: c.mark === 'target' }">{{ c.text }}</text>
        </g>
    </svg>
</template>
