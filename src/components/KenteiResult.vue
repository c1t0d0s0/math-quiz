<script setup>
import Hanamaru from './Hanamaru.vue';
import RewardBox from './RewardBox.vue';
import { formatTime } from '../modes.js';
import { SECTIONS } from '../kentei/levels.js';
import { answerText } from '../kentei/exam.js';

// 算数検定もぎ試験の結果。合格かどうか、分野ごとの正解の数、まちがえた問題と正しい答え
const props = defineProps({
    mode: { type: Object, required: true },
    level: { type: Object, required: true }, // src/kentei/levels.js の examLevel
    result: { type: Object, required: true }, // src/composables/useKentei.js の result
});
defineEmits(['restart', 'back', 'open']);

/** まちがえた問題の問題文 */
const promptOf = q => (q.type === 'choice' ? q.question : q.label || q.text);

/** 自分の答え */
function givenText(m) {
    // 答えなかった問題 (時間切れで終わったときは、時間切れと出す)
    if (!m.answered) return props.result.timedOut ? '（時間切れ）' : '答えなかった';
    if (m.given === null || m.given === undefined) return 'わからない';
    return Array.isArray(m.given) ? m.given.join('、') : m.given;
}
</script>

<template>
    <main id="result-container" class="result-page kentei-result">
        <section class="result">
            <div class="result-body">
            <div class="result-main">
            <div class="result-head">
                <Hanamaru v-if="result.passed" animated />
                <div>
                    <h2>{{ mode.name }}</h2>
                    <p class="result-sub">合格ライン {{ result.pass }}問 / {{ result.total }}問　／　かかった時間: {{ formatTime(result.seconds) }}（{{ level.minutes }}分）</p>
                </div>
            </div>
            <p v-if="result.isNewRecord" id="new-record-banner" class="new-record">最高記録 更新！</p>
            <div class="kentei-score">
                <p id="final-score">{{ result.score }}<small> / {{ result.total }}問</small></p>
                <p id="kentei-verdict" class="kentei-stamp" :class="{ 'is-fail': !result.passed }">{{ result.passed ? '合格' : 'もう少し' }}</p>
            </div>
            <p class="kentei-message">
                {{ result.passed
                    ? (mode.mini ? '合格ラインに とどいたよ！ 本番の 試験にも ちょうせんしよう。' : `おめでとう！ 算数検定${mode.level}級に 合格できる 力が あるよ。`)
                    : `あと ${result.pass - result.score}問で 合格！ まちがえた 問題を 見なおそう。` }}
            </p>
            <p v-if="result.timedOut" class="kentei-timeout">時間切れ！ 答えられなかった 問題は まちがいに なるよ。</p>
            <p v-if="result.newTitle" id="kentei-new-title" class="kentei-new-title">
                しょうごう ゲット！ リスザルの 下に「{{ result.newTitle }}」が つくよ。
            </p>
            </div>
            <div class="kentei-detail">
                <h3>分野ごとの 正解</h3>
                <ul class="kentei-sections">
                    <li v-for="row in result.sections" :key="row.label" :class="{ 'is-full': row.got === row.max }">
                        <span>{{ row.label }}</span><b>{{ row.got }} / {{ row.max }}</b>
                    </li>
                </ul>
                <template v-if="result.missed.length > 0">
                    <h3>まちがえた 問題</h3>
                    <ol class="kentei-missed">
                        <li v-for="m in result.missed" :key="m.number">
                            <span class="kentei-missed-head">第{{ m.number }}問・{{ SECTIONS[m.q.section].label }}</span>
                            <span class="kentei-missed-question">{{ promptOf(m.q) }}</span>
                            <span class="kentei-missed-answer">正しい答え: <b>{{ answerText(m.q) }}</b></span>
                            <span class="kentei-missed-given">あなたの答え: {{ givenText(m) }}</span>
                        </li>
                    </ol>
                </template>
            </div>
            </div>
            <RewardBox :reward="result.reward" clear-label="はじめて合格！" @open="name => $emit('open', name)" />
            <div class="result-actions result-buttons">
                <button id="back-to-start-button" type="button" class="btn" @click="$emit('back')">ホームにもどる</button>
                <button id="restart-button" type="button" class="btn btn-primary" @click="$emit('restart')">もう一度 受ける</button>
            </div>
        </section>
    </main>
</template>
