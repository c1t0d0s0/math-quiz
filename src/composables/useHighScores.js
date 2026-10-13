import { reactive, onMounted } from 'vue';
import { MODES } from '../modes.js';
import { cloudAvailable, startCloud } from '../cloud/index.js';
import { isBetter } from '../cloud/records.js';
import { clearLocalRecords, readLocalRecords, rememberSignedIn, wasSignedIn, writeLocalRecord } from '../cloud/local.js';

const ASK_MIGRATE = 'この端末にある記録を、アカウントにうつしますか？\n（「キャンセル」をえらぶと、アカウントの記録だけを使います。この端末の記録は、ログアウトするとまた使えます）';

/**
 * 最高記録の読み書き。
 * ログインしていないときは、この端末の localStorage に保存する。
 * Google でログインしているときは、localStorage には書かず、Firestore に保存する (src/cloud/sync.js)。
 */
export function useHighScores() {
    const scores = reactive({});
    const times = reactive({});
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
    let early = {};

    function show(records) {
        for (const mode of MODES) {
            scores[mode.id] = records[mode.id]?.score ?? 0;
            times[mode.id] = records[mode.id]?.seconds ?? 0;
        }
    }
    show(account.loading ? {} : readLocalRecords());

    function refreshAccount(current) {
        // Firebase を読みこみ終わる前によばれることがあるので、わたされたものをおぼえておく
        sync = current;
        account.status = sync.status;
        account.signedIn = sync.uid !== null;
        account.loading = sync.status === 'loading' ? account.loading : sync.uid !== null && !sync.loaded;
    }

    function flushEarly() {
        const pending = early;
        early = {};
        for (const [modeId, record] of Object.entries(pending)) save(modeId, record);
    }

    function save(modeId, record) {
        if (sync?.uid) {
            sync.submit(modeId, record);
        } else if (account.status === 'loading' && account.loading) {
            early[modeId] = record;
        } else if (isBetter(record, readLocalRecords()[modeId])) {
            writeLocalRecord(modeId, record);
        }
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
        save(modeId, record);
        return true;
    }

    onMounted(async () => {
        sync = await startCloud({
            onStatus: refreshAccount,
            onRecords(records, current) {
                rememberSignedIn(records !== null);
                refreshAccount(current);
                // ログインしているかどうかが分かる前に出た記録があれば、ここで保存先に入れる
                flushEarly();
                show(records === null ? readLocalRecords() : current.records);
            },
            askMigrate: () => window.confirm(ASK_MIGRATE),
            readGuest: readLocalRecords,
            clearGuest: clearLocalRecords,
        });
    });

    return {
        scores,
        times,
        account,
        submit,
        signIn: () => sync.signIn(),
        signOut: force => sync.signOut(force),
    };
}
