#!/bin/bash
# lint.sh v2 — ヤマダイ記事用 機械チェッカー
# 使用法: bash scripts/lint.sh articles/{KW}-article.html
# v2変更点:
#   - バグ修正: サブシェルカウンター消失 → 一時ファイルベースに変更
#   - バグ修正: grep -co → grep -c に変更
#   - バグ修正: UTF-8での【】誤検出 → LC_ALL=C.UTF-8 + grep -P に変更
#   - 新規: ぴったり/手作り/レストラン品質/AI臭いナンバリング等を追加
#   - 新規: 訴求社CTA直前strong チェック対象をPost Snippets登録社にも拡大
#   - 新規: 頻出表現の自動カウント（3回以上で警告）
#   - 新規: サービス紹介の書き出しパターン単調チェック
set -uo pipefail

FILE="$1"
if [[ ! -f "$FILE" ]]; then echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; fi

# === カウンター: 一時ファイルベース（サブシェル対策） ===
ERR_FILE=$(mktemp)
WARN_FILE=$(mktemp)
echo 0 > "$ERR_FILE"
echo 0 > "$WARN_FILE"
trap "rm -f $ERR_FILE $WARN_FILE" EXIT

error() {
  echo "ERROR: $1"
  echo $(( $(cat "$ERR_FILE") + 1 )) > "$ERR_FILE"
}
warning() {
  echo "WARNING: $1"
  echo $(( $(cat "$WARN_FILE") + 1 )) > "$WARN_FILE"
}

echo "=== lint.sh v2 ヤマダイ記事チェック ==="
echo "対象: $FILE"
echo ""

# ============================================
# 1. 禁止ワード・変換必須
# ============================================
echo "--- 禁止ワード ---"
for P in "様々" "行なう" "行なっ" "是非" "下さい"; do
  grep -n "$P" "$FILE" | while read -r l; do error "変換必須「$P」: $l"; done || true
done

# ============================================
# 2. AI表現（prohibited-words.md準拠 + 今回の追加分）
# ============================================
echo "--- AI表現 ---"
for P in "大きな魅力" "充実しています" "ぴったりの" "ぴったりです" "ぴったりな" "への第一歩" "を両立" "の強みです" "魅力のひとつ" "仕上がり" "選ばれています" "把握しておけば" "リスクを減らせ" "OKです" "代表です" "代表格" "払拭" "疑問視" "レストラン品質" "手作りした" "手作りの" "候補です" "選択肢に入" "試してほしい" "ポイントです"; do
  grep -n "$P" "$FILE" | while read -r l; do error "AI/景表法表現「$P」: $l"; done || true
done

# ============================================
# 3. AI臭いナンバリング（今回追加）
# ============================================
echo "--- AI臭いナンバリング ---"
for P in "[0-9]つのポイント" "[0-9]つのメリット" "[0-9]つの注意点" "[0-9]つの特徴" "[0-9]点を" "[0-9]点に"; do
  grep -nE "$P" "$FILE" | while read -r l; do error "AI臭いナンバリング: $l"; done || true
done

# ============================================
# 4. 比喩表現
# ============================================
echo "--- 比喩表現 ---"
for P in "跳ね上が" "ふくらむ" "広がる" "広がり" "近づく" "近づけ" "絞られ" "狭まる" "かみ合" "目を向け" "分かれ目" "道が開け"; do
  grep -n "$P" "$FILE" | while read -r l; do error "比喩「$P」: $l"; done || true
done

# ============================================
# 5. 後述系
# ============================================
for P in "後ほど紹介" "前述の通り" "上記で触れ"; do
  grep -n "$P" "$FILE" | while read -r l; do error "後述系: $l"; done || true
done

# ============================================
# 6. 冗長表現
# ============================================
echo "--- 冗長表現 ---"
grep -n "という" "$FILE" | while read -r l; do error "冗長「という」: $l"; done || true
grep -n "といった" "$FILE" | while read -r l; do error "冗長「といった」: $l"; done || true
grep -n "として" "$FILE" | while read -r l; do warning "「として」要確認: $l"; done || true

