// リスザルの絵 (SVG の文字列) をかく。カードの絵柄もここで作る。
// 白い顔に黒い口もと、頭の黒っぽい毛、大きな耳がリスザルの目じるし

// 目や輪郭は、画面の明暗に関係なくこの色にする
const LINE = '#1c2a4a';
const RED = '#e8546a';
const YELLOW = '#ffd23f';
const MUZZLE = '#3d3a44';

/** 指定がないときの色 (ホーム画面のリスザル) */
export const DEFAULT_LOOK = { fur: '#e3b84f', light: '#fffaf0', cap: '#6b6558', pink: '#f3b8a4' };

const sparkle = (cx, cy, r, fill = YELLOW) =>
    `<path fill="${fill}" d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z"/>`;

/** 花丸の線 (うずまきのあとに花びら) */
export function hanamaruPoints() {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
        const t = i / 140;
        const a = t * 3 * Math.PI * 2 - Math.PI / 2;
        const r = 3 + t * 24;
        pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
    }
    for (let i = 1; i <= 120; i++) {
        const t = i / 120;
        const a = t * Math.PI * 2 - Math.PI / 2;
        const r = 27 + 13 * Math.abs(Math.sin(t * Math.PI * 6));
        pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
}

const EYE_Y = 69;
const EYE_X = [43, 77];

function eyes(look) {
    const open = x => (look.eyeColor
        ? `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${look.eyeColor}" stroke="${LINE}" stroke-width="1.6"/>`
            + `<ellipse cx="${x}" cy="${EYE_Y}" rx="4.2" ry="6" fill="${LINE}"/>`
            + `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="2" fill="#fff"/>`
        : `<ellipse cx="${x}" cy="${EYE_Y}" rx="7.5" ry="8.5" fill="${LINE}"/>`
            + `<circle cx="${x + 2.6}" cy="${EYE_Y - 3.6}" r="3.1" fill="#fff"/>`
            + `<circle cx="${x - 2.6}" cy="${EYE_Y + 3.6}" r="1.5" fill="#fff"/>`);
    const arc = (x, up) =>
        `<path fill="none" stroke="${LINE}" stroke-width="2.8" stroke-linecap="round" d="M${x - 7} ${EYE_Y + (up ? 2 : -1)}Q${x} ${EYE_Y + (up ? -8 : 7)} ${x + 7} ${EYE_Y + (up ? 2 : -1)}"/>`;
    const [l, r] = EYE_X;
    switch (look.eyes ?? 'open') {
        case 'wink':
            return open(l) + arc(r, true);
        case 'sleep':
            return arc(l, false) + arc(r, false);
        case 'happy':
            return arc(l, true) + arc(r, true);
        case 'sparkle':
            return open(l) + open(r) + sparkle(l - 12, EYE_Y - 13, 4.5) + sparkle(r + 12, EYE_Y - 13, 4.5);
        case 'brave':
            return open(l) + open(r)
                + `<path fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round" d="M34 57L51 61M86 57L69 61"/>`;
        default:
            return open(l) + open(r);
    }
}

// 口もとは黒っぽいので、口は明るい色でかく
function mouth(look) {
    const nose = `<path fill="#77717f" d="M56.6 85.2Q60 83.6 63.4 85.2Q62 88.2 60 88.6Q58 88.2 56.6 85.2Z"/>`;
    const smile = `<path fill="none" stroke="#f6dccd" stroke-width="2" stroke-linecap="round" d="M53.5 92Q60 97.5 66.5 92"/>`;
    switch (look.mouth ?? 'smile') {
        case 'open':
            return nose
                + `<path fill="#e86a78" stroke="#f6dccd" stroke-width="1.6" stroke-linejoin="round" d="M53 91Q60 101.5 67 91Z"/>`;
        case 'tongue':
            return nose + smile + `<path fill="#f28f86" d="M57.4 94.6Q60 100 62.6 94.6Z"/>`;
        default:
            return nose + smile;
    }
}

