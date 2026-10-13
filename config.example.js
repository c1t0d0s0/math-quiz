// このファイルを public/config.js という名前でコピーして、値を書きかえる (public/config.js は Git に入れない)。
// どれも入れなくても動く。

// Google アナリティクスの ID。入れると、Google のタグを読みこむ
const GTM_ID = 'G-XXXXXXXXXX';

// Firebase のウェブアプリの設定。4つとも入れると、Google ログインと Firestore への保存が使えるようになる。
// 入れなければ、ログインの入り口は出ず、記録は今までどおりブラウザ (localStorage) だけに保存する。
// これらの値は公開されてもよいもの (記録を守るのは firestore.rules のほう)。
const FIREBASE_API_KEY = '';
const FIREBASE_AUTH_DOMAIN = '';
const FIREBASE_PROJECT_ID = '';
const FIREBASE_APP_ID = '';
