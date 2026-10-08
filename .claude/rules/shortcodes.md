# ショートコード・HTMLテンプレート仕様

## 1. 訴求サービス用ショートコード（4社）

| サービス名 | ショートコード |
|-----------|-------------|
| Oisix（オイシックス） | `[Oisix]` |
| ヨシケイ | `[ヨシケイ]` |
| らでぃっしゅぼーや | `[ラディッシュボーヤ]` |
| コープデリ | `[コープデリ]` |

**注意:**
- ショートコード内のテキストは上記の通り正確に記述。表記揺れ不可
- 「ラディッシュボーヤ」はカタカナ表記（サービス名「らでぃっしゅぼーや」とは異なる）
- サービス紹介文の最終行（CTAボタン位置）に単独で配置
- 1サービスにつきショートコード1つ

## 2. Post Snippets登録済みショートコード

### 宅配弁当記事用
- `[Dr.ツルガメキッチン]`
- `[筋肉食堂DELI]`
- `[watamidirect]`（ワタミの宅食ダイレクト）
- `[Meals]`
- `[タイヘイ]`

### ワタミの宅食用
- `[ワタミ]`
  - class属性: 「raised accent-bc strong」
  - リンク先: https://www.super-yamadai.co.jp/article/lp-watami-takushoku
  - あっ！とごはん・PAKU MOGUには使用しない

### 追加登録分（2026-06・送客用CTAショートコード）

定期申請が通り Post Snippets に登録済みの送客用ショートコード。**従来 [btn] で出していたサービスも、登録済みのものは [btn] ではなくショートコードを使う。**

#### 食材宅配
- `[sakanototyu_vegetable]`（坂ノ途中 お野菜セット定期宅配）
- `[GreenBeans]`（グリーンビーンズ／食材・日用品宅配。A8案件・2026-09-17 提携。`[GreenBeans_table]` は 2026-09-24 登録）
- `[palsystem]`（パルシステム／食材・日用品宅配）
- `[pakumogu]`（PAKU MOGU／ミールキット。**afb案件・PID.15087**・2026-10-01 登録。リンクは特単メディア様限定LPの個別リンク）
- `[attogohan]`（あっ！とごはん／ミールキット。**afb案件・PID.15089**・2026-10-01 登録。同上）

#### 宅配弁当・冷凍弁当
- `[lifemeal]`（ライフミール）
- `[DELIPICKS]`（DELIPICKS。afb案件）
- `[tsukurio]`（ツクリオ）
- `[MuscleDeli]`（マッスルデリ／Muscle Deli）
- `[wellness-dining]`（ウェルネスダイニング。【たんぱく質】【やわらか宅食】とも同一ショートコード）
- `[shokunosoyokaze]`（食のそよ風）
- `[nitireifoods]`（ニチレイフーズダイレクト／きくばりごぜん。2026-09-09 新規提携で訴求社化。**`[nitirei]` はWordPressに存在しない**（2026-09-28 Post Snippets一覧で確認）。A8リンクは2026-09-28にヤマダイ用（013）へ差し替え済み）
- `[MITSUBOSHI]`（三ツ星ファーム。afb案件・2026-08 登録）
- `[magokorokea]`（まごころケア食。**link-A案件**・2026-09-08 登録。運営は株式会社シルバーライフで `[lifemeal]` のライフミールと同じ会社だが別ブランド）
- `[健康直球便]`（健康直球便。**A8案件・サイトID 013「スーパーヤマダイ」**・2026-09-25 登録）

#### ウォーターサーバー（登録予定・2026-10-08）

**WordPress の Post Snippets には、まだ登録していない。** 記事「ウォーターサーバー おすすめ」（`articles/ウォーターサーバー おすすめ/article.html`）は、下の名前で書いてある。**この名前を正として、あとから Post Snippets に登録する**（Manabuさん指示 2026-10-08）。登録するまで、WordPress に貼ると `[every-frecious]` などの文字がそのまま表示される。ASPのアフィリエイトURLは未取得（2026-10-08時点）。

