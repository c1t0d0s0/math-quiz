import { defaultRng } from './rng.js';

function browserStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function loadRecent(storage, key) {
    try {
        const list = JSON.parse(storage?.getItem(key) || '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function saveRecent(storage, key, recent) {
    try {
        storage?.setItem(key, JSON.stringify(recent));
    } catch {
        // 保存できなくても出題は続ける
    }
}

/**
 * シャッフルバッグ。list（id を持つ要素）を一巡するまで同じものを出さない。
 * 最近出したものは storageKey に保存しておき、次に袋を作るとき後ろに回すので、
 * プレイのたびに違うものから始まる。keep は覚えておく数（既定は全体の半分）。
 */
export function createBag(list, storageKey, r = defaultRng, storage = browserStorage(), keep = Math.floor(list.length / 2)) {
    let recent = loadRecent(storage, storageKey);
    let bag = [];

    const refill = () => {
        const seen = new Set(recent);
        const shuffled = r.shuffle(list);
        bag = [...shuffled.filter(p => !seen.has(p.id)), ...shuffled.filter(p => seen.has(p.id))];
    };

    return () => {
        if (bag.length === 0) {
            refill();
        }
        const item = bag.shift();
        recent = [...recent.filter(id => id !== item.id), item.id].slice(-keep);
        saveRecent(storage, storageKey, recent);
        return item;
    };
}