const ITEMS = {
    ribbon:
        `<g transform="translate(88 32) rotate(18)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" fill="${RED}">`
        + `<path d="M0 0L-14 -8.5V8.5Z"/><path d="M0 0L14 -8.5V8.5Z"/><circle r="4"/></g>`,
    glasses:
        `<g fill="rgba(255,255,255,0.3)" stroke="${LINE}" stroke-width="2.6">`
        + `<circle cx="43" cy="69" r="11.5"/><circle cx="77" cy="69" r="11.5"/>`
        + `<path fill="none" stroke-linecap="round" d="M54.5 67.5Q60 64 65.5 67.5M31.5 67L21 63M88.5 67L99 63"/></g>`,
    pencil:
        `<g transform="rotate(30 97 34)" stroke="${LINE}" stroke-width="2" stroke-linejoin="round">`
        + `<rect x="93" y="12" width="8" height="6" fill="#f7a3b0"/><rect x="93" y="18" width="8" height="26" fill="${YELLOW}"/>`
        + `<path fill="#f6e0b5" d="M93 44H101L97 54Z"/><path fill="${LINE}" stroke="none" d="M95.4 50H98.6L97 54Z"/></g>`,
    hat:
        `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">`
        + `<ellipse cx="60" cy="31" rx="43" ry="7.5" fill="#f0d27a"/>`
        + `<path fill="#f5dc8e" d="M37 30C37 6 83 6 83 30Q60 36 37 30Z"/>`
        + `<path fill="${RED}" d="M37.2 24Q60 19 82.8 24L83 30Q60 36 37 30Z"/></g>`,
    scarf:
        `<g fill="${RED}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">`
        + `<path d="M73 110L79 129L90 125L85 107Z"/><path d="M25 99Q60 115 95 99L97 108Q60 126 23 108Z"/></g>`
        + `<path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" d="M38 108Q60 116 82 108"/>`,
    flower:
        `<g transform="translate(89 32)" stroke="${LINE}" stroke-width="1.6">`
        + [0, 72, 144, 216, 288].map(a => `<circle r="5.4" cx="0" cy="-6.6" fill="#ff9fb5" transform="rotate(${a})"/>`).join('')
        + `<circle r="4" fill="${YELLOW}"/></g>`,
    book:
        `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">`
        + `<path fill="#fff" d="M32 102Q46 95 60 102Q74 95 88 102V122Q74 115 60 122Q46 115 32 122Z"/>`
        + `<path fill="none" d="M60 102V122"/></g>`
        + `<path fill="none" stroke="#9aa6b8" stroke-width="1.4" stroke-linecap="round" d="M38 106Q46 103 54 106M38 111Q46 108 54 111M66 106Q74 103 82 106M66 111Q74 108 82 111"/>`,
    headband:
        `<g stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" fill="#fff">`
        + `<path d="M97 52L112 44L110 53L114 60L98 58Z"/><path d="M21 50Q60 33 99 50L99.5 59Q60 42 20.5 59Z"/></g>`
        + `<circle cx="60" cy="44.5" r="4.4" fill="#d63c2c"/>`,
    banana:
        `<g transform="translate(93 104) rotate(-24)" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round">`
        + `<path fill="${YELLOW}" d="M-17 -6Q-2 8 17 -9Q19 -5 16 0Q0 20 -18 1Q-19 -3 -17 -6Z"/>`
        + `<path fill="#8a6a2c" d="M15.5 -10.5L19.5 -8.5L17.5 -4.5L14.5 -7Z"/></g>`,
    cap:
        `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">`
        + `<path fill="#2f55a8" d="M38 33C24 33 11 37 6 44C24 45 46 41 62 35Z"/>`
        + `<path fill="#3f6fd1" d="M35 34C35 8 85 8 85 34Q60 28 35 34Z"/></g>`
        + `<circle cx="60" cy="13.5" r="2.6" fill="#fff" stroke="${LINE}" stroke-width="1.5"/>`
        + `<path fill="none" stroke="#fff" stroke-width="1.6" opacity="0.7" d="M60 16V30"/>`,
    wizard:
        `<g stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round">`
        + `<path fill="#5b3fa8" d="M34 33Q50 10 70 -12Q72 12 86 33Q60 39 34 33Z"/>`
        + `<ellipse cx="60" cy="33" rx="37" ry="6.5" fill="#4a3290"/></g>`
        + sparkle(57, 20, 5) + sparkle(69, 8, 3.2) + sparkle(72, 25, 2.6),
    crown:
        `<path fill="${YELLOW}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" d="M38 32L35 8L49 20L60 2L71 20L85 8L82 32Q60 26 38 32Z"/>`
        + `<circle cx="60" cy="21" r="3.6" fill="#d63c2c" stroke="${LINE}" stroke-width="1.4"/>`
        + `<circle cx="45.5" cy="24" r="2.6" fill="#4a90e2" stroke="${LINE}" stroke-width="1.2"/>`
        + `<circle cx="74.5" cy="24" r="2.6" fill="#3fb37f" stroke="${LINE}" stroke-width="1.2"/>`,
    zzz:
        `<g fill="#fff" font-family="sans-serif" font-weight="700">`
        + `<text x="90" y="34" font-size="13">z</text><text x="99" y="22" font-size="16">z</text><text x="110" y="8" font-size="19">z</text></g>`,
};

