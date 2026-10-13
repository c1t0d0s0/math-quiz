<script setup>
import { ref, computed } from 'vue';
import Hanamaru from './Hanamaru.vue';
import AccountBox from './AccountBox.vue';
import Monkey from './Monkey.vue';
import { pt } from '../rewardText.js';
import { jstDate } from '../rewards.js';
import { DAILY_COUNT } from '../daily.js';
import { GRADES, MODES, isVisible, formatTime } from '../modes.js';
import { SET_SIZE, QUESTIONS_PER_PROBLEM } from '../long/index.js';

const props = defineProps({
    highScores: { type: Object, required: true },
    bestTimes: { type: Object, default: () => ({}) },
    recordDates: { type: Object, default: () => ({}) },
    account: { type: Object, default: () => ({ available: false }) },
    signIn: { type: Function, default: null },
    signOut: { type: Function, default: null },
    points: { type: Number, default: 0 },
});
defineEmits(['start', 'open']);

const LONG_TOTAL = SET_SIZE * QUESTIONS_PER_PROBLEM;

// モードのしゅるいごとの見出し
const today = jstDate();
const todayLabel = `${Number(today.slice(5, 7))}月${Number(today.slice(8))}日（${'日月火水木金土'[new Date(`${today}T00:00:00Z`).getUTCDay()]}）`;

const KINDS = [
    { kind: 'daily', title: `今日のチャレンジ　${todayLabel}`, note: `毎日かわる${DAILY_COUNT}問。同じ日は、だれが開いても同じ問題が出ます。時間はむせいげんです。` },
    { kind: 'calc', title: '計算', note: '時間内に何問とけるかな。答えは4つの中からえらびます。' },
    { kind: 'word', title: '文章問題', note: '5分間でできるだけたくさん。いろいろな場面の問題が出ます。' },
    { kind: 'long', title: '長文チャレンジ', note: `長い文章を3題、小問は全部で${LONG_TOTAL}問。時間はむせいげんで、答えは10この中からえらびます。` },
];

const grade = ref('all');
const groups = computed(() => KINDS
    .map(k => ({ ...k, modes: MODES.filter(mode => mode.kind === k.kind && isVisible(mode, grade.value)) }))
    .filter(k => k.modes.length > 0));

// 長文チャレンジは「7/9問（6分12秒）」のように、満点と時間もあわせて見せる
function longRecord(mode) {
    if (props.account.loading) return '読みこみ中…';
    const best = props.highScores[mode.id];
    if (!best) return 'まだ記録なし';
    const time = props.bestTimes[mode.id];
    return `最高: ${best}/${LONG_TOTAL}問` + (time ? `（${formatTime(time)}）` : '');
}

// 今日のチャレンジは、今日の分の記録だけを見せる (きのうまでの記録は出さない)
const playedToday = mode => props.recordDates[mode.id] === today && props.highScores[mode.id] > 0;
function dailyRecord(mode) {
    if (props.account.loading) return '読みこみ中…';
    if (!playedToday(mode)) return '今日はまだだよ';
    const time = props.bestTimes[mode.id];
    return `今日: ${props.highScores[mode.id]}/${DAILY_COUNT}問` + (time ? `（${formatTime(time)}）` : '');
}

const isPerfect = mode => (mode.kind === 'long' && props.highScores[mode.id] === LONG_TOTAL)
    || (mode.kind === 'daily' && playedToday(mode) && props.highScores[mode.id] === DAILY_COUNT);
</script>

<template>
    <main id="start-container" class="home">
        <!-- タイトルと学年の切りかえ。広い画面では左の列にならぶ -->
        <div class="home-side">
        <header class="hero">
            <div class="crest" aria-hidden="true">
                <span class="crest-cell">＋</span>
                <span class="crest-cell">−</span>
                <span class="crest-cell crest-cross">×</span>
                <span class="crest-cell">÷</span>
            </div>
            <div class="hero-text">
                <h1 class="brand">算数チャレンジ</h1>
                <p class="lead">計算から中学受験の長文問題まで。学年をえらんで、ちょうせんしよう。</p>
            </div>
            <Monkey />
        </header>

        <!-- 学年の切りかえ -->
        <div class="mode grade-tabs" role="group" aria-label="学年の切りかえ">
            <button
                v-for="g in GRADES"
                :key="g.id"
                type="button"
                class="mode-option grade-tab"
                :aria-pressed="grade === g.id"
                @click="grade = g.id"
            ><span class="mode-label">{{ g.label }}</span></button>
        </div>
        <!-- スタンプカードとリスザルカードは、それぞれのページで見る -->
        <nav class="reward-links" aria-label="スタンプカードとリスザルカード">
            <p class="points">
                <span class="points-label">持っているポイント</span>
                <b class="points-num">{{ account.loading ? '…' : pt(points) }}</b>
            </p>
            <div class="reward-buttons">
                <button id="open-stamps" type="button" class="btn" @click="$emit('open', 'stamps')">スタンプカード</button>
                <button id="open-cards" type="button" class="btn" @click="$emit('open', 'cards')">リスザルカード</button>
            </div>
        </nav>
        <AccountBox v-if="account.available" :account="account" :sign-in="signIn" :sign-out="signOut" />
        </div>

        <div class="home-main">
        <section v-for="group in groups" :key="group.kind" :aria-labelledby="`kind-${group.kind}`">
            <h2 :id="`kind-${group.kind}`">{{ group.title }}</h2>
            <p class="section-note">{{ group.note }}</p>
            <div class="tiles">
                <button
                    v-for="mode in group.modes"
                    :id="`mode-${mode.id}`"
                    :key="mode.id"
                    type="button"
                    class="tile mode-button"
                    @click="$emit('start', mode.id)"
                >
                    <span class="tile-badge">{{ mode.badge }}</span>
                    <span class="tile-title">{{ mode.title }}</span>
                    <span class="tile-meta">{{ mode.desc }}</span>
                    <span v-if="mode.kind === 'daily'" class="tile-record high-score-tag">{{ dailyRecord(mode) }}</span>
                    <span v-else-if="mode.kind === 'long'" class="tile-record high-score-tag">{{ longRecord(mode) }}</span>
                    <span v-else-if="account.loading" class="tile-record high-score-tag">読みこみ中…</span>
                    <span v-else class="tile-record high-score-tag">最高: <b>{{ highScores[mode.id] }}</b>問</span>
                    <Hanamaru v-if="isPerfect(mode)" class="hanamaru-small" />
                </button>
            </div>
        </section>
        </div>
    </main>
</template>
