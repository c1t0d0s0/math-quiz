import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/** プロジェクト直下の config.js に書かれた `名前 = '値'` を読む (実行はせず、文字として読み取る) */
function readFromConfigJs(name) {
    const file = fileURLToPath(new URL('./config.js', import.meta.url));
    if (!existsSync(file)) return '';
    const match = readFileSync(file, 'utf8').match(new RegExp(`\\b${name}\\b\\s*[:=]\\s*(['"\`])(.*?)\\1`));
    return match ? match[2].trim() : '';
}

/**
 * Firebase の設定 (Google ログインと Firestore への保存に使う)。
 * 環境変数があればその値、なければ config.js の値を使う。4つそろっていなければ null で、
 * そのときはログインの入り口を出さず、Firebase のコードも読みこまれない。
 *   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
 * 対戦 (Realtime Database) を使うときは、もう1つ FIREBASE_DATABASE_URL を入れる。
 * なければ、ログインと保存だけが動き、対戦の入り口は出さない。
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
    // コンソールからコピーすると末尾に / が付くので、取りのぞいてから確かめる
    const databaseURL = get('FIREBASE_DATABASE_URL').replace(/\/+$/, '');
    if (databaseURL && !/^https?:\/\/[\w.:-]+$/.test(databaseURL)) {
        throw new Error(`FIREBASE_DATABASE_URL の形式が正しくありません: "${databaseURL}" (https://….firebasedatabase.app など)`);
    }
    return databaseURL ? { ...config, databaseURL } : config;
}

/**
 * Google のタグの ID を決める。
 * 1. 環境変数 GTM_ID があれば、その値 (GitHub Actions では vars.GTM_ID をわたす)
 * 2. なければ、プロジェクト直下の config.js に書かれた GTM_ID
 * どちらもなければタグは埋め込まない。
 */
function readGtmId() {
    const value = (process.env.GTM_ID ?? '').trim() || readFromConfigJs('GTM_ID');
    // HTML にそのまま書きこむので、ID の形をしていないものは受けつけない
    if (value && !/^(GTM|G)-[A-Z0-9]+$/.test(value)) {
        throw new Error(`GTM_ID の形式が正しくありません: "${value}" (G-XXXXXXXXXX または GTM-XXXXXXX)`);
    }
    return value;
}

/** G-… なら Google アナリティクス (gtag.js)、GTM-… なら Google タグ マネージャーのタグ */
function googleTags(id) {
    if (id.startsWith('GTM-')) {
        return [
            {
                tag: 'script',
                injectTo: 'head-prepend',
                children:
                    "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});"
                    + "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;"
                    + "j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);"
                    + `})(window,document,'script','dataLayer','${id}');`,
            },
            {
                tag: 'noscript',
                injectTo: 'body-prepend',
                children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            },
        ];
    }
    return [
        {
            tag: 'script',
            injectTo: 'head-prepend',
            attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${id}` },
        },
        {
            tag: 'script',
            injectTo: 'head-prepend',
            children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
        },
    ];
}

/** ID があるときだけ、index.html に Google のタグを入れる */
function googleTagPlugin(id) {
    return {
        name: 'math-quiz-google-tag',
        transformIndexHtml: () => (id ? googleTags(id) : []),
    };
}

export default defineConfig({
    // サブパス配信（GitHub Pages など）でも動くように相対パスで出力する
    base: './',
    plugins: [vue(), googleTagPlugin(readGtmId())],
    define: {
        __FIREBASE_CONFIG__: JSON.stringify(readFirebaseConfig()),
        // 手元の Firebase エミュレーターにつなぐ (開発・テスト用): FIREBASE_EMULATOR=1 npm run dev
        __FIREBASE_EMULATOR__: JSON.stringify(process.env.FIREBASE_EMULATOR === '1'),
    },
});