/** リスザルの顔 (たて 110 × よこ 120 の中にかく) */
export function monkeyFace(look = {}) {
    const c = { ...DEFAULT_LOOK, ...look };
    const items = look.items ?? [];
    return (
        // 耳
        `<g stroke="${LINE}" stroke-width="2.5">`
        + `<circle cx="16" cy="61" r="13.5" fill="${c.light}"/><circle cx="104" cy="61" r="13.5" fill="${c.light}"/></g>`
        + `<circle cx="17.5" cy="62" r="6.5" fill="${c.pink}"/><circle cx="102.5" cy="62" r="6.5" fill="${c.pink}"/>`
        // 頭
        + `<path fill="${c.fur}" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round" d="M60 26C35 26 20 44 20 66C20 90 38 106 60 106C82 106 100 90 100 66C100 44 85 26 60 26Z"/>`
        // 頭の黒っぽい毛。まん中が、目の間に向かって下がっている
        + `<path fill="${c.cap}" d="M22.6 53C25 37 40 27.4 60 27.4C80 27.4 95 37 97.4 53C90 44 80 42 72 46C67 48.5 63 53 60 59C57 53 53 48.5 48 46C40 42 30 44 22.6 53Z"/>`
        // 白い顔
        + `<path fill="${c.light}" d="M60 58C54 48 40 46 31.5 54C24.5 61 24.5 76 31.5 84C38 91 50 92 60 87C70 92 82 91 88.5 84C95.5 76 95.5 61 88.5 54C80 46 66 48 60 58Z"/>`
        + `<ellipse cx="33.5" cy="81" rx="5.5" ry="3.4" fill="${c.pink}" opacity="0.7"/>`
        + `<ellipse cx="86.5" cy="81" rx="5.5" ry="3.4" fill="${c.pink}" opacity="0.7"/>`
        // 黒い口もと
        + `<ellipse cx="60" cy="90.5" rx="14" ry="10.5" fill="${MUZZLE}" stroke="${LINE}" stroke-width="2"/>`
        + eyes(look)
        + mouth(look)
        + items.map(item => ITEMS[item] ?? '').join('')
    );
}

/** ホーム画面のリスザル */
export function monkeySvg() {
    return `<svg viewBox="0 0 120 110" role="img" aria-label="リスザルのキャラクター">${monkeyFace()}</svg>`;
}

// ---- カードの絵柄 (たて 156 × よこ 120) ----

const W = 120;
const H = 156;
const circles = (points, fill) => points.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const fillRect = fill => `<rect width="${W}" height="${H}" fill="${fill}"/>`;

