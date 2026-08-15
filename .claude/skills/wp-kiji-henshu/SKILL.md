---
name: wp-kiji-henshu
description: 公開済みWordPress記事の本文を、他の箇所を壊さずに差し替える。MCPが返すのは表示用に変換されたHTMLでそのまま書き戻すと記事が壊れるため、REST の context=edit で編集画面と同じ生ソースを取得し、狙った箇所だけを置換して書き戻し、保存結果と描画結果を照合する。「記事○○を直して」「アフィリリンクに差し替えて」「公開記事のこの部分を修正」「ショートコードに置き換えて」等でトリガー。
---

# 公開記事の編集（wp-kiji-henshu）

**対象**：すでに公開されている本番記事（`super-yamadai.co.jp/article/{ID}`）の本文差し替え。
**対象外**：新規記事の執筆（`kosei-sakusei` → 執筆パイプライン）、Post Snippetsの中身作り（`post-snippet-sakusei`）。

---

## 最重要：MCPの中身をそのまま書き戻さない

`wp_get_post --include_content=true` が返すのは **WordPressが表示用に変換した後のHTML**。これを `wp_update_post` で書き戻すと記事が壊れる。

| 混ざるもの | 書き戻すとどうなるか |
|---|---|
| 展開済みショートコード | `[lifemeal]` 等がベタHTMLに焼き付き、以後の一括差し替えができなくなる |
| 目次HTML（`js-toc-list`） | 目次が二重に出る |
| `loading="lazy"` `decoding="async"` `srcset` | ソースに固定され、画像を差し替えても追従しなくなる |
| `wpautop` が付けた `<p>` | 段落構造が二重になる |

**変換後かどうかの判定**（着手時に必ず1回）

```bash
grep -c 'js-toc-list\|loading="lazy"\|srcset=' <取得した中身>
```

1件でも出たら変換後。**生ソースを取り直す。**

---

## 手順

### 0. 着手前に確認する

- 対象の記事ID（URLの数字）
- 差し替える箇所と、置き換え後の文字列（**推測で決めない**。指定が無ければ確認して止まる）
- 同じサービスが記事内の**他の場所**にも出ていないか（比較表・お試し価格の一覧・FAQ・まとめ）

### 1. 生ソースを取得してバックアップにする

```bash
cd <スクラッチパッド>
eval "$(grep -E '^(SVC=|export WORDPRESS_)' ~/.claude/mcp-servers/wordpress/run-yamadai.sh)"
python3 ~/Projects/super-yamadai/.claude/skills/wp-kiji-henshu/wpsrc.py get 546 article546_raw.html
```

- 認証情報は macOS Keychain（サービス名 `claude-mcp-wordpress-yamadai`）から実行時に読む。**値を画面に出さない**
- この操作は権限でブロックされることがある。**ブロックされたら回避せず、何をしたいか説明してManabuさんの判断を仰ぐ**（グローバル §2）
- 取得した `*_raw.html` が**唯一のバックアップ**。上書きしない

### 2. 差し替える箇所を特定する

```bash
grep -n "対象の文字列" article546_raw.html | cut -c1-160
grep -n -o 'uploads/[0-9]*/[0-9]*/[^"]*' article546_raw.html   # 画像の棚卸し
```

**1箇所直して終わりにしない。** 同じサービス名で全件grepし、比較表・一覧・本文の全出現を確認してから作業に入る（feedback_structure 学び64「1点指摘されたら同類を全件grepしてから直す」）。

### 3. 置換する（アンカーをassertで固定する）

行番号だけで切らない。**置換前に「そこが本当に狙った場所か」をassertで確かめる。**

```python
raw = open("article546_raw.html").read()
lines = raw.split("\n")

blk_start, blk_end = 637, 662          # 画像＋テーブル
assert "CleanShot-Aug-9-2026" in lines[blk_start], lines[blk_start]
assert lines[blk_end-1] == "</table>", lines[blk_end-1]

cta_i = 667                            # CTA
assert "magokoro-care-shoku.com" in lines[cta_i], lines[cta_i]

new = lines[:blk_start] + ["[magokorokea_table]"] + lines[blk_end:]
cta_new = cta_i - (blk_end - blk_start) + 1
assert "magokoro-care-shoku.com" in new[cta_new], new[cta_new]
new[cta_new] = "[magokorokea]"

open("article546_new.html", "w").write("\n".join(new))
```

- ショートコードは **`<p>` で包まず、単独行に置く**
- 削除した文字列が残っていないかを件数で確認する（`out.count("magokoro-care-shoku.com") == 0`）

