---
description: tasks/ にワークスペース生成＋骨子作成
---

# /task

依頼ベースのタスクに対して、ワークスペースを切って分析骨子を作る。

## 引数

- `$1`：クライアント名
- `$2`：タスクのスラッグ（例：`pc-sp-analysis`、`monthly-report`）

## 動作

### 1. ワークスペース作成

```
clients/{client}/tasks/YYYY-MM-DD-{slug}/
├── brief.md         # 依頼内容・目的・期日・成果物形式
├── analysis.md      # 分析過程
└── deliverable.md   # 納品物（クライアントに渡す形）
```

### 2. brief.md の自動生成

ユーザーから依頼内容を受け取り、以下フォーマットで保存：

```markdown
# タスク：{タスク名}

**依頼日**：YYYY-MM-DD
**依頼者**：（誰から）
**期日**：YYYY-MM-DD HH:MM
**成果物形式**：（Notionに貼る / Slackに投稿 / PDF / Slide / 等）
**最終提出先**：（クライアント / 上司 / 内部 / 等）

---

## 依頼内容（原文）

（依頼文をそのまま貼る）

---

## 解釈・前提

（Claudeが解釈した前提・確認事項）

---

## アウトプット要件

- 形式：
- 含めるべき要素：
- 除外するべき要素：

---

## 必要なデータ

- [ ] データA
- [ ] データB

---

## 進め方

1. 
2. 
3. 

---

## リスク・注意

- 
```

### 3. 関連ファイルの参照

タスク骨子作成時、必ず以下を読む：
- `clients/{client}/CLAUDE.md`
- `clients/{client}/feedback-log.md`
- 該当する `knowledge/playbooks/` のテンプレ
- 該当する `knowledge/frameworks/`

### 4. analysis.md の骨子

タスクのテーマに応じて、以下のplaybookから骨子を持ってくる：

| テーマ | playbook |
|---|---|
| PC/SP差分析 | `playbooks/google-ads-pc-sp-analysis.md` |
| 計測監査 | `playbooks/conversion-tracking-audit.md` |
| マッチタイプ戦略 | `playbooks/match-type-strategy.md` |
| 月次レポート | `templates/monthly-report.md`（あれば） |

### 5. deliverable.md のフォーマット選定

成果物形式に応じて、テンプレを選ぶ：
- Notion貼り付け → markdown
- Slack投稿 → 短文＋箇条書き
- PDF → 整形markdown→PDF想定
- スライド → 1ページ1論点

## 出力

```
タスク作成完了：
- ディレクトリ：clients/blueworks/tasks/2026-05-15-pc-sp-analysis/
- brief.md / analysis.md / deliverable.md を生成
- 必要なデータ：（リスト）
- 次にやること：（提案）
```
