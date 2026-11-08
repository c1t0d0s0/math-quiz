<script setup>
import { ref, computed } from 'vue';
import Figure from './figures/Figure.vue';
import FigureList from './figures/FigureList.vue';
import { patterns, generateFromPattern } from '../word/index.js';
import { problems, generateProblem } from '../long/index.js';
import { patterns as zukeiPatterns, generateZukei } from '../zukei/index.js';

const LEVELS = [['low', '1・2年'], ['mid', '3・4年'], ['high', '5・6年']];
const LONG_LEVELS = [['g3', '3年'], ['g45', '4・5年'], ['g6', '6年']];
const round = ref(0);
const VIEWS = ['word', 'long', 'zukei'];
const param = new URLSearchParams(location.search).get('view');
const view = ref(VIEWS.includes(param) ? param : 'word');

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

// 図形チャレンジ: パターンごとに1問ずつ作って、図と答えと解き方を見る
const zukeiGroups = computed(() => {
    round.value;
    return [['mid', '3・4年'], ['high', '5・6年']].map(([level, label]) => ({
        label,
        items: zukeiPatterns[level].map(p => generateZukei(p)),
    }));
});
const zukeiTotal = computed(() => zukeiGroups.value.reduce((sum, g) => sum + g.items.length, 0));

/** 図形の問題の答え (空欄に答えの数を入れた式、または図の記号) */
function zukeiAnswer(q) {
    if (q.type !== 'fill') return q.answer;
    let i = 0;
    return q.parts.map(p => (typeof p === 'string' ? p : `[${q.blanks[i++]}]`)).join('');
}
</script>

<template>
    <div class="pattern-list">
        <h1>問題パターン一覧</h1>
        <button class="btn" :class="{ 'btn-primary': view === 'word' }" @click="view = 'word'">文章問題（{{ total }}）</button>
        <button class="btn" :class="{ 'btn-primary': view === 'long' }" @click="view = 'long'">長文チャレンジ（{{ longTotal }}）</button>
        <button class="btn" :class="{ 'btn-primary': view === 'zukei' }" @click="view = 'zukei'">図形チャレンジ（{{ zukeiTotal }}）</button>
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

        <template v-else-if="view === 'zukei'">
            <section v-for="group in zukeiGroups" :key="group.label">
                <h2>{{ group.label }}（{{ group.items.length }}）</h2>
                <article v-for="q in group.items" :key="q.patternId" class="long-passage zukei-sample">
                    <h3>{{ q.topicLabel }} <code>{{ q.patternId }}</code><span v-if="q.hirameki" class="zukei-hirameki">ひらめき</span></h3>
                    <p>{{ q.text }}</p>
                    <FigureList :figure="q.figure" />
                    <div v-if="q.type === 'pick'" class="figure-options zukei-sample-options">
                        <div v-for="o in q.options" :key="o" :class="{ answer: o === q.answer }">
                            <b>{{ o }}</b>
                            <Figure :figure="q.optionFigures[o]" />
                        </div>
                    </div>
                    <p class="answer">答え: {{ zukeiAnswer(q) }}</p>
                    <p class="zukei-explain">{{ q.explain }}</p>
                </article>
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
