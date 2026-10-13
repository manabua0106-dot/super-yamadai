---
name: post-snippet-sakusei
description: 新しく提携したサービスのPost Snippets（CTAボタン用 `[サービス名]` と 画像＋テーブル用 `[サービス名_table]`）の中身を作る。既存の提携社の描画結果から逆算した形式に、修正済み記事の画像・テーブル実物と公式で裏取りした数値を流し込む。「ポストスニペット作って」「新しく提携したのでショートコード用意して」「_tableの中身作って」「口コミ版（_kuchikomi_slide）作って」等でトリガー。WordPressへの登録・更新はREST非公開だが、Playwrightでwp-adminを操作すれば私が実行できる。
---

# ポストスニペット作成（post-snippet-sakusei）

**正本**：`.claude/rules/shortcodes.md`（ショートコード仕様）・`.claude/rules/service-info.md`（サービスの数値）。本スキルは**新規提携社のスニペット2本の中身をどう組み立てるか**だけを扱う。

**記事本文へのショートコード反映は本スキルの範囲外。** `wp-kiji-henshu` スキルで行う。

---

## 先に把握しておくこと：RESTでは無理だが、Playwrightなら私が登録・更新できる

Post Snippets プラグインは REST API に公開されていない。**REST（`wpsrc.py` / wp_* MCP）からは作成も読み取りもできない。**

**ただし「だから人が貼る」ではない（2026-08-26 訂正）。** Playwright MCP で wp-admin にログインすれば、私が中身の読み取り・書き換え・保存まで実行できる。実際に `MITSUBOSHI_table` の配送エリア行へ広告主指定の注記を追加し、公開ページへの反映まで確認済み。**「REST非公開なので貼っておいてください」と案内しない。**

### Playwrightでの操作手順（実測・2026-08-26）

1. `browser_navigate` で `https://www.super-yamadai.co.jp/article/wp-admin/` を開く（未ログインなら wp-login にリダイレクトされるので、その画面でManabuさんにログインしてもらう。**Keychainの認証情報はREST用アプリケーションパスワードで、wp-login.phpには使えない**）
2. 一覧は `admin.php?page=post-snippets`。**`options-general.php?page=post-snippets/post-snippets.php` は403になる**（旧スラッグ）
3. 一覧表 `table.psp_all_snippets` の行から編集リンク（`?page=post-snippets-edit&action=edit&snippet={ID}&_wpnonce=...`）を取る。**行の1セル目はチェックボックスなのでタイトルは `tr.textContent` で拾う**
4. 本文は **CodeMirror**。`document.querySelector('.CodeMirror').CodeMirror.getValue()` で読み、`setValue()` で書く。書いたら `cm.save()` とtextarea同期を確認する
5. 置換前に**出現1件をassert**し、**書き換え前の全文をチャットに出してバックアップ**にする
6. 保存は `input#submit[name="submit"]`
7. 保存後は**編集画面を開き直して保存値を確認**し、さらに**公開ページをcurlして描画を確認**する（画面遷移だけで完了と言わない）

なお REST に snippet 系の投稿タイプが無いことは、着手時に下記で毎回確かめる（グローバル §3.2.1）。

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

## 口コミあり版 `サービス名_kuchikomi_slide` を作る（2026-10-13・22サービスぶんを作った手順）

名前・使い分けは `appeal-ranking.md`「5位以内に入る会社が変わるとき」と `shortcodes.md` が正本。ここは**作り方**。道具と本文の実物は `slide-kit/`（一覧と注意は `slide-kit/README.md`）。**既存の `[X]` は書き換えない。**

