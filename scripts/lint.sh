#!/bin/bash
# lint.sh — ヤマダイ記事用 機械チェッカー
# 使用法: bash scripts/lint.sh articles/{KW}-article.html
set -uo pipefail
FILE="$1"
if [[ ! -f "$FILE" ]]; then echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; fi
ERRORS=0; WARNINGS=0
error() { echo "ERROR: $1"; ((ERRORS++)) || true; }
warning() { echo "WARNING: $1"; ((WARNINGS++)) || true; }

# パイプのサブシェル問題を回避するため、一時ファイルベースでカウントする
TMPERR=$(mktemp)
TMPWARN=$(mktemp)
echo 0 > "$TMPERR"
echo 0 > "$TMPWARN"
trap 'rm -f "$TMPERR" "$TMPWARN"' EXIT

p_error() {
  echo "ERROR: $1"
  local c; c=$(cat "$TMPERR"); echo $((c + 1)) > "$TMPERR"
}
p_warning() {
  echo "WARNING: $1"
  local c; c=$(cat "$TMPWARN"); echo $((c + 1)) > "$TMPWARN"
}

echo "=== lint.sh ヤマダイ記事チェック ==="
echo "対象: $FILE"
echo ""

# --- 禁止ワード ---
for P in "様々" "行なう" "行なっ" "是非" "下さい"; do
  grep -n "$P" "$FILE" | while read -r l; do p_error "変換必須「$P」: $l"; done || true
done

# --- AI表現 ---
for P in "大きな魅力" "充実しています" "ぴったりの" "への第一歩" "を両立" "の強みです" "魅力のひとつ" "仕上がり" "選ばれています" "把握しておけば" "リスクを減らせ" "OKです" "代表です" "代表格" "払拭" "疑問視"; do
  grep -n "$P" "$FILE" | while read -r l; do p_error "AI表現「$P」: $l"; done || true
done

# --- 比喩表現 ---
for P in "跳ね上が" "ふくらむ" "広がる" "広がり" "近づく" "近づけ" "絞られ" "狭まる" "かみ合" "目を向け" "分かれ目" "道が開け"; do
  grep -n "$P" "$FILE" | while read -r l; do p_error "比喩「$P」: $l"; done || true
done

# --- 後述系 ---
for P in "後ほど紹介" "前述の通り" "上記で触れ"; do
  grep -n "$P" "$FILE" | while read -r l; do p_error "後述系: $l"; done || true
done

# --- 冗長表現 ---
grep -n "という" "$FILE" | while read -r l; do p_error "冗長「という」: $l"; done || true
grep -n "といった" "$FILE" | while read -r l; do p_error "冗長「といった」: $l"; done || true
grep -n "として" "$FILE" | while read -r l; do p_warning "「として」要確認: $l"; done || true

# --- 指示語 ---
grep -n "この[^記]" "$FILE" | grep -v "そのまま" | while read -r l; do p_error "指示語「この」: $l"; done || true
grep -n "その[^ま]" "$FILE" | while read -r l; do p_error "指示語「その」: $l"; done || true
grep -n "これ[はをがも]" "$FILE" | while read -r l; do p_error "指示語「これ」: $l"; done || true
grep -n "そうした" "$FILE" | while read -r l; do p_error "指示語: $l"; done || true

# --- 「こと」---
KC=$(grep -c "こと[がはをもで。、]" "$FILE" || true)
KC=${KC:-0}
KC=$(echo "$KC" | head -1)
if [[ "$KC" -gt 0 ]]; then error "「こと」が${KC}回"; grep -n "こと[がはをもで。、]" "$FILE" || true; fi

# --- 記号 ---
LC_ALL=C.UTF-8 grep -nP '(?<=<h2>).*[【】]' "$FILE" | while read -r l; do p_error "H2に【】: $l"; done || true
grep -n "!" "$FILE" | grep -v "href\|class\|src\|alt\|style\|rel\|target\|<" | while read -r l; do p_warning "半角!: $l"; done || true

# --- HTML ---
grep -n "<li>.*。</li>" "$FILE" | while read -r l; do p_error "li内に句点: $l"; done || true
grep -n "<tr><tr>\|<td><td>" "$FILE" | while read -r l; do p_error "タグ二重: $l"; done || true

# --- CTA ---
grep -n "\[btn " "$FILE" | grep -v 'rel="nofollow"' | while read -r l; do p_error "btnにnofollow無: $l"; done || true
grep -n "\[btn " "$FILE" | grep -v 'class="raised main-bc strong"' | while read -r l; do p_error "btnのclass不正: $l"; done || true
grep -n "gad_campaignid\|gbraid\|gclid" "$FILE" | while read -r l; do p_error "Googleパラメータ: $l"; done || true

# --- しましょう ---
grep -n "しましょう" "$FILE" | while read -r l; do p_error "「しましょう」: $l"; done || true

# --- 追加NG ---
grep -n "あなた" "$FILE" | while read -r l; do p_error "「あなた」: $l"; done || true
grep -n "といいです" "$FILE" | while read -r l; do p_error "「といいです」: $l"; done || true
grep -n "ためです。" "$FILE" | while read -r l; do p_error "「ためです。」: $l"; done || true
grep -n "かどうかを" "$FILE" | while read -r l; do p_warning "間接疑問文: $l"; done || true

