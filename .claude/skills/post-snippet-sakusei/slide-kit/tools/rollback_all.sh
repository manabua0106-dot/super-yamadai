#!/bin/bash
# 元に戻す（控えの生ソースを書き戻す）。既定は「確認だけ」。
#   確認だけ  : bash rollback_all.sh
#   実行      : JUNNI_APPROVED=1 bash rollback_all.sh --apply [--only 353,401]
# 現在の記事が「差し替え後ファイルと同じ」ときだけ戻す。違う（誰かが編集した）記事は、触らずに知らせる。
set -o pipefail
BASE=/Users/manasimac/.cache/junni-henkou/wp-backup/yamadai/pre-all-20261013
T=$BASE/tools
EDITS=${EDITS:-$BASE/edits}
APPLY=0; ONLY=""
while [ $# -gt 0 ]; do case "$1" in --apply) APPLY=1;; --only) ONLY="$2"; shift;; esac; shift; done
if [ $APPLY = 1 ] && [ "$JUNNI_APPROVED" != "1" ]; then echo "承認の印（JUNNI_APPROVED=1）が無いので書き込みません"; exit 9; fi
source /Users/manasimac/.claude/skills/junni-henkou/env.sh yamadai >/dev/null 2>&1 || { echo "★ 認証の読み込み失敗"; exit 1; }
echo "接続先: $WORDPRESS_SITE_URL / モード: $([ $APPLY = 1 ] && echo '書き込みあり' || echo '確認だけ')"
mkdir -p $BASE/run-fresh
want() { [ -z "$ONLY" ] || echo ",$ONLY," | grep -q ",$1,"; }
n_back=0; n_skip=0; n_orig=0
while IFS=$'\t' read -r id F M S labels; do
  want "$id" || continue
  python3 $W get $id $BASE/run-fresh/post-$id.rb.html >/dev/null 2>&1 || { echo "★ 取得失敗 $id"; continue; }
  if cmp -s $BASE/run-fresh/post-$id.rb.html $BASE/raw-all/post-$id.html; then echo "記事$id: すでに元の状態"; n_orig=$((n_orig+1)); continue; fi
  if ! cmp -s $BASE/run-fresh/post-$id.rb.html $EDITS/post-$id.new.html; then echo "★ 記事$id: 現在の中身が「差し替え後」とも「元」とも違う（誰かが編集した可能性）→ 触りません"; n_skip=$((n_skip+1)); continue; fi
  if [ $APPLY = 1 ]; then
    python3 $W put $id $BASE/raw-all/post-$id.html | tee -a "$LOG" | grep -E "更新完了|保存ソース" || { echo "★ put失敗 $id → 停止"; exit 3; }
    sleep 3
    python3 -I $T/verify_all.py same $id ${PUBLIC_BEFORE:-$BASE/public-before}/post-$id.html | tail -1
  else
    echo "記事$id: 戻せる状態（現在＝差し替え後）"
  fi
  n_back=$((n_back+1))
done < $EDITS/targets.tsv
echo "戻した/戻せる: $n_back 本 / すでに元: $n_orig 本 / 触らず保留: $n_skip 本"
