<script setup>
import FigureSegments from './FigureSegments.vue';
import FigureRoute from './FigureRoute.vue';
import FigureGraph from './FigureGraph.vue';
import FigureShape from './FigureShape.vue';
import FigureGrid from './FigureGrid.vue';

defineProps({ figure: { type: Object, required: true } });

const RENDERERS = {
    segments: FigureSegments,
    route: FigureRoute,
    graph: FigureGraph,
    shape: FigureShape,
    tank: FigureShape,
    circle: FigureShape,
    grid: FigureGrid,
};
</script>

<template>
    <figure class="figure">
        <table v-if="figure.type === 'table'" class="figure-table">
            <caption v-if="figure.caption">{{ figure.caption }}</caption>
            <thead>
                <tr><th v-for="(h, i) in figure.head" :key="i">{{ h }}</th></tr>
            </thead>
            <tbody>
                <tr v-for="(row, i) in figure.rows" :key="i">
                    <component :is="j === 0 ? 'th' : 'td'" v-for="(cell, j) in row" :key="j">{{ cell }}</component>
                </tr>
            </tbody>
        </table>
        <template v-else>
            <component :is="RENDERERS[figure.type]" :figure="figure" />
            <figcaption v-if="figure.caption" class="figure-caption">{{ figure.caption }}</figcaption>
        </template>
    </figure>
</template>
