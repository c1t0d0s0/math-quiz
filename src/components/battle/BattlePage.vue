<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import FillQuestion from '../FillQuestion.vue';
import {
    MAX_PLAYERS, NAME_MAX, battleOutcome, cleanName, everyoneDone, formatMs, parseCode, seatOf, standings,
} from '../../battle/battle.js';
import { COUNTS, GRADES, battleQuestions, isCorrect, questionsPrint } from '../../battle/questions.js';
import { BATTLE_DAILY_LIMIT, BATTLE_LOSE_POINTS, BATTLE_WIN_POINTS } from '../../rewards.js';
import { pt } from '../../rewardText.js';

// 対戦の画面: 入口 → 待ち画面 (コード・QR・URL) → カウントダウン → 対戦 → 結果。Wordlynx の対戦と同じ流れ
const props = defineProps({
    code: { type: String, default: null }, // URL (#/battle/12345) の対戦コード
    addBattleResult: { type: Function, required: true },
});
const emit = defineEmits(['home']);

const NAME_KEY = 'math_quiz_battle_name';
const VERSION = questionsPrint();

const roomHash = code => `#/battle/${code}`;
const inviteUrl = code => `${location.href.split('#')[0]}${roomHash(code)}`;

function savedName() {
    try {
        return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
        return '';
    }
}

function saveName(name) {
    try {
        localStorage.setItem(NAME_KEY, name);
    } catch {
        // 保存できなくても遊べる
    }
}

// ---- 通信 ----
let net = null;
const status = ref('connecting'); // 'connecting' | 'failed' | 'ready'
const message = ref('');
const busy = ref(false);

// ---- 入口 ----
const name = ref(savedName());
const grade = ref(3);
const count = ref(10);
const codeInput = ref('');
/** 入口で「入る」「作る」を押したときの名前。部屋のページに着いたら、名前をもう一度聞かずに入る */
let autoJoinName = null;

// ---- 部屋 ----
const room = ref(null);
const joined = ref(null); // すわっている部屋のコード
const roomState = ref('idle'); // 'idle' | 'joining' | 'ask-name' | 'missing' | 'started' | 'full' | 'gone'
let stopWatch = null;

const me = computed(() => (room.value && net ? room.value.players?.[seatOf(room.value, net.uid)] ?? null : null));
const isHost = computed(() => !!room.value && !!net && room.value.hostUid === net.uid);
const rows = computed(() => (room.value ? standings(room.value) : []));
const online = computed(() => Object.values(room.value?.players ?? {}).filter(p => p.online));
const mismatch = computed(() => !!room.value && room.value.version !== VERSION);

// ---- 時計 (サーバーの時刻) ----
const now = ref(Date.now());
let clock = null;

// ---- 対戦中の自分の進み具合 ----
const questions = computed(() => (room.value?.seed ? battleQuestions(room.value.grade, room.value.count, room.value.seed) : []));
const solved = ref(0);
const misses = ref(0);
const wrongSignal = ref(0);
let playingRound = 0;

const phase = computed(() => {
    const r = room.value;
    if (!r) return 'none';
    if (r.status === 'waiting') return 'lobby';
    if (r.status === 'playing' && typeof r.startAt === 'number' && now.value < r.startAt) return 'countdown';
    if (r.status === 'finished' || everyoneDone(r)) return 'result';
    if (me.value && me.value.round === r.round && (typeof me.value.finishedAt === 'number' || me.value.retired)) return 'waiting';
    return 'play';
});

// 3・2・1 と数える (スタートを押してから問題が出るまでは、通信の待ちもふくめて少し長い)
const countdownText = computed(() => Math.min(3, Math.max(1, Math.ceil((room.value.startAt - now.value) / 1000))));
const elapsedText = computed(() => formatMs(now.value - (room.value?.startAt ?? now.value)));
const current = computed(() => questions.value[solved.value] ?? null);

// ---- 結果とポイント ----
const award = ref(null); // { points, remaining, already, outcome }
const awarded = new Set();