1. **投稿を2件選ぶ**：`kuchikomi-shutoku`「CTA直下の口コミ（横スライド）に使う投稿の選び方」に従い、ツイートIDを2つ決める。`slide-kit/picks.json` に `{"サービス名": {"label": 表示名, "name_for_nowrap": ボタン内で折り返さない社名, "ids": [ID, ID]}}` を足す
2. **枠の高さを実測する**：スマホ幅とPC幅で、2件のうち高い方の高さ（px）を測り、`slide-kit/reserve.json` に `{"サービス名": [スマホ, PC]}` で足す（無いときの既定は 318/696）。入れないと、読み込み後に枠が伸びて表示がガタつく（CLS）
3. **本文を作る**：`python3 build_all.py サービス名`。元のCTAスニペット `[X]` の中身から、マイクロコピー・ボタン文言・リンクを取り、`口コミ2件の横スライド → CTA1組` に組む。CSS・スクリプトは `template/lifemeal_kuchikomi_slide.body.html` から取るので、全社で見た目と動きが同じ。投稿の本文は X公式のCDN から取り直し、`[ ] \ { }` は文字参照にする。**WordPress には何も書かない**
4. **登録する**（承認後）：wp-admin の `admin.php?page=post-snippets-edit` にフォーム送信する（既存の編集は同じURLに `&action=edit&snippet=ID&_wpnonce=…`）。項目は `snippet_title`（＝ショートコード名 `サービス名_kuchikomi_slide`）・`snippet_content`・`snippet_shortcode`（チェック）・`snippet_status`（有効は1。新規の初期値は0）。チェックボックスは、元の `[X]` スニペットと同じ状態に揃える
5. **登録を確かめる**：編集画面を開き直して保存値を読み、`bodies/_index.json` の指紋と突き合わせる。公開ページで、枠（`kc-scroll`）が出ること・生のショートコードが無いことを確かめる
6. **記事に反映する**（`wp-kiji-henshu`・承認後）：`make_edits_all.py` が `plan_lib.py` の規則どおりの位置で差し替え後ファイルを作る → `tools/apply_all.sh`（確認だけ → 1本ずつ書く → `verify_all.py` で公開ページを確認 → NGなら控えで戻して停止）。商標記事の目次の上への挿入は `tools/apply_ins.sh`。全体を戻すのは `tools/rollback_all.sh`。反映の前後は `tools/snap-public.py`・`tools/compare-public.py` で、既存ページが変わっていないことを示す
7. **台帳を更新する**（承認後）：`shortcodes.md` の口コミあり版の表（ID）、`appeal-ranking.md` の口コミあり版の一覧と更新履歴

**落とし穴**
- 記事に未登録のタグ（例 `[ワタミダイレクト]`）があるとき、`[ワタミ]` を全部置き換えるとそのタグが文字のまま出る（前方一致。`shortcodes.md`）。`make_edits_all.py` は見送って知らせる
- X埋め込みは `widgets.js` を画面に近づいてから読み込む。ブラウザのペインが隠れていると読み込み・高さの計算が止まって、不具合に見えることがある。確かめるときは前面に出す
- スワイプで枠の高さが変わる瞬間にCLSが出る（ライフミールで実測0.109）。2件の高さの差が小さい組み合わせを選ぶ（写真なしを優先）
- 口コミ版が作れる会社は、1〜5位に入る記事があるかを先に確かめる。無ければ作らない（オイシエ・タイヘイの経緯は `shortcodes.md`）

---

## やらないこと

- 承認なしのWordPress登録（登録は承認後に wp-admin のフォーム送信で行う。REST では不可）
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
| 1 | スペック | 新規提携社のPost Snippets 2本の中身を作る。**受け入れ条件**＝出典と正規化後完全一致・提携社の描画形式に一致・数値が公式で裏取り済み・チャットに実物提示。**対象外**＝承認なしのWP登録、記事反映、ルールファイル無断更新。口コミあり版 `_kuchikomi_slide` の作り方は「口コミあり版 … を作る」の節 |
| 2 | 優先順位 | 法令（二重価格・優良誤認） > 出典との一致 > 既存提携社との形式統一 > 訴求の強さ |
| 3 | コンテキスト | 読む＝shortcodes.md・service-info.md・対象記事の生ソース。**読まない**＝writing-manual全文、他記事の構成 |
| 4 | ツール | Bash（curl・python3・diff）／wp_list_media／WebFetch（公式裏取り）。RESTでのWordPress書き込みは使わない（登録は承認後に wp-admin のフォーム送信）。口コミ版の本文づくりは `slide-kit/` のスクリプト |
| 5 | ハーネス | 作業ファイルはスクラッチパッド。ルールファイルは承認後のみ更新 |
| 6 | ループと停止条件 | 検証の直しは最大3回。3回で一致しなければ差分を貼って人に確認 |
| 7 | 検証 | 機械突合（正規化diff）＋公式サイトでの数値裏取り＋登録後のプレビュー確認（人） |
| 8 | 権限と承認 | WP登録は承認後（フォーム送信は私が実行できる）。ルールファイル更新は承認後。アフィリURLは指定されたものだけを使う |
| 9 | 報告 | 2本の中身の実物＋貼り付け手順＋確認方法＋**残った不確実性**（service-info.mdとのズレ等）を必ず書く |
