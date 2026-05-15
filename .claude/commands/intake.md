---
description: inbox/ の素材を判別して適切な場所に振り分ける
---

# /intake

`inbox/` 配下のファイル（または直貼りされた素材）を判別し、適切な場所に保存する。

## 動作

1. `inbox/` をリストし、ファイル一覧を取得
2. 各ファイルの内容を読み、以下に分類：

| 素材の種類 | 移動先 | ファイル名 |
|---|---|---|
| MTG書き起こし | `clients/{client}/meetings/` | `YYYY-MM-DD-transcript.md` |
| 議事録（整形済み） | `clients/{client}/meetings/` | `YYYY-MM-DD-summary.md` |
| 数値CSV/数値テキスト | `clients/{client}/data/snapshots/` | `YYYY-MM-DD.md`（markdown表に正規化） |
| 依頼文・タスク | `clients/{client}/tasks/YYYY-MM-DD-{slug}/` | `brief.md` |
| クライアント指摘 | `clients/{client}/feedback-log.md` | 追記 |
| LP情報・スクショ | `clients/{client}/services/{service}/` | 既存ファイルに追記 or `assets/` |
| 不明 | そのまま inbox/ に残す | ユーザーに確認 |

3. クライアント名がファイル内容から判別できない場合、ユーザーに確認

4. 移動・追記が完了したら、サマリを表示：

```
## 振り分け結果
| 元ファイル | 移動先 | 操作 |
|---|---|---|
| inbox/transcript.txt | clients/blueworks/meetings/2026-05-14-transcript.md | 移動 |
| inbox/data.csv | clients/blueworks/data/snapshots/2026-05-14.md | 正規化保存 |
```

## 直貼り対応

ユーザーがチャットに直貼りしてきた素材も、この手順で振り分ける。`inbox/` にファイルがなくても動く。

## 振り分け後の追加アクション

- MTG書き起こし → 同時に `summary.md` を生成（論点・決定・TODO）
- 数値スナップショット → 直前のスナップショットと差分を提示
- 依頼文 → そのまま `/task` を呼ぶか確認

## 注意

- クライアント側人物の発言から指摘・タブー・好みが読み取れたら、必ず `feedback-log.md` に追記
- 振り分けに迷ったら勝手に移動せず、ユーザーに確認
