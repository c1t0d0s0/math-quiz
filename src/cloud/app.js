// Firebase のアプリとログインを、記録の保存 (firebase.js) と対戦 (battle-net.js) で1つずつ共有する。
// どちらも最初の画面を出したあとで読みこむので、このファイルも最初の表示では読みこまれない。
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { firebaseConfig, useEmulator } from './config.js';

let auth = null;

export function firebaseApp() {
    if (!firebaseConfig) throw new Error('Firebase の設定がありません');
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth() {
    if (auth) return auth;
    auth = getAuth(firebaseApp());
    if (useEmulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    return auth;
}
