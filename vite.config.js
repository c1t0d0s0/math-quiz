import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/** public/config.js に書かれた `名前 = '値'` を読む (実行はせず、文字として読み取る) */
function readFromConfigJs(name) {
    const file = fileURLToPath(new URL('./public/config.js', import.meta.url));
    if (!existsSync(file)) return '';
    const match = readFileSync(file, 'utf8').match(new RegExp(`\\b${name}\\b\\s*[:=]\\s*(['"\`])(.*?)\\1`));
    return match ? match[2].trim() : '';
}

/**
 * Firebase の設定 (Google ログインと Firestore への保存に使う)。
 * 環境変数があればその値、なければ public/config.js の値を使う。4つそろっていなければ null で、
 * そのときはログインの入り口を出さず、Firebase のコードも読みこまれない。
 *   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
 */
function readFirebaseConfig() {
    // config.js に設定があっても、Firebase を入れないビルドを作りたいとき: FIREBASE_DISABLED=1
    if (process.env.FIREBASE_DISABLED === '1') return null;
    const get = name => (process.env[name] ?? '').trim() || readFromConfigJs(name);
    const config = {
        apiKey: get('FIREBASE_API_KEY'),
        authDomain: get('FIREBASE_AUTH_DOMAIN'),
        projectId: get('FIREBASE_PROJECT_ID'),
        appId: get('FIREBASE_APP_ID'),
    };
    const filled = Object.values(config).filter(Boolean).length;
    if (filled === 0) return null;
    if (filled < 4) {
        throw new Error('Firebase の設定が足りません。FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID の4つを入れてください');
    }
    return config;
}

export default defineConfig({
    // サブパス配信（GitHub Pages など）でも動くように相対パスで出力する
    base: './',
    plugins: [vue()],
    define: {
        __FIREBASE_CONFIG__: JSON.stringify(readFirebaseConfig()),
        // 手元の Firebase エミュレーターにつなぐ (開発・テスト用): FIREBASE_EMULATOR=1 npm run dev
        __FIREBASE_EMULATOR__: JSON.stringify(process.env.FIREBASE_EMULATOR === '1'),
    },
});
