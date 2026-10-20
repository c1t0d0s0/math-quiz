// Firebase を使う部分は、このファイルだけにまとめる。
// 最初の画面を出したあとで読みこむので、Firebase を使わない人の最初の表示はおそくならない。
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import {
    collection,
    connectFirestoreEmulator,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    setDoc,
} from 'firebase/firestore/lite';
import { APP_ID, SCHEMA, fromAppDoc, fromProgressDoc, toAppDoc, toProgressDoc } from './records.js';
import { firebaseApp, firebaseAuth } from './app.js';

export function createFirebase(emulator) {
    const auth = firebaseAuth();
    const db = getFirestore(firebaseApp());
    if (emulator) {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }

    // users/{uid}/apps/{appId} と、その下の progress/{モードの id}
    const userRef = uid => doc(db, 'users', uid);
    const appRef = uid => doc(db, 'users', uid, 'apps', APP_ID);
    const progressCol = uid => collection(db, 'users', uid, 'apps', APP_ID, 'progress');
    const progressRef = (uid, id) => doc(db, 'users', uid, 'apps', APP_ID, 'progress', id);

    const remote = {
        async loadAll(uid) {
            const [summary, docs] = await Promise.all([getDoc(appRef(uid)), getDocs(progressCol(uid))]);
            const records = {};
            docs.forEach((d) => {
                const record = fromProgressDoc(d.data());
                if (record) records[d.id] = record;
            });
            return { exists: summary.exists(), records, summary: fromAppDoc(summary.exists() ? summary.data() : null) };
        },
        async loadRecord(uid, id) {
            const snap = await getDoc(progressRef(uid, id));
            return snap.exists() ? fromProgressDoc(snap.data()) : null;
        },
        async loadSummary(uid) {
            const snap = await getDoc(appRef(uid));
            return snap.exists() ? fromAppDoc(snap.data()) : null;
        },
        async saveSummary(uid, summary) {
            const now = Date.now();
            // その人の情報 (全アプリ共通)。名前やメールアドレスは入れない
            const user = await getDoc(userRef(uid));
            await setDoc(userRef(uid), { schema: SCHEMA, updatedAt: now, ...(user.exists() ? {} : { createdAt: now }) }, { merge: true });
            await setDoc(appRef(uid), toAppDoc(summary, now));
        },
        async saveRecord(uid, id, record) {
            await setDoc(progressRef(uid, id), toProgressDoc(record, Date.now()));
        },
    };

    const authPort = {
        onUser(cb) {
            // 対戦のための匿名ログインは「ログインしていない」としてあつかう (記録は Google でログインしたときだけ Firestore に保存する)
            onAuthStateChanged(auth, user => cb(user && !user.isAnonymous ? user.uid : null));
        },
        async signIn() {
            // エミュレーターには本物の Google ログインの画面がないので、テストから「だれとしてログインするか」を
            // 指定できるようにする (window.__testUser)。本番のビルドでは emulator が false なので使われない
            if (emulator && window.__testUser) {
                const sub = window.__testUser;
                const token = JSON.stringify({ sub, email: `${sub}@example.com`, email_verified: true });
                await signInWithCredential(auth, GoogleAuthProvider.credential(token));
                return;
            }
            await signInWithPopup(auth, new GoogleAuthProvider());
        },
        async signOut() {
            await signOut(auth);
        },
    };

    return { remote, auth: authPort };
}
