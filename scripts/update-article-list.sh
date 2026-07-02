#!/bin/bash
# update-article-list.sh — 公開記事一覧を sitemap から自動生成する（ヤマダイ）
# 出力: articles/公開記事一覧.md（自動生成・手で編集しない）。カニバリ照合の台帳として
# internal-links.md（手動メンテ・誘導ルール用）を補完する。実行: bash scripts/update-article-list.sh
set -u
export LC_ALL=en_US.UTF-8
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/articles/公開記事一覧.md"
SITEMAP="https://www.super-yamadai.co.jp/article/post-sitemap.xml"
TMP="/tmp/article-list.$$"

URLS=$(curl -sL -m 30 "${SITEMAP}" | grep -oE 'https://www\.super-yamadai\.co\.jp/article/[0-9]+' | sort -u)
[ -n "${URLS}" ] || { echo "ERROR: sitemapから記事URLを取得できませんでした（${SITEMAP}）"; exit 1; }

: > "${TMP}"
echo "${URLS}" | while read -r U; do
  T=$(curl -sL -m 15 "${U}" | grep -oE '<title>[^<]*' | head -1 | sed -E 's/<title>//; s/ *[|｜–-] *スーパーヤマダイ.*$//')
  [ -n "${T}" ] || T="(タイトル取得不可)"
  echo "| ${T} | ${U} |" >> "${TMP}"
done

{
  echo "# 公開記事一覧（自動生成・編集禁止）"
  echo ""
  echo "生成: $(date '+%Y-%m-%d %H:%M')／取得元: ${SITEMAP}"
  echo "カニバリ照合はこの一覧＋GSC実データで行う（internal-links.md は誘導ルール用の手動リスト）。"
  echo ""
  echo "| 記事タイトル | URL |"
  echo "|---|---|"
  sort -t'|' -k3 -V "${TMP}"
} > "${OUT}"
rm -f "${TMP}"
N=$(grep -c '^| ' "${OUT}")
echo "OK: ${OUT} を更新（記事 $((N-1)) 本）"
