<script setup>
import { ref, computed, nextTick } from 'vue';
import { CARDS } from '../data/cards.js';
import { cardSvg } from '../monkey.js';
import { STAMP_RULE, pt } from '../rewardText.js';

// リスザルカードの画面。ためたポイントとカードを交換し、集めたカードをながめる
const props = defineProps({
    cards: { type: Array, required: true }, // 持っているカード [{ id, paid }]
    points: { type: Number, required: true },
    loading: { type: Boolean, default: false },
    buy: { type: Function, required: true },
});
defineEmits(['home']);

const justGot = ref(null);
const owned = computed(() => new Set(props.cards.map(c => c.id)));
const tiles = computed(() => CARDS.map(card => ({
    card,
    owned: owned.value.has(card.id),
    // 絵は、持っているカードだけ作る (持っていないカードの絵柄は見せない)
    svg: owned.value.has(card.id) ? cardSvg(card) : '',
    short: card.price - props.points,
})));

async function get(card) {
    if (!window.confirm(`${pt(card.price)}を使って、このカードをゲットしますか？`)) return;
    if (!props.buy(card)) return;
    justGot.value = card.id;
    await nextTick();
    document.querySelector('.card.is-new')?.scrollIntoView({ block: 'nearest' });
}
</script>

<template>
    <div class="cards-page">
        <header class="bar">
            <button type="button" class="back home-btn" @click="$emit('home')"><span aria-hidden="true">‹</span>ホーム</button>
            <h1>リスザルカード</h1>
            <span class="bar-meta">{{ owned.size }} / {{ CARDS.length }}まい</span>
        </header>
        <main class="cards-main">
            <p class="cards-lead">ポイントをためて、リスザルのカードを集めよう。</p>
            <p class="points points-big">
                <span class="points-label">持っているポイント</span>
                <b class="points-num">{{ loading ? '読みこみ中…' : pt(points) }}</b>
            </p>
            <ul class="card-grid">
                <li v-for="t in tiles" :key="t.card.id" class="card" :class="t.owned ? ['is-owned', { 'is-new': t.card.id === justGot }] : 'is-back'">
                    <template v-if="t.owned">
                        <!-- eslint-disable-next-line vue/no-v-html -- 中身は src/monkey.js が作る決まった絵だけ -->
                        <div class="card-face" v-html="t.svg" />
                        <p class="card-name">{{ t.card.name }}</p>
                    </template>
                    <!-- まだ持っていないカードは裏向き。絵柄も名前も出さず、必要なポイントだけを見せる -->
                    <template v-else>
                        <div class="card-back" role="img" :aria-label="`まだ持っていないカード。${pt(t.card.price)}でゲットできる`">
                            <span class="card-price">{{ pt(t.card.price) }}</span>
                        </div>
                        <p v-if="loading" class="card-short">…</p>
                        <p v-else-if="t.short > 0" class="card-short">あと{{ pt(t.short) }}</p>
                        <button v-else type="button" class="btn btn-primary card-get" @click="get(t.card)">ゲットする</button>
                    </template>
                </li>
            </ul>
            <p class="stamp-rule">{{ STAMP_RULE }}</p>
            <p class="page-foot"><button type="button" class="btn btn-primary" @click="$emit('home')">ホームへ</button></p>
        </main>
    </div>
</template>
