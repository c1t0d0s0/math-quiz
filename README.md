# 算数チャレンジ

小学生向けの算数クイズです。制限時間内に4択の問題を何問解けるかに挑戦します。

- 今日のチャレンジ: 1・2年 / 3・4年 / 5・6年（毎日かわる10問。同じ日は、だれが開いても同じ問題）
- 計算モード: 足し算・引き算 / かけ算 / 割り算 / 小数 / 分数 / ミックス
- 文章問題モード: 1・2年 / 3・4年 / 5・6年（合計208パターンから自動生成）
  - 3・4年では、ふつうの問題4問ごとに「線分図」の問題を4問ひと組ではさむ（`src/word/segments.js`）。
    たとえば 13 を 4・4・4・1 に区切った線分図を見ながら、`13 ÷ 4 = [ ] … [ ]`、`(13 − 1) ÷ 4 = [ ]`、
    `[ ] × 3 + 1 = 13`、`(13 − [ ]) ÷ 4 = 3` の空欄に、テンキー（PC はキーボードでも）で数字を入れて答える。1問1点
- 長文チャレンジ: 3年 / 4・5年 / 6年（中学受験型の長文60題。小問3問つき・10択・時間無制限、図やグラフつき）
- 対戦: 2〜8人で同じ問題を同時に解いて、暗算の速さを競う（学年と出題数をえらぶ。Firebase Realtime Database）
- スタンプカードとリスザルカード: 毎日遊ぶとスタンプとポイントがたまり、ポイントでリスザルのカードを集められる

## 開発

```sh
npm install
npm run dev      # 開発サーバー
npm test         # テスト
npm run build    # dist/ に本番用ファイルを出力
npm run preview  # ビルド結果の確認
```

手元での設定は、プロジェクト直下の `config.js` に書きます（Git 管理外。ひな形は `config.example.js`）。
設定はビルドのときに読むので、変えたら `npm run dev` / `npm run build` をやり直してください。

- Google アナリティクスを使う場合: 下の「アクセス解析」を参照
- Google ログインと Firestore への保存を使う場合: 下の「ログインと記録の保存」を参照

## 公開 (GitHub Pages)

`main` ブランチに push すると、GitHub Actions（`.github/workflows/deploy.yml`）がテストとビルドを行い、
GitHub Pages に公開します。テストが失敗したときは公開されません。Actions の画面から手動で実行することもできます。

はじめに1回だけ、リポジトリの Settings → Pages → Build and deployment の **Source** を **GitHub Actions** にしてください。

公開するビルドの設定は、リポジトリの Settings → Secrets and variables → Actions → **Variables** に登録します。

| 変数 | 内容 |
|---|---|
| `GTM_ID` | Google アナリティクスの ID。登録してあれば、その ID のタグを埋め込む（なければ埋め込まない） |
| `FIREBASE_API_KEY` `FIREBASE_AUTH_DOMAIN` `FIREBASE_PROJECT_ID` `FIREBASE_APP_ID` | 4つとも登録してあれば、Google ログインと Firestore への保存が使える（なければログインの入り口を出さない） |
| `FIREBASE_DATABASE_URL` | 登録してあれば、対戦が使える（ほかの4つも必要。なければ対戦の入り口を出さない） |

## アクセス解析 (Google のタグ)

ID を設定したときだけ、Google のタグをページに埋め込みます。設定しなければ何も埋め込みません。
ID が `G-…` なら Google アナリティクス（gtag.js）、`GTM-…` なら Google タグ マネージャーのタグになります。

- 手元: `config.js` に `const GTM_ID = 'G-XXXXXXXXXX';` のように書く
- GitHub Pages: リポジトリの変数 `GTM_ID` を登録する

環境変数 `GTM_ID`（デプロイ時は `vars.GTM_ID`）があればそれを使い、なければ `config.js` の値を使います。
ID の形をしていない値を入れると、ビルドがエラーになります。

## 今日のチャレンジ

学年帯（1・2年 / 3・4年 / 5・6年）ごとに、計算5問と文章問題5問の10問を出します。4択で、時間はむせいげんです。

