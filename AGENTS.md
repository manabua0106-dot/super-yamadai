# AGENTS.md — Codex用エントリポイント（参照スタブ）

**バージョン**：v5.0（2026-07-02・スタブ化）

---

## ⚠️ このファイルはスタブ（本文を持たない）

旧AGENTS.mdはCLAUDE.mdのコピーで、更新漏れによるドリフト（登録ブランド数の古さ・存在しないパス）が発生したため、参照スタブに変更した。**ルール・手順はここに書かない。以下の正本を読むこと。**

| 知りたいこと | 正本 |
|---|---|
| パイプライン定義・絶対遵守事項・5グループ責任分担 | [CLAUDE.md](CLAUDE.md) |
| **最上位ルール**（主語・目的語／サービス名は表／導入の型 ほか。他のどの規定にも優先。2026-10-08） | [.claude/rules/writing-manual.md](.claude/rules/writing-manual.md) の §0。検査は `python3 scripts/check-subject-object.py <article.html>`（`scripts/lint.sh` が内蔵） |
| ライティングルール全般（SSOT） | [.claude/rules/writing-manual.md](.claude/rules/writing-manual.md) |
| 禁止語・変換ルール（検査用語彙） | [.claude/rules/prohibited-words.md](.claude/rules/prohibited-words.md) |
| サービスのスペック・価格（唯一の正） | [.claude/rules/service-info.md](.claude/rules/service-info.md) |
| ショートコード・HTMLテンプレート | [.claude/rules/shortcodes.md](.claude/rules/shortcodes.md) |
| 訴求順位（カテゴリ別基本ランキング） | [.claude/rules/appeal-ranking.md](.claude/rules/appeal-ranking.md) |
| 文体のお手本（毎回参照・丸パクリ禁止） | [references/gold-example-style.md](references/gold-example-style.md) |
| **見本記事**（最上位ルール準拠・フィックス済み。書くパーツと同じ場所だけ見比べる・丸パクリ禁止） | [references/gold-article.md](references/gold-article.md)（→ `articles/ウォーターサーバー おすすめ/article.html`） |
| NG→OK対比集 | [references/style-examples.md](references/style-examples.md) |
| 機械チェック（本文） | `bash scripts/lint.sh articles/{KW}/article.html` |
| 機械チェック（**本文のKWと共起語**・2026-09-09 新設） | `python3 scripts/check-body-kw.py articles/{KW}/cooccurrence.json articles/{KW}/competitor.json articles/{KW}/article.html "<メインKW>" articles/{KW}/cooccurrence-plan.md` ／**Tier A 100%で合格**（入れない語は計画書の「配置しない語」に理由を書けば合格に数える。理由なしの未達はWARN・80%未満はERROR）。計画に書いたのに本文に無い語もERROR |
| 機械チェック（構成の見出し） | `bash scripts/lint-outline.sh articles/{KW}/outline.md` |
| 機械チェック（**競合の網羅**・2026-09-08 新設） | `python3 scripts/check-coverage.py articles/{KW}/competitor.json articles/{KW}/outline.md` |
| 機械チェック（**KWと共起語の競合比**・2026-09-09 新設） | `python3 scripts/check-kw-cooccurrence.py articles/{KW}/cooccurrence.json articles/{KW}/competitor.json articles/{KW}/outline.md "<メインKW>"` ／**カバー率80%以上で合格**（60%未満はERROR） |
| **ゲートを一気通貫で回す（まずこれ）** | `bash scripts/check-all.sh "articles/{KW}"` ／素材の有無＋全チェッカー＋見出しツリー出力までを1本で。**個別に回すのは切り分けのときだけ** |
| **構成をチャットに出す**（構成完成時・見出しを1本でも直した時・省略禁止） | `bash scripts/show-outline.sh articles/{KW}/outline.md` ／**この出力をそのまま貼る**。書き写すと省略が起きる |
| 機械チェック（**見出しの書き換え**・2026-09-09 新設） | `python3 scripts/check-heading-diff.py articles/{KW}/outline.md` ／消えた語を出す。**記録 `heading-3checks.md` にハッシュが無ければERROR** |
| 機械チェック（**実在検査**・2026-09-09 新設） | `python3 scripts/check-existence.py articles/{KW}/outline.md` ／service-info.md が存在しない・使わないと書いた語の検出 |
| 機械チェック（**訴求の向き**・2026-09-09 新設） | `python3 scripts/check-appeal.py articles/{KW}/outline.md` ／訴求社の指名記事で非訴求社（nosh・食宅便・わんまいる 等）の安さ・割引・価格を見出しに書いていたらERROR。タイトルにその社名がある比較記事は対象外 |
| 機械チェック（公開記事とのカニバリ） | `bash scripts/check-cannibal.sh articles/{KW}/outline.md` |
| 構成スキルの正本 | [.claude/skills/kosei-sakusei/SKILL.md](.claude/skills/kosei-sakusei/SKILL.md)（`.agents/skills/kosei-sakusei` からsymlinkで参照） |

## レビュー時の最優先観点（Codexレビュー用のメモ）

1. **情報ゼロ文**（消しても意味が変わらない文・言い換え・当たり前の総括）を文単位で検出する（writing-manual §E-12）
2. 見出し・本文の重複、PREP破綻、蛇足H3
3. 禁止語・法令リスクは lint.sh と writing-manual 付録1・2 を正とする（独自に再定義しない）
