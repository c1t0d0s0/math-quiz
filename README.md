# 算数チャレンジ

小学生向けの算数クイズです。制限時間内に4択の問題を何問解けるかに挑戦します。

- 計算モード: 足し算・引き算 / かけ算 / 割り算 / 小数 / 分数 / ミックス
- 文章問題モード: 1・2年 / 3・4年 / 5・6年（合計208パターンから自動生成）
- 長文チャレンジ: 3年 / 4・5年 / 6年（中学受験型の長文60題。小問3問つき・10択・時間無制限、図やグラフつき）

## 開発

```sh
npm install
npm run dev      # 開発サーバー
npm test         # テスト
npm run build    # dist/ に本番用ファイルを出力
npm run preview  # ビルド結果の確認
```

設定は `public/config.js` に書きます（Git 管理外。ひな形は `config.example.js`）。

- Google アナリティクスを使う場合: `const GTM_ID = 'G-XXXXXXX';`
- Google ログインと Firestore への保存を使う場合: 下の「ログインと記録の保存」を参照

## ログインと記録の保存 (Firebase)

Google でログインした人の記録（モードごとの最高記録）は Firebase の Firestore に保存し、どのブラウザでも同じ記録で遊べます。
ログインは任意で、ログインしない人は、今までどおりそのブラウザの localStorage に保存します。
**Firebase の設定を入れていないビルドでは、ログインの入り口は出ず、Firebase のコードも読みこまれません。**

### 仕組み

- ログインしていないとき: 記録は localStorage（`math_quiz_highscore_<モード>` など）に保存する（`src/cloud/local.js`）
- ログインしているとき: 記録は localStorage には書かず、Firestore に保存する（`src/cloud/sync.js`）。
  ページを開くと Firestore から読みこみ、読み終わるまでは「読みこみ中…」と出す
- 新しい記録を書くときは、Firestore にある記録とくらべて、よいほう（正解数が多いほう。同じなら時間が短いほう）を残す。
  2台で別々に遊んでも、よい記録が消えることはない（`src/cloud/records.js`）
- ログインしたとき、その端末にログインなしの記録があれば、アカウントにうつすかどうかを聞く。
  うつした記録は端末から消す。うつさなかった記録は端末に残り、ログアウトするとまた使える
- 通信できずに送れなかった記録は、ページを開いている間はおぼえていて、つながったら送る。
  送れていない記録があるままログアウトしようとすると、たしかめる（ページをとじると、送れていない分は失われる）
- 出題の順番を決めるための「最近出した問題」は記録ではないので、ログイン中も端末の localStorage に置く

### Firestore の形 (Wordlynx と共通)

小学生向けの学習アプリで共通の形を使います。同じ Firebase プロジェクトを Wordlynx と共有できます（このアプリの `appId` は `math-quiz`）。

```
users/{uid}                                   その人の情報 (全アプリ共通)
  schema: 1, createdAt, updatedAt             ※ 名前・メールアドレス・写真は保存しない

users/{uid}/apps/math-quiz                    アプリごとの記録のまとめ (このアプリでは共通の項目は空)
  schema: 1, updatedAt, activeDays: [], completed: [], inventory: {}, spent: {}, settings: {}

users/{uid}/apps/math-quiz/progress/{モードの id}   モードごとの最高記録
  schema: 1, updatedAt
  status: "done"
  data: { score: 正解数, seconds: かかった秒数 (長文チャレンジだけ。ほかは 0) }
```

読み書きできるのはログインしている本人だけです（`firestore.rules`）。

### Firebase の準備

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作り（Wordlynx と同じプロジェクトでもよい）、ウェブアプリを登録する
2. Authentication → ログイン方法 で **Google** を有効にする。設定 → 承認済みドメイン に、公開先のドメインを足す
3. Firestore Database を作り、ルールに `firestore.rules` の内容を設定する
4. ウェブアプリの設定値のうち4つを入れる
   - 手元: `public/config.js` に書く

     ```js
     const FIREBASE_API_KEY = '…';
     const FIREBASE_AUTH_DOMAIN = '….firebaseapp.com';
     const FIREBASE_PROJECT_ID = '…';
     const FIREBASE_APP_ID = '…';
     ```

   - ビルド用のサーバー: 同じ4つの名前の環境変数でわたす

   環境変数があればそれを使い、なければ `public/config.js` の値を使います。4つのうち一部だけを入れると、ビルドがエラーになります。
   設定はビルドのときに読むので、変えたら `npm run dev` / `npm run build` をやり直してください。
   これらの値は公開されてもよいものです（記録を守るのはルールのほうです）。

