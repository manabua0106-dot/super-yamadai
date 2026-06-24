# AGENTS.md — ヤマダイ記事制作パイプライン

**バージョン**：v4.0（2026-04-24）
**正本マニュアル**：`.Codex/rules/writing-manual.md`

---

## ⚠️ 最重要：Single Source of Truth

このリポジトリの**ライティングルールは `writing-manual.md` のみが正本**です。
本ファイル（AGENTS.md）・各エージェント・各チェッカーは、writing-manual.md を参照するだけで、ルールを独自に再定義しません。

矛盾が生じた場合は writing-manual.md の記述が優先されます。

---

## 絶対遵守事項（5グループ責任分担）

writing-manual §L に定義される5グループの責任分担に従う。

### 🟪 グループA：企画系（researcher）

1. **ハルシネーション絶対禁止。** WebSearch/WebFetchで実アクセスしたデータのみ記載する
2. **構成案のH2/H3見出しは、writerが1文字も変えずに採用する**（researcherが再設計しない）
3. **依頼情報の訴求順位を最優先で反映する。** 番号を勝手に振り直さない

### 🟦 グループB：執筆系（writer）

4. **記事HTMLを一気に書かない。必ずH2単位で分割して出力する**
5. **通常H3は必ず「骨格 → 構造チェック → 文章化 → 表現チェック」の2段階**
6. **lint.shは文章化のたびに必ず実行**
7. **1文目は結論から。** 背景説明・リスク説明から入らない
8. **一文一改行・60字以内**（writing-manual §E-3）
9. **推測で数値を書かない。** `[出典名](URL)` を併記（writing-manual §F-4）
10. **service-info.md が唯一の正。** テーブル・画像・CTA・アフィリURLはservice-info.mdからコピペ
11. **サービス紹介H2は3〜5社ずつに分割出力**
12. **構成案のH2/H3見出しを勝手に変えない**
13. **法令セーフ変換表10パターンを執筆段階で必ず適用**（writing-manual 付録1）
14. **書いたら自分でチェックして、問題があれば自分で直してから出力する**
15. **`pタグ`は絶対に出力しない。** WordPress側で自動付与されるため二重になる（writing-manual §D-1補足）
16. **`_table`ショートコード登録済みサービスは画像＋テーブル直書き禁止。** 必ず `[サービス名_table]` で置換する（writing-manual §C-1補足2）
    - 登録済み11ブランド: Oisix / コープデリ / ヨシケイ / ラディッシュボーヤ / Dr.ツルガメキッチン / Meals / タイヘイ / ワタミ / 筋肉食堂DELI / watamidirect / lifemeal
17. **本文の具体例とulを二重に書かない。** 具体例をulで列挙する場合は、本文側の同内容文を削除する（writing-manual §E-2補足）
18. **「実質単価」「圧迫」「占有」「家庭の食材」「タイプ別の〇〇」は完全禁止。** 中学生でもわかる日常語に置換（writing-manual 付録2 カテゴリA）
19. **サービス紹介文は4〜6文程度に簡潔にする。** 「夫婦で〇〇食」「平日5日分」のような無理やりな取り入れ方文を追加しない

### 🟫 グループC：統率系（editor）

15. **強制ゲート5つの門番として、チェックポイントファイルの存在を確認する**（writing-manual §G-6）
16. **セクション完了チェックリスト全項目パスしないと次のH2に進めない**（writing-manual §G-4）
17. **最終チェックリスト全項目パスで初めて完成**（writing-manual §G-5）

### 🟩 グループD：自動検査系（quality-checker / style-checker / kw-checker）

18. **禁止語・AI定型表現・景表法リスクは lint.sh + grep で自動検出**
19. **writing-manual の禁止語リストを参照し、独自に再定義しない**

### 🟥 グループE：意味検査系（editorial-reviewer / iron-rule-checker / prep-logic-checker / duplicate-checker）

20. **文脈判断系（レイヤー8・10・13）は LLM で意味検査**
21. **editor の矛盾解決優先順位**：duplicate > prep-logic > iron-rule > kw（writing-manual §L）

---

## プロジェクト概要

- サイト: スーパーヤマダイ（super-yamadai.co.jp/article）
- ジャンル: 食材宅配サービス・宅配弁当サービスの比較記事
- CMS: WordPress
- 訴求社（食材宅配）: Oisix / ヨシケイ / らでぃっしゅぼーや / コープデリ
- 訴求社（宅配弁当）: 依頼情報に従う（service-info.md 参照）
- 非訴求社: 上記以外すべて

---

## 参照ファイル一覧

| カテゴリ | ファイル | 内容 |
|---|---|---|
| ルール | `.Codex/rules/writing-manual.md` | ⭐ SSOT正本（v4.0） |
| ルール | `.Codex/rules/prohibited-words.md` | 禁止語・変換ルール |
| ルール | `.Codex/rules/shortcodes.md` | ショートコード・HTMLテンプレート |
| ルール | `.Codex/rules/service-info.md` | 各サービスのスペック情報 |
| ルール | `.Codex/rules/internal-links.md` | 内部リンクリスト |
| ルール | `.Codex/rules/feedback_writing.md` | 未昇格の文体FB一時記録 |
| ルール | `.Codex/rules/feedback_structure.md` | 未昇格の構成FB一時記録 |
| ルール | `.Codex/rules/feedback_legal.md` | 食材宅配・宅配弁当固有の法令FB |
| 参考 | `references/structure-examples.md` | H2/H3構成パターンの合格例 |
| 参考 | `references/style-examples.md` | 本文の装飾・文体パターン例 |
| 参考 | `references/h3-templates.md` | H3タイプ別骨格テンプレート |
| スクリプト | `scripts/lint.sh` | 機械チェッカー |