# ============================================
# 7. 指示語
# ============================================
echo "--- 指示語 ---"
grep -n "この[^記]" "$FILE" | grep -v "そのまま" | while read -r l; do error "指示語「この」: $l"; done || true
grep -n "その[^ま]" "$FILE" | while read -r l; do error "指示語「その」: $l"; done || true
grep -n "これ[はをがも]" "$FILE" | while read -r l; do error "指示語「これ」: $l"; done || true
grep -n "そうした" "$FILE" | while read -r l; do error "指示語: $l"; done || true

# ============================================
# 8.「こと」（grep -c に修正）
# ============================================
echo "--- 「こと」---"
KC=$(grep -c "こと[がはをもで。、]" "$FILE" 2>/dev/null || true)
if [[ "$KC" -gt 0 ]]; then
  error "「こと」が${KC}行で検出"
  grep -n "こと[がはをもで。、]" "$FILE" || true
fi

# ============================================
# 9. 記号（UTF-8対応: LC_ALL=C.UTF-8 + grep -P）
# ============================================
echo "--- 記号 ---"
LC_ALL=C.UTF-8 grep -nP '<h2>.*[【】]' "$FILE" | while read -r l; do error "H2に【】: $l"; done || true
grep -n "!" "$FILE" | grep -v "href\|class\|src\|alt\|style\|rel\|target\|<" | while read -r l; do warning "半角!: $l"; done || true

# ============================================
# 10. HTML
# ============================================
echo "--- HTML ---"
grep -n "<li>.*。</li>" "$FILE" | while read -r l; do error "li内に句点: $l"; done || true
grep -n "<tr><tr>\|<td><td>" "$FILE" | while read -r l; do error "タグ二重: $l"; done || true

# ============================================
# 11. CTA
# ============================================
echo "--- CTA ---"
grep -n "\[btn " "$FILE" | grep -v 'rel="nofollow"' | while read -r l; do error "btnにnofollow無: $l"; done || true
grep -n "\[btn " "$FILE" | grep -v 'class="raised main-bc strong"' | while read -r l; do error "btnのclass不正: $l"; done || true
grep -n "gad_campaignid\|gbraid\|gclid" "$FILE" | while read -r l; do error "Googleパラメータ: $l"; done || true

# ============================================
# 12. しましょう
# ============================================
grep -n "しましょう" "$FILE" | while read -r l; do error "「しましょう」: $l"; done || true

# ============================================
# 13. 追加NG表現
# ============================================
echo "--- 追加NG ---"
grep -n "あなた" "$FILE" | while read -r l; do error "「あなた」: $l"; done || true
grep -n "といいです" "$FILE" | while read -r l; do error "「といいです」: $l"; done || true
grep -n "ためです。" "$FILE" | while read -r l; do error "「ためです。」: $l"; done || true
grep -n "かどうかを" "$FILE" | while read -r l; do warning "間接疑問文: $l"; done || true

# ============================================
# 14. 内部リンク誘導文
# ============================================
grep -n "参考にしてみてください\|詳しく知りたい方は" "$FILE" | while read -r l; do error "内部リンク誘導文: $l"; done || true

# ============================================
# 15. FAQ番号プレフィックス
# ============================================
grep -n "質問[0-9]\|Q[0-9]" "$FILE" | while read -r l; do error "FAQ番号: $l"; done || true

# ============================================
# ヤマダイ固有チェック
# ============================================
echo ""
echo "--- ヤマダイ固有チェック ---"

# --- テーブル5行チェック（横断比較テーブルを除外） ---
# サービス紹介のテーブル（th width="25.8158%"を含むもの）のみ対象
TABLE_IDX=0
IN_TABLE=0
TR_COUNT=0
IS_SERVICE_TABLE=0
while IFS= read -r line; do
  if echo "$line" | grep -q "<table"; then
    IN_TABLE=1; TR_COUNT=0; IS_SERVICE_TABLE=0; ((TABLE_IDX++))
  fi
  if [[ "$IN_TABLE" -eq 1 ]]; then
    echo "$line" | grep -q "25.8158%" && IS_SERVICE_TABLE=1
    echo "$line" | grep -q "<tr>" && ((TR_COUNT++))
    if echo "$line" | grep -q "</table>"; then
      IN_TABLE=0
      if [[ "$IS_SERVICE_TABLE" -eq 1 && "$TR_COUNT" -ne 5 && "$TR_COUNT" -gt 0 ]]; then
        error "サービステーブル(#${TABLE_IDX})の行数が${TR_COUNT}行（5行固定のはず）"
      fi
    fi
  fi
