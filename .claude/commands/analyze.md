---
description: 数値分析を実行（フォールバックでinbox直処理可）
---

# /analyze

数値データを分析する。`/snapshot` を経由せずに `inbox/` の生データから直接分析もできる。

## 引数

- `$1`：クライアント名（例：`blueworks`）。省略時は最後に触ったクライアント
- `$2`：分析テーマ（例：`pc-sp`、`weekly`、`device`）。省略時はユーザーに確認

## 動作

### 必読ファイル（順番）

1. `CLAUDE.md`（ルート）
2. `clients/{client}/CLAUDE.md`
3. `clients/{client}/feedback-log.md` ★必ず読む
4. `knowledge/frameworks/judgment.md`
5. `knowledge/frameworks/multi-axis-analysis.md`
6. `knowledge/frameworks/hypothesis-driven-analysis.md`
7. テーマに対応するplaybook（例：pc-spなら `knowledge/playbooks/google-ads-pc-sp-analysis.md`）

### データ取得

| ソース | 優先順位 |
|---|---|
| `clients/{client}/data/snapshots/` の最新ファイル | 1 |
| `inbox/` の数値データ（CSV / txt / 直貼り） | 2 |
| ユーザーへ追加データ依頼 | 3（不足時のみ） |

### 分析手順

1. データをフラットに記述（解釈なし）
2. 判定基準を明示（CPA基準・ボリューム基準・最終KPI基準）
3. 多軸クロス（媒体×商材×デバイス×年齢など）
4. 仮説を5つ網羅
5. 各仮説をデータで検証（成立 / 棄却 / 検証不可）
6. アクション設計（何を/どれくらい/いつまでに/成功基準）
7. クライアント報告フォーマットで出力

### 出力先

- 分析結果：`clients/{client}/tasks/YYYY-MM-DD-{slug}/analysis.md`（タスクある場合）
- または `clients/{client}/issues/YYYY-MM-DD-{slug}.md`
- 必ずユーザーに「保存先候補」を提示してから保存

## 出力スタイル

ルートCLAUDE.md の出力スタイル節に従う：
- 結論先出し
- 表多用
- 短文・箇条書き
- 「悪化/改善」は基準明示
- 「自動入札の学習が」など検証なしロジック禁止

## 直貼り対応

ユーザーが「これ分析して」+ 数値テキスト直貼り でも動く：
1. 直貼り内容を `inbox/{timestamp}-pasted.md` に保存
2. 上記手順で分析
3. 分析後、ユーザーに「これを `data/snapshots/` に正規化保存しますか？」と確認