### 4. 送信前にdiffを見る（省略禁止）

```bash
diff article546_raw.html article546_new.html
```

**意図した箇所以外に1行でも差分が出たら送信しない。** diffの結果はチャットにも貼る（グローバル §3.2.1）。

### 5. 書き戻す

```bash
python3 ~/Projects/super-yamadai/.claude/skills/wp-kiji-henshu/wpsrc.py put 546 article546_new.html
```

`wpsrc.py put` は送信前に自動で止める安全装置を持つ。

- 中身が空
- 現状より3割以上短い（差し替えミス・取りこぼし）
- `js-toc-list` や `srcset=` が新たに混入している（表示用HTMLの書き戻し）

送信後に「保存ソース == 送信内容」を自動照合する。

### 6. 描画結果を確認する（ここまでやって完了）

```bash
python3 ~/Projects/super-yamadai/.claude/skills/wp-kiji-henshu/wpsrc.py show 546
```

差し替えた箇所について、最低限これを確認してチャットに出す。

- 画像が出ているか（URL）
- テーブルの行数・主要な数値
- リンク先URL・class・ボタン文言
- **未展開のショートコードが残っていないか**（`[xxx]` の文字列が表示に出ていたらスニペット未登録か設定不足）

「たぶん反映されました」で終わらせない。**実出力を貼る。**

---

## 事故の記録（同じことを繰り返さない）

- **2026-08-15 記事546**：MCPの中身が変換後HTMLだと気づかず書き戻していたら、他15社のブロックと目次が壊れていた。`grep -c 'js-toc-list\|loading="lazy"'` で33件出たため寸前で止めた。**判定を手順に組み込んだのはこのため**
- 同記事は**ショートコードを1つも使っておらず全部ベタHTML**だった。「うちの記事はショートコードで組まれているはず」という思い込みで判断せず、毎回 `wpsrc.py get` の出力（含まれるショートコード）を見る
- 画像を差し替えるとき `wp-image-XXX` クラスを勝手に足して差し戻しになった。**出典に無い属性を足さない**

---

## やらないこと

- 表示用HTMLの書き戻し
- 記事全文の作り直し（差し替えは常に最小範囲）
- 指示されていない箇所の「ついでの修正」（グローバル §3.3）
- 認証情報の値を画面に出す／権限ブロックの回避
- 記事の削除・ステータス変更・タイトル変更（指示があった場合のみ）

## 停止条件

- 差し替え後の文字列が未確定 → 確認して止まる
- diffに意図しない差分が出た → 送信せず、差分を貼って確認
- `wpsrc.py put` の安全装置が発動 → 送信せず、理由を報告
- 描画確認で未展開ショートコードが残る → 記事は戻さず、スニペット側の設定を確認してもらう

---

## スキル定義（グローバル §3.11 の9項目）

| # | 項目 | 内容 |
|---|---|---|
| 1 | スペック | 公開記事の指定箇所だけを差し替える。**受け入れ条件**＝diffが意図した箇所のみ・保存ソース==送信内容・描画結果を実出力で確認済み。**対象外**＝新規執筆、構成変更、他箇所の改善 |
| 2 | 優先順位 | 記事を壊さないこと > 指示どおりの差し替え > 表記の統一 > 速度 |
| 3 | コンテキスト | 読む＝対象記事の生ソース、差し替え指示、shortcodes.md。**読まない**＝writing-manual全文、他記事 |
| 4 | ツール | Bash（wpsrc.py・grep・diff・python3）／wp_list_media（画像確認）。`wp_update_post` は**使わない**（変換後HTMLを書き戻す事故のもと） |
| 5 | ハーネス | 作業はスクラッチパッド。`*_raw.html`＝バックアップとして上書き禁止。WordPress側にもリビジョンが残る |
| 6 | ループと停止条件 | 置換のやり直しは最大3回。3回でdiffが意図どおりにならなければ人に確認 |
| 7 | 検証 | ①assertでアンカー固定 ②diff目視 ③put時の安全装置 ④保存ソース照合 ⑤描画結果の実出力確認 の5段。自己申告だけで完了と言わない |
| 8 | 権限と承認 | 本番記事の更新は差し替え内容の合意が前提。認証情報の読み取りがブロックされたら人の判断を仰ぐ。削除・公開状態の変更はしない |
| 9 | 報告 | diff・保存照合・描画確認の**実出力**＋バックアップの場所＋残った不確実性（他記事への横展開が未確認 等）を書く |
