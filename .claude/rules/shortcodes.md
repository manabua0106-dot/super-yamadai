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
- `[ワタミダイレクト]`
- `[Meals]`
- `[タイヘイ]`

### ワタミの宅食用
- `[ワタミ]`
  - class属性: 「raised accent-bc strong」
  - リンク先: https://www.super-yamadai.co.jp/article/lp-watami-takushoku
  - あっ！とごはん・PAKU MOGUには使用しない

**注意:**
- 使用前にPost Snippets管理画面でリンク先URLが正しいか必ず確認
- Post Snippetsに未登録のサービスは[btn]ショートコードを使用
- ショートコードの動作確認は下書きプレビューで行う

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

記述例:
```
[btn href="https://www.pal-system.co.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]パルシステムの公式サイトはこちら[/btn]
```

## 4. CTA配置ルール

- 訴求社: ショートコードをサービス紹介文の最終行に配置
- 非訴求社: [btn]ショートコードをサービス紹介文の最終行に配置
- **訴求社のCTA直前にはstrong価格訴求文（段落4）を必ず配置**
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

- H2直下には配置しない（不要）
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