watch([phase, () => room.value?.round], () => {
    if (phase.value !== 'result' || !room.value || !net || !joined.value) return;
    const key = `${joined.value}-${room.value.round}`;
    if (awarded.has(key)) return;
    awarded.add(key);
    const outcome = battleOutcome(room.value, net.uid);
    if (!outcome) {
        award.value = null;
        return;
    }
    award.value = { ...props.addBattleResult(joined.value, room.value.round, outcome), outcome };
});

// 次の回になったら、自分の記録と画面をその回のはじめにもどす
watch(() => room.value?.round, (round) => {
    if (!round || !net || !joined.value) return;
    if (round !== playingRound) {
        playingRound = round;
        solved.value = me.value?.round === round ? me.value.solved || 0 : 0;
        misses.value = me.value?.round === round ? me.value.misses || 0 : 0;
        award.value = null;
        void net.resetForRound(joined.value, room.value);
    }
});

function showError(text) {
    message.value = text;
}

async function connect() {
    try {
        const { connectBattle } = await import('../../cloud/battle-net.js');
        net = await connectBattle();
        status.value = 'ready';
        if (props.code) openRoom(props.code);
    } catch {
        status.value = 'failed';
    }
}

function watchRoom(code) {
    stopWatch?.();
    stopWatch = net.watch(code, (r) => {
        if (!r) {
            if (joined.value === code) roomState.value = 'gone';
            room.value = null;
            return;
        }
        room.value = r;
    });
}

async function openRoom(code) {
    message.value = '';
    if (joined.value === code) return;
    roomState.value = 'joining';
    const nameToUse = autoJoinName ?? '';
    autoJoinName = null;
    if (!nameToUse) {
        roomState.value = 'ask-name';
        return;
    }
    await joinRoom(code, nameToUse);
}

async function joinRoom(code, nameToUse) {
    busy.value = true;
    try {
        const result = await net.join(code, nameToUse);
        if (result !== 'ok') {
            roomState.value = result;
            return;
        }
        joined.value = code;
        roomState.value = 'idle';
        watchRoom(code);
    } catch {
        showError('部屋に入れませんでした。もういちどためしてね。');
        roomState.value = 'ask-name';
    } finally {
        busy.value = false;
    }
}

function checkName() {
    const n = cleanName(name.value);
    if (!n) {
        showError('名前を入れてね');
        return null;
    }
    name.value = n;
    saveName(n);
    return n;
}

async function createRoom() {
    const n = checkName();
    if (!n) return;
    busy.value = true;
    try {
        const code = await net.create(grade.value, count.value, VERSION, n);
        joined.value = code;
        watchRoom(code);
        location.hash = roomHash(code);
    } catch {
        showError('部屋を作れませんでした。もういちどためしてね。');
    } finally {
        busy.value = false;
    }
}

function enterByCode() {
    const n = checkName();
    if (!n) return;
    const code = parseCode(codeInput.value);
    if (!code) {
        showError('対戦コードは、数字5けただよ');
        return;
    }
    autoJoinName = n;
    location.hash = roomHash(code);
}

function enterFromInvite() {
    const n = checkName();
    if (n) void joinRoom(props.code, n);
}

async function leaveRoom() {
    const code = joined.value;
    stopWatch?.();
    stopWatch = null;
    joined.value = null;
    room.value = null;
    roomState.value = 'idle';
    if (code && net) await net.leave(code);
}

async function exitRoom() {
    if (phase.value === 'play' && !window.confirm('対戦のとちゅうだよ。部屋を出ますか？')) return;
    await leaveRoom();
    location.hash = '#/battle';
}

function goHome() {
    if (joined.value && phase.value === 'play' && !window.confirm('対戦のとちゅうだよ。部屋を出ますか？')) return;
    emit('home');
}

watch(() => props.code, async (code, before) => {
    if (status.value !== 'ready') return;
    if (before && before !== code && joined.value === before) await leaveRoom();
    if (code) openRoom(code);
});

