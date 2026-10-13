import { firebaseConfig, useEmulator } from './config.js';
import { RecordSync } from './sync.js';

/** Firebase の設定が入っているビルドか。入っていなければ、ログインの入り口は出さない */
export const cloudAvailable = firebaseConfig !== null;

/** 最初の画面を出したあとでよぶ。Firebase のコードを別ファイルとして読みこんで、ログインの確認を始める */
export async function startCloud(hooks) {
    if (!firebaseConfig) return null;
    const { createFirebase } = await import('./firebase.js');
    const { remote, auth } = createFirebase(firebaseConfig, useEmulator);
    const sync = new RecordSync(remote, auth, hooks);
    sync.start();
    // 画面がかくれる前・通信がもどったときに、送れていない記録を送っておく
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') void sync.flush();
    });
    window.addEventListener('online', () => void sync.flush());
    return sync;
}
