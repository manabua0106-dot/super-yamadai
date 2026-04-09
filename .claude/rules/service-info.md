# サービス情報マスターデータ

**⚠️ このファイルが唯一の正（Single Source of Truth）。**
- writerはサービス紹介のテーブル・画像・CTAをこのファイルからコピペする
- 外部サイトや記憶から情報を補完しない。このファイルに載っていない情報は書かない
- 価格・送料・エリア等が変わった場合はこのファイルを先に更新してから執筆する
- このファイルに未登録のサービスが依頼情報に含まれている場合は、Manabuさんに確認する

**訴求順位は固定ではない。毎記事の依頼情報（構成書）でManabuさんが指定する。** このファイルの番号はサービスの管理番号であり、訴求順位ではない。掲載順序・訴求順位は必ず依頼情報に従う。

---

## 📌 重要：_tableショートコード（2026年3月〜の新ルール）

一部サービスは`[サービス名_table]`ショートコード1つで画像＋テーブルが自動挿入される形に変更された。ASPからの画像差し替え依頼にも自動対応できるよう、ショートコード内に最新の画像URLが埋め込まれている。

### 新しい記事の書き方

```html
<h3>1.サービス名</h3>
[サービス名_table]
（説明文章を3〜5段落で手入力）
[サービス名]
```

- `[サービス名_table]` が画像＋テーブルを自動挿入（以前は手入力していた部分）
- 説明文章は従来通り手入力
- CTA `[サービス名]` も従来通り手入力
- ⚠️ 手動で画像・表のHTMLを書かない。常にショートコード方式を優先する

### _tableショートコード登録済みサービス（11社・2026年3月時点）

| サービス名 | _tableショートコード | CTAショートコード |
|-----------|-------------------|-----------------|
| Oisix | `[Oisix_table]` | `[Oisix]` |
| ヨシケイ | `[ヨシケイ_table]` | `[ヨシケイ]` |
| らでぃっしゅぼーや | `[ラディッシュボーヤ_table]` | `[ラディッシュボーヤ]` |
| コープデリ | `[コープデリ_table]` | `[コープデリ]` |
| Dr.つるかめキッチン | `[Dr.ツルガメキッチン_table]` | `[Dr.ツルガメキッチン]` |
| 筋肉食堂DELI | `[筋肉食堂DELI_table]` | `[筋肉食堂DELI]` |
| ワタミの宅食 | `[ワタミ_table]` | `[ワタミ]` |
| Meals | `[Meals_table]` | `[Meals]` |
| タイヘイ | `[タイヘイ_table]` | `[タイヘイ]` |
| ワタミの宅食ダイレクト | `[ワタミダイレクト_table]` | `[ワタミダイレクト]` |

### _tableショートコード未登録サービス（従来通り手動HTML）

以下のサービスは`_table`ショートコードが未実装のため、従来通り本ファイルから**テーブルHTML・画像HTMLを手動でコピペ**して記事に貼る。

- **訴求社**: オイシエ
- **非訴求社**: nosh / 三ツ星ファーム / 食宅便 / ニチレイフーズダイレクト / まごころケア食 / ウェルネスダイニング / わんまいる / 食のそよ風 / ライフミール

---

## 訴求社

### 1. Dr.つるかめキッチン【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[Dr.ツルガメキッチン_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: 株式会社クロスエッジ
- 費用: 定期1食約730〜787円（税込・送料無料）、都度購入は送料770円
- 配送エリア: 全国（一部離島を除く）
- 配送日時の設定: 日時指定可、1週〜1か月ごとの配送頻度を選択、ヤマトクール冷凍便
- お試しの有無: なし（定期コースは通常価格から28%OFF・送料無料）

**CTA:** `[Dr.ツルガメキッチン]`
**strong 1文目の方向性:** 管理栄養士が献立設計に関与した冷凍宅配弁当（監修者情報は公式サイト参照）
**比較テーブル用単価:** 約730円〜
**法令セーフ注意:** 「専門医の指導のもと」「管理栄養士が監修」はCLAUDE.md #18の#1・#2に該当。執筆時は必ず変換する。