// ---- 対戦中 ----
function onAnswer(values) {
    const q = current.value;
    if (!q || phase.value !== 'play') return;
    const ok = values.length === q.blanks.length && values.every((v, i) => isCorrect(v, q.blanks[i]));
    if (!ok) {
        misses.value++;
        wrongSignal.value++;
        net.progress(joined.value, solved.value, misses.value);
        return;
    }
    solved.value++;
    if (solved.value >= questions.value.length) void net.finish(joined.value, solved.value, misses.value);
    else net.progress(joined.value, solved.value, misses.value);
}

async function retire() {
    if (window.confirm('リタイアしますか？（この回のポイントはもらえません）')) await net.retire(joined.value);
}

// ---- ホストの操作 ----
const canStart = computed(() => online.value.length >= 2);
const start = () => net.start(joined.value);
const end = () => net.end(joined.value);
const rematch = () => net.rematch(joined.value, room.value.round);

// ---- 招待 ----
const qr = ref('');
const copied = ref(false);
watch(joined, async (code) => {
    qr.value = '';
    if (!code) return;
    try {
        const QRCode = (await import('qrcode')).default;
        qr.value = await QRCode.toDataURL(inviteUrl(code), { margin: 1, width: 240, color: { dark: '#1c2a4a', light: '#fdfdfa' } });
    } catch {
        // QR コードが作れなくても、コードと URL で入れる
    }
});

async function copyUrl() {
    try {
        await navigator.clipboard.writeText(inviteUrl(joined.value));
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 1500);
    } catch {
        // コピーできないブラウザでは、URL を見て伝えてもらう
    }
}

const statusLabel = (s) => {
    if (s.status === 'done') return formatMs(s.timeMs);
    if (s.status === 'retired') return 'リタイア';
    if (s.status === 'left') return 'ぬけた';
    return `${s.solved} / ${room.value.count}問`;
};

onMounted(() => {
    clock = setInterval(() => {
        now.value = net ? net.serverNow() : Date.now();
    }, 200);
    void connect();
});

onUnmounted(() => {
    clearInterval(clock);
    void leaveRoom();
});
</script>

