# AGENTS.md — Codex用エントリポイント（参照スタブ）

**バージョン**：v5.0（2026-07-02・スタブ化）

---

## ⚠️ このファイルはスタブ（本文を持たない）

旧AGENTS.mdはCLAUDE.mdのコピーで、更新漏れによるドリフト（登録ブランド数の古さ・存在しないパス）が発生したため、参照スタブに変更した。**ルール・手順はここに書かない。以下の正本を読むこと。**

| 知りたいこと | 正本 |
|---|---|
| パイプライン定義・絶対遵守事項・5グループ責任分担 | [CLAUDE.md](CLAUDE.md) |
| ライティングルール全般（SSOT） | [.claude/rules/writing-manual.md](.claude/rules/writing-manual.md) |
| 禁止語・変換ルール（検査用語彙） | [.claude/rules/prohibited-words.md](.claude/rules/prohibited-words.md) |
| サービスのスペック・価格（唯一の正） | [.claude/rules/service-info.md](.claude/rules/service-info.md) |
| ショートコード・HTMLテンプレート | [.claude/rules/shortcodes.md](.claude/rules/shortcodes.md) |
| 訴求順位（カテゴリ別基本ランキング） | [.claude/rules/appeal-ranking.md](.claude/rules/appeal-ranking.md) |
| 文体のお手本（毎回参照・丸パクリ禁止） | [references/gold-example-style.md](references/gold-example-style.md) |
| NG→OK対比集 | [references/style-examples.md](references/style-examples.md) |
| 機械チェック | `bash scripts/lint.sh articles/{KW}/article.html` |

## レビュー時の最優先観点（Codexレビュー用のメモ）

1. **情報ゼロ文**（消しても意味が変わらない文・言い換え・当たり前の総括）を文単位で検出する（writing-manual §E-12）
2. 見出し・本文の重複、PREP破綻、蛇足H3
3. 禁止語・法令リスクは lint.sh と writing-manual 付録1・2 を正とする（独自に再定義しない）
