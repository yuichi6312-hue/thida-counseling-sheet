# Codex 実装タスク：「宮古島 蜜塩芋」LP

> このファイルを丸ごと Codex に渡してください（例：`codex "docs/mitsushioimo-miyakojima/codex-task.md を読んで実装して"`）。
> 背景は同じフォルダの `企画書.md` にあります。

## 目的
東京・日本橋で販売中の「日本橋 蜜塩芋」（茨城県産ブランド芋＋宮古島産の雪塩、整体師の"揉み焼き技法"で仕上げる冷やし焼き芋）の**宮古島バージョン**の紹介ページを作る。
ねらいは、東京のお客様に**宮古島の魅力**（さつまいも伝来の島とされる歴史・雪塩・島への旅）を伝え、宮古島の観光情報とふるさと納税へ誘導すること。
芋の産地は**固定しない**（現在は茨城県産。仕入れにより変わる）。コンセプトは「日本最古のさつまいも伝来地・宮古島の雪塩で仕上げる焼き芋」。

## 絶対に守ること（ガードレール）
1. 作業してよいのは `public/mitsushioimo/**` だけ。既存ファイルは**一切変更しない**。
   - 変更禁止：`src/`、ルートの `index.html`、`vite.config.ts`、`tsconfig.json`、`package*.json`、`public/sw.js`、`public/manifest.webmanifest`、`public/ryoshusho/`、`.github/`
   - 例外：ルートの `README.md` に1〜3行の追記だけは可（任意）
2. 素の HTML / CSS / JS（ES2020）で書く。npm 依存・CDN の JS は使わない。フォントは Google Fonts のみ可。
3. Service Worker・manifest は追加しない（本体の PWA と衝突するため）。
4. `localStorage` のキーは `mitsushioimo.v1.*` だけを使い、読み書きはすべて try/catch で囲む。フォームの入力内容は保存しない。
5. 表現のルール（データにもコードの固定文言にも適用する）
   - 宮古島は「日本最古のさつまいも伝来地」と表記する（「諸説あり」は付けない）。年表の本文は、旨屋の出来事を「〜と伝わる」の語り口で書く。
   - 芋の産地はコードに書かず、`site.json` の `ingredients.imo` から表示する（現在の値は「茨城県産」）。塩の産地は宮古島。「宮古島で育った芋」と誤認させる表現はしない。
   - 「原種は宮古島」「宮古島原産」とは書かない（芋そのものの産地の表示と誤解されるため）。
   - 揉み焼きは調理工程の説明にとどめ、健康効果・効能はうたわない。
   - 価格は税込の総額で表示する。
6. 完了したら `npm ci && npm run build` を実行し、下のチェックリストの確認結果を報告する。

## 参考にする既存実装
- `public/ryoshusho/index.html`：ビルドを通らない単体 HTML の前例。CSS 変数、Zen 系フォント、try/catch で囲んだ localStorage の書き方をこれにそろえる。
- `src/mailer.ts`：mailto の組み立て方。考え方だけ参考にする（import はできないので素の JS で書き直す）。
- 公開 URL：`https://<user>.github.io/thida-counseling-sheet/mitsushioimo/`。パスはすべて相対パス。
- 開発時の確認：`npm run dev` → `/mitsushioimo/index.html`

## ファイル構成
```
public/mitsushioimo/
  index.html        # 1ページLP。<script src="./app.js" defer>
  app.js            # 先頭に下記「データ型」を JSDoc @typedef で書く
  styles.css
  data/site.json    # ブランド文言・ヒーロー・雪塩・揉み焼き・原料・FAQ・連絡先・表記
  data/history.json # 年表（主役のセクション）
  data/menu.json    # 日本橋の店頭商品
  data/store.json   # 日本橋の店舗情報
  data/links.json   # 宮古島へ行こう（観光・ふるさと納税・雪塩・生産者・アクセス）
  img/logo.svg      # 仮ロゴ（筆文字風の文字＋金の焼き芋シルエット）
  img/imo-gold.svg  # 金色の焼き芋イラスト
  img/wave.svg      # 宮古ブルーの波線
  README.md         # 非エンジニア向けの JSON 更新手順と「表現のルール」
```