<template>
    <div class="battle-page">
        <header class="bar">
            <button type="button" class="back home-btn" @click="goHome"><span aria-hidden="true">‹</span>ホーム</button>
            <h1>対戦</h1>
            <span class="bar-meta">{{ joined ? `コード ${joined}` : '' }}</span>
        </header>

        <main class="battle-main">
            <section v-if="status === 'connecting'" class="battle-card battle-message" role="status"><p>つないでいます…</p></section>
            <section v-else-if="status === 'failed'" class="battle-card battle-message" role="status">
                <p>対戦のサーバーにつなげませんでした。通信のようすをたしかめて、ページを読みこみ直してね。</p>
                <button type="button" class="btn" @click="emit('home')">ホームへ</button>
            </section>

            <!-- 入口 -->
            <template v-else-if="!code">
                <section class="battle-card">
                    <h2>名前</h2>
                    <input v-model="name" class="battle-input" :maxlength="NAME_MAX" placeholder="ニックネーム" autocomplete="nickname">
                    <p class="battle-note">みんなに見える名前です（{{ NAME_MAX }}文字まで）。本当の名前でなくてもいいよ。</p>
                </section>
                <section class="battle-card">
                    <h2>部屋を作る</h2>
                    <p class="battle-label">学年</p>
                    <div class="mode battle-choice" role="group" aria-label="学年">
                        <button v-for="g in GRADES" :key="g" type="button" class="mode-option" :aria-pressed="grade === g" @click="grade = g">
                            <span class="mode-label">{{ g }}年</span>
                        </button>
                    </div>
                    <p class="battle-label">出題数</p>
                    <div class="mode battle-choice battle-count" role="group" aria-label="出題数">
                        <button v-for="c in COUNTS" :key="c" type="button" class="mode-option" :aria-pressed="count === c" @click="count = c">
                            <span class="mode-label">{{ c }}問</span>
                        </button>
                    </div>
                    <button id="create-room" type="button" class="btn btn-primary" :disabled="busy" @click="createRoom">部屋を作る</button>
                </section>
                <section class="battle-card">
                    <h2>コードで入る</h2>
                    <input v-model="codeInput" class="battle-input battle-code-input" inputmode="numeric" maxlength="7" placeholder="12345" @keydown.enter="enterByCode">
                    <button id="join-room" type="button" class="btn btn-primary" :disabled="busy" @click="enterByCode">入る</button>
                </section>
                <section class="battle-card battle-rules">
                    <h2>あそびかた</h2>
                    <ul>
                        <li>2〜{{ MAX_PLAYERS }}人で、同じ問題を同時に解いて、速さを競います。答えは数字で入れます。</li>
                        <li>まちがえたら、正解するまで同じ問題をやり直し。全問を解き終えるまでのタイムで順位が決まります。</li>
                        <li>1位は {{ pt(BATTLE_WIN_POINTS) }}、最後まで解いた人は {{ pt(BATTLE_LOSE_POINTS) }}。ポイントがもらえるのは1日{{ BATTLE_DAILY_LIMIT }}回までです。</li>
                    </ul>
                </section>
                <p v-if="message" class="battle-error" role="alert">{{ message }}</p>
            </template>

            <!-- 部屋に入る前・入れなかったとき -->
            <template v-else-if="!joined">
                <section v-if="roomState === 'ask-name'" class="battle-card">
                    <h2>対戦コード {{ code }} の部屋に入る</h2>
                    <input v-model="name" class="battle-input" :maxlength="NAME_MAX" placeholder="ニックネーム" @keydown.enter="enterFromInvite">
                    <button id="join-invite" type="button" class="btn btn-primary" :disabled="busy" @click="enterFromInvite">入る</button>
                    <p v-if="message" class="battle-error" role="alert">{{ message }}</p>
                </section>
                <section v-else class="battle-card battle-message" role="status">
                    <p v-if="roomState === 'missing'">対戦コード {{ code }} の部屋は見つかりませんでした。</p>
                    <p v-else-if="roomState === 'started'">この部屋は、もう対戦が始まっています。</p>
                    <p v-else-if="roomState === 'full'">この部屋は満員です（{{ MAX_PLAYERS }}人まで）。</p>
                    <p v-else-if="roomState === 'gone'">部屋がなくなりました（部屋を作った人が出ました）。</p>
                    <p v-else>部屋に入っています…</p>
                    <a v-if="roomState !== 'joining'" class="btn" href="#/battle">対戦の入口へ</a>
                </section>
            </template>

            <section v-else-if="!room" class="battle-card battle-message" role="status"><p>部屋をよみこんでいます…</p></section>

            <section v-else-if="mismatch" class="battle-card battle-message" role="status">
                <p>問題の作り方が、部屋を作った人とちがいます。ページを読みこみ直してね。</p>
            </section>

            <!-- 待ち画面 -->
            <template v-else-if="phase === 'lobby'">
                <section class="battle-card battle-invite">
                    <div>
                        <p class="battle-label">対戦コード</p>
                        <p id="battle-code" class="battle-code">{{ joined }}</p>
                        <p class="battle-note">{{ room.grade }}年・{{ room.count }}問</p>
                        <button type="button" class="btn" @click="copyUrl">{{ copied ? 'コピーしたよ' : '招待のURLをコピー' }}</button>
                    </div>
                    <img v-if="qr" class="battle-qr" :src="qr" alt="招待のQRコード">
                </section>
                <section class="battle-card">
                    <h2>入っている人（{{ online.length }} / {{ MAX_PLAYERS }}）</h2>
                    <ul class="battle-players">
                        <li v-for="p in online" :key="p.uid">{{ p.name }}<span v-if="p.uid === room.hostUid" class="battle-tag">ホスト</span><span v-if="p.uid === me?.uid" class="battle-tag">あなた</span></li>
                    </ul>
                    <template v-if="isHost">
                        <button id="start-battle" type="button" class="btn btn-primary" :disabled="!canStart" @click="start">スタート</button>
                        <p v-if="!canStart" class="battle-note">2人以上そろったら、スタートできます。</p>
                    </template>
                    <p v-else class="battle-note">ホストがスタートするのを待っています…</p>
                </section>
                <p class="battle-foot"><button type="button" class="btn btn-quiet" @click="exitRoom">部屋を出る</button></p>
            </template>

            <!-- カウントダウン -->
            <section v-else-if="phase === 'countdown'" class="battle-card battle-countdown" role="status">
                <p class="battle-count-num">{{ countdownText }}</p>
            </section>

            <!-- 対戦中 -->
            <template v-else-if="phase === 'play' || phase === 'waiting'">
                <div class="meter">
                    <p class="meter-item"><span class="meter-progress">第{{ Math.min(solved + 1, room.count) }}問 / {{ room.count }}問</span></p>
                    <p id="battle-timer" class="meter-item meter-time">{{ elapsedText }}</p>
                </div>
                <ul class="battle-chips">
                    <li v-for="s in rows" :key="s.uid" class="battle-chip" :class="[`is-${s.status}`, { 'is-me': s.uid === me?.uid }]">
                        <b>{{ s.name }}</b><span>{{ statusLabel(s) }}</span>
                    </li>
                </ul>
                <div v-if="phase === 'play' && current" class="quiz-body battle-body">
                    <FillQuestion :question="current" :max-length="6" :wrong-signal="wrongSignal" @answer="onAnswer" />
                </div>
                <section v-else class="battle-card battle-message" role="status">
                    <p>{{ me?.retired ? 'リタイアしました。' : 'ゴール！' }} ほかの人が終わるのを待っています…</p>
                </section>
                <p class="battle-foot">
                    <button v-if="phase === 'play'" type="button" class="btn btn-quiet" @click="retire">リタイアする</button>
                    <button v-if="isHost" type="button" class="btn" @click="end">終了する</button>
                </p>
            </template>

            <!-- 結果 -->
            <template v-else-if="phase === 'result'">
                <section class="battle-card">
                    <h2>結果（{{ room.grade }}年・{{ room.count }}問）</h2>
                    <table class="battle-table">
                        <thead><tr><th>順位</th><th>名前</th><th>タイム</th><th>まちがい</th></tr></thead>
                        <tbody>
                            <tr v-for="s in rows" :key="s.uid" :class="{ 'is-me': s.uid === me?.uid }">
                                <td>{{ s.rank ?? '−' }}</td>
                                <td>{{ s.name }}</td>
                                <td>{{ statusLabel(s) }}</td>
                                <td>{{ s.misses }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <section id="battle-award" class="result-stamp">
                    <template v-if="award && award.points > 0">
                        <p class="result-reward">{{ award.outcome === 'win' ? 'かち！' : 'さいごまでがんばった！' }} +{{ pt(award.points) }}</p>
                        <p class="result-balance">持っているポイント {{ pt(award.balance) }}（今日はあと{{ award.remaining }}回ポイントがもらえるよ）</p>
                    </template>
                    <p v-else-if="award && !award.already" class="result-balance">今日の対戦のポイントは、もうおしまい（1日{{ BATTLE_DAILY_LIMIT }}回まで）。また明日ね。</p>
                    <p v-else-if="!award" class="result-balance">さいごまで解くと、ポイントがもらえるよ。</p>
                </section>
                <p class="battle-foot">
                    <button v-if="isHost" id="rematch" type="button" class="btn btn-primary" @click="rematch">もう一度</button>
                    <span v-else class="battle-note">ホストが「もう一度」をおすと、次の対戦になります。</span>
                    <button type="button" class="btn btn-quiet" @click="exitRoom">部屋を出る</button>
                </p>
            </template>
        </main>
    </div>
</template>
