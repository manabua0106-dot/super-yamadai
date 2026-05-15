# inbox/

未整理の素材投げ込み場所。

## 何を投げるか

- MTG書き起こし（音声テキスト・Zoom文字起こし等）
- 議事録PDF（テキスト抽出して .txt or .md で）
- 管理画面エクスポート（CSV）
- スクショ（画像 or 文字起こし）
- 上司・クライアントからの依頼文
- その他、整理する前に一旦置きたいもの

## 命名

なんでもOK。Claudeが `/intake` で適切な場所に振り分ける。

## 整理フロー

1. ファイルを inbox/ に置く
2. `/intake` を呼ぶ → Claudeが内容を判別
3. 適切な場所に移動：

| 素材の種類 | 移動先 |
|---|---|
| MTG書き起こし | `clients/{client}/meetings/YYYY-MM-DD-transcript.md` |
| 議事録PDF抜粋 | `clients/{client}/meetings/YYYY-MM-DD-summary.md` |
| 数値CSV | raw保管 + `clients/{client}/data/snapshots/YYYY-MM-DD.md` |
| 依頼文 | `clients/{client}/tasks/YYYY-MM-DD-{slug}/brief.md` |
| クライアント指摘 | `clients/{client}/feedback-log.md` に追記 |

## 直貼り運用

ファイルを置かず、チャットに直貼りでもOK。Claudeが内容を判別して適切な場所に保存する。