## 画面構成（1ページの縦スクロール、スマホ優先。確認幅 360 / 768 / 1120px）
| # | セクション | ID | 内容 |
|---|---|---|---|
| H | 固定ヘッダー | — | ロゴ、日本語/EN 切り替え、ナビ（768px 未満はハンバーガー。Esc で閉じる） |
| 1 | ヒーロー | `#top` | H1「宮古島 蜜塩芋」、小見出し「日本橋 蜜塩芋」、キャッチ、金の焼き芋、ボタン「日本橋の店舗へ」「宮古島の物語」、原料表示の帯「芋：{ingredients.imo} ／ 塩：{ingredients.salt}」（データから表示） |
| 2 | 芋のはじまりは宮古島 | `#history` | 年表 UI（詳細は下記） |
| 3 | 雪塩と地下海水 | `#salt` | 岩→水→塩の3ステップ。SVG の地層断面に宮古ブルーの水の層を描く |
| 4 | 揉み焼き技法 | `#momiyaki` | 工程カード3〜4枚と、効能をうたわない旨の注記 |
| 5 | 商品メニュー | `#menu` | 名前・説明・税込価格・単位・温度バッジ（冷やし/温/常温を文字で）・保存方法・アレルゲン・完売表示 |
| 6 | 店舗情報 | `#store` | 住所、アクセス、営業時間の表、定休日、支払い方法、`tel:`、Google マップへのリンク（iframe は使わない）、期間内のお知らせ。その下に、タブで「店頭取り置き `#reserve`」と「法人ギフトのお問い合わせ `#gift`」の2フォーム |
| 7 | 宮古島へ行こう | `#miyako` | カテゴリ別の外部リンクカード（`target=_blank rel=noopener`、外部リンクの表記つき） |
| 8 | FAQ | `#faq` | `<details>` で作る |
| F | フッター | — | 事業者名、連絡先、SNS、雪塩の商標表記、「入力情報はメールでのやり取りにのみ使います」、© |
| S | 下部固定 CTA | — | 768px 未満のときだけ。「店舗・営業時間」「取り置き」 |

### 年表 UI の要件
- `events` を `year` の昇順に並べる。スマホでは縦のタイムライン、広い画面では縦2列の千鳥配置。ページ全体に横スクロールを出さない。
- 各ノードに年（`yearDisplay` があればそちらを優先）、和暦、地名バッジ（region が miyako なら宮古ブルー、edo なら金、それ以外は muted）、人物、タイトル、本文を表示する。
- `highlight` のノードは金の枠で強調する。`certainty` はデータとして持つだけで、画面には出さない。disclaimer は空なら表示しない。
- ノードは IntersectionObserver で順番にフェードインさせる。`prefers-reduced-motion` のときは即時に表示する。
- コードに年号を書かない。すべて JSON から読む。

### フォーム（mailto）
- 宛先は `site.contact.email`。`encodeURIComponent` を使い、改行は `%0D%0A`。本文は「項目名：値」を1行ずつ並べ、末尾に `---`、ページ URL、言語、送信日時（JST）を付ける。本文は1,500文字以内、備考は500文字で切る。
- 取り置き：受取日は「今日＋`leadDays` 日」以降で14日先まで。受取時刻はその曜日の営業時間内を30分刻み。数量は `reservable && !soldOut` の商品が対象で、合計 `maxItems` 点まで。合計点数と合計金額をその場で表示する。氏名・電話・同意は必須。件名は `【取り置き】{M/D} {HH:mm} {name}様`。
- 法人ギフト：会社名・担当者名・メール・同意は必須。電話・希望納期・数量・予算・用途（select）・備考は任意。件名は `【法人ギフト】{company} {name}様`。
- 送信時に JS でもチェックする。エラーは `aria-describedby` で項目ごとに出し、最初のエラー項目にフォーカスを移す。全体のメッセージは `role="alert"`。送信後3秒間は再送信できないようにする。
- 送信後に「メールアプリが開かない場合」パネル（宛先・件名・本文の readonly textarea とコピーボタン）を表示する。
- メニューの「取り置きする」は `#reserve` へ移動してその商品の数量を1にする。「ギフトの相談」は `#gift` へ移動する。

