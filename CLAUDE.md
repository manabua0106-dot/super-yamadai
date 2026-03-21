# CLAUDE.md — ヤマダイ記事制作パイプライン

## ⚠️ 絶対遵守事項（最優先で読め）

1. **通常H3は必ず「骨格 → 構造チェック → 文章化 → 表現チェック」の2段階で書く。** 骨格を飛ばして完成文を出力した場合、editorは受け付けずに差し戻す。
2. **lint.shは文章化のたびに必ず実行する。** ERROR が1件でもあれば次に進めない。
3. **1文目は結論から。** 背景説明・リスク説明・仕事説明から入ったら即修正。「〜ためです。」で終わる1文目は禁止。
4. **禁止語（「こと」「として」「という」「といった」「指示語」）は絶対に使わない。** lint.shで検出されたら即差し戻し。
5. **共起語の配置計画を骨格段階で立てる。** 依頼情報の共起語リストを各H2/H3に分配してから書き始める。
6. **構成段階でKWニーズとH2順序の整合性を確認する。** H2①がKWの検索意図に直接回答しているかをresearcherが必ずチェック。
7. **吹き出しは不要。ヤマダイ記事では吹き出しパーツを使用しない。**
8. **テーブル（サービス紹介）は5行固定。** 会社・費用・配送エリア・配送日時の設定・お試しの有無（or お試し内容）。
9. **訴求順位は固定ではない。毎記事の依頼情報（構成書・発注指示書）に記載されるので、それを読み込んでそのまま反映する。** 番号を勝手に振り直さない。H2②の掲載順は訴求順位が最優先。非訴求社の認知度を理由に先頭に置かない。依頼情報に訴求順位の記載がない場合のみ、マニュアルC-4のデフォルト訴求社を使う。
10. **H2見出しにはメインKWの全構成要素を含める。** 見出しを修正するたびにKW含有を再チェックする。修正でKWが抜け落ちることが頻発する。
11. **H3見出しは1テーマ1見出し。** 2つ以上のテーマを1つのH3に詰め込まない。

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
開始前の準備:
  ├── 共起語配置計画を作成 → articles/{KW}-cooccurrence-plan.md（ゲート1）
  └── 全サービスのテーブル・CTA情報をservice-info.mdから事前確認

ステップ1: @writer → H2単位で執筆（通常H3は骨格→文章化の2段階）
  ├── 通常H3: 骨格出力 → articles/{KW}-skeleton-h2{N}.md（ゲート2）
  ├── 骨格チェック: duplicate-checker + prep-logic-checker
  ├── editor統合 → writerに修正指示
  ├── 文章化 → lint.sh実行 → articles/{KW}-lint-result.txt（ゲート3）
  ├── 表現チェック: iron-rule-checker + kw-checker
  ├── editor統合 → writerに修正指示（最大3ループ）
  ├── サービス紹介H3: テンプレートコピペ → 紹介文追記（骨格不要）
  ├── リード文・FAQ・まとめ: 1段階で出力（骨格不要）
  └── 出力: articles/{KW}-article.html

ステップ2: @editorial-reviewer → 本文レビュー（KW密度・訴求角度分散・論理構造）
ステップ3: @writer → 修正 → editorial-reviewerの再反論0件まで

ステップ4: lint.sh最終実行 → articles/{KW}-lint-final.txt（ゲート4）
ステップ5: @quality-checker → 最終品質チェック
ステップ6: @style-checker → 最終表記チェック
  └── 完成記事出力
```

### 強制ゲート（editorが門番）

| ゲート | チェックポイントファイル | ブロック内容 |
|-------|----------------------|------------|
| ゲート1 | `{KW}-cooccurrence-plan.md` | 共起語配置計画がないと骨格に進めない |
| ゲート2 | `{KW}-skeleton-h2{N}.md` | 骨格ファイルがないと文章化に進めない |
| ゲート3 | `{KW}-lint-result.txt` | lint ERROR 0でないとチェッカーに渡さない |
| ゲート4 | `{KW}-lint-final.txt` | 最終lint結果がないと完成記事として認めない |

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