- 問題は「日付（日本時間）＋学年帯」だけから決まります（`src/daily.js`）。同じ日に開けば、だれでも同じ10問になり、
  やり直しても同じ問題が出ます。日付が変わると新しい問題になります
- 計算は、1・2年がたし算・ひき算、3・4年がかけ算・わり算・小数、5・6年が小数・分数。文章問題は、その学年帯のパターンから5つ
- 記録は「その日の記録」として持ちます（正解数と時間）。次の日に遊ぶと、前の日の記録は置きかわります
- 5問以上正解すると、その日のスタンプがもらえます（ほかのモードと同じきまり）
- 問題の作り方（`src/generators/`、`src/word/`、`src/daily.js`）を変えると、同じ日でも前とちがう問題になります。
  公開中に変えると、その日は人によって問題がちがうことがあります

## スタンプ・ポイント・リスザルカード

キャラクターはリスザルです（絵は `src/monkey.js` が SVG でかきます）。
ブラウザのタブのアイコン（`public/favicon.ico` / `favicon.svg` / `apple-touch-icon.png`）も同じリスザルです。
絵を変えたときは `node scripts/build-favicon.mjs` で `favicon.svg` を作り直し、`.ico` と `.png` はその SVG から作り直してください。

- 1回のプレイで5問以上正解すると、その日のスタンプが1個もらえて 20pt（1日1個。どのモードでもよい）
- 7日連続するたびに 1000pt（とぎれたら数え直し）
- その月の1日から末日まで全部そろうと、さらに 5000pt（月ごとに数える）
- 計算・文章問題ではじめて10問以上正解すると 20pt、長文チャレンジではじめて全問正解すると 200pt（どちらもモードごとに1回だけ）
- 対戦で1位になると 20pt、最後まで解いて1位以外だと 10pt（1日5回まで）
- カードは 40pt から 3000pt までの20枚で、合計 28,420pt。持っていないカードは裏向きで、必要な pt だけが見える
  - 毎日スタンプをもらうと、はじめの5枚は2週間以内（2・6・7・7・14日目）に手に入る
  - 対戦をしない人は、全部集めるには少なくとも3か月の連続プレイがいる（対戦のポイントも毎日いちばん多くもらうと、最短70日）
  - 値段を変えるときは、`tests/rewards.test.js` の「カードの値段のバランス」が通ることを確かめる

ポイントは合計を保存せず、スタンプの日付と「はじめて」の記録から毎回計算します（`src/rewards.js`）。
カードの種類と値段は `src/data/cards.js` にあります。
日付は端末の時計（日本時間に換算）で決まるので、時計を変えれば先の日のスタンプも押せてしまいます。

## 対戦 (Firebase Realtime Database)

同じ問題を2〜8人で同時に解いて、全問を解き終えるまでのタイムを競います（Wordlynx の対戦と同じしくみ）。
**`FIREBASE_DATABASE_URL` が入っていないビルドでは、対戦の入り口は出ず、そのコードも読みこまれません。**

### 遊び方

1. ホームの「対戦する」から、名前（ニックネーム、10文字まで）を入れて、学年（1〜6年）と出題数（5・10・20問）をえらんで「部屋を作る」
2. 出てきた対戦コード（数字5けた）・QR コード・招待の URL を友だちに見せる。友だちは URL か QR コードから開くか、
   「コードで入る」にコードを打って入る（8人まで）
3. 2人以上そろったら、部屋を作った人（ホスト）が「スタート」。3・2・1 のあと、全員に同じ問題が同じ順で出る
4. 答えはテンキー（PC はキーボードでも）で数字を入れる。小数は「.」、分数は「3/4」のように約分して入れる。
   まちがえると入れた数が消えて、正解するまで同じ問題をやり直す。画面の上に、みんなの進み具合（○問 / 全問）が出る
5. 全員が解き終わるか（リタイア・退出した人はのぞく）、ホストが「終了する」をおすと結果（順位・タイム・まちがえた数）が出る。
   ホストの「もう一度」で、同じ部屋のまま新しい問題で次の対戦になる

