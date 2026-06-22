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
- `[GreenBeans]`（グリーンビーンズ／食材・日用品宅配。アフィリンク未確定だが差し替え前提で送客に使用可）
- `[palsystem]`（パルシステム／食材・日用品宅配）

#### 宅配弁当・冷凍弁当
- `[lifemeal]`（ライフミール）
- `[DELIPICKS]`（DELIPICKS。afb案件）
- `[tsukurio]`（ツクリオ）
- `[MuscleDeli]`（マッスルデリ／Muscle Deli）
- `[wellness-dining]`（ウェルネスダイニング。【たんぱく質】【やわらか宅食】とも同一ショートコード）
- `[shokunosoyokaze]`（食のそよ風）
- `[nitireifoods]`（ニチレイフーズ お試し。service-info.md「ニチレイフーズダイレクト」と同一）

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
| GreenBeans | 食材・日用品宅配 | `[GreenBeans]` | `[GreenBeans_table]` | — | 未確定（定期申請中・差し替え前提） |
| パルシステム | 食材・日用品宅配 | `[palsystem]` | `[palsystem_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AZA43+A4NBM+HS+U3OCH |
| 食のそよ風 | 冷凍弁当 | `[shokunosoyokaze]` | `[shokunosoyokaze_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+5WK102+5JJC+5YJRM |
| ニチレイフーズ（お試し） | 冷凍弁当 | `[nitireifoods]` | `[nitireifoods_table]` | — | https://px.a8.net/svt/ejp?a8mat=4AV10L+8G8MRE+4SIA+5Z6WX |

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
| ニチレイフーズ（お試し） | `[nitireifoods_table]` |

#### 使用例

```
<h3>1.Dr.つるかめキッチン</h3>
[Dr.ツルガメキッチン_table]

<strong>Dr.つるかめキッチンは、管理栄養士が献立設計に関与した冷凍宅配弁当です。</strong>

（以下、紹介文）

[Dr.ツルガメキッチン]
```

#### 注意

- 上記リストに**ない**サービス（オイシエ・nosh・三ツ星ファーム・まごころケア食・食宅便・わんまいる など）は画像＋テーブルを直書きする（service-info.md からコピペ）
- まごころケア食は株式会社シルバーライフが運営するが、`[lifemeal_table]` は**別ブランド「ライフミール」用**。まごころケア食には適用しない
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

記述例（[btn]はPost Snippets未登録サービスのみ。パルシステム・食のそよ風・ニチレイ等は専用ショートコードに移行済み）:
```
[btn href="https://magokoro-care-shoku.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]まごころケア食の公式サイトはこちら[/btn]
```

## 4. CTA配置ルール

- 訴求社: ショートコードをサービス紹介文の最終行に配置
- 非訴求社: [btn]ショートコードをサービス紹介文の最終行に配置
- **訴求社のCTA直前のstrong価格訴求文は任意（具体的な価格・割引があるときのみ。情報の薄い決まり文句は置かない）**
- **非訴求社のCTA直前にはstrong価格訴求文を入れない**
- テーブルや紹介本文の途中には入れない
- 1サービスにつきCTAは1つのみ
- 「＼〜／」装飾のキャッチコピー行は使用しない

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
| 上記以外すべて | 非訴求社 | `[btn]`（rel="nofollow"付き） |
