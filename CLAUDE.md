# CLAUDE.md — ヤマダイ記事制作パイプライン

## ⚠️ 絶対遵守事項（最優先で読め）

1. **記事HTMLを一気に書かない。必ずH2単位で分割して出力する。** 「全セクション一括で書く」「一気に書き上げます」は禁止。1回の出力はH2を1つだけ。出力が長すぎるとRequest timed outになる。
2. **通常H3は必ず「骨格 → 構造チェック → 文章化 → 表現チェック」の2段階で書く。** 骨格を飛ばして完成文を出力した場合、editorは受け付けずに差し戻す。
3. **lint.shは文章化のたびに必ず実行する。** ERROR が1件でもあれば次に進めない。
4. **1文目は結論から。** 背景説明・リスク説明・仕事説明から入ったら即修正。「〜ためです。」で終わる1文目は禁止。
5. **禁止語（「こと」「として」「という」「といった」「指示語」）は絶対に使わない。** lint.shで検出されたら即差し戻し。
6. **共起語の配置計画を骨格段階で立てる。** 依頼情報の共起語リストを各H2/H3に分配してから書き始める。
7. **構成段階でKWニーズとH2順序の整合性を確認する。** H2①がKWの検索意図に直接回答しているかをresearcherが必ずチェック。
8. **吹き出しは不要。ヤマダイ記事では吹き出しパーツを使用しない。**
9. **テーブル（サービス紹介）は5行固定。** 会社・費用・配送エリア・配送日時の設定・お試しの有無（or お試し内容）。
10. **訴求順位は固定ではない。毎記事の依頼情報（構成書・発注指示書）に記載されるので、それを読み込んでそのまま反映する。** 番号を勝手に振り直さない。H2②の掲載順は訴求順位が最優先。非訴求社の認知度を理由に先頭に置かない。依頼情報に訴求順位の記載がない場合のみ、マニュアルC-4のデフォルト訴求社を使う。
11. **H2見出しにはメインKWの全構成要素を含める。** 見出しを修正するたびにKW含有を再チェックする。修正でKWが抜け落ちることが頻発する。
12. **H3見出しは1テーマ1見出し。** 2つ以上のテーマを1つのH3に詰め込まない。
13. **サービス紹介H2は、3〜5社ずつに分割して出力する。** 15社を一度に書こうとするとタイムアウトする。「まず1〜5社目を出力」→「次に6〜10社目」→「最後に11〜15社目」のように分ける。
14. **構成案で確定したH2/H3見出しを勝手に変えない。** writerが見出しのテキストを変更・差し替えした場合、editorは即差し戻す。変更が必要な場合はManabuさんに確認する。
15. **選び方・メリット・注意点のH3には、原則として箇条書き（ul）またはテーブルを1つ入れる。** 目安は全H3の8割。テキストだけの段落が続くH3が多いと読者が離脱する。
16. **依頼情報で訴求社に指定されているがPost Snippets未登録のサービスは、[btn]を使うがrel="nofollow"は付けない。** 訴求社のbtnにnofollowを付けるのはNG。

---

## プロジェクト概要

- サイト: スーパーヤマダイ（super-yamadai.co.jp/article）
- ジャンル: 食材宅配サービスの比較記事
- CMS: WordPress
- 訴求社: Oisix / ヨシケイ / らでぃっしゅぼーや / コープデリ（4社）
- 非訴求社: 上記以外すべて

---

## 参照ファイル一覧

| カテゴリ | ファイル | 内容 |
|---------|---------|------|
| ルール | `.claude/rules/writing-manual.md` | ライティングマニュアルv3.0全文 |
| ルール | `.claude/rules/prohibited-words.md` | 禁止語・変換ルール・NG表現リスト |
| ルール | `.claude/rules/shortcodes.md` | ショートコード・HTMLテンプレート |
| ルール | `.claude/rules/service-info.md` | 各サービスのスペック情報 |
| ルール | `.claude/rules/internal-links.md` | 内部リンクリスト |
| 参考 | `references/structure-examples.md` | H2/H3構成パターンの合格例 |
| 参考 | `references/style-examples.md` | 本文の装飾・文体パターン例 |
| 参考 | `references/h3-templates.md` | H3タイプ別の骨格テンプレート |
| スクリプト | `scripts/lint.sh` | 機械チェッカー |

---

## パイプライン定義

### セッション1: 構成案作成

