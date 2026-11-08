<script setup>
import { computed } from 'vue';

const props = defineProps({ figure: { type: Object, required: true } });

const PAD = 58;
const MAX_W = 320;
const MAX_H = 210;
// 寸法を線のどちら側に書くか（画面上の向き）
const SIDES = { below: [0, 1], above: [0, -1], left: [-1, 0], right: [1, 0] };

const unit = (x, y) => {
    const len = Math.hypot(x, y) || 1;
    return [x / len, y / len];
};

const view = computed(() => {
    const f = props.figure;
    // 小さく出す図 (折り紙の手順など) は、図ごとに大きさと余白を決められる
    const pad = f.pad ?? PAD;
    const k = Math.min((f.maxW ?? MAX_W) / f.w, (f.maxH ?? MAX_H) / f.h);
    const width = f.w * k + pad * 2;
    const height = f.h * k + pad * 2;
    const px = x => pad + x * k;
    const py = y => pad + (f.h - y) * k;
    const pt = ([x, y]) => [px(x), py(y)];

    const sector = (s) => {
        const rad = d => (d * Math.PI) / 180;
        const [x1, y1] = pt([s.cx + s.r * Math.cos(rad(s.from)), s.cy + s.r * Math.sin(rad(s.from))]);
        const [x2, y2] = pt([s.cx + s.r * Math.cos(rad(s.to)), s.cy + s.r * Math.sin(rad(s.to))]);
        const large = s.to - s.from > 180 ? 1 : 0;
        return `M ${px(s.cx)} ${py(s.cy)} L ${x1} ${y1} A ${s.r * k} ${s.r * k} 0 ${large} 0 ${x2} ${y2} Z`;
    };

    // 円の弧をふくむ形。ccw (反時計回り) の弧は、SVG では sweep を 0 にする
    const path = p => p.d.map(([cmd, ...v]) => {
        if (cmd === 'A') return `A ${v[0] * k} ${v[0] * k} 0 0 ${v[3] === false ? 1 : 0} ${px(v[1])} ${py(v[2])}`;
        return `${cmd} ${px(v[0])} ${py(v[1])}`;
    }).join(' ') + ' Z';

    // 円柱の底面。front は手前 (下側) の半分、back はおくの半分
    const ellipse = (e) => {
        const [cx, cy, rx, ry] = [px(e.cx), py(e.cy), e.rx * k, e.ry * k];
        const front = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`;
        const back = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
        return { d: e.half === 'front' ? front : e.half === 'back' ? back : `${front} ${back}`, dashed: !!e.dashed };
    };

    // 角のしるし: 頂点から2つの辺の向きに、小さい弧 (直角は四角) をかき、弧の外に文字を置く
    const angle = (a) => {
        const [ox, oy] = pt(a.at);
        const [fx, fy] = pt(a.from);
        const [tx, ty] = pt(a.to);
        const [ux, uy] = unit(fx - ox, fy - oy);
        const [vx, vy] = unit(tx - ox, ty - oy);
        const cross = ux * vy - uy * vx;
        const size = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
        let [bx, by] = unit(ux + vx, uy + vy);
        if (Math.hypot(ux + vx, uy + vy) < 1e-6) [bx, by] = cross >= 0 ? [-uy, ux] : [uy, -ux];
        if (a.right) {
            const s = 11;
            return {
                d: `M ${ox + ux * s} ${oy + uy * s} L ${ox + (ux + vx) * s} ${oy + (uy + vy) * s} L ${ox + vx * s} ${oy + vy * s}`,
                x: ox + bx * 30, y: oy + by * 30 + 5, text: a.text ?? '', accent: !!a.accent,
            };
        }
        // せまい角は、弧を大きくして文字を遠くに置く
        const r = size < 0.6 ? 34 : 20;
        const far = r + (size < 0.4 ? 30 : 15);
        return {
            d: `M ${ox + ux * r} ${oy + uy * r} A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${ox + vx * r} ${oy + vy * r}`,
            x: ox + bx * far, y: oy + by * far + 5, text: a.text ?? '', accent: !!a.accent,
        };
    };

    // 寸法: 線から少しはなして平行に細い線を引き、まん中に文字を置く
    const dim = (d) => {
        const [x1, y1] = pt(d.from);
        const [x2, y2] = pt(d.to);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
        // 線に垂直な2つの向きのうち、side で指定された側に近いほうを選ぶ
        const [wx, wy] = SIDES[d.side] || (vertical ? SIDES.left : SIDES.below);
        let [nx, ny] = [-(y2 - y1) / len, (x2 - x1) / len];
        if (nx * wx + ny * wy < 0) [nx, ny] = [-nx, -ny];
        const off = 12;
        return {
            d: `M ${x1 + nx * off} ${y1 + ny * off} L ${x2 + nx * off} ${y2 + ny * off}`,
            x: (x1 + x2) / 2 + nx * (vertical ? 18 : 26),
            y: (y1 + y2) / 2 + ny * (vertical ? 18 : 26) + 5,
            anchor: vertical ? (nx > 0 ? 'start' : 'end') : 'middle',
            text: d.text,
        };
    };

    return {
        width,
        height,
        polys: f.polys.map(p => ({ points: p.points.map(q => pt(q).join(',')).join(' '), fill: p.fill || 'none', dashed: !!p.dashed })),
        paths: (f.paths ?? []).map(p => ({ d: path(p), fill: p.fill || 'none', dashed: !!p.dashed })),
        circles: f.circles.map(c => ({ cx: px(c.cx), cy: py(c.cy), r: c.r * k, fill: c.fill || 'none', dashed: !!c.dashed })),
        sectors: f.sectors.map(s => ({ d: sector(s), fill: s.fill || 'none' })),
        ellipses: (f.ellipses ?? []).map(ellipse),
        lines: f.lines.map(l => ({ a: pt(l.from), b: pt(l.to), dashed: !!l.dashed })),
        angles: (f.angles ?? []).map(angle),
        dims: f.dims.map(dim),
        labels: f.labels.map(l => ({ x: px(l.at[0]), y: py(l.at[1]) + 5, text: l.text, small: !!l.small })),
        points: f.points.map(p => ({ x: px(p.at[0]), y: py(p.at[1]), tx: px(p.at[0]) + (p.dx ?? 0), ty: py(p.at[1]) + (p.dy ?? 0), text: p.text })),
    };
});
</script>

<template>
    <svg :viewBox="`0 0 ${view.width} ${view.height}`" class="figure-svg" :style="{ maxWidth: view.width + 'px' }" role="img" aria-label="図">
        <polygon v-for="(p, i) in view.polys" :key="'p' + i" :points="p.points" class="fig-line" :class="[`fill-${p.fill}`, { dashed: p.dashed }]" />
        <path v-for="(p, i) in view.paths" :key="'a' + i" :d="p.d" class="fig-line" :class="[`fill-${p.fill}`, { dashed: p.dashed }]" />
        <path v-for="(s, i) in view.sectors" :key="'s' + i" :d="s.d" class="fig-line" :class="`fill-${s.fill}`" />
        <circle v-for="(c, i) in view.circles" :key="'c' + i" :cx="c.cx" :cy="c.cy" :r="c.r" class="fig-line" :class="[`fill-${c.fill}`, { dashed: c.dashed }]" />
        <path v-for="(e, i) in view.ellipses" :key="'e' + i" :d="e.d" class="fig-line" :class="{ dashed: e.dashed }" />
        <line v-for="(l, i) in view.lines" :key="'l' + i" :x1="l.a[0]" :y1="l.a[1]" :x2="l.b[0]" :y2="l.b[1]" class="fig-line" :class="{ dashed: l.dashed }" />
        <g v-for="(a, i) in view.angles" :key="'g' + i">
            <path :d="a.d" class="fig-line thin-ink" fill="none" />
            <text v-if="a.text" :x="a.x" :y="a.y" text-anchor="middle" class="fig-text" :class="{ accent: a.accent }">{{ a.text }}</text>
        </g>
        <g v-for="(d, i) in view.dims" :key="'d' + i">
            <path :d="d.d" class="fig-line thin" fill="none" />
            <text :x="d.x" :y="d.y" :text-anchor="d.anchor" class="fig-text accent">{{ d.text }}</text>
        </g>
        <text v-for="(l, i) in view.labels" :key="'t' + i" :x="l.x" :y="l.y" text-anchor="middle" class="fig-text" :class="{ small: l.small }">{{ l.text }}</text>
        <g v-for="(p, i) in view.points" :key="'v' + i">
            <circle :cx="p.x" :cy="p.y" r="3" class="fig-dot" />
            <text :x="p.tx" :y="p.ty" text-anchor="middle" class="fig-text">{{ p.text }}</text>
        </g>
    </svg>
</template>
