/* global __FIREBASE_CONFIG__, __FIREBASE_EMULATOR__ */

/**
 * Firebase の設定。ビルドのときに config.js か環境変数から入る (vite.config.js)。
 * 設定がなければ null で、そのときはログインの入り口を出さず、Firebase のコードも読みこまない。
 */
export const firebaseConfig = typeof __FIREBASE_CONFIG__ !== 'undefined' && __FIREBASE_CONFIG__ ? __FIREBASE_CONFIG__ : null;

/** 対戦 (Realtime Database) が使えるビルドか。FIREBASE_DATABASE_URL が入っているときだけ */
export const battleAvailable = !!firebaseConfig?.databaseURL;

/** 手元の Firebase エミュレーターにつなぐか (開発・テスト用) */
export const useEmulator = typeof __FIREBASE_EMULATOR__ !== 'undefined' && __FIREBASE_EMULATOR__ === true;