# --- 内部リンク誘導文 ---
grep -n "参考にしてみてください\|詳しく知りたい方は" "$FILE" | while read -r l; do p_error "内部リンク誘導文: $l"; done || true

# --- FAQ番号 ---
grep -n "質問[0-9]\|Q[0-9]" "$FILE" | while read -r l; do p_error "FAQ番号: $l"; done || true

# ============================================
# ヤマダイ固有チェック
# ============================================

# --- テーブル5行チェック ---
# 各tableの<tr>数を数えて5行でなければERROR
# ※ H2直下の比較一覧テーブル（th/thヘッダー行のあるテーブル）はスキップ
TABLE_NUM=$(grep -c "<table" "$FILE" || echo 0)
if [[ "$TABLE_NUM" -gt 0 ]]; then
  for i in $(seq 1 "$TABLE_NUM"); do
    TABLE_CONTENT=$(awk -v n="$i" 'BEGIN{c=0} /<table/{c++} c==n{print} /<\/table>/&&c==n{exit}' "$FILE")
    # ヘッダー行（<tr><th>...<th>）が複数thを持つテーブルは比較一覧テーブルなのでスキップ
    FIRST_ROW=$(echo "$TABLE_CONTENT" | awk '/<tr>/{found=1} found{print} /<\/tr>/&&found{exit}')
    HEADER_TH_COUNT=$(echo "$FIRST_ROW" | grep -o "<th" | wc -l)
    HEADER_TH_COUNT=$(echo "$HEADER_TH_COUNT" | tr -d ' ')
    if [[ "$HEADER_TH_COUNT" -ge 2 ]]; then
      continue
    fi
    TR_COUNT=$(echo "$TABLE_CONTENT" | grep -c "<tr>" || echo 0)
    if [[ "$TR_COUNT" -ne 5 && "$TR_COUNT" -gt 0 ]]; then
      error "テーブル${i}の行数が${TR_COUNT}行（5行固定のはず）"
    fi
  done
fi

# --- 訴求社CTA直前のstrong価格訴求文チェック ---
for SC in "\[Oisix\]" "\[ヨシケイ\]" "\[ラディッシュボーヤ\]" "\[コープデリ\]"; do
  SC_LINE=$(grep -n "$SC" "$FILE" | head -1 | cut -d: -f1 || echo 0)
  if [[ "$SC_LINE" -gt 2 ]]; then
    PREV_LINE=$((SC_LINE - 1))
    PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE")
    if ! echo "$PREV_CONTENT" | grep -q "<strong>"; then
      p_warning "訴求社CTA直前にstrong価格訴求文がない可能性（${SC_LINE}行目付近）"
    fi
  fi
done

# --- 非訴求社CTA直前にstrongがないことを確認 ---
grep -n "\[btn " "$FILE" | while read -r line; do
  BTN_LINE=$(echo "$line" | cut -d: -f1)
  PREV_LINE=$((BTN_LINE - 1))
  PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE")
  if echo "$PREV_CONTENT" | grep -q "<strong>"; then
    p_warning "非訴求社CTA直前にstrongがある（不要）: ${BTN_LINE}行目付近"
  fi
done || true

# --- olリストとH3の一致チェック ---
# olリスト内のli要素を抽出
grep -oP '(?<=<li>).*?(?=</li>)' "$FILE" 2>/dev/null | while read -r li_text; do
  if ! grep -q "<h3>.*${li_text}" "$FILE" 2>/dev/null; then
    p_warning "olリストの「${li_text}」に対応するH3が見つからない"
  fi
done || true

# --- H2直下の画像チェック ---
H2_COUNT=$(grep -c "<h2>" "$FILE" || echo 0)
if [[ "$H2_COUNT" -gt 0 ]]; then
  echo "  H2数: ${H2_COUNT} / imgタグ数: $(grep -c '<img ' "$FILE" || echo 0)"
fi

# --- 「〜い。」で終わるアドバイス文 ---
grep -n "[やすにくほし]い。" "$FILE" | grep -v "<\|>\|\[" | while read -r l; do p_warning "「〜い。」で終わるアドバイス文: $l"; done || true

# --- 体言止めチェック ---
grep -nE "を実施。|に対応。|を実現。|を提供。" "$FILE" | while read -r l; do p_error "体言止め: $l"; done || true

# --- strongタグの過剰使用 ---
LINE_NUM=0
while IFS= read -r line; do
  ((LINE_NUM++)) || true
  STRONG_COUNT=$(echo "$line" | grep -o "<strong>" | wc -l)
  STRONG_COUNT=$(echo "$STRONG_COUNT" | tr -d ' ')
  if [[ "$STRONG_COUNT" -ge 2 ]]; then
    error "1行にstrongが${STRONG_COUNT}箇所: ${LINE_NUM}行目"
  fi
done < "$FILE" || true

# --- サブシェルのカウンターを統合 ---
PIPE_ERRORS=$(cat "$TMPERR")
PIPE_WARNINGS=$(cat "$TMPWARN")
ERRORS=$((ERRORS + PIPE_ERRORS))
WARNINGS=$((WARNINGS + PIPE_WARNINGS))

echo ""
echo "=== 結果: ERROR ${ERRORS}件 / WARNING ${WARNINGS}件 ==="
if [[ "$ERRORS" -gt 0 ]]; then echo "→ 修正が必要です。"; exit 1; else echo "→ パス。"; exit 0; fi