done < "$FILE"

# --- 訴求社CTA直前のstrong価格訴求文チェック（Post Snippets登録社も対象） ---
for SC in '\[Oisix\]' '\[ヨシケイ\]' '\[ラディッシュボーヤ\]' '\[コープデリ\]' '\[Dr\.ツルガメキッチン\]' '\[筋肉食堂DELI\]' '\[ワタミダイレクト\]' '\[Meals\]' '\[タイヘイ\]' '\[ワタミ\]'; do
  SC_LINE=$(grep -n "$SC" "$FILE" | head -1 | cut -d: -f1 2>/dev/null || echo 0)
  if [[ "$SC_LINE" -gt 2 ]]; then
    PREV_LINE=$((SC_LINE - 1))
    PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE")
    if ! echo "$PREV_CONTENT" | grep -q "<strong>"; then
      SC_NAME=$(echo "$SC" | tr -d '\\[]')
      warning "訴求社CTA [${SC_NAME}] の直前にstrong価格訴求文がない（${SC_LINE}行目付近）"
    fi
  fi
done

# --- 非訴求社CTA直前にstrongがないことを確認 ---
grep -n "\[btn " "$FILE" | while read -r line; do
  BTN_LINE=$(echo "$line" | cut -d: -f1)
  PREV_LINE=$((BTN_LINE - 1))
  PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE")
  if echo "$PREV_CONTENT" | grep -q "<strong>"; then
    warning "非訴求社CTA直前にstrongがある（不要）: ${BTN_LINE}行目付近"
  fi
done || true

# --- olリストとH3の一致チェック（ol内のliのみ・通し番号を除去して比較） ---
awk '/<ol[^l]*>|<ol>/{in_ol=1} in_ol{print} /<\/ol>/{in_ol=0}' "$FILE" | grep -oP '(?<=<li>).*?(?=</li>)' 2>/dev/null | while read -r li_text; do
  # li内の通し番号「1.」「2.」等を除去して比較
  li_clean=$(echo "$li_text" | sed 's/^[0-9]*\.\s*//')
  if ! grep -q "<h3>.*${li_clean}\|<h3>.*${li_clean%（*}" "$FILE" 2>/dev/null; then
    warning "olリストの「${li_text}」に対応するH3が見つからない"
  fi
done || true

# --- H2情報 ---
H2_COUNT=$(grep -c "<h2>" "$FILE" 2>/dev/null || true)
IMG_COUNT=$(grep -c '<img ' "$FILE" 2>/dev/null || true)
echo "  H2数: ${H2_COUNT} / imgタグ数: ${IMG_COUNT}"

# --- 「〜い。」で終わるアドバイス文 ---
grep -n "[やすにくほし]い。" "$FILE" | grep -v "<\|>\|\[" | while read -r l; do warning "「〜い。」で終わるアドバイス文: $l"; done || true

# --- 体言止めチェック ---
grep -nE "を実施。|に対応。|を実現。|を提供。" "$FILE" | while read -r l; do error "体言止め: $l"; done || true

# --- strongタグの過剰使用（1行に2箇所以上） ---
LINE_NUM=0
while IFS= read -r line; do
  ((LINE_NUM++))
  STRONG_COUNT=$(echo "$line" | grep -o "<strong>" | wc -l)
  if [[ "$STRONG_COUNT" -ge 2 ]]; then
    error "1行にstrongが${STRONG_COUNT}箇所: ${LINE_NUM}行目"
  fi
done < "$FILE"

# --- 頻出表現の自動カウント（3回以上でWARNING） ---
echo ""
echo "--- 頻出表現チェック ---"
for PHRASE in "に合わせて選べます" "に向いています" "で安心" "が魅力です" "に定評があります" "を楽しめます" "が特徴です" "で届きます" "気軽に始められます"; do
  COUNT=$(grep -c "$PHRASE" "$FILE" 2>/dev/null || true)
  if [[ "$COUNT" -ge 3 ]]; then
    warning "「${PHRASE}」が${COUNT}回出現（3回以上は分散させる）"
  fi
