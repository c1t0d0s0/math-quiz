<script setup>
import { ref, computed } from 'vue';
import { patterns, generateFromPattern } from '../word/index.js';

const LEVELS = [['low', '1・2年'], ['mid', '3・4年'], ['high', '5・6年']];
const round = ref(0);

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
</script>

<template>
    <div class="pattern-list">
        <h1>文章問題パターン一覧（全{{ total }}）</h1>
        <button class="grade-tab active" @click="round++">作り直す</button>
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
    </div>
</template>