### 出題（`src/battle/questions.js`）

暗算の速さを競うので、学年で習う範囲の、暗算できる形だけを出します。

| 学年 | 出す問題（例） |
|---|---|
| 1年 | 1桁＋1桁（7+5）、2桁−1桁のくり下がり（13−6） |
| 2年 | 2桁の加減（34+25、62−28。99まで）、九九（7×8） |
| 3年 | 10の倍数の3桁の加減（240+350）、2桁×1桁（24×3）、九九の逆のわり算（56÷7） |
| 4年 | 10の倍数の3桁の加減（650−280）、くふうして暗算できる2桁×2桁（25×12、11×23 など決まった形だけ）、小数の加減（3.5+2.4） |
| 5年 | 小数×整数・小数÷整数（1.2×5）、分母が同じ分数の加減（3/8+2/8）、くふうする計算（125×8、25×4×7） |
| 6年 | 分数の乗除（3/4×2/3）、割合（240の25%）、比で分ける（500を2:3に分ける。空欄2つ）、複合計算（3+4×5） |

### ポイント

- 1位（同じタイムなら全員）は 20pt、最後まで解いて1位以外の人は 10pt。リタイア・退出した人は 0pt
- 結果は「はじめて」の記録と同じところ（`completed`）に `battle:<日付>:<コード>-<回>:win|lose` として入れる。
  ポイントを数えるときは、同じ回は1回だけ、1日5回分までだけを数える（`src/rewards.js` の `battleTotal`）

### 仕組み

- 問題は各端末で作る。Realtime Database には乱数の種（seed）だけを置き、全員が同じ種から同じ問題を作る。
  公開をはさんで問題の作り方が変わると問題がずれるので、作り方の指紋（`version`）を部屋に入れておき、ちがう人には「ページを読みこみ直してね」と出す
- タイムはサーバーの時計で測る。スタート時刻（`startAt`）と、ゴールの時刻（`finishedAt`、サーバーの時刻だけを受けつける）の差
- 部屋に入るときは匿名でログインする（Google でログイン中なら、そのアカウント）。匿名のログインでは、Firestore への記録の保存は始めない
- タブを閉じた人は「ぬけた」になる（`onDisconnect`）。ホストが部屋を出ると部屋は消える。作ってから1日たった部屋は、次に同じ番号で部屋を作る人が上書きできる

```
mathBattles/{code}             code = 数字5けた (0 から始まらない)
  app: "math-quiz", hostUid, createdAt, grade: 1〜6, count: 5 | 10 | 20, version
  round: 1, 2, …               「もう一度」でふえる
  seed, status: "waiting" | "playing" | "finished", startAt
  players/{seat}               seat = 0〜7
    uid, name, joinedAt, online, round, solved, misses, finishedAt?, retired?
```

ルール（`database.rules.json`）では、次のことを確かめています。

- 読めるのはログインしている人だけ。部屋の一覧は読めない
- 部屋を作れるのは、まだその番号の部屋がないとき（または1日以上前の部屋のとき）だけ
- `status`・`seed`・`startAt`・`round` を変えたり、部屋を消したりできるのはホストだけ
- 席にすわれるのは、待っている間で、自分の uid のときだけ。書きかえられるのは自分の席だけ
- 名前は1〜20（UTF-16 の長さ。画面では10文字まで）、数はマイナスにできない、決まっていない項目は入れられない

### 準備

1. Firebase コンソール → Realtime Database でデータベースを作る
2. Realtime Database → ルール に、`database.rules.json` の内容を設定する。
   **Realtime Database のルールはデータベース全体で1つです。Wordlynx と同じプロジェクト・同じデータベースを使うときは、
   Wordlynx の `battles` のルールと、このアプリの `mathBattles` のルールを、1つの `"rules"` の中にならべて設定してください**
   （どちらかだけを設定すると、もう一方の対戦が使えなくなります）。

   ```json
   {
     "rules": {
       "battles": { … Wordlynx の database.rules.json の battles の中身 … },
       "mathBattles": { … このリポジトリの database.rules.json の mathBattles の中身 … }
     }
   }
   ```

