<script setup>
import { ref } from 'vue';

// ホーム画面のアカウント欄。Google でログインすると、記録を Firestore に保存して、
// ほかのブラウザや端末でも同じ記録で遊べる。Firebase の設定がないビルドでは出さない
const props = defineProps({
    account: { type: Object, required: true },
    signIn: { type: Function, required: true },
    signOut: { type: Function, required: true },
});

const STATUS_TEXT = {
    syncing: '保存中…',
    synced: '保存ずみ',
    offline: 'まだ保存できていません。つながったら保存します。',
};

const busy = ref(false);
const error = ref('');

async function onSignIn() {
    busy.value = true;
    error.value = '';
    try {
        await props.signIn();
    } catch (err) {
        // 自分でログインの画面をとじたときは、何も言わない。
        // 原因を調べられるよう、Firebase のエラーの名前も小さくそえる (README の「ログインできないとき」を参照)
        const code = err?.code ?? '';
        if (!/popup-closed-by-user|cancelled-popup-request/.test(code)) {
            error.value = 'ログインできませんでした。もういちどためしてください。' + (code ? ` (${code})` : '');
        }
    } finally {
        busy.value = false;
    }
}

async function onSignOut() {
    busy.value = true;
    try {
        if ((await props.signOut()) === 'unsynced'
            && window.confirm('まだ保存できていない記録があります。今ログアウトすると、その分はなくなります。ログアウトしますか？')) {
            await props.signOut(true);
        }
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <section class="account" aria-labelledby="account-title">
        <h2 id="account-title">記録の保存</h2>

        <!-- Firebase のコードを読みこんでいる間・ログインしているか確かめている間 -->
        <p v-if="account.status === 'loading'" class="account-status">たしかめています…</p>

        <template v-else-if="!account.signedIn">
            <p class="account-note">Google でログインすると、記録が保存されて、ほかのブラウザや端末でも同じ記録で遊べます。ログインしなくても遊べます。</p>
            <button id="sign-in-button" type="button" class="btn btn-primary" :disabled="busy" @click="onSignIn">Google でログイン</button>
            <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        </template>

        <template v-else>
            <p class="account-state">
                <b>ログイン中</b>
                <span class="account-status" :class="`is-${account.status}`" role="status">{{ STATUS_TEXT[account.status] }}</span>
            </p>
            <button id="sign-out-button" type="button" class="btn" :disabled="busy" @click="onSignOut">ログアウト</button>
        </template>
    </section>
</template>
