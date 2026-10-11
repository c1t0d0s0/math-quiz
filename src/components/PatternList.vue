<script setup>
import { ref, computed } from 'vue';
import Figure from './figures/Figure.vue';
import { patterns, generateFromPattern } from '../word/index.js';
import { problems, generateProblem } from '../long/index.js';

const LEVELS = [['low', '1・2年'], ['mid', '3・4年'], ['high', '5・6年']];
const LONG_LEVELS = [['g3', '3年'], ['g45', '4・5年'], ['g6', '6年']];
const round = ref(0);
const view = ref(new URLSearchParams(location.search).get('view') === 'long' ? 'long' : 'word');

// トピックごとにまとめたサンプル（「作り直す」で数値や人名が変わる）
const groups = computed(() => {
    round.value;
    return LEVELS.map(([level, label]) => {
        const topics = new Map();
        for (const pattern of patterns[level]) {
            if (!topics.has(pattern.topic)) topics.set(pattern.topic, []);
            topics.get(pattern.topic).push({ id: pattern.id, ...generateFromPattern(pattern) });
        }
        return { label, count: patterns[level].length, topics: [...topics] };
    });
});
const total = computed(() => groups.value.reduce((sum, g) => sum + g.count, 0));

const longGroups = computed(() => {
    round.value;
    return LONG_LEVELS.map(([level, label]) => ({
        label,
        items: problems[level].map((problem) => {
            const p = generateProblem(problem);
            return { ...p, figures: [p.figure].flat().filter(Boolean), length: p.text.join('').length };
        }),
    }));
});
const longTotal = computed(() => longGroups.value.reduce((sum, g) => sum + g.items.length, 0));
</script>

<template>
    <div class="pattern-list">
        <h1>問題パターン一覧</h1>
        <button class="btn" :class="{ 'btn-primary': view === 'word' }" @click="view = 'word'">文章問題（{{ total }}）</button>
        <button class="btn" :class="{ 'btn-primary': view === 'long' }" @click="view = 'long'">長文チャレンジ（{{ longTotal }}）</button>
        <button class="btn" @click="round++">作り直す</button>

        <template v-if="view === 'word'">
            <section v-for="group in groups" :key="group.label">
                <h2>{{ group.label }}（{{ group.count }}）</h2>
                <div v-for="[topic, samples] in group.topics" :key="topic">
                    <h3>{{ topic }}（{{ samples.length }}）</h3>
                    <dl v-for="q in samples" :key="q.id">
                        <dt><code>{{ q.id }}</code> {{ q.question }}</dt>
                        <dd>
                            <span v-for="o in q.options" :key="o" :class="{ answer: o === q.answer }">{{ o }}</span>
                        </dd>
                    </dl>
                </div>
            </section>
        </template>

        <template v-else>
            <section v-for="group in longGroups" :key="group.label">
                <h2>{{ group.label }}（{{ group.items.length }}）</h2>
                <article v-for="p in group.items" :key="p.id" class="long-passage">
                    <h3>{{ p.topic }} <code>{{ p.id }}・{{ p.length }}字</code></h3>
                    <p v-for="(para, i) in p.text" :key="i">{{ para }}</p>
                    <Figure v-for="(figure, i) in p.figures" :key="i" :figure="figure" />
                    <dl v-for="(q, i) in p.questions" :key="i">
                        <dt>({{ i + 1 }}) {{ q.question }}</dt>
                        <dd>
                            <span v-for="o in q.options" :key="o" :class="{ answer: o === q.answer }">{{ o }}</span>
                        </dd>
                    </dl>
                </article>
            </section>
        </template>
    </div>
</template>