3. Authentication → ログイン方法 で **匿名** を有効にする（Google ログインとは別に必要）
4. Realtime Database の URL（`https://….firebasedatabase.app` など）を、`config.js` の `FIREBASE_DATABASE_URL` か、
   リポジトリ変数 `FIREBASE_DATABASE_URL` に入れる（ほかの4つの Firebase の設定も必要）

エミュレーターで動かすとき（Java が必要）:

```sh
npx firebase-tools emulators:start --only auth,firestore,database --project demo-math-quiz
FIREBASE_API_KEY=x FIREBASE_AUTH_DOMAIN=localhost FIREBASE_PROJECT_ID=demo-math-quiz FIREBASE_APP_ID=x \
  FIREBASE_DATABASE_URL=https://demo-math-quiz-default-rtdb.firebaseio.com FIREBASE_EMULATOR=1 npm run dev
```

## ログインと記録の保存 (Firebase)

Google でログインした人の記録（モードごとの最高記録、スタンプ、カード）は Firebase の Firestore に保存し、どのブラウザでも同じ記録で遊べます。
ログインは任意で、ログインしない人は、今までどおりそのブラウザの localStorage に保存します。
**Firebase の設定を入れていないビルドでは、ログインの入り口は出ず、Firebase のコードも読みこまれません。**

### 仕組み

- ログインしていないとき: 記録は localStorage（最高記録は `math_quiz_highscore_<モード>` など、スタンプとカードは `math_quiz_rewards`）に保存する（`src/cloud/local.js`）
- ログインしているとき: 記録は localStorage には書かず、Firestore に保存する（`src/cloud/sync.js`）。
  ページを開くと Firestore から読みこみ、読み終わるまでは「読みこみ中…」と出す
- 新しい記録を書くときは、Firestore にある記録とくらべて、よいほう（正解数が多いほう。同じなら時間が短いほう）を残す。
  2台で別々に遊んでも、よい記録が消えることはない（`src/cloud/records.js`）
- スタンプとカードは、Firestore にある分と合わせてから書く（スタンプの日付と「はじめて」の記録は両方を合わせた集合、
  カードは両方を合わせ、同じカードは払った額の小さいほう）
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

users/{uid}/apps/math-quiz                    アプリごとの記録のまとめ
  schema: 1, updatedAt
  activeDays: string[]                        スタンプをもらった日 (YYYY-MM-DD)
  completed:  string[]                        「はじめて」の記録 ("clear:<モード>" / "perfect:<モード>")
  inventory:  { [カードの id]: { paid } }      交換したリスザルカードと、使ったポイント
  spent: {}, settings: {}                     このアプリでは使わない

users/{uid}/apps/math-quiz/progress/{モードの id}   モードごとの最高記録
  schema: 1, updatedAt
  status: "done"
  data: { score: 正解数, seconds: かかった秒数 (長文チャレンジと今日のチャレンジ。ほかは 0),
          date: その記録を出した日 (今日のチャレンジだけ) }
```

読み書きできるのはログインしている本人だけです（`firestore.rules`）。

### Firebase の準備

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作り（Wordlynx と同じプロジェクトでもよい）、ウェブアプリを登録する
2. Authentication → ログイン方法 で **Google** を有効にする。設定 → 承認済みドメイン に、公開先のドメインを足す
3. Firestore Database を作り、ルールに `firestore.rules` の内容を設定する
4. ウェブアプリの設定値のうち4つを入れる
   - 手元: `config.js` に書く

     ```js
     const FIREBASE_API_KEY = '…';
     const FIREBASE_AUTH_DOMAIN = '….firebaseapp.com';
     const FIREBASE_PROJECT_ID = '…';
     const FIREBASE_APP_ID = '…';
     ```

   - GitHub Pages: リポジトリの Settings → Secrets and variables → Actions → Variables に、同じ4つの名前で登録する

   環境変数があればそれを使い、なければ `config.js` の値を使います。4つのうち一部だけを入れると、ビルドがエラーになります。
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
