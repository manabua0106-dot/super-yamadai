#!/usr/bin/env bash
# check-all.sh — 構成案のゲートを一気通貫で回す入口。これ1本を叩けば全部そろう
#
# 使い方:
#   bash scripts/check-all.sh "articles/{KW}"
#   bash scripts/check-all.sh "articles/三ツ星ファーム ナッシュ 比較"
#
# なぜ作ったか:
#   2026-09-09、チェッカーを7本に増やした当日に「🚨10・ゲート0・新スクリプト4本を
#   どれも使わずに進めていた」という事故が起きた。**ルールが増えるほど使い忘れる。**
#   入口を1本にして、必要な素材が無いことも、チェッカーの回し忘れも、機械が止める。
#
# やること:
#   1. 必要な素材がそろっているか確認（無ければ ERROR で止める）
#   2. 全チェッカーを決まった順で回す
#   3. 合否をまとめて出す
#   4. 最後に H2/H3 のツリーを出す（Manabuさんへの提示用・そのまま貼る）
set -uo pipefail
DIR="${1:-}"
if [ -z "$DIR" ] || [ ! -d "$DIR" ]; then
  echo "使い方: bash scripts/check-all.sh \"articles/{KW}\"" >&2
  exit 2
fi
DIR="${DIR%/}"
KW="$(basename "$DIR")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

OUTLINE="$DIR/outline.md"
COMP="$DIR/competitor.json"
COOC="$DIR/cooccurrence.json"
PLAN="$DIR/cooccurrence-plan.md"

FAIL=0
note() { printf '  %s\n' "$1"; }
head2() { printf '\n══ %s ══\n' "$1"; }

head2 "0. 必要な素材"
miss=0
for f in "$OUTLINE" "$COMP" "$COOC"; do
  if [ -f "$f" ]; then
    note "OK   $(basename "$f")"
  else
    note "ERROR $(basename "$f") が無い"
    miss=$((miss + 1))
  fi
done
if [ ! -f "$COMP" ]; then
  note "  → mcp__claude_ai__headline(keyword, limit=10, h4=true, lessCharacters=true) のJSONを $COMP に保存する"
fi
if [ ! -f "$COOC" ]; then
  note "  → mcp__claude_ai__co-occurrence(keyword, limit=150, sortBy=\"siteCountHeading\") のJSONを $COOC に保存する"
  note "  ⚠️ 共起語を取らずに構成を確定させない（ゲート1）。LLMの推測で共起語リストを作らない"
fi
[ -f "$PLAN" ] && note "OK   cooccurrence-plan.md" || note "INFO cooccurrence-plan.md は本文執筆フェーズで作る"
if [ "$miss" -gt 0 ]; then
  FAIL=1
  printf '\n素材が %d 件足りない。取得してからやり直す。以降のチェックは意味がないので止める\n' "$miss"
  printf '\n══ 判定 ══\n  ERROR: 素材不足で検査できない\n'
  exit 1
fi

run() { # 表示名 コマンド...
  local name="$1"; shift
  head2 "$name"
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  printf '%s\n' "$out" | grep -E '^(ERROR|WARN|INFO|── INFO|   ERROR|   WARN|   INFO|check-|lint-|■ 判定|   ★)' || printf '%s\n' "$out" | tail -3
  [ "$rc" -ne 0 ] && FAIL=1
  return 0
}

run "1. 見出しの機械チェック（lint-outline.sh）" bash scripts/lint-outline.sh "$OUTLINE"
run "2. 実在検査（service-info.md の存在しない語）" python3 scripts/check-existence.py "$OUTLINE"
run "3. 見出しの書き換えと3検査の記録（ゲート0）" python3 scripts/check-heading-diff.py "$OUTLINE"
run "4. メインKWと共起語の競合比（🚨10）" python3 scripts/check-kw-cooccurrence.py "$COOC" "$COMP" "$OUTLINE" "$KW"
run "5. 訴求の向き（非訴求社への送客になっていないか）" python3 scripts/check-appeal.py "$OUTLINE"
run "6. 公開記事とのカニバリ" bash scripts/check-cannibal.sh "$OUTLINE"
run "6b. 情報台帳（置き場所が1か所ずつか。台帳が無い既存の構成はINFOだけ）" python3 scripts/check-ledger.py "$OUTLINE"

head2 "7. 競合トピックの網羅（🚨9）"
TREE="$(mktemp)"
awk '/^---$/{n++} n==1' "$OUTLINE" > "$TREE"
python3 scripts/check-coverage.py "$COMP" "$TREE" 2>&1 | grep -E '^(ERROR|check-coverage)' || true
python3 scripts/check-coverage.py "$COMP" "$TREE" >/dev/null 2>&1 || FAIL=1
rm -f "$TREE"

head2 "判定"
if [ "$FAIL" -eq 0 ]; then
  echo "  すべて通過。ただし機械が見られないものは残る:"
else
  echo "  ERROR あり。上を直してから出す。機械が見られないものも残る:"
fi
cat <<'TXT'
   ・H2の約束と配下H3の論理関係（要件定義 §9）… 束で読んで人が判断する
   ・主語のすり替わり … 「Xの冷凍庫は16,500円かかる」型は機械で検出できない
   ・見出しの意味が一読で通るか … 音読する
   ・KW選定そのものの妥当性 … 検索意図の判断
   ・そのH2が蛇足でないか … check-coverage のERRORを消す目的で足した見出しは疑う
     （2026-09-09 ニチレイ：足した他社比較H2のH3 3本中2本が非訴求社の宣伝だった）
TXT

head2 "提示用の見出しツリー（この下をそのままチャットに貼る）"
bash scripts/show-outline.sh "$OUTLINE"

exit "$FAIL"