function background(bg) {
    switch (bg) {
        case 'dots': {
            const dots = [];
            for (let y = 0; y < 11; y++) for (let x = 0; x < 9; x++) dots.push([x * 15 + (y % 2) * 7.5, y * 15 + 6, 3.2]);
            return fillRect('#fff5c2') + circles(dots, '#ffe36e');
        }
        case 'grid': {
            let d = '';
            for (let x = 12; x < W; x += 12) d += `M${x} 0V${H}`;
            for (let y = 12; y < H; y += 12) d += `M0 ${y}H${W}`;
            return fillRect('#f3faf6') + `<path d="${d}" stroke="#b9dccf" stroke-width="1" fill="none"/>`;
        }
        case 'night':
            return fillRect('#27305a')
                + `<circle cx="24" cy="24" r="11" fill="#ffe58a"/><circle cx="29" cy="20.5" r="10" fill="#27305a"/>`
                + circles([[52, 14, 1.4], [76, 26, 1.1], [14, 60, 1.2], [108, 52, 1.5], [100, 140, 1.3], [16, 132, 1.5], [62, 148, 1.1]], '#fff')
                + sparkle(90, 16, 4, '#ffe58a') + sparkle(106, 100, 3, '#ffe58a');
        case 'pink':
            return fillRect('#ffe4ea') + circles([[18, 22, 13], [102, 34, 9], [96, 132, 16], [14, 120, 8], [60, 10, 6]], '#ffd0da');
        case 'sky':
            return fillRect('#cdeaf8')
                + `<circle cx="98" cy="22" r="11" fill="${YELLOW}"/>`
                + `<g fill="#fff"><ellipse cx="26" cy="22" rx="15" ry="6.5"/><ellipse cx="34" cy="17" rx="9" ry="6"/>`
                + `<ellipse cx="92" cy="142" rx="17" ry="6.5"/><ellipse cx="20" cy="136" rx="12" ry="5"/></g>`;
        case 'snow':
            return fillRect('#dcecf5')
                + `<ellipse cx="60" cy="160" rx="90" ry="22" fill="#fff"/>`
                + circles([[16, 16, 2.6], [44, 10, 1.8], [78, 20, 2.4], [104, 12, 1.9], [10, 58, 2], [110, 66, 2.6], [20, 104, 1.8], [102, 112, 2.2], [60, 24, 1.6]], '#fff');
        case 'sakura': {
            const petals = [[16, 18, 20], [42, 10, -30], [86, 16, 50], [106, 34, -10], [10, 70, 70], [112, 86, 30], [18, 128, -40], [98, 138, 15], [58, 146, -60], [70, 28, 80]];
            return fillRect('#fdeaf0')
                + petals.map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#f7a8bd" transform="rotate(${a} ${x} ${y})"/>`).join('');
        }
        case 'numbers': {
            // 算数の記号をちらす
            const marks = [[10, 26, 18, '＋'], [92, 22, 16, '×'], [100, 72, 14, '÷'], [6, 96, 15, '−'], [90, 146, 18, '＝'], [22, 148, 14, '＋'], [52, 16, 12, '÷']];
            return fillRect('#e9f1ff')
                + `<g fill="#7d94d6" font-family="sans-serif" font-weight="700">`
                + marks.map(([x, y, s, ch]) => `<text x="${x}" y="${y}" font-size="${s}">${ch}</text>`).join('')
                + `</g>`;
        }
        case 'hanamaru':
            return fillRect('#fdfdfa')
                + `<polyline points="${hanamaruPoints()}" fill="none" stroke="#d63c2c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" transform="translate(-10 4) scale(1.4)"/>`;
        case 'stars':
            return fillRect('#33285c')
                + [[16, 18, 6], [100, 14, 4.5], [108, 70, 5], [10, 84, 4], [20, 140, 5], [98, 140, 6.5], [60, 12, 3]].map(([x, y, r]) => sparkle(x, y, r)).join('')
                + circles([[40, 20, 1.2], [84, 30, 1], [112, 112, 1.3], [8, 116, 1.1]], '#fff');
        case 'rainbow':
            return fillRect('#eaf6ff')
                + ['#f2666c', '#f7a23b', '#ffd93b', '#69c56e', '#4aa3e8', '#8b6fd6']
                    .map((color, i) => `<circle cx="60" cy="150" r="${112 - i * 9}" fill="none" stroke="${color}" stroke-width="9"/>`)
                    .join('')
                + `<circle cx="60" cy="150" r="53.5" fill="#eaf6ff"/>`;
        case 'gold': {
            let rays = '';
            for (let i = 0; i < 12; i++) rays += `<path d="M60 84L46 -40L74 -40Z" fill="#f2d56a" transform="rotate(${i * 30} 60 84)"/>`;
            return fillRect('#f8e9ad') + rays + sparkle(16, 20, 6, '#fff') + sparkle(104, 28, 4.5, '#fff') + sparkle(102, 136, 6, '#fff') + sparkle(18, 132, 4, '#fff');
        }
        default:
            return fillRect('#fdfdfa') + `<rect x="8" y="8" width="104" height="140" rx="4" fill="none" stroke="#c5ddd3" stroke-width="1.2"/>`;
    }
}

const FRAMES = {
    plain: `<rect x="1.5" y="1.5" width="117" height="153" rx="7" fill="none" stroke="#6aa893" stroke-width="3"/>`,
    silver:
        `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#aeb8c4" stroke-width="5"/>`
        + `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#f1f4f7" stroke-width="1.2"/>`,
    gold:
        `<rect x="2.5" y="2.5" width="115" height="151" rx="6.5" fill="none" stroke="#d9a520" stroke-width="5"/>`
        + `<rect x="5.5" y="5.5" width="109" height="145" rx="4.5" fill="none" stroke="#fff3c4" stroke-width="1.2"/>`,
};

let clipSeq = 0;

/** 表向きのカードの絵 */
export function cardSvg(card) {
    const clip = `card-clip-${clipSeq++}`;
    return (
        `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${card.name}">`
        + `<clipPath id="${clip}"><rect width="${W}" height="${H}" rx="8"/></clipPath>`
        + `<g clip-path="url(#${clip})">${background(card.bg)}`
        + `<g transform="translate(9 37) scale(0.85)">${monkeyFace(card.look)}</g>`
        + `</g>${FRAMES[card.frame]}</svg>`
    );
}
