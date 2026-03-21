# yamadai-articles

スーパーヤマダイ（super-yamadai.co.jp/article）食材宅配サービス比較記事の制作パイプライン。

## ディレクトリ構造

```
yamadai-articles/
├── CLAUDE.md                          ← パイプライン定義・絶対遵守事項
├── README.md
├── .claude/
│   ├── agents/
│   │   ├── researcher.md             ← 構成案作成（競合TTP強化版）
│   │   ├── writer.md                 ← 本文執筆（骨格→文章化の2段階）
│   │   ├── editorial-reviewer.md     ← セカンドオピニオン
│   │   ├── editor.md                 ← 統率・ゲート管理
│   │   ├── duplicate-checker.md      ← 重複検出専門
│   │   ├── prep-logic-checker.md     ← PREP構造・論理専門
│   │   ├── iron-rule-checker.md      ← 鉄の掟（読者に伝わるか）専門
│   │   ├── kw-checker.md             ← KW特化度専門
│   │   ├── quality-checker.md        ← 品質チェック（構造・ルール準拠）
│   │   └── style-checker.md          ← 表記チェック（禁止表現・HTML）
│   └── rules/
│       ├── writing-manual.md          ← ライティングマニュアルv3.0全文
│       ├── prohibited-words.md        ← 禁止語・変換ルール
│       ├── shortcodes.md              ← ショートコード・HTMLテンプレート
│       ├── service-info.md            ← 各サービスのスペック情報
│       └── internal-links.md          ← 内部リンクリスト
├── references/
│   ├── h3-templates.md                ← H3タイプ別の骨格テンプレート
│   ├── structure-examples.md          ← 構成パターンの合格例
│   └── style-examples.md             ← 本文の装飾・文体パターン例
├── scripts/
│   └── lint.sh                        ← 機械チェッカー
└── articles/                          ← 記事出力先
```

## セットアップ後にやること

1. `.claude/rules/writing-manual.md` にライティングマニュアルv3.0の全文を貼り付ける
2. `.claude/rules/service-info.md` に各サービスの最新スペック情報を入力する
3. Claude Code Web でリポジトリに接続してテスト実行