## デザイン（現行ポスターに準拠）
- 黒基調の単一テーマ。`:root{color-scheme:dark}` を指定し、`body` に背景色を明示する。
- 色のトークン（`:root` の CSS 変数で定義する）
  - `--ink-bg:#0B0B0B` `--ink-surface:#161616` `--paper:#F4F1EA` `--muted:#A8A39A`
  - `--gold:#C9A24A` `--gold-strong:#E3BE62`
  - `--miyako:#1F8FB0` `--miyako-soft:#7FD0E6`
- 宮古ブルーはアクセントとしてだけ使う（年表の宮古島ノード、雪塩セクション、宮古島へ行こうのカード、フォーカスリング）。
- 見出しは筆文字風の Google Fonts「Yuji Syuku」（代替は「Zen Old Mincho」）で、**見出しだけ**に使う。本文は「Zen Kaku Gothic New」、英語は system-ui。
- ヒーローのキャッチは、768px 以上かつ日本語表示のときだけ縦書き（`writing-mode:vertical-rl`）にしてよい。
- コントラストは 4.5:1 以上。タップ領域は 44px 以上、本文は 16px 以上。`safe-area` に対応する。

## 日英対応
- 言語は `?lang=` → `localStorage["mitsushioimo.v1.lang"]` → `navigator.language` の順で決める。
- 切り替え時はページを再読み込みせずに再描画し、`<html lang>`・`title`・`meta description` を更新して、`history.replaceState` で URL の `?lang=` を書き換える。
- 固定の文言は `app.js` の `UI = {ja:{...}, en:{...}}` に置く。データの文言は `t()` で取り、英語がなければ日本語にフォールバックする。
- 価格は ja「600円（税込）」、en「¥600 (tax incl.)」と表示する。日付は `Intl` で `timeZone:"Asia/Tokyo"` を指定する。
- 英語表示のときは、英語ページのない外部リンク（`langAvailable` に en がないもの）に「(Japanese)」を付ける。

## データ型（app.js の先頭に JSDoc で写す）
```ts
type Lang = "ja" | "en";
type I18nText = { ja: string; en?: string };

interface SiteConfig {
  brandName: I18nText; parentBrand?: I18nText;
  hero: { catch: I18nText[]; lead: I18nText };
  salt: { title: I18nText; lead: I18nText; steps: { id: string; title: I18nText; body: I18nText }[]; trademarkNote?: I18nText };
  momiyaki: { title: I18nText; lead: I18nText; steps: { id: string; title: I18nText; body: I18nText }[]; disclaimer?: I18nText };
  ingredients: { imo: I18nText; salt: I18nText };
  contact: { email: string; instagram?: string; x?: string };
  legal: { operator: I18nText; address?: I18nText; note?: I18nText };
  faq: { q: I18nText; a: I18nText }[];
  siteUrl?: string;   // あるときだけ og:image を絶対 URL で出す
}

interface HistoryEvent {
  id: string; year: number; eraLabel?: I18nText; yearDisplay?: I18nText;
  place: I18nText; region: "miyako" | "okinawa" | "satsuma" | "edo" | "other";
  person?: I18nText; title: I18nText; body: I18nText;
  certainty: "tradition" | "documented"; sourceNote?: I18nText; highlight?: boolean;
}
interface History { title: I18nText; lead: I18nText; disclaimer: I18nText; events: HistoryEvent[] }

interface MenuItem {
  id: string; name: I18nText; description: I18nText; priceYen: number; unit?: I18nText;
  temperature?: "chilled" | "warm" | "ambient";
  tags?: ("signature" | "new" | "limited" | "seasonal" | "gift")[];
  allergens?: I18nText; storage?: I18nText;
  reservable: boolean; giftAvailable?: boolean; soldOut?: boolean; image?: string;
}
type Menu = { updatedAt: string; note?: I18nText; items: MenuItem[] };

interface Store {
  name: I18nText; address: I18nText; postalCode?: string; access: I18nText[]; mapUrl?: string; phone?: string;
  hours: { days: I18nText; open: string; close: string; note?: I18nText; weekdays: number[] }[]; // weekdays: 0=日〜6=土
  closedDays?: I18nText; notices?: { from?: string; to?: string; text: I18nText }[];
  payment?: I18nText[]; reservation: { cutoffNote: I18nText; maxItems: number; leadDays: number };
}

interface MiyakoLink {
  id: string; category: "tourism" | "furusato" | "producer" | "salt" | "access";
  title: I18nText; description?: I18nText; url: string; langAvailable?: Lang[];
}
type MiyakoLinks = { title: I18nText; lead: I18nText; links: MiyakoLink[] };
```