---

### 2. 筋肉食堂DELI【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[筋肉食堂DELI_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: 株式会社TANPAC
- 費用: 1食約994円〜（税込・ローカーボ21食の場合）、送料1,640円〜（地域別・割引条件は公式サイトで要確認）
- 配送エリア: 全国（一部離島を除く）
- 配送日時の設定: 日時指定可、スキップ可、ヤマトクール冷凍便
- お試しの有無: なし（ベーシック7食が初回30%OFF＝5,292円・1食756円）

**CTA:** `[筋肉食堂DELI]`
**strong 1文目の方向性:** 高たんぱく・低脂質に特化した冷凍宅配弁当
**比較テーブル用単価:** 994円〜

---

### 3. ワタミの宅食【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[ワタミ_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: ワタミ株式会社
- 費用: 1食590〜790円（税込・送料無料・自社配送）、初回20%OFF時472円〜
- 配送エリア: 北海道・青森・岩手・秋田・鳥取・沖縄を除く全国（一部対象外あり・郵便番号検索で要確認）
- 配送日時の設定: 毎日手渡し（まごころスタッフ）、置き配対応（鍵付きボックス無料貸出）
- お試しの有無: 初回20%OFF（1世帯1回限り）

**CTA:** `[ワタミ]`
**strong 1文目の方向性:** 冷蔵の宅配弁当を毎日届けてくれる（冷蔵なので「冷凍宅配弁当」は使わない）
**比較テーブル用単価:** 590円〜

---

### 4. Meals（ミールズ）【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[Meals_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: 株式会社エブリー（DELISH KITCHENプロデュース）
- 費用: 1食696〜927円（税込）、送料990円〜（食数別：7〜14食990円、21食1,190円、28食1,690円）
- 配送エリア: 全国（ヤマトまたは佐川）
- 配送日時の設定: 1〜3週ごと選択可
- お試しの有無: なし（全セット初回1,000円OFF・7食5,490円・1食約784円）

**CTA:** `[Meals]`
**strong 1文目の方向性:** DELISH KITCHENがプロデュースした冷凍宅配弁当
**比較テーブル用単価:** 696円〜

---

### 5. タイヘイ【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[タイヘイ_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: タイヘイ株式会社
- 費用: ヘルシー御膳1食約783円〜（税込・7食セットの場合）、定期購入は送料無料、都度購入は送料715円〜
- 配送エリア: 全国（一部離島を除く）
- 配送日時の設定: 日時指定可、5〜28日ごと選択可
- お試しの有無: なし

**CTA:** `[タイヘイ]`
**strong 1文目の方向性:** 定期購入で送料無料になる冷凍宅配弁当
**比較テーブル用単価:** 約783円〜

---

