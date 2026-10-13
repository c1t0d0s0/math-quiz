import { reactive, computed, onMounted } from 'vue';
import { MODES, findMode } from '../modes.js';
import { cloudAvailable, startCloud } from '../cloud/index.js';
import { isBetter } from '../cloud/records.js';
import {
    clearLocalRecords, readLocalRecords, readLocalSummary, rememberSignedIn, wasSignedIn, writeLocalRecord, writeLocalSummary,
} from '../cloud/local.js';
import { balance, buyCard as buy, emptySummary, jstDate, mergeSummary, playReward } from '../rewards.js';

const ASK_MIGRATE = 'この端末にある記録（最高記録・スタンプ・カード）を、アカウントにうつしますか？\n（「キャンセル」をえらぶと、アカウントの記録だけを使います。この端末の記録は、ログアウトするとまた使えます）';

/**
 * 最高記録と、スタンプ・ポイント・カードの読み書き。
 * ログインしていないときは、この端末の localStorage に保存する。
 * Google でログインしているときは、localStorage には書かず、Firestore に保存する (src/cloud/sync.js)。
 */
export function useHighScores() {
    const scores = reactive({});
    const times = reactive({});
    /** スタンプ・「やったね」の記録・カード (src/rewards.js の summary の形) */
    const rewards = reactive(emptySummary());
    const points = computed(() => balance(rewards));
    /** アカウント欄に出す状態。status は src/cloud/sync.js の説明を参照 */
    const account = reactive({
        available: cloudAvailable,
        status: cloudAvailable ? 'loading' : 'signed-out',
        signedIn: false,
        // ログイン中の人の記録を、まだ読み終わっていない (その間は記録を「読みこみ中」と出す)
        loading: cloudAvailable && wasSignedIn(),
    });

    let sync = null;
    // ログインしているかどうかが分かる前に出た記録。分かったら、その人の保存先に入れる
    let earlyRecords = {};
    let earlySummary = null;

    function show(records, summary) {
        for (const mode of MODES) {
            scores[mode.id] = records[mode.id]?.score ?? 0;
            times[mode.id] = records[mode.id]?.seconds ?? 0;
        }
        Object.assign(rewards, mergeSummary(emptySummary(), summary));
    }
    if (account.loading) show({}, emptySummary());
    else show(readLocalRecords(), readLocalSummary());

    function refreshAccount(current) {
        // Firebase を読みこみ終わる前によばれることがあるので、わたされたものをおぼえておく
        sync = current;
        account.status = sync.status;
        account.signedIn = sync.uid !== null;
        account.loading = sync.status === 'loading' ? account.loading : sync.uid !== null && !sync.loaded;
    }

    /** ログインしているかどうかを、まだ確かめている (前はログインしていた) */
    const undecided = () => account.status === 'loading' && account.loading;

    function saveRecord(modeId, record) {
        if (sync?.uid) {
            sync.submit(modeId, record);
        } else if (undecided()) {
            earlyRecords[modeId] = record;
        } else if (isBetter(record, readLocalRecords()[modeId])) {
            writeLocalRecord(modeId, record);
        }
    }

    function saveSummary(summary) {
        if (sync?.uid) {
            sync.submitSummary(summary);
        } else if (undecided()) {
            earlySummary = mergeSummary(earlySummary ?? emptySummary(), summary);
        } else {
            writeLocalSummary(mergeSummary(readLocalSummary(), summary));
        }
    }

    function flushEarly() {
        const records = earlyRecords;
        const summary = earlySummary;
        earlyRecords = {};
        earlySummary = null;
        for (const [modeId, record] of Object.entries(records)) saveRecord(modeId, record);
        if (summary) saveSummary(summary);
    }

    /**
     * スコアを記録する。最高記録を更新したら true を返す。
     * seconds を渡すと、同じ正解数のときは時間が短いほうを最高記録にする
     */
    function submit(modeId, score, seconds) {
        const record = { score, seconds: seconds ?? 0 };
        if (!isBetter(record, { score: scores[modeId], seconds: times[modeId] })) {
            return false;
        }
        scores[modeId] = record.score;
        times[modeId] = record.seconds;
        saveRecord(modeId, record);
        return true;
    }

    /**
     * 1回のプレイが終わったときによぶ。最高記録を記録し、スタンプとポイントをつける。
     * total は問題の数 (長文チャレンジだけ)。
     * もどり値: { isNewRecord, reward }。reward は src/rewards.js の playReward のもどり値
     */
    function finish(modeId, score, seconds, total) {
        const isNewRecord = submit(modeId, score, seconds);
        const reward = playReward(mergeSummary(emptySummary(), rewards), findMode(modeId), score, total ?? 0, jstDate());
        if (reward.gained > 0 || reward.stampAdded) {
            Object.assign(rewards, reward.summary);
            saveSummary(reward.summary);
        }
        return { isNewRecord, reward };
    }

    /** ポイントとカードを交換する。足りないときや、もう持っているとき、読みこみ中は何もしない */
    function buyCard(card) {
        if (account.loading) return false;
        const next = buy(mergeSummary(emptySummary(), rewards), card);
        if (!next) return false;
        Object.assign(rewards, next);
        saveSummary(next);
        return true;
    }

    onMounted(async () => {
        await startCloud({
            onStatus: refreshAccount,
            onRecords(records, current) {
                rememberSignedIn(records !== null);
                refreshAccount(current);
                // ログインしているかどうかが分かる前に出た記録があれば、ここで保存先に入れる
                flushEarly();
                if (records === null) show(readLocalRecords(), readLocalSummary());
                else show(current.records, current.summary);
            },
            askMigrate: () => window.confirm(ASK_MIGRATE),
            readGuest: () => ({ records: readLocalRecords(), summary: readLocalSummary() }),
            clearGuest: clearLocalRecords,
        });
    });

    return {
        scores,
        times,
        rewards,
        points,
        account,
        submit,
        finish,
        buyCard,
        signIn: () => sync.signIn(),
        signOut: force => sync.signOut(force),
    };
}
