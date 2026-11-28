<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

// 問題を解くときのメモ。手書き (スマホ・タブレット向け) と文字入力を切りかえて使う。
// 推理パズルでは、○×を書きこむ「表」も使える。1問ごとの一時的なものなので、どこにも保存しない
const props = defineProps({
    // この値が変わったら (次の問題に進んだら) メモを消す
    resetKey: { default: null },
    // 表の見出し { rows, cols, groups? } (推理パズルのときだけ。src/word/suiri.js)
    table: { type: Object, default: null },
});

const isTouch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const defaultTab = isTouch ? 'draw' : 'text';

const open = ref(false);
const tab = ref(props.table ? 'table' : defaultTab);
const tool = ref('pen'); // 'pen' | 'eraser'
const text = ref('');
const textarea = ref(null);
const canvas = ref(null);
const toggleBtn = ref(null);

// 描いた線。キャンバスの大きさが変わっても描きなおせるように、点の列でおぼえておく
let strokes = [];
let current = null;
const hasStrokes = ref(false);

// ---- 表 ----
// マスの印。押すたびに 空 → × → ○ → 空
const MARKS = ['', '×', '○'];
const marks = ref({});
const hasMarks = computed(() => Object.values(marks.value).some(Boolean));
const cellKey = (i, j) => `${i}-${j}`;
function toggleCell(i, j) {
    const k = cellKey(i, j);
    marks.value = { ...marks.value, [k]: MARKS[(MARKS.indexOf(marks.value[k] ?? '') + 1) % MARKS.length] };
}
function clearTable() {
    marks.value = {};
}
// 区切り線を引く列 (オス・メスのまとまりの最初の列)
const groupStarts = computed(() => {
    const starts = new Set();
    let at = 0;
    for (const size of props.table?.groups ?? []) {
        if (at > 0) starts.add(at);
        at += size;
    }
    return starts;
});
// 「ハムスター」など長い見出しは、せまい列に入るように縦書きにする
const tallHead = computed(() => !!props.table?.cols.some(c => c.length > 3));
// 表のある問題では「表」を、ない問題では手書きか文字を開く
watch(() => props.table, (t) => {
    if (t) tab.value = 'table';
    else if (tab.value === 'table') tab.value = defaultTab;
});

function clearAll() {
    clearTable();
    text.value = '';
    strokes = [];
    current = null;
    hasStrokes.value = false;
    redraw();
}
watch(() => props.resetKey, clearAll);

function clearDrawing() {
    strokes = [];
    current = null;
    hasStrokes.value = false;
    redraw();
}

async function toggle() {
    open.value = !open.value;
    if (open.value) await focusTab();
}

// とじても中身は消さない (同じ問題のあいだは、また開けば続きから書ける)
async function close() {
    open.value = false;
    await nextTick();
    toggleBtn.value?.focus();
}

async function selectTab(name) {
    tab.value = name;
    await focusTab();
}

async function focusTab() {
    await nextTick();
    if (tab.value === 'text') textarea.value?.focus();
    else resizeCanvas();
}

// ---- 手書き ----
function inkColor() {
    return getComputedStyle(canvas.value).getPropertyValue('--ink').trim() || '#1c2a4a';
}

function drawStroke(ctx, stroke, color) {
    const pts = stroke.points;
    if (!pts.length) return;
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = stroke.eraser ? 22 : 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
        // 点と点のあいだを曲線でつないで、なめらかにする
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
}

function redraw() {
    const el = canvas.value;
    if (!el) return;
    const ctx = el.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const color = inkColor();
    for (const s of strokes) drawStroke(ctx, s, color);
    if (current) drawStroke(ctx, current, color);
}

function resizeCanvas() {
    const el = canvas.value;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
    }
    redraw();
}

function pointOf(e) {
    const rect = canvas.value.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    canvas.value.setPointerCapture(e.pointerId);
    // ペンの消しゴム側 (buttons = 32) でも消せる
    const eraser = tool.value === 'eraser' || (e.buttons & 32) !== 0;
    current = { eraser, points: [pointOf(e)], pointerId: e.pointerId };
    redraw();
}

function onPointerMove(e) {
    if (!current || e.pointerId !== current.pointerId) return;
    e.preventDefault();
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of events.length ? events : [e]) current.points.push(pointOf(ev));
    redraw();
}

function onPointerUp(e) {
    if (!current || e.pointerId !== current.pointerId) return;
    strokes.push({ eraser: current.eraser, points: current.points });
    current = null;
    hasStrokes.value = true;
    redraw();
}