## 初期データ（すべて仮の値。店舗の住所・価格・URL・メールはダミーのままにする）

### history.json の初期値（表現を変えないこと）
| id | year | 表示 | place / region | person | title | body | certainty | highlight |
|---|---|---|---|---|---|---|---|---|
| miyako-1597 | 1597 | 1597年（慶長2年） | 宮古島 / miyako | 長真氏旨屋（砂川親雲上） ※読みは要確認 | 宮古島に伝わる | 中国から甘藷を持ち帰り、島に広めたと伝わる。日本で最初の伝来とされる。 | tradition | true |
| okinawa-1605 | 1605 | 1605年 | 沖縄本島 / okinawa | 野国総管 | 沖縄本島へ | 中国から沖縄本島へ伝えたとされる。のちに儀間真常が琉球に広めた。 | documented | |
| satsuma-1705 | 1705 | 1705年 | 薩摩 / satsuma | 前田利右衛門 | 薩摩へ | 琉球から薩摩へ持ち帰ったと伝わり、「さつまいも」の名につながる。 | tradition | |
| edo-1735 | 1735 | 1735年 | 江戸 / edo | 青木昆陽 | 江戸で栽培が広まる | 飢饉への備えとして関東で栽培が奨励されたとされる。 | documented | |
| edo-yakiimo | 1793 | 18世紀末ごろ | 江戸 / edo | — | 焼き芋が江戸の町へ | 江戸の町で焼き芋が売られ、親しまれるようになったとされる。 | tradition | |
| japan-now | 2025 | 現代 | 全国 / other | — | 全国の産地へ | 宮古島から始まったと伝わるさつまいもは、いま全国で育てられている。 | documented | |
| nihonbashi-now | 2026 | いま | 日本橋 / edo | — | 宮古島の塩と、日本橋で | 宮古島の雪塩と、選び抜いた国産の芋が、焼き芋の根づいた江戸の地でひとつに。 | documented | true |

- disclaimer：空（表示しない）
- 宮古島ノードの sourceNote：「国立国会図書館レファレンス協同データベースほか」
- 英語訳も付けること（`"is said to"` / `"according to tradition"` を使う）。

### site.json に入れる文言
- hero.catch：
  - 「1597年、宮古島に甘藷（さつまいも）が伝わったとされる。」
  - 「日本最古のさつまいも伝来地、宮古島。」
  - 「そして焼き芋は、江戸の町で愛された。」
- hero.lead：「宮古島の雪塩で仕上げる、日本橋の冷やし焼き芋。」（英語：Miyakojima, said to be the birthplace of the Japanese sweet potato — finished with its salt, roasted in Nihonbashi.）
- salt.steps：
  - 琉球石灰岩：サンゴ由来の岩が島をつくる。
  - 地下海水：石灰岩で濾過された地下の海水をくみ上げる。
  - 特殊製法：パウダー状の塩に仕上げる。
