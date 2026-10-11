// 長文問題を書くときの小さな道具

/** 小問を作る。extra には prefix / step / format を入れられる */
export const q = (text, answer, unit = '', wrong = [], extra = {}) => ({ text, answer, unit, wrong, ...extra });

/** 条件 ok を満たすまで make(r) を引き直す */
export function until(r, make, ok) {
    for (let i = 0; i < 5000; i++) {
        const v = make(r);
        if (ok(v)) return v;
    }
    throw new Error('条件を満たす数が見つかりません');
}

export const schools = ['みどり', 'あおば', 'ひかり', 'さくら', 'わかば', 'あさひ'];