done

# --- サービス紹介の書き出しパターン単調チェック ---
echo ""
echo "--- 書き出しパターンチェック ---"
# strong 1文目の「〜宅配弁当です。」「〜サービスです。」のパターンをカウント
PATTERN_A=$(grep -c "宅配弁当です。</strong>" "$FILE" 2>/dev/null || true)
PATTERN_B=$(grep -c "サービスです。</strong>" "$FILE" 2>/dev/null || true)
TOTAL_SERVICES=$(grep -c "<h3>[0-9]" "$FILE" 2>/dev/null || true)
if [[ "$TOTAL_SERVICES" -gt 0 ]]; then
  DOMINANT=$(( PATTERN_A > PATTERN_B ? PATTERN_A : PATTERN_B ))
  RATIO=$(( DOMINANT * 100 / TOTAL_SERVICES ))
  if [[ "$RATIO" -gt 60 ]]; then
    warning "サービス紹介の書き出しが${DOMINANT}/${TOTAL_SERVICES}社で同じパターン（60%超）。書き出しのバリエーションを増やす"
  fi
  echo "  書き出し「〜宅配弁当です。」: ${PATTERN_A}社 / 「〜サービスです。」: ${PATTERN_B}社 / 全${TOTAL_SERVICES}社"
fi

# --- 「本記事では」→「この記事では」に統一 ---
grep -n "本記事" "$FILE" | while read -r l; do error "「本記事」→「この記事」に統一: $l"; done || true

# --- strong締めのパターン集計 ---
echo ""
echo "--- strong締めパターンチェック ---"
STRONG_FUSEGE=$(grep -c "防げます。</strong>" "$FILE" 2>/dev/null || true)
STRONG_DEKI=$(grep -c "できます。</strong>" "$FILE" 2>/dev/null || true)
STRONG_NARI=$(grep -c "なります。</strong>" "$FILE" 2>/dev/null || true)
for PAT in "防げます:$STRONG_FUSEGE" "できます:$STRONG_DEKI" "なります:$STRONG_NARI"; do
  NAME="${PAT%%:*}"; CNT="${PAT##*:}"
  if [[ "$CNT" -ge 3 ]]; then
    warning "strong締め「〜${NAME}」が${CNT}回（3回以上はバリエーション不足）"
  fi
done
echo "  strong締め「〜防げます」: ${STRONG_FUSEGE} / 「〜できます」: ${STRONG_DEKI} / 「〜なります」: ${STRONG_NARI}"

# --- H3の箇条書き/テーブル含有率チェック ---
echo ""
echo "--- H3の箇条書き/テーブル率チェック ---"
TOTAL_H3=$(grep -c "<h3>" "$FILE" 2>/dev/null || true)
SERVICE_H3=$(grep -c "<h3>[0-9]" "$FILE" 2>/dev/null || true)
CONTENT_H3=$(( TOTAL_H3 - SERVICE_H3 ))
UL_COUNT=$(grep -c "<ul>" "$FILE" 2>/dev/null || true)
if [[ "$CONTENT_H3" -gt 0 && "$UL_COUNT" -eq 0 ]]; then
  warning "選び方・メリット・注意点のH3に箇条書き(ul)が1つもない。8割のH3にul or テーブルを入れる"
fi
echo "  コンテンツH3数: ${CONTENT_H3} / ul数: ${UL_COUNT}"

# ============================================
# 結果サマリー
# ============================================
echo ""
FINAL_ERRORS=$(cat "$ERR_FILE")
FINAL_WARNINGS=$(cat "$WARN_FILE")
echo "=== 結果: ERROR ${FINAL_ERRORS}件 / WARNING ${FINAL_WARNINGS}件 ==="
if [[ "$FINAL_ERRORS" -gt 0 ]]; then
  echo "→ ERRORが${FINAL_ERRORS}件あります。修正してから次のステップに進んでください。"
  exit 1
else
  echo "→ パス。"
  exit 0
fi
