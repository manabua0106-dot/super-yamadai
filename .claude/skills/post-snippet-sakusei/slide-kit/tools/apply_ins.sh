#!/bin/bash
# 目次の上に口コミ付きCTAを挿入（記事774・971・980）。既定は「確認だけ」で、書き込まない。
#   確認だけ  : bash apply_all.sh
#   試し1本   : JUNNI_APPROVED=1 bash apply_all.sh --apply --only 401
#   全部      : JUNNI_APPROVED=1 bash apply_all.sh --apply
# 1本ずつ：控えと現在の一致確認 → 書き込み → 公開ページの確認。NGならその記事を控えで元に戻して全体を止める。
# 承認の印（JUNNI_APPROVED=1）は、依頼を受けて実行するとき、呼び出す側が付ける（このファイルには埋め込まない）。
set -o pipefail
BASE=/Users/manasimac/.cache/junni-henkou/wp-backup/yamadai/pre-all-20261013
T=$BASE/tools
EDITS=${EDITS:-$BASE/edits-intro}
APPLY=0; ONLY=""
while [ $# -gt 0 ]; do case "$1" in --apply) APPLY=1;; --only) ONLY="$2"; shift;; esac; shift; done
if [ $APPLY = 1 ] && [ "$JUNNI_APPROVED" != "1" ]; then echo "承認の印（JUNNI_APPROVED=1）が無いので書き込みません"; exit 9; fi
source /Users/manasimac/.claude/skills/junni-henkou/env.sh yamadai >/dev/null 2>&1 || { echo "★ 認証の読み込み失敗"; exit 1; }
echo "接続先: $WORDPRESS_SITE_URL / モード: $([ $APPLY = 1 ] && echo '書き込みあり' || echo '確認だけ') / 差し替え: $EDITS"
mkdir -p $BASE/run-live $BASE/run-fresh
want() { [ -z "$ONLY" ] || echo ",$ONLY," | grep -q ",$1,"; }

# ① 事前確認：現在の生ソース＝控え、差し替え後ファイルあり
bad=0
while IFS=$'\t' read -r id I; do
  want "$id" || continue
  python3 $W get $id $BASE/run-fresh/post-$id.html >/dev/null 2>&1 || { echo "★ 取得失敗 $id"; bad=1; continue; }
  cmp -s $BASE/run-fresh/post-$id.html $BASE/raw-all/post-$id.html || { echo "★ $id: 現在の生ソースが控えと違う（誰かが編集した可能性）"; bad=1; }
  [ -f $EDITS/post-$id.new.html ] || { echo "★ $id: 差し替え後ファイルが無い"; bad=1; }
done < $EDITS/targets.tsv
[ $bad = 0 ] || { echo "事前確認NG：書き込まずに停止"; exit 2; }
echo "事前確認OK：対象の現在の生ソースは、すべて控えと同じ"
[ $APPLY = 1 ] || exit 0

# ② 1本ずつ
n_done=0
while IFS=$'\t' read -r id I; do
  want "$id" || continue
  echo "=== 記事$id（目次の上に口コミ付きCTAを挿入 $I か所）"
  curl -s -m 60 -L https://www.super-yamadai.co.jp/article/$id -o $BASE/run-live/$id.before.html
  python3 $W put $id $EDITS/post-$id.new.html | tee -a "$LOG" | grep -E "更新完了|保存ソース" || { echo "★ put失敗 $id → 停止"; exit 3; }
  sleep 3
  if ! python3 -I $T/verify_all.py ins $id $BASE/run-live/$id.before.html $I | tail -1; then
    sleep 8
    if ! python3 -I $T/verify_all.py ins $id $BASE/run-live/$id.before.html $I | tail -1; then
      echo "★ 記事$id: 公開ページの確認NG → 控えで元に戻す"
      python3 $W put $id $BASE/raw-all/post-$id.html | tee -a "$LOG"
      exit 4
    fi
  fi
  n_done=$((n_done+1))
done < $EDITS/targets.tsv
echo "書き込み完了: $n_done 本"
