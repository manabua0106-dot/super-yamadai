# slide-kit — 口コミあり版（横スライド）の道具と本文

2026-10-13 に、ヤマダイの22サービスぶんの口コミあり版 `[サービス名_kuchikomi_slide]`（Post Snippets ID 69〜91）を作り、78記事・237か所に反映したときの道具と本文の控え。元は作業フォルダ `~/.cache/junni-henkou/wp-backup/yamadai/pre-all-20261013/`（リポジトリの外・バージョン管理なし）にあった。

**使い方・考え方は `../SKILL.md`「口コミあり版 `サービス名_kuchikomi_slide` を作る」。** 位置の決め方は `.claude/rules/appeal-ranking.md`、名前とIDの一覧は `.claude/rules/shortcodes.md`。

## 中身

| ファイル | 役目 |
|---|---|
| `build_all.py` | 口コミ本文を組む。入力＝`picks.json`・`reserve.json`・`template/lifemeal_kuchikomi_slide.body.html`（CSS・スクリプトの出どころ）・`existing-cta-snippets.json`（元のCTAスニペットの中身。同梱せず）。出力＝`bodies/<名前>.body.html` と `bodies/_index.json`。**WordPress には何も書かない** |
| `plan_lib.py` | 記事の生ソースから「口コミあり版にする位置」を決める。規則はファイル冒頭のコメントと `appeal-ranking.md` の条文が同じ |
| `make_edits_all.py` | 記事ごとの差し替え後ファイルを作る。置換位置を元に戻すと原文とバイト単位で一致するか、前方一致の落とし穴（`[ワタミ]` と `[ワタミダイレクト]`）を検算する。読み取り専用 |
| `tools/apply_all.sh` | 記事に反映する。既定は確認だけ。1本ずつ「控えと現在の一致確認 → 書き込み → 公開ページの確認」し、NGならその記事を控えで戻して全体を止める |
| `tools/apply_ins.sh` | 商標記事の目次の上に口コミ付きCTAを挿入する版（記事774・971・980）。先頭コメントの使い方は `apply_all.sh` のまま書いてあるが、呼ぶのはこのファイル |
| `tools/rollback_all.sh` | 控えの生ソースを書き戻す。現在の記事が「差し替え後」と同じときだけ戻し、誰かが編集した記事は触らずに知らせる |
| `tools/verify_all.py` | 反映後の公開ページの確認（`new`＝差し替え／`ins`＝挿入／`same`＝戻したあと）。枠の数・ボタンの数・Xの引用の数・生のショートコードが無いこと |
| `tools/snap-public.py`・`tools/compare-public.py` | 公開ページの前後の保存と比較。関連記事のランダム表示と nonce は除く。「既存ページが変わっていない」を示す |
| `picks.json` | サービスごとの表示名と、使う投稿のツイートID（2件）。18サービス |
| `reserve.json` | サービスごとの枠の高さの予約値 `[スマホ, PC]`（px・実測）。入れないと読み込み後に枠が伸びて表示がガタつく |
| `bodies/` | 17サービス＋タイヘイの本文（ID 74〜91）。`_index.json` に指紋（sha256の先頭12桁）・ツイートID・予約高さ |
| `template/` | 最初の5サービス（ライフミール・ワタミの宅食ダイレクト・ウェルネスダイニング・ワタミの宅食・筋肉食堂DELI＝ID 69〜73）の現行本文。`lifemeal_kuchikomi_slide.body.html` が、全社共通のCSS・スクリプトの雛形 |

## 注意

1. **保存先が固定**：スクリプトの `BASE`（`build_all.py` はさらに `PS`）が `~/.cache/.../pre-all-20261013/` を指している。別の場所で動かすときは書き換える。ここにあるのは「手順の控え」で、そのままでは動かない場合がある
2. **同梱していない入力**：`existing-cta-snippets.json`（元のCTAスニペットの中身。Post Snippets の一覧から取る）、`index.json`（公開記事の一覧：`id`・`status`）、`registered-tags.json`（WordPress に登録済みのショートコード名）、`raw-all/`（記事の生ソース。`wp-kiji-henshu` の `wpsrc.py get` で取る）
3. **承認の印**：書き込み（`--apply`）は、依頼を受けた側が `JUNNI_APPROVED=1` を付けて実行する。ファイルには埋め込まない。印が無いときは確認だけ
4. **スニペットの登録は含まない**：本文を作るところまで。登録は `../SKILL.md` の手順（wp-admin のフォーム送信・承認後）
5. **使う前に**：投稿は消える・非公開になることがある。使う前に `kuchikomi-shutoku` の手順で、ツイートIDが今も取得できるかを確かめる
