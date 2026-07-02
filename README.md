# yamadai-articles

スーパーヤマダイ（super-yamadai.co.jp/article）食材宅配・宅配弁当比較記事の制作パイプライン。

**更新日**：2026-07-02（構造を現状に同期）

## ディレクトリ構造

```
super-yamadai/
├── CLAUDE.md                          ← パイプライン定義・絶対遵守事項（Claude用）
├── AGENTS.md                          ← Codex用エントリ（参照スタブ。本文はCLAUDE.mdと正本群）
├── README.md
├── .claude/
│   ├── agents/                        ← 10エージェント定義（writer v5 / editor / checkers…）＋codex-reviewer
│   ├── rules/
│   │   ├── writing-manual.md          ← ⭐ライティングルールのSSOT正本（v4.0）
│   │   ├── prohibited-words.md        ← 禁止語・変換ルール（lint用語彙テーブル）
│   │   ├── shortcodes.md              ← ショートコード・HTMLテンプレート
│   │   ├── service-info.md            ← 各サービスのスペック情報（唯一の正）
│   │   ├── appeal-ranking.md          ← カテゴリ別の基本ランキング（デフォルト訴求順位）
│   │   ├── internal-links.md          ← 内部リンクリスト（カニバリ照合用）
│   │   └── feedback_writing/structure/legal.md ← 未昇格FBの一時記録（昇格したら削除）
│   ├── skills/
│   │   └── kosei-sakusei/             ← 構成案作成スキル（SKILL.md＋要件定義＋pipeline.js）
│   └── reviews/                       ← スキル・パイプラインの点検記録
├── references/
│   ├── gold-example-style.md          ← ⭐文体・トンマナのお手本（執筆前に毎回参照・丸パクリ禁止）
│   ├── h3-templates.md                ← H3タイプ別の骨格テンプレート（情報インベントリ方式・v5）
│   ├── style-examples.md              ← NG→OK対比集（実レビューで直された失敗パターン・v5）
│   └── structure-examples.md          ← H2/H3構成パターンの合格例
├── scripts/
│   └── lint.sh                        ← 機械チェッカー（ERROR=機械・安全系／WARNING=意味判断系）
└── articles/
    ├── {日本語KW}/                    ← 制作中の記事（outline.md / research.md / article.html 等）
    └── 完成済み/                      ← 納品済み記事（新規はKWフォルダ単位。旧命名の平置きは遡及変更しない）
```

## 制作フロー（概要）

1. **構成案**：`kosei-sakusei` スキル（KW＋依頼情報 → `articles/{KW}/outline.md`）
2. **本文執筆**：CLAUDE.md セッション2の通り（writer が H2単位で骨格→文章化、lint.sh＋チェッカー＋強制ゲート5つ）
3. **品質の考え方**：lint ERROR 0 は必要条件。意味レビュー（writing-manual §E-12・情報ゼロ文の削除）を通して初めて提示可

## 運用メモ

- ライティングルールの正本は `writing-manual.md` のみ。他ファイルは参照（SSOT）
- 価格・スペックは `service-info.md` が唯一の正（外部ソース・記憶からの補完禁止）
- lint実行：`bash scripts/lint.sh "articles/{KW}/article.html"`
