---
name: post-snippet-sakusei
description: 新しく提携したサービスのPost Snippets（CTAボタン用 `[サービス名]` と 画像＋テーブル用 `[サービス名_table]`）の中身を作る。既存の提携社の描画結果から逆算した形式に、修正済み記事の画像・テーブル実物と公式で裏取りした数値を流し込む。「ポストスニペット作って」「新しく提携したのでショートコード用意して」「_tableの中身作って」等でトリガー。WordPressへの登録自体はREST非公開のため人が貼る。
---

# ポストスニペット作成（post-snippet-sakusei）

**正本**：`.claude/rules/shortcodes.md`（ショートコード仕様）・`.claude/rules/service-info.md`（サービスの数値）。本スキルは**新規提携社のスニペット2本の中身をどう組み立てるか**だけを扱う。

**記事本文へのショートコード反映は本スキルの範囲外。** `wp-kiji-henshu` スキルで行う。

---

## 先に把握しておくこと：登録は私にはできない

Post Snippets プラグインは REST API に公開されていない。**Claudeからは作成も読み取りもできない。** 中身を作ってチャットに出し、貼り付けはManabuさんに依頼する。

「登録しておきます」と言わない。着手時に下記を実行して、状況が変わっていないか毎回確かめる（グローバル §3.2.1）。

```bash
curl -s -m 20 "https://www.super-yamadai.co.jp/article/wp-json/wp/v2/types" \
  | python3 -c "import sys,json;print(list(json.load(sys.stdin).keys()))"
```

2026-08-15 実測の結果は `post / page / attachment / nav_menu_item / wp_block / wp_template / wp_template_part / wp_global_styles / wp_navigation / wp_font_family / wp_font_face / content_block`。**snippet系の投稿タイプは無い。**

---

## 作るもの（1サービスにつき2本）

| スニペット名 | 中身 | 記事での置き場所 |
|---|---|---|
| `サービス名_table` | 画像1行 ＋ 5行テーブル | H3直下 |
| `サービス名` | キャッチコピー1行 ＋ `[btn]` | 紹介文の最終行 |

**スニペット名（Title）＝ショートコード文字列。** Manabuさんから指定された文字列を1文字も変えない（例：`magokorokea` / `magokorokea_table`。サービス名の日本語表記とは限らない）。指定が無ければ確認する。**推測で命名しない。**

---

## 手順

### 1. 素材の出所を決める（優先順）

1. **提携にあたって修正した記事の実物**（あるならこれが最優先。広告主のレビューを通った状態のため）
2. `service-info.md` のエントリ
3. 公式サイト

**1と2が食い違ったら1を採用し、2のズレは報告する（勝手に直さない）。** 実例：2026-08-15 まごころケア食で `service-info.md` のお試しが 1,260円（1食90円）のまま、記事と公式は 2,660円（1食190円）だった。

### 2. 記事から画像・テーブルの実物を取り出す

記事の生ソースを取得する（表示用HTMLでは `<p>` や `loading="lazy"` が混ざる）。取得手順は `wp-kiji-henshu` スキルの `wpsrc.py get` を使う。

### 3. `_table` の中身を組む

```html
<img class="size-full aligncenter" src="{画像URL}" alt="" width="800" height="{高さ}" />
<table style="width: 100%;">
<tbody>
<tr>
<th style="width: 25.8158%;">会社</th>
<td style="width: 74.1117%;">{運営会社}</td>
</tr>
… 費用／配送エリア／配送日時の設定／お試しの有無 …
</tbody>
</table>
```

- **テーブルは5行固定**（会社／費用／配送エリア／配送日時の設定／お試しの有無）
- **WordPressが表示時に付けるものは入れない**：`<p>` ラッパー・`loading="lazy"`・`decoding="async"`・`srcset`・`sizes`
- **`wp-image-XXX` クラスを勝手に足さない。** 出典の記事に無ければ付けない（2026-08-15、良かれと思って足して差し戻しになった）
- 画像のIDと高さは `wp_list_media --search` で確認する

### 4. CTAの中身を組む

```
<p class="center_micro"><strong>＼{キャッチ}／</strong></p>
[btn href="{URL}" class="raised accent-bc strong" rel="nofollow"]{ボタン文言}[/btn]
```

**提携社の形式（記事546の描画結果から逆算・2026-08-15 実測）**

| 項目 | 提携社 | 非提携社 |
|---|---|---|
| class | `raised accent-bc strong`（オレンジ） | `raised main-bc strong` |
| target | **付けない** | `_blank` |
| rel | `nofollow` | `nofollow` |
| キャッチ | `＼〜／` を付ける | 付けない |