### 6. オイシエ【訴求社・依頼情報の番号に従う】

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社オイシエ</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食690円〜（バリュー）、スタンダード780円〜、プレミアム980円〜（税込・送料別）、送料900円〜（地域別）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島等を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可（5時間帯）、1〜3週ごと選択可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">なし（期間限定で送料無料キャンペーンの場合あり）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-306 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2025/03/oisie.jpg" alt="" width="800" height="533" />
```

**CTA（訴求社だがPost Snippets未登録）:**
```
[btn href="https://oisie-dining.jp/" class="raised main-bc strong" target="_blank"]オイシエの宅配弁当の公式サイトはこちら[/btn]
```
※ 訴求社のためrel="nofollow"は**付けない**

**strong 1文目の方向性:** シェフが調理した冷凍宅配弁当（※「手作り」は景表法リスクで禁止）
**比較テーブル用単価:** 690円〜
**※2025年4月価格改定済み**

---

### 7. ワタミの宅食ダイレクト【訴求社・依頼情報の番号に従う】

**テーブルショートコード（コピペ用）:** `[ワタミダイレクト_table]`
※ このショートコード1つで画像＋テーブルが自動挿入される。手動でHTMLを書かない。

**サービス情報（執筆時の参考・HTMLとしては使わない）:**
- 会社: ワタミ株式会社
- 費用: 1食360円〜（税込・いつでも二菜）、送料880円（本州・四国・九州）
- 配送エリア: 全国（一部離島を除く）
- 配送日時の設定: 日時指定可、スキップ・一時停止対応
- お試しの有無: 三菜10食3,900円・五菜10食4,880円（税込・初回1回限り）

**CTA:** `[ワタミダイレクト]`
**strong 1文目の方向性:** 1食360円から注文できる低価格帯の冷凍宅配弁当
**比較テーブル用単価:** 360円〜

---

## 非訴求社

### 8. nosh（ナッシュ）

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">nosh株式会社</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食620〜719円（税込）、送料は地域・食数で異なる（公式サイトで要確認）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島等を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可、1〜3週ごと選択可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">なし（初回1,500円OFFクーポン・解約金なし）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-408 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2025/06/82ec588dc0f91aeac5e1e968b2e38c6c-scaled.png" alt="" width="800" height="533" />
```

**CTA:**
```
[btn href="https://nosh.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]noshの公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 620円〜

---

### 9. 三ツ星ファーム

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社イングリウッド</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食818円〜（税込・14食コース2回目以降・2025年6月改定後）、送料990円（本州・四国・九州）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可、1〜4週ごと選択可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">なし（初回14食4,500円OFF・解約縛りなし）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-131 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2024/11/mitsuboshifarm.jpg" alt="" width="800" height="533" />
```

**CTA:**
```
[btn href="https://mitsuboshifarm.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]三ツ星ファームの公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 818円〜

---

### 10. 食宅便

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">日清医療食品株式会社</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食約966円〜（税込・おまかせコース5食4,830円）、送料1,330円（都度）・940円（定期便）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可（最短4日後）、時間帯指定可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">なし</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-124 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2026/02/shokutakubin.jpg" alt="" width="800" height="400" />
```

**CTA:**
```
[btn href="https://shokutakubin.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]食宅便の公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 約966円〜

---

### 11. ニチレイフーズダイレクト

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社ニチレイフーズ</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">定期8食6,400円（税込・送料込み・1食800円）、都度購入の送料条件は注文金額と地域で異なる</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（佐川またはヤマト）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">送料無料のお試しセットあり（内容は時期により異なる・公式サイトで要確認）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-249 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2026/03/nichirei.jpg" alt="" width="800" height="534" />
```

**CTA:**
```
[btn href="https://wellness.nichirei.co.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]ニチレイフーズダイレクトの公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 800円〜

---

### 12. まごころケア食

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社シルバーライフ</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食394〜426円（税込）、送料1,080円（沖縄・離島は1,580円）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島は送料割増）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可（5時間帯）</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">初回14食トライアル1,260円（税込・1食90円）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-224 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2026/03/magokoro-care-shoku.jpg" alt="" width="800" height="403" />
```

**CTA:**
```
[btn href="https://magokoro-care-shoku.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]まごころケア食の公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 394円〜

---

### 13. ウェルネスダイニング

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">ウェルネスダイニング株式会社</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食約705円〜（税込・コースと食数で異なる）、初回送料無料、送料無料の条件は公式サイトで要確認</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">初回送料無料（お試し定期で8回分の送料が無料）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-125 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2026/02/wellness-dining.jpg" alt="" width="800" height="399" />
```

**CTA:**
```
[btn href="https://www.wellness-dining.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]ウェルネスダイニングの公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 約705円〜

---

### 14. わんまいる

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社ファミリーネットワークシステムズ</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食896円〜（税込・定期）、送料1,080円（本州・四国・九州）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（ヤマトクール冷凍便）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可（ヤマト時間帯）</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">初回5食3,480円〜（税込・送料別）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-122 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2024/11/onemile.jpg" alt="" width="800" height="533" />
```