```
ステップ1: @researcher → 構成案v1を出力
  ├── 依頼情報を最優先で遵守
  ├── SERP分析（WebSearch必須。推測データ禁止）
  ├── 競合上位5記事のH2/H3構成を取得（WebFetch必須）
  ├── 競合TTP要素の抽出 + 差別化要素の設計
  ├── 出典リストの作成と検証
  └── 出力: articles/{KW}-outline.md

ステップ2: @editorial-reviewer → 構成案をレビュー
  ├── 読者ニーズ・SEO・H2棲み分け・H3具体性・出典要否
  ├── 競合TTP要素が反映されているかチェック
  ├── ターゲットKW・共起語・複合KWの反映度チェック
  └── 出力: 改善提案リスト（優先度: 高/中/低）

ステップ3: @researcher → 提案を取捨選択して構成案を修正
  ├── 各提案に「採用（修正済み）」or「不採用（理由）」を返答
  └── 出力: articles/{KW}-outline.md（更新版）+ articles/{KW}-response.md

  ※ editorial-reviewerの再反論が0件になるまでステップ2-3をループ

ステップ4: @quality-checker → 構成案の品質チェック
ステップ5: @style-checker → 構成案の表記チェック
  └── Manabuさん承認待ち
```

### セッション2: 本文執筆

```
⚠️ 一気書き禁止: 1回の出力はH2を1つだけ。サービス紹介は3〜5社ずつ分割。
⚠️ セクション完了ごとにチェックリスト全項目パスしないと次のH2に進めない。

開始前の準備:
  ├── 共起語配置計画を作成 → articles/{KW}-cooccurrence-plan.md（ゲート1）
  ├── service-info.mdの全サービスデータを読み込む
  └── 構成案（outline）のH2/H3見出しを確認し、変更しないことを宣言

ステップ1: @writer → H2単位で分割執筆
  推奨執筆順序: H2②サービス紹介 → H2①選び方 → H2③メリット → H2④注意点 → H2⑤FAQ → 導入文 → H2⑥まとめ

  【各H2の執筆フロー】
  ┌─ 1. 骨格出力（通常H3のみ。サービス紹介/FAQ/導入文/まとめは骨格不要）
  │     → articles/{KW}-skeleton-h2{N}.md（ゲート2）
  │
  ├─ 2. 骨格チェック: duplicate-checker + prep-logic-checker
  │     → editor統合 → writerに修正指示
  │
  ├─ 3. 文章化 → lint.sh実行（ゲート3: ERROR 0必須）
  │
  ├─ 4. 表現チェック: iron-rule-checker + kw-checker
  │     → editor統合 → writerに修正指示（最大3ループ）
  │
  ├─ 5. ★セクション完了チェックリスト（全項目パスしないと次のH2に進めない）★
  │     → 全項目パス → 次のH2へ
  │     → 1項目でもNG → そのセクションを修正して再チェック
  │
  └─ 6. サービス紹介H2のみ追加チェック:
        全社分完了後にduplicate-checker（サービス間酷似）+ lint.sh（書き出しパターン）

ステップ2: @editorial-reviewer → 全文レビュー（KW密度・訴求角度分散・論理構造）
ステップ3: @writer → 修正 → editorial-reviewerの再反論0件まで
ステップ4: lint.sh最終実行 → articles/{KW}-lint-final.txt（ゲート4）
ステップ5: @quality-checker → 最終品質チェック
ステップ6: @style-checker → 最終表記チェック
ステップ7: ★最終チェックリスト（法令チェック含む）★ → 全項目パスで完成
  └── 完成記事出力
```

### 強制ゲート（editorが門番）

| ゲート | チェックポイント | ブロック内容 |
|-------|----------------|------------|
| ゲート1 | `{KW}-cooccurrence-plan.md` | 共起語配置計画がないと骨格に進めない |
| ゲート2 | `{KW}-skeleton-h2{N}.md` | 骨格ファイルがないと文章化に進めない |
| ゲート3 | lint.sh ERROR 0 | lint通過前にチェッカーに渡さない |
| ゲート3b | **セクション完了チェックリスト全項目パス** | **1項目でもNGなら次のH2に進めない** |
| ゲート4 | `{KW}-lint-final.txt` ERROR 0 | 最終lint前に完成記事として認めない |
| ゲート5 | **最終チェックリスト（法令含む）全項目パス** | **全項目パスで初めて完成** |

---

## 出力ファイル命名規則

| 種別 | ファイル名 |
|------|----------|
| 構成案 | `articles/{KW}-outline.md` |
| 共起語配置計画 | `articles/{KW}-cooccurrence-plan.md` |
| 骨格 | `articles/{KW}-skeleton-h2{N}.md` |
| lintチェック結果 | `articles/{KW}-lint-result.txt` |
| 最終lintチェック | `articles/{KW}-lint-final.txt` |
| レビュー | `articles/{KW}-review.md` |
| レスポンス | `articles/{KW}-response.md` |
| 完成記事 | `articles/{KW}-article.html` |

---

## モデル設定

| エージェント | model |
|------------|-------|
| researcher | opus |
| writer | opus |
| editor | opus |
| duplicate-checker | opus |
| prep-logic-checker | opus |
| editorial-reviewer | sonnet |
| quality-checker | sonnet |
| style-checker | sonnet |
| iron-rule-checker | sonnet |
| kw-checker | sonnet |