- **URL**：LPがある社は `https://www.super-yamadai.co.jp/article/lp-xxx`、**LPが無い社はアフィリURL直**（ツクリオ・DELIPICKS・ニチレイ・食のそよ風がこの形）
- **ボタン文言**：LP有り＝「〇〇のお試しはこちら」／直リンク＝「〇〇をお得に始める」
- **キャッチ**は数値を1つだけ入れて短く（例：`＼初回限定！14食セットが1食190円／`）。**通常価格の内訳が説明できない割引率（「○%OFF」「通常○○円」）は入れない**（二重価格表示・writing-manual §8）

### 5. 提示前の検証（必須）

出典と機械で突合する。目視で「合っています」と言わない。

```bash
# 出典（記事の生ソース）から該当ブロックを切り出して article_block.txt に、
# 作ったスニペットを snippet_block.txt に置いてから
python3 - <<'EOF'
import re
a=open('article_block.txt').read(); b=open('snippet_block.txt').read()
def norm(s):
    s=re.sub(r'</?p>','',s)
    s=re.sub(r'\s*(loading="lazy"|decoding="async")','',s)
    s=re.sub(r'\s*/?>','>',s)
    return s.strip()
print("完全一致:", norm(a)==norm(b))
EOF
```

`完全一致: True` が出るまで直す。**差分が出たら、その差分をチャットに貼ったうえで、意図的な変更か事故かを説明する。**

### 6. 提示と引き継ぎ

- 2本の中身を**チャットに実物で貼る**（ファイルリンクだけで済ませない・グローバル §0）
- 貼り付け手順を添える：Post Snippets → Add New → Title にスニペット名 → 本文貼り付け → Active
- **CTA側は中に `[btn]` が入っているので、既存の提携社スニペット（例 `lifemeal`）を開いてチェックボックスの状態を揃えてもらう**よう必ず伝える
- 登録後の確認方法を添える：下書きにショートコードを置いてプレビュー。`[btn href=...]` の文字列がそのまま出たら設定不足

### 7. 登録できたら台帳を更新（承認後）

`shortcodes.md` の「登録済みショートコード マスター一覧」と「_table版」の表、`service-info.md` の該当エントリ、`appeal-ranking.md` の順位。**ルールファイルの更新は承認を取ってから**（グローバル §2.2）。

---

## やらないこと

- WordPressへの登録（不可）
- 記事本文への反映（`wp-kiji-henshu` の担当）
- 出典に無い数値の補完、`service-info.md` の無断修正
- スニペット名の推測、画像の勝手な差し替え

## 停止条件

- スニペット名が未指定 → 確認して止まる
- 出典（記事・service-info・公式）が三者三様で決められない → 差分表を出して確認して止まる
- 検証の `完全一致` が3回直しても True にならない → 差分を貼って確認を仰ぐ

---

## スキル定義（グローバル §3.11 の9項目）

| # | 項目 | 内容 |
|---|---|---|
| 1 | スペック | 新規提携社のPost Snippets 2本の中身を作る。**受け入れ条件**＝出典と正規化後完全一致・提携社の描画形式に一致・数値が公式で裏取り済み・チャットに実物提示。**対象外**＝WP登録、記事反映、ルールファイル無断更新 |
| 2 | 優先順位 | 法令（二重価格・優良誤認） > 出典との一致 > 既存提携社との形式統一 > 訴求の強さ |
| 3 | コンテキスト | 読む＝shortcodes.md・service-info.md・対象記事の生ソース。**読まない**＝writing-manual全文、他記事の構成 |
| 4 | ツール | Bash（curl・python3・diff）／wp_list_media／WebFetch（公式裏取り）。WordPressへの書き込みは使わない |
| 5 | ハーネス | 作業ファイルはスクラッチパッド。ルールファイルは承認後のみ更新 |
| 6 | ループと停止条件 | 検証の直しは最大3回。3回で一致しなければ差分を貼って人に確認 |
| 7 | 検証 | 機械突合（正規化diff）＋公式サイトでの数値裏取り＋登録後のプレビュー確認（人） |
| 8 | 権限と承認 | WP登録は人。ルールファイル更新は承認後。アフィリURLは指定されたものだけを使う |
| 9 | 報告 | 2本の中身の実物＋貼り付け手順＋確認方法＋**残った不確実性**（service-info.mdとのズレ等）を必ず書く |
