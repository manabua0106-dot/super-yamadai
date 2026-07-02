#!/bin/bash
# lint-outline.sh — 構成案（outline.md）の見出しツリーを機械チェックする（ヤマダイ版）
# 使い方: bash scripts/lint-outline.sh "articles/{KW}/outline.md"
# 対象: 「H1 」「H2 」「　H3 」で始まる見出し行＋「- タイトル：」行のみ（約束文・メモは対象外）
# ERROR 1件でも exit 1。提示前に ERROR 0 にする（kosei-sakusei SKILL.md ⚡標準フロー）。
set -u
export LC_ALL=en_US.UTF-8
FILE="${1:?使い方: bash scripts/lint-outline.sh <outline.mdのパス>}"
[ -f "$FILE" ] || { echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; }

ERR=0; WARN=0
err() { echo "ERROR [$1] L$2: $3"; ERR=$((ERR+1)); }
warn() { echo "WARN  [$1] L$2: $3"; WARN=$((WARN+1)); }

# 見出しツリー行（H1/H2/H3）を行番号付きで抽出
grep -nE '^(H1 |H2 |[　[:space:]]*H3 )' "$FILE" | while IFS=: read -r LN TEXT; do
  H=$(echo "$TEXT" | sed -E 's/^[　[:space:]]*//')
  IS_H1=0; echo "$H" | grep -q '^H1 ' && IS_H1=1
  # 1. 見出し内のカッコ・記号（🚨4・§8-2）※！はH1（タイトル）のみ可（2026-07-02裁定）
  echo "$H" | grep -qE '（|）|【|】|｜|※|★' && err "カッコ記号" "$LN" "$H"
  [ "$IS_H1" -eq 0 ] && echo "$H" | grep -qE '!|！' && err "感嘆符" "$LN" "$H"
  # 2. 疑問符（H1は可・H2/H3はFAQ質問H3「〜ですか？/ありますか？/ますか？」のみ許容・§10.2）
  if [ "$IS_H1" -eq 0 ] && echo "$H" | grep -q '？\|?'; then
    echo "$H" | grep -qE '(ですか？|ありますか？|ますか？)$' || err "疑問符" "$LN" "$H"
  fi
  # 2b. FAQ語尾の？漏れ（「〜ですか/ますか」で終わるのに？がない）
  echo "$H" | grep -qE '(ですか|ますか)$' && err "FAQ語尾" "$LN" "${H}（「〜ですか？」と全角？で締める）"
  # 3. AI臭ナンバリング「○つの」（付録2カテゴリC）
  echo "$H" | grep -qE '([0-9]|１|２|３|４|５|６|７|８|９|一|二|三|四|五|六|七|八|九|十)つの' && err "○つの" "$LN" "$H"
  # 4. 冗長な動詞・連体修飾（🚨13・2026-07-02 FB）→ 最短形に
  echo "$H" | grep -qE 'に関するよくある質問|で気をつけたい|を頼んだ(良い|気になる)|を利用する際の' && err "冗長修飾" "$LN" "${H}（→「〜のよくある質問」「〜の注意点」「〜の良い口コミ」等の最短形に）"
  # 5. 単独で曖昧な名詞（🚨13）
  if echo "$H" | grep -q '定期' && ! echo "$H" | grep -qE '定期便|定期コース|定期宅配|定期購入'; then
    warn "曖昧名詞" "$LN" "${H}（「定期」→「定期便」等に具体化）"
  fi
  # 6. 業界語・硬語（付録2カテゴリA抜粋・見出しでの使用）
  echo "$H" | grep -qE '実質単価|出資金|有無$' && err "硬語" "$LN" "$H"
done > /tmp/lint-outline-body.$$ 2>&1
cat /tmp/lint-outline-body.$$
BODY_ERR=$(grep -c '^ERROR' /tmp/lint-outline-body.$$ || true)
BODY_WARN=$(grep -c '^WARN' /tmp/lint-outline-body.$$ || true)
rm -f /tmp/lint-outline-body.$$

# タイトル行のチェック（？・！は使用可＝2026-07-02裁定。年号・記号は不可）
TLINE=$(grep -nE '^\- タイトル：' "$FILE" | head -1)
if [ -n "$TLINE" ]; then
  LN="${TLINE%%:*}"; TITLE=$(echo "$TLINE" | sed -E 's/^[0-9]+:- タイトル：//')
  echo "$TITLE" | grep -qE '【?20[0-9]{2}' && { echo "ERROR [タイトル年号] L$LN: $TITLE"; BODY_ERR=$((BODY_ERR+1)); }
  echo "$TITLE" | grep -qE '【|】|｜|※' && { echo "ERROR [タイトル記号] L$LN: $TITLE"; BODY_ERR=$((BODY_ERR+1)); }
  TLEN=$(echo -n "$TITLE" | python3 -c 'import sys;print(len(sys.stdin.read()))' 2>/dev/null || echo 0)
  if [ "$TLEN" -gt 0 ] && { [ "$TLEN" -lt 30 ] || [ "$TLEN" -gt 48 ]; }; then
    echo "WARN  [タイトル字数] L$LN: ${TLEN}字（目安35〜45字）"; BODY_WARN=$((BODY_WARN+1))
  fi
fi

echo "---"
echo "lint-outline: ERROR=${BODY_ERR} WARN=${BODY_WARN}（ERRORは提示前に必ず修正・WARNは一読して判断）"
[ "$BODY_ERR" -eq 0 ] || exit 1
exit 0