- salt.trademarkNote：「「雪塩」は株式会社宮古島の雪塩の商標です（表記は要確認）。」
- momiyaki.steps：選ぶ（その時期いちばんの国産ブランド芋）→ 揉む（整体の手技を応用し、繊維をやわらげる）→ 焼く → 冷やす・塩（仕上げに宮古島の雪塩）
- momiyaki.disclaimer：「※調理工程の説明であり、健康効果をうたうものではありません。」
- ingredients：芋「さつまいも（茨城県産）」※仕入れ先が変わったらここだけ書き換える／塩「雪塩（沖縄県宮古島産）」
- faq：「なぜ宮古島なのですか？」「芋はどこの産地ですか？（時期により国内の産地から選んでいる。現在は茨城県産。塩は宮古島産）」「なぜ宮古島の芋を使わないのですか？（沖縄の生のさつまいもは植物防疫法で県外に持ち出せないため）」「日持ちはしますか？」

### links.json の初期値
カテゴリごとに1件以上入れる（URL はダミーで、`TODO` と明記する）。
- tourism：宮古島観光協会
- furusato：宮古島市 ふるさと納税
- salt：雪塩ミュージアム
- producer：宮古島の生産者（準備中）
- access：宮古空港・みやこ下地島空港

## 受け入れチェックリスト
- [ ] `git diff --stat` に出るのが `public/mitsushioimo/**` だけ（＋任意で README）。
- [ ] `npm ci && npm run build` が成功し、`dist/mitsushioimo/` に HTML・JS・CSS・JSON 5つ・img ができている。
- [ ] `npm run preview` で、本体（カウンセリングシート）と `/ryoshusho/` が従来どおり動く。
- [ ] 幅 360・768・1280px で横スクロールやはみ出しがない。768px 未満ではハンバーガーと下部 CTA が出る。
- [ ] 本文と小さい金文字のコントラストが 4.5:1 以上。Lighthouse モバイルで Accessibility・Best Practices が 90 以上、Performance が 85 以上。
- [ ] history.json を書き換えると表示に反映される。年順に並ぶ。disclaimer が空なら何も出ない。reduced-motion のときはアニメーションしない。
- [ ] 「原種は宮古島」「宮古島原産」「宮古島産の芋」はどこにもない（芋の産地の誤認防止）。
- [ ] 芋の産地がコードに直接書かれていない（`ingredients.imo` を書き換えると、ページ全体の表示が変わる）。
- [ ] `?lang=en` で全体が英語になる（英語がない項目は日本語にフォールバック）。言語の選択が保持される。`<html lang>` と title が切り替わる。
- [ ] 完売表示と税込の注記が出る。「取り置きする」で `#reserve` に移動し、数量が1になる。
- [ ] 2つのフォームとも、必須項目が空だとエラーとフォーカス移動が起き、mailto は開かない。正しく入力すると仕様どおりの件名・本文（1,500 文字以内）で開き、送信後にコピー用パネルが出る。
- [ ] 期間内のお知らせだけが表示される（JST で判定）。
- [ ] JSON を1つ壊しても、そのセクションだけがエラー表示（再試行ボタン付き）になる。
- [ ] フォームの内容が localStorage に保存されていない。
- [ ] Tab キーだけで全体を操作できる（タブは矢印キーで移動、ドロワーは Esc で閉じる）。装飾画像は `aria-hidden`。
- [ ] `public/mitsushioimo/README.md` に JSON の更新手順と表現のルールが書かれている。

## 作らないもの
決済・EC・バックエンド・DB・管理画面・ログイン・LINE 連携・PWA・Service Worker・ライトテーマ・日英以外の言語・地図の埋め込み・アクセス解析・Cookie バナー・本体アプリからのリンク・キッチンカーのスケジュール・芋掘り体験の予約。
