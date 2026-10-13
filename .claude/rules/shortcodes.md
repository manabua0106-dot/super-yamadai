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

#### 口コミあり版（ランキング1〜5位・商標記事の目次上のCTA用）

会社ごとに、口コミなし `[X]`（従来）と口コミあり `[X_kuchikomi_slide]` を持つ（2026-10-09〜13 作成）。`[X]` は書き換えない。口コミ枠は「Xの埋め込み2件の横スライド → CTA」の順で、1ページに何本入ってもCSS・スクリプトは1回だけ動く。ボタンは `[btn]` ではなく独自の `a.cm-main`・`a.cm-sub`（見た目は元のボタンに近いが、角丸・矢印などが少し違う）。

| 会社 | 口コミなし（従来） | 旧・戻し用（CTA→口コミ→CTA） | 現行（口コミ横スライド→CTA） |
|---|---|---|---|
| ライフミール | `[lifemeal]` | `[lifemeal_kuchikomi]`（ID 64） | `[lifemeal_kuchikomi_slide]`（ID 69） |
| ワタミの宅食ダイレクト | `[watamidirect]` | `[watamidirect_kuchikomi]`（ID 65） | `[watamidirect_kuchikomi_slide]`（ID 70） |
| ウェルネスダイニング | `[wellness-dining]` | `[wellness-dining_kuchikomi]`（ID 66） | `[wellness-dining_kuchikomi_slide]`（ID 71） |
| ワタミの宅食 | `[ワタミ]` | `[ワタミ_kuchikomi]`（ID 67） | `[ワタミ_kuchikomi_slide]`（ID 72） |
| 筋肉食堂DELI | `[筋肉食堂DELI]` | `[筋肉食堂DELI_kuchikomi]`（ID 68） | `[筋肉食堂DELI_kuchikomi_slide]`（ID 73） |
| ヨシケイ | `[ヨシケイ]` | — | `[ヨシケイ_kuchikomi_slide]`（ID 74） |
| コープデリ | `[コープデリ]` | — | `[コープデリ_kuchikomi_slide]`（ID 75） |
| Oisix | `[Oisix]` | — | `[Oisix_kuchikomi_slide]`（ID 76） |
| らでぃっしゅぼーや | `[ラディッシュボーヤ]` | — | `[ラディッシュボーヤ_kuchikomi_slide]`（ID 77） |
| 坂ノ途中 | `[sakanototyu_vegetable]` | — | `[sakanototyu_vegetable_kuchikomi_slide]`（ID 78） |
| Green Beans | `[GreenBeans]` | — | `[GreenBeans_kuchikomi_slide]`（ID 79） |
| パルシステム | `[palsystem]` | — | `[palsystem_kuchikomi_slide]`（ID 80） |
| PAKU MOGU | `[pakumogu]` | — | `[pakumogu_kuchikomi_slide]`（ID 81） |
| あっ！とごはん | `[attogohan]` | — | `[attogohan_kuchikomi_slide]`（ID 82） |
| ツクリオ | `[tsukurio]` | — | `[tsukurio_kuchikomi_slide]`（ID 83） |
| Dr.つるかめキッチン | `[Dr.ツルガメキッチン]` | — | `[Dr.ツルガメキッチン_kuchikomi_slide]`（ID 84） |
| 三ツ星ファーム | `[MITSUBOSHI]` | — | `[MITSUBOSHI_kuchikomi_slide]`（ID 85） |
| DELIPICKS | `[DELIPICKS]` | — | `[DELIPICKS_kuchikomi_slide]`（ID 86） |
| マッスルデリ | `[MuscleDeli]` | — | `[MuscleDeli_kuchikomi_slide]`（ID 87） |
| 宅配弁当Meals | `[Meals]` | — | `[Meals_kuchikomi_slide]`（ID 88） |
| 楽天マート | （記事に直書きの公式サイトボタン） | — | `[楽天マート_kuchikomi_slide]`（ID 89） |
| わんまいる | （記事に直書きの公式サイトボタン） | — | `[わんまいる_kuchikomi_slide]`（ID 90） |

- 使い分けは `appeal-ranking.md`「5位以内に入る会社が変わるとき」。
- 口コミの本文（Xの実在の公開投稿）は、スニペットの中に入っている。投稿は消える・非公開になることがあるので、定期的に表示を確認する。
- 宅配弁当のタイヘイ（`[タイヘイ_kuchikomi_slide]`・ID 91）：3年以内の好意的な個人投稿が無く、2021年の投稿2件で用意した（記事には未反映。1〜5位に入る記事ができたら、新しい投稿を探し直してから使う）。
- 未作成：オイシエの宅配弁当（1〜5位に入る記事が無い・案件の疑いがある投稿のみ）。
- 楽天マート・わんまいるは提携外の公式サイトボタンのため、枠線のボタン（`cm-sub`）1つだけ。記事656（楽天マート）・157（わんまいる）では、記事に直書きだった公式サイトの `[btn]` をこの口コミ版に置き換えた（2026-10-13）。
- **⚠ 前方一致の落とし穴**：記事に未登録のタグ（例：`[ワタミダイレクト]`。登録済みは `[watamidirect]`）があり、同じ記事に `[ワタミ]` もあるとき、WordPressは `[ワタミダイレクト]` を `[ワタミ]` ＋ 文字「ダイレクト]」として読む。記事内の `[ワタミ]` を**すべて** `[ワタミ_kuchikomi_slide]` に置き換えると、`[ワタミダイレクト]` が文字のまま表示される。置き換える前に、記事内の未登録タグが置き換え対象のタグ名で始まっていないかを確かめる。記事671・762はこの理由でワタミの置き換えを見送った（2026-10-13時点。公開ページで文字のままの `[ワタミダイレクト]` は0件）。
- **口コミ枠が入っていない記事**（2026-10-13時点・規則どおりの位置を判定ロジックで確かめた結果）：
  - 記事1296（食のそよ風）・1315（健康直球便）・1327（まごころケア食）：規則の位置は「目次の上の最初のCTA」の1か所だけで、その会社の口コミあり版が未作成のため入っていない（CTA本体 `[shokunosoyokaze]`・`[健康直球便]`・`[magokorokea]` はある）。口コミあり版を作れば入れられる
  - 記事546：本文のCTAが `[X]` ではなく `[X_table]` とおすすめ枠（`fv-rank_btn` のボタン）で組まれており、規則の位置が0件。入れるなら、先にCTAを `[X]` に置き換える

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