let observer = null;
let scheme = null;
onMounted(() => {
    if (typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(() => resizeCanvas());
        if (canvas.value) observer.observe(canvas.value);
    }
    // ダークモードに切りかわったら、線の色を合わせて描きなおす
    scheme = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    scheme?.addEventListener?.('change', redraw);
});
onUnmounted(() => {
    observer?.disconnect();
    scheme?.removeEventListener?.('change', redraw);
});
</script>

<template>
    <!-- 固定表示のボタン・パネルで、問題の下のほうがかくれないようにするための余白 -->
    <div class="memo-spacer" :class="{ 'is-open': open }" aria-hidden="true"></div>

    <button
        v-show="!open"
        ref="toggleBtn"
        type="button"
        class="memo-toggle"
        :aria-expanded="open"
        aria-controls="memo-panel"
        @click="toggle"
    >メモ</button>

    <section v-show="open" id="memo-panel" class="memo-panel" aria-label="メモ">
        <div class="memo-head">
            <div class="memo-tabs" role="tablist">
                <button
                    v-if="table"
                    type="button"
                    role="tab"
                    class="memo-tab"
                    :class="{ 'is-active': tab === 'table' }"
                    :aria-selected="tab === 'table'"
                    @click="selectTab('table')"
                >表</button>
                <button
                    type="button"
                    role="tab"
                    class="memo-tab"
                    :class="{ 'is-active': tab === 'draw' }"
                    :aria-selected="tab === 'draw'"
                    @click="selectTab('draw')"
                >手書き</button>
                <button
                    type="button"
                    role="tab"
                    class="memo-tab"
                    :class="{ 'is-active': tab === 'text' }"
                    :aria-selected="tab === 'text'"
                    @click="selectTab('text')"
                >文字</button>
                <button type="button" class="memo-close" aria-label="メモをとじる" @click="close">とじる</button>
            </div>
            <div class="memo-tools">
                <template v-if="tab === 'draw'">
                    <button type="button" class="memo-tool" :class="{ 'is-active': tool === 'pen' }" :aria-pressed="tool === 'pen'" @click="tool = 'pen'">ペン</button>
                    <button type="button" class="memo-tool" :class="{ 'is-active': tool === 'eraser' }" :aria-pressed="tool === 'eraser'" @click="tool = 'eraser'">消しゴム</button>
                    <button type="button" class="memo-tool" :disabled="!hasStrokes" @click="clearDrawing">ぜんぶ消す</button>
                </template>
                <button v-else-if="tab === 'table'" type="button" class="memo-tool" :disabled="!hasMarks" @click="clearTable">ぜんぶ消す</button>
                <button v-else type="button" class="memo-tool" :disabled="!text" @click="text = ''">ぜんぶ消す</button>
            </div>
        </div>
        <div class="memo-body">
            <div v-if="table" v-show="tab === 'table'" class="memo-table-wrap">
                <table class="memo-table" :class="{ 'is-tall': tallHead }" aria-label="表のメモ">
                    <thead>
                        <tr>
                            <th scope="col"></th>
                            <th v-for="(c, j) in table.cols" :key="j" scope="col" :class="{ 'is-group': groupStarts.has(j) }"><span class="memo-col">{{ c }}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, i) in table.rows" :key="i">
                            <th scope="row">{{ row }}</th>
                            <td v-for="(c, j) in table.cols" :key="j" :class="{ 'is-group': groupStarts.has(j) }">
                                <button
                                    type="button"
                                    class="memo-cell"
                                    :class="{ 'is-maru': marks[cellKey(i, j)] === '○', 'is-batsu': marks[cellKey(i, j)] === '×' }"
                                    :aria-label="`${row}・${c}: ${marks[cellKey(i, j)] || '空'}`"
                                    @click="toggleCell(i, j)"
                                >{{ marks[cellKey(i, j)] }}</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <canvas
                v-show="tab === 'draw'"
                ref="canvas"
                class="memo-canvas"
                :class="{ 'is-eraser': tool === 'eraser' }"
                aria-label="手書きメモ"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
            ></canvas>
            <textarea
                v-show="tab === 'text'"
                ref="textarea"
                v-model="text"
                class="memo-text"
                aria-label="文字メモ"
                placeholder="計算や考えたことを書いておけます"
                autocomplete="off"
                spellcheck="false"
            ></textarea>
        </div>
    </section>
</template>