**CTA:**
```
[btn href="https://www.onemile.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]わんまいるの公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 896円〜
**特記:** 湯煎・流水解凍タイプ、国産食材100%、合成保存料不使用

---

### 15. 食のそよ風

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社SOYOKAZE</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">1食475〜825円（税込・コース別）、定期購入はお届け回数に応じた送料割引あり（最大25%OFF）</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（一部離島を除く）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">なし（定期購入で送料割引あり）</td></tr>
</tbody>
</table>
```

**画像HTML:**
```html
<img class="size-full wp-image-260 aligncenter" src="https://www.super-yamadai.co.jp/article/wp-content/uploads/2025/01/shokunosoyokaze.jpg" alt="" width="800" height="533" />
```

**CTA:**
```
[btn href="https://shokunosoyokaze.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]食のそよ風の公式サイトはこちら[/btn]
```

**比較テーブル用単価:** 475円〜
**特記:** 3シリーズ（プチデリカ475円〜、国産プレミアム748円〜、そよ風のやさしい食感718円〜）、賞味期限約1年

---

### 16. ライフミール

**情報ソース:** 公式サイト https://l-meal.com/ （2026年4月時点で確認）
**画像HTML:** 未入稿（Manabuさんから支給後に下記「画像HTML」欄を差し替える）。**画像未入稿でも記事掲載は可能。** writerはH3直下にTBDコメント `<!-- 画像入稿待ち・Manabuさん支給後に差し替え -->` を置き、テーブル・説明文・CTAは通常通り書く。

**テーブルHTML（コピペ用）:**
```html
<table style="width: 100%;">
<tbody>
<tr><th style="width: 25.8158%;">会社</th><td style="width: 74.1117%;">株式会社シルバーライフ</td></tr>
<tr><th style="width: 25.8158%;">費用</th><td style="width: 74.1117%;">定期10食5,100円（税込・1食510円）、定期20食9,800円（税込・1食490円）、7食セット1食520円、送料別</td></tr>
<tr><th style="width: 25.8158%;">配送エリア</th><td style="width: 74.1117%;">全国（沖縄・離島は送料割増）</td></tr>
<tr><th style="width: 25.8158%;">配送日時の設定</th><td style="width: 74.1117%;">日時指定可、1〜4週ごと選択可、ヤマト運輸クール冷凍便</td></tr>
<tr><th style="width: 25.8158%;">お試しの有無</th><td style="width: 74.1117%;">初回限定10食1,900円（税込・1食190円）</td></tr>
</tbody>
</table>
```

**画像HTML（TBD・Manabuさんから支給後に差し替え）:**
```html
<!-- 画像入稿待ち・Manabuさん支給後に差し替え -->
```
※ 画像が未入稿でも記事掲載は止めない。writerは上記コメントをH3直下に置き、残り（テーブル・説明文・CTA）は通常通り執筆する。

**CTA:**
```
[btn href="https://l-meal.com/" class="raised main-bc strong" target="_blank" rel="nofollow"]ライフミールの公式サイトはこちら[/btn]
```

**strong 1文目の方向性:** 初回10食1,900円から始められる低価格帯の冷凍宅配弁当
**比較テーブル用単価:** 490円〜（定期20食）／初回190円〜（10食お試し）
**送料（2025年10月1日改定後）:** 通常1,080円（税込）、沖縄・離島1,580円（税込）。ご飯付きメニュー選択時は+250円。
**特記:**
- まごころケア食（#12）と**同じ株式会社シルバーライフが運営**。記事内で両社を並列で紹介する場合は運営会社が同じ点を明示する（読者の誤解防止）。
- 冷凍庫無料レンタルキャンペーンあり（クレジットカード利用者・10食/20食セット対象）。
- 法令セーフ注意: 公式表記に「管理栄養士監修」「糖質30g以下」等があるがCLAUDE.md #18の#1・#6・#7・#10で変換必須。