| サービス | CTA | _table | 記事内のID |
|---|---|---|---|
| エブリィフレシャス | `[every-frecious]` | `[every-frecious_table]` | 1a |
| Locca | `[locca]` | `[locca_table]` | 2a |
| コスモウォーター | `[cosmowater]` | `[cosmowater_table]` | 3a |
| フレシャス | `[frecious]` | `[frecious_table]` | 4a |
| プレミアムウォーター | `[premium-water]` | `[premium-water_table]` | 5a |
| クリクラ | `[crecla]` | `[crecla_table]` | 6a |
| ウォータースタンド ピュアライフ | `[purelife]` | `[purelife_table]` | 7a |
| ハミングウォーター | `[hummingwater]` | `[hummingwater_table]` | 8a |
| しずくりあ | `[shizuclear]` | `[shizuclear_table]` | 9a |

`_table` の中身（画像＋5行の表）は `articles/ウォーターサーバー おすすめ/official-facts.md` の機種・料金・解約金から作る。

#### 登録済みショートコード マスター一覧（差し替え用リファレンス）

ショートコードの差し替えはWordPress側のPost Snippetsで行う（記事側はショートコード文字列のみ配置）。アフィリURLはリファレンス用。

| サービス | カテゴリ | CTAショートコード | _tableショートコード | LP（スラッグ） | アフィリURL |
|---|---|---|---|---|---|
| Oisix | 食材宅配 | `[Oisix]` | `[Oisix_table]` | lp-oisix | https://px.a8.net/svt/ejp?a8mat=4AV10K+4BZUJ6+3RK+2TP9K1 |
| コープデリ（お試し） | 食材宅配 | `[コープデリ]` | `[コープデリ_table]` | lp-coopdeli | https://px.a8.net/svt/ejp?a8mat=4AV10K+49M442+NJ8+NZ4J5 |
| ヨシケイ | 食材宅配 | `[ヨシケイ]` | `[ヨシケイ_table]` | lp-yoshikei | https://px.a8.net/svt/ejp?a8mat=4AV10K+4HCQZ6+1QM6+HZAGY |
| らでぃっしゅぼーや | 食材宅配 | `[ラディッシュボーヤ]` | `[ラディッシュボーヤ_table]` | lp-radishbo-ya | https://px.a8.net/svt/ejp?a8mat=4AV10K+4GRBDE+1YGO+1ZMNSH |
| Dr.ツルガメキッチン | 冷凍弁当 | `[Dr.ツルガメキッチン]` | `[Dr.ツルガメキッチン_table]` | lp-tsurukame-kitchen | https://px.a8.net/svt/ejp?a8mat=4AV10L+69NKB6+48GW+5ZMCH |
| 宅配弁当Meals | 冷凍弁当 | `[Meals]` | `[Meals_table]` | lp-meals | https://px.a8.net/svt/ejp?a8mat=4AV10L+64ANV6+53KW+601S1 |
| 宅配弁当のタイヘイ | 冷凍弁当 | `[タイヘイ]` | `[タイヘイ_table]` | lp-taihei | https://px.a8.net/svt/ejp?a8mat=4AV10L+4J51SI+4OFW+5Z6WY |
| ワタミの宅食 | 冷凍弁当 | `[ワタミ]` | `[ワタミ_table]` | lp-watami-takushoku | https://px.a8.net/svt/ejp?a8mat=4AV10L+8HFNDE+4YX4+62MDD |
| 筋肉食堂DELI | 冷凍弁当 | `[筋肉食堂DELI]` | `[筋肉食堂DELI_table]` | lp-kinnikushokudo | https://px.a8.net/svt/ejp?a8mat=4AVBW6+ECSJ4I+4R6I+5YRHE |
| ワタミの宅食ダイレクト | 冷凍弁当 | `[watamidirect]` | `[watamidirect_table]` | lp-watami-direct | https://px.a8.net/svt/ejp?a8mat=4AV10L+4FKG5U+3YYE+BXIYP |
| ライフミール | 冷凍弁当 | `[lifemeal]` | `[lifemeal_table]` | lp-life-meal | https://px.a8.net/svt/ejp?a8mat=4B1MHP+4A7JPU+5U5U+5Z6WX |
| ウェルネスダイニング（やわらかダイニング） | 冷凍弁当 | `[wellness-dining]` | `[wellness-dining_table]` | lp-wellness-dining | https://px.a8.net/svt/ejp?a8mat=4B1XE2+3ZHQTU+30S4+BY641 |
| 坂ノ途中 お野菜セット定期宅配 | 食材宅配 | `[sakanototyu_vegetable]` | `[sakanototyu_vegetable_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AXKC9+A36P1U+3QQK+5Z6WY |
| ツクリオ | 宅配弁当 | `[tsukurio]` | `[tsukurio_table]` | — | https://px.a8.net/svt/ejp?a8mat=4B1MHP+78S502+59UQ+65ME9 |
| マッスルデリ（Muscle Deli） | 冷凍弁当 | `[MuscleDeli]` | `[MuscleDeli_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+6P4U1E+4CPY+5YRHE |
| DELIPICKS | 冷凍弁当 | `[DELIPICKS]` | `[DELIPICKS_table]` | — | https://t.afi-b.com/visit.php?a=613560P-N449760f&p=O982170a |
| GreenBeans | 食材・日用品宅配 | `[GreenBeans]` | `[GreenBeans_table]` | — | https://px.a8.net/svt/ejp?a8mat=4BCDBG+E2O5UA+59TM+5YRHE |
| パルシステム | 食材・日用品宅配 | `[palsystem]` | `[palsystem_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AZA43+A4NBM+HS+U3OCH |
| 食のそよ風 | 冷凍弁当 | `[shokunosoyokaze]` | `[shokunosoyokaze_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+5WK102+5JJC+5YJRM |
| ニチレイフーズダイレクト（きくばりごぜん） | 冷凍弁当 | `[nitireifoods]` | `[nitireifoods_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+8G8S5U+4SIA+5Z6WX （ヤマダイ013用。2026-09-28にクラダシ006用 `8G8MRE` から差し替え） |
| 三ツ星ファーム | 冷凍弁当 | `[MITSUBOSHI]` | `[MITSUBOSHI_table]` | lp-mitsuboshifarm | https://t.afi-b.com/visit.php?a=O12865f-v428311E&p=O982170a |
| まごころケア食 | 冷凍弁当 | `[magokorokea]` | `[magokorokea_table]` | — | https://cl.link-ag.net/click/710df2/93216012 |
| 健康直球便 | 冷凍弁当 | `[健康直球便]` | `[健康直球便_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+8FNCK2+5E7E+5YJRM |
| PAKU MOGU（パクモグ） | ミールキット | `[pakumogu]` | `[pakumogu_table]` | — | https://t.afi-b.com/visit.php?a=r15087P-a539014e&p=O982170a （afb・個別リンク。2026-10-01 に旧 `a=r15087P-0493309k` から差し替え） |
| あっ！とごはん | ミールキット | `[attogohan]` | `[attogohan_table]` | — | https://t.afi-b.com/visit.php?a=215089z-q5390153&p=O982170a （afb・個別リンク。2026-10-01 に旧 `a=215089z-n4933145` から差し替え） |
| nosh（ナッシュ） | 冷凍弁当 | （未登録＝[btn] で公式サイトへ直リンク） | `[nosh_table]` | — | （ASPのリンク未指定。非訴求社扱い。2026-10-02 に `_table` のみ登録・snippet ID 61） |

> LP列は `https://www.super-yamadai.co.jp/article/` 配下のスラッグ。`—` はLP未指定。
> コープデリは「お試し」案件のショートコードのみ登録（`[コープデリ]`）。
> カテゴリ別の基本ランキングは `appeal-ranking.md` を参照。

**注意:**
- Post Snippetsに未登録のサービスは[btn]ショートコードを使用
- 下記の登録済みリストにないサービスは存在しないものとして扱う（推測でショートコードを作らない）

### 画像＋テーブル一括ショートコード（_table版）

サービス紹介H3直下の画像（`<img>`）とサービス紹介テーブル（`<table>` 5行）をまとめて呼び出すショートコード。登録済みサービスでは**画像＋テーブルを直書きせず必ずショートコードを使う**。

| サービス | _tableショートコード |
|---|---|
| Oisix（オイシックス） | `[Oisix_table]` |
| コープデリ | `[コープデリ_table]` |
| ヨシケイ | `[ヨシケイ_table]` |
| らでぃっしゅぼーや | `[ラディッシュボーヤ_table]` |
| Dr.つるかめキッチン | `[Dr.ツルガメキッチン_table]` |
| Meals（ミールズ） | `[Meals_table]` |
| タイヘイ | `[タイヘイ_table]` |
| ワタミの宅食 | `[ワタミ_table]` |
| 筋肉食堂DELI | `[筋肉食堂DELI_table]` |
| ワタミの宅食ダイレクト | `[watamidirect_table]` |
| ライフミール（lifemeal） | `[lifemeal_table]` |
| ウェルネスダイニング（やわらかダイニング） | `[wellness-dining_table]` |
| 坂ノ途中 お野菜セット定期宅配 | `[sakanototyu_vegetable_table]` |
| ツクリオ | `[tsukurio_table]` |
| マッスルデリ（Muscle Deli） | `[MuscleDeli_table]` |
| DELIPICKS | `[DELIPICKS_table]` |
| GreenBeans（グリーンビーンズ） | `[GreenBeans_table]` |
| パルシステム | `[palsystem_table]` |
| 食のそよ風 | `[shokunosoyokaze_table]` |
| ニチレイフーズダイレクト（きくばりごぜん） | `[nitireifoods_table]` |
| 三ツ星ファーム | `[MITSUBOSHI_table]` |
| まごころケア食 | `[magokorokea_table]` |
| 健康直球便 | `[健康直球便_table]` |
| PAKU MOGU（パクモグ） | `[pakumogu_table]` |
| あっ！とごはん | `[attogohan_table]` |
| nosh（ナッシュ） | `[nosh_table]` |

#### 使用例

```
<h3>1.Dr.つるかめキッチン</h3>
[Dr.ツルガメキッチン_table]

<strong>Dr.つるかめキッチンは、管理栄養士が献立設計に関与した冷凍宅配弁当です。</strong>

（以下、紹介文）

[Dr.ツルガメキッチン]
```

#### 注意

- 上記リストに**ない**サービス（オイシエ・食宅便・わんまいる など）は画像＋テーブルを直書きする（service-info.md からコピペ）
- **nosh（ナッシュ）は `[nosh_table]` を使う**（2026-10-02 登録）。CTAのスニペット `nosh` は未登録（ASPのリンクが未指定）なので、CTAは `[btn href="https://nosh.jp/" …]` のまま
- まごころケア食と**ライフミールはどちらも株式会社シルバーライフの運営だが別ブランド**。`[lifemeal]`/`[lifemeal_table]` はライフミール用、`[magokorokea]`/`[magokorokea_table]` はまごころケア食用で、取り違えない
- ライフミール（lifemeal）はシルバーライフの20〜30代向け新ブランド

## 3. 非訴求サービス用ボタンショートコード

```
[btn href="URL" class="raised main-bc strong" target="_blank" rel="nofollow"]テキスト[/btn]
```

| 属性 | 値 | 注意 |
|------|---|------|
| href | 各サービスの公式サイトURL | Googleパラメータ（?gad_campaignid=等）を付けない |
| class | `raised main-bc strong` | 固定。変更不可 |
| target | `_blank` | 固定 |
| rel | `nofollow` | 必須。省略不可 |
| テキスト | 「○○の公式サイトはこちら」 | 統一形式 |

記述例（[btn]はPost Snippets未登録サービスのみ。パルシステム・食のそよ風・ニチレイ・まごころケア食等は専用ショートコードに移行済み）:
```
[btn href="https://shokutakubin.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]食宅便の公式サイトはこちら[/btn]
```

## 4. CTA配置ルール

- 訴求社: ショートコードをサービス紹介文の最終行に配置
- 非訴求社: [btn]ショートコードをサービス紹介文の最終行に配置
- **アフィリンク（ASPのURL）を [btn] に直接入れるときは、訴求社でも `rel="nofollow"` を付ける**（2026-09-29 Manabuさん決定）。形は `[btn href="アフィリンク" class="raised accent-bc strong" rel="nofollow"]〇〇の公式サイトはこちら[/btn]`（targetなし。例：記事450・375のPAKU MOGU・あっ！とごはん＝afb）。公式サイトへの直リンク（オイシエなど）は `service-info.md` の各項に従う
- **訴求社のCTA直前のstrong価格訴求文は任意（具体的な価格・割引があるときのみ。情報の薄い決まり文句は置かない）**
- **非訴求社のCTA直前にはstrong価格訴求文を入れない**
- テーブルや紹介本文の途中には入れない
- 1サービスにつきCTAは1つのみ
- 「＼〜／」装飾のキャッチコピー行は使用しない
- **ボタンの矢印（▶︎＝別ページへ遷移／▼＝ページ内へ遷移）は、本文のボタン文言に書かない。** サイトの追加CSS（Customizer。`ARROW-RULE:START`〜`END` のブロック）が、リンク先から自動で付ける（`href` が `#` で始まれば ▼、それ以外は ▶︎。2026-10-06 導入・公開85記事のボタン1,854個に適用）。文言に ▼ ▶︎ を直接書くと二重表示になる。`[btn]` の文言・FVランキング欄の「詳細を見る」「公式サイト」・Post Snippets のCTAのすべてが対象。根拠と実測は Obsidian `Knowledge/andmedia-toc-button-arrow-rule.md`

## 5. サービス紹介テーブルテンプレート

```html
<table style="width: 100%;">
<tbody>
<tr>
<th style="width: 25.8158%;">会社</th>
<td style="width: 74.1117%;">{運営会社名}</td>
</tr>
<tr>
<th style="width: 25.8158%;">費用</th>
<td style="width: 74.1117%;">{お試し価格・定期価格・送料情報（税込）}</td>
</tr>
<tr>
<th style="width: 25.8158%;">配送エリア</th>
<td style="width: 74.1117%;">{全国 or 地域限定（具体的な都道府県名）。除外条件も併記}</td>
</tr>
<tr>
<th style="width: 25.8158%;">配送日時の設定</th>
<td style="width: 74.1117%;">{指定可否、頻度、置き配対応の有無}</td>
</tr>
<tr>
<th style="width: 25.8158%;">{お試しの有無 or お試し内容}</th>
<td style="width: 74.1117%;">{内容}</td>
</tr>
</tbody>
</table>
```

**テーブルは5行固定。** 項目の増減不可。

**3列以上の本文の表は、全セル（th・td）に `style="width: N%;"` を付け、列の合計を100%にする**（writing-manual §0 0-16）。
5行目のthは記事テーマに応じて使い分ける:
- 総合比較記事 → 「お試しの有無」
- お試し特化記事 → 「お試し内容」

## 6. 画像タグテンプレート

```html
<img class="size-full wp-image-XXX aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/YYYY/MM/filename.jpg" alt="" width="800" height="XXX" />
```

- 各H2直下に配置
- H3直下はサービス紹介のみ
- alt: 空文字（alt=""）
- width: 800固定

## 7. 訴求社・非訴求社の判定

| サービス名 | 区分 | CTA形式 |
|-----------|------|---------|
| Oisix（オイシックス） | 訴求社 | `[Oisix]` |
| ヨシケイ | 訴求社 | `[ヨシケイ]` |
| らでぃっしゅぼーや | 訴求社 | `[ラディッシュボーヤ]` |
| コープデリ | 訴求社 | `[コープデリ]` |
| 三ツ星ファーム | 訴求社（afb・2026-08〜） | `[MITSUBOSHI]` |
| まごころケア食 | 訴求社（link-A・2026-09〜） | `[magokorokea]` |
| ニチレイフーズダイレクト | 訴求社（2026-09-09〜） | `[nitireifoods]` |
| 健康直球便 | 訴求社（A8・サイトID 013・2026-09-25〜） | `[健康直球便]` |
| PAKU MOGU | 訴求社（afb・特単8,500円・2026-09-28〜） | `[pakumogu]` |
| あっ！とごはん | 訴求社（afb・特単8,500円・2026-09-28〜） | `[attogohan]` |
| 上記以外すべて | 非訴求社 | `[btn]`（rel="nofollow"付き） |
