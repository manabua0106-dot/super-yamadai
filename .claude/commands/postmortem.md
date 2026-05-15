---
description: MTG振り返り＋feedback-log.md更新
---

# /postmortem

MTG後に振り返り、学びを `feedback-log.md` に追記する。

## 引数

- `$1`：クライアント名
- `$2`：MTG日付（省略時は今日）

## 動作

### 1. 必読ファイル

- `clients/{client}/meetings/YYYY-MM-DD-transcript.md`（書き起こし）
- `clients/{client}/meetings/YYYY-MM-DD-summary.md`（議事録）
- `clients/{client}/feedback-log.md`（既存ログ）

### 2. クライアント発言の分類

書き起こし・議事録から、クライアント発言を以下に分類：

| 分類 | 例 |
|---|---|
| 事実の共有 | 「予算は130万です」 |
| 主張・解釈 | 「これは改善している」 |
| 要望 | 「デバイス別に分けてほしい」 |
| 指摘・批判 | 「悪化と思い込んでロジック後付けしている」 |
| 質問 | 「年齢別の数値は？」 |
| 承認 | 「アクションは良いと思います」 |

### 3. 学びの抽出

以下に該当する発言を `feedback-log.md` に追記：

- 指摘・批判 → 「事案 / 詳細 / 学び / 再発防止」の4要素で記録
- 質問（こちらが事前に持っていなかった視点） → 「事案 / 学び」で記録
- クライアント独自の仮説 → 「学び」として記録
- 人物の癖・好み → 該当節に追記

### 4. 再発防止策の検討

学びごとに、以下のいずれかで再発防止：

| 再発防止策 | 具体的な作業 |
|---|---|
| ルートCLAUDE.md更新 | 絶対遵守事項に追加 |
| クライアントCLAUDE.md更新 | クライアント固有事情に追加 |
| playbook化 | `knowledge/playbooks/` に新規 or 更新 |
| frameworks化 | `knowledge/frameworks/` に新規 or 更新 |
| slash command化 | `.claude/commands/` に新規 |

### 5. 次回MTGへの引き継ぎ

次回MTGで実施すべきことを `clients/{client}/issues/` に起票：

```markdown
# YYYY-MM-DD MTG postmortem & next actions

## 振り返り
- 良かった点：
- 改善点：

## 学び（feedback-log.md に追記済み）
- 

## 次回MTGへの宿題
- [ ] 
- [ ] 

## 修正したファイル
- 
```

### 6. 出力

- `feedback-log.md` 追記
- `issues/YYYY-MM-DD-postmortem.md` 作成
- 関連playbookやframeworksの更新があれば実施
- ユーザーに「追記内容と再発防止策」をサマリ提示

## 重要

**postmortemは「次回同じ失敗を繰り返さないため」のもの**。
個人攻撃や責任追及ではなく、**仕組みで再発を防ぐ**ことに集中する。
