// シード付き乱数（テストで再現できるようにするため）
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * 乱数ヘルパーを作る。seed を省略すると Math.random を使う
 */
export function createRng(seed) {
    const next = seed === undefined ? Math.random : mulberry32(seed);
    const r = {
        next,
        // min〜max（両端を含む）の整数
        int(min, max) {
            return Math.floor(next() * (max - min + 1)) + min;
        },
        bool(p = 0.5) {
            return next() < p;
        },
        pick(arr) {
            return arr[Math.floor(next() * arr.length)];
        },
        // Fisher–Yates（元の配列は変更しない）
        shuffle(arr) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        pickN(arr, n) {
            return r.shuffle(arr).slice(0, n);
        },
    };
    return r;
}

export const defaultRng = createRng();

export function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a, b) {
    return (a * b) / gcd(a, b);
}