---

## パイプライン定義

### セッション1: 構成案作成

```
⚠️ 出力分割: researcherは1回でステップ1〜7を全部出さない。ステップごとに分割。

ステップ1: @researcher → 構成案v1を出力（分割出力）
ステップ2: @editorial-reviewer → 構成案をレビュー
ステップ3: @researcher → 提案を取捨選択して構成案を修正
  ※ editorial-reviewerの再反論が0件になるまでステップ2-3をループ
ステップ4: @quality-checker → 構成案の品質チェック
ステップ5: @style-checker → 構成案の表記チェック
  → Manabuさん承認待ち
```

### セッション2: 本文執筆

```
⚠️ 一気書き禁止: 1回の出力はH2を1つだけ。サービス紹介は3〜5社ずつ分割。
⚠️ セクション完了ごとにチェックリスト全項目パスしないと次のH2に進めない。

開始前の準備:
  ├── 共起語配置計画を作成 → {KW}-cooccurrence-plan.md（ゲート1）
  ├── service-info.mdの全サービスデータを読み込む
  └── 構成案のH2/H3見出しを確認し、変更しないことを宣言

ステップ1: @writer → H2単位で分割執筆
  推奨執筆順序: H2②サービス紹介 → H2①選び方 → H2③メリット → H2④注意点 → H2⑤FAQ → 導入文 → H2⑥まとめ

  【各H2の執筆フロー】
  ┌─ 1. 骨格出力（通常H3のみ）
  │     → {KW}-skeleton-h2{N}.md（ゲート2）
  │
  ├─ 2. 骨格チェック: duplicate-checker + prep-logic-checker
  │     → editor統合 → writerに修正指示
  │
  ├─ 3. 文章化 → lint.sh実行（ゲート3: ERROR 0必須）
  │
  ├─ 4. 表現チェック: iron-rule-checker + kw-checker
  │     → editor統合 → writerに修正指示（最大3ループ）
  │
  ├─ 5. ★セクション完了チェックリスト（ゲート3b）★
  │     → 全項目パス → 次のH2へ
  │
  └─ 6. サービス紹介H2のみ追加チェック:
        全社分完了後にduplicate-checker（サービス間酷似）+ lint.sh（書き出しパターン）

ステップ2: @editorial-reviewer → 全文レビュー
ステップ3: @writer → 修正 → editorial-reviewerの再反論0件まで
ステップ4: lint.sh最終実行 → {KW}-lint-final.txt（ゲート4）
ステップ5: @quality-checker → 最終品質チェック
ステップ6: @style-checker → 最終表記チェック
ステップ7: ★最終チェックリスト（ゲート5・法令チェック含む）★ → 全項目パスで完成
```

### 強制ゲート（writing-manual §G-6）

| ゲート | チェックポイント | ブロック内容 |
|---|---|---|
| ゲート1 | `{KW}-cooccurrence-plan.md` | 共起語配置計画がないと骨格に進めない |
| ゲート2 | `{KW}-skeleton-h2{N}.md` | 骨格ファイルがないと文章化に進めない |
| ゲート3 | lint.sh ERROR 0 | lint通過前にチェッカーに渡さない |
| ゲート3b | **セクション完了チェックリスト全項目パス**（§G-4） | **1項目でもNGなら次のH2に進めない** |
| ゲート4 | `{KW}-lint-final.txt` ERROR 0 | 最終lint前に完成記事として認めない |
| ゲート5 | **納品前チェックリスト全項目パス**（§G-5） | **全項目パスで初めて完成** |

---

## 出力ファイル命名規則

| 種別 | ファイル名 |
|---|---|
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

| エージェント | グループ | model |
|---|---|---|
| researcher | 🟪 A | opus |
| writer | 🟦 B | opus |
| editor | 🟫 C | opus |
| duplicate-checker | 🟥 E | opus |
| prep-logic-checker | 🟥 E | opus |
| editorial-reviewer | 🟥 E | sonnet |
| quality-checker | 🟩 D | sonnet |
| style-checker | 🟩 D | sonnet |
| iron-rule-checker | 🟥 E | sonnet |
| kw-checker | 🟩 D | sonnet |

---

## 運用ルール

- **AGENTS.md は200行以内を維持。** ルール追加は writing-manual.md に書く
- **feedback_*.md は一時的な記録場所。** 恒久ルール化が決まったら writing-manual.md に昇格させ、feedback からは削除する（SSOT 維持のため二重管理回避）
- **memory に「今の作業進捗」は入れない。** 入れるのは「次回以降も使える普遍的な学び」だけ

---

## 変更履歴

### v4.0（2026-04-24）

- 5グループ責任分担を明文化（writing-manual §L と連動）
- 絶対遵守事項19項目 → グループ別21項目に再編
- 法令セーフ変換表10パターン → writing-manual 付録1 に移譲
- feedback_*.md 3ファイル（文体・構成・法令）を新設
- SSOT化の宣言を冒頭に明記
- 200行以内原則を復活

### v3.0

- 初版