### ログインできないとき

ログインに失敗すると、ボタンの下に「ログインできませんでした。(auth/…)」と、Firebase のエラーの名前が出ます。

| エラーの名前 | 原因 | 直し方 |
|---|---|---|
| `auth/configuration-not-found` | そのプロジェクトで Authentication がまだ始まっていない | Firebase コンソール → Authentication → 「始める」をおし、ログイン方法で Google を有効にする |
| `auth/operation-not-allowed` | Google でのログインが有効になっていない | Authentication → ログイン方法 → Google を有効にして保存する |
| `auth/unauthorized-domain` | 開いているサイトのドメインが登録されていない | Authentication → 設定 → 承認済みドメイン に、公開先のドメイン（手元なら `localhost`）を足す |
| `auth/popup-blocked` | ブラウザがログインの画面（ポップアップ）を止めた | ブラウザでこのサイトのポップアップをゆるす |
| `auth/invalid-api-key` など | 設定値がまちがっている | 4つの値を、コンソールの「ウェブアプリの設定」からコピーし直す |

ログインはできるのに「まだ保存できていません」のままのときは、Firestore Database がまだ作られていないか、
ルールが `firestore.rules` の内容になっていません。

### エミュレーターで動かす (開発用)

本物の Firebase を使わずに、手元でログインと保存をためせます（Java が必要）。

```sh
npx firebase-tools emulators:start --only auth,firestore --project demo-math-quiz
FIREBASE_API_KEY=x FIREBASE_AUTH_DOMAIN=localhost FIREBASE_PROJECT_ID=demo-math-quiz FIREBASE_APP_ID=x FIREBASE_EMULATOR=1 npm run dev
```

## 文章問題パターンの追加

`src/word/{low,mid,high}/` のファイルに、トピックごとに `defineTopic` で定義します。

```js
(r) => {
    const [a, b] = [r.int(2, 9), r.int(2, 9)];
    return {
        text: `りんごが ${a}こ、みかんが ${b}こ あります。あわせて なんこですか。`,
        answer: a + b,            // 数値、または文字列
        unit: 'こ',
        wrong: [Math.abs(a - b)], // 典型的なまちがい。足りない分は近い値で自動的に補う
    };
},
```

- 答えが文字列のときは `wrong` に3つ以上の誤答が必要です。
- 1・2年向けの文は、ひらがな中心の分かち書きにします（使える漢字は `tests/word-patterns.test.js` の `LOW_KANJI`）。
- 開発サーバーで `/?debug=patterns` を開くと、全パターンのサンプルを一覧で確認できます。

## 長文問題の追加

`src/long/{g3,g45,g6}/` のファイルに、同じく `defineTopic` で定義します。1題につき小問はちょうど3問です。

```js
(r) => ({
    text: ['1つ目の段落…', '2つ目の段落…'],
    figure: table(['品物', 'ねだん'], [['ノート', '120円']]), // 省略可。配列にすると図1・図2のように複数出せる
    questions: [
        q('代金は何円ですか。', 360, '円', [240, 480], { step: 10 }),
        q('着いたのは午前何時何分ですか。', 615, '', [600, 630], { format: t => clock(t, '午前') }),
        q('速さは分速何mですか。', 80, 'm', [60, 160], { prefix: '分速' }),
    ],
}),
```

- 答えは数値にします。時こく・「何時間何分」などは、数値（分など）と `format` で表します。10択の残りは自動で作られます。
- 図は `src/long/figures.js` の `table` / `segments` / `route` / `graph` / `shape` で「種類＋数値」のデータとして返します。寸法の向きは `side: 'below' | 'above' | 'left' | 'right'` で指定します。
- 本文の長さの目安（3年220字、4・5年350字、6年550字以上）はテストで確認しています。
- `/?debug=patterns&view=long` で、全題を図つきで確認できます。
