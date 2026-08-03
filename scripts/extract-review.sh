#!/bin/bash
# extract-review.sh — 提示前の意味レビュー（§E-12-b）の判定対象を機械抽出する
# 使い方: bash scripts/extract-review.sh "articles/{KW}/article.html" [出力先.md]
#
# 背景（2026-07-31）: 「通しで一読」の自己レビューは、書いた本人の同一コンテキストでは
# 盲点が構造的に残り、2記事でManabuさん指摘60件超が素通りした。
# 全文再読ではなく「指摘が集中する行だけ」を抽出し、1行ずつ判定を書き残す方式に変える。
# 生成された meaning-review.md の判定列が埋まっていない提示は editor が差し戻す（ゲート3b）。
set -u
export LC_ALL=en_US.UTF-8
FILE="${1:?使い方: bash scripts/extract-review.sh <article.htmlまたはdraft-h2-N.htmlのパス> [出力先.md]}"
[ -f "$FILE" ] || { echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; }
# 既定の出力名: article.html → meaning-review.md ／ draft-h2-N.html → meaning-review-h2-N.md
# （H2単位の途中稿ごとに別ファイルにし、記入済み判定の上書き事故を防ぐ）
BASE=$(basename "$FILE")
if [[ "$BASE" == draft-* ]]; then
  DEF="$(dirname "$FILE")/meaning-review-${BASE#draft-}"
  DEF="${DEF%.html}.md"
else
  DEF="$(dirname "$FILE")/meaning-review.md"
fi
OUT="${2:-$DEF}"

python3 - "$FILE" "$OUT" <<'PY'
# -*- coding: utf-8 -*-
import io, re, sys, collections

src, out = sys.argv[1], sys.argv[2]
lines = io.open(src, encoding='utf-8').read().splitlines()

def plain(s):
    return re.sub(r'<[^>]+>', '', s).strip()

rows = []          # (行番号, 種別, 表示テキスト)
tails = collections.Counter()
in_bq = False

def next_text(i):
    """i行目の次にある本文1文（タグ・空行・ショートコードを飛ばす。次の見出しに達したら打切り）"""
    for j in range(i + 1, min(i + 15, len(lines))):
        t = lines[j].strip()
        if t.startswith(('<h2', '<h3')):
            return None, None
        if not t or t.startswith(('<table', '<tbody', '<tr', '</', '<ul', '<ol', '<img', '[', '<blockquote')):
            continue
        return j + 1, plain(t)
    return None, None

for i, raw in enumerate(lines):
    t = raw.strip()
    if '<blockquote' in t: in_bq = True
    if '</blockquote' in t: in_bq = False; continue
    if in_bq or not t:
        continue
    n = i + 1
    if t.startswith('<h2'):
        j, s = next_text(i)
        if s: rows.append((j, 'H2導入1文', s))
        continue
    if t.startswith('<h3'):
        h = plain(t)
        j, s = next_text(i)
        if s: rows.append((j, 'H3見出し⇔1文目', '【' + h + '】⇔ ' + s))
        continue
    if '<strong>' in t:
        rows.append((n, 'strong文', plain(t)))
    # ul/ol 直前の誘導文
    if i + 1 < len(lines):
        nx = lines[i + 1].strip()
        if nx.startswith(('<ul', '<ol')) and not t.startswith('<'):
            rows.append((n, 'ul/ol誘導文', plain(t)))
    # 語尾ヒストグラム（本文行のみ）
    p = plain(t)
    if p.endswith('。') and not t.startswith('<'):
        m = re.search(r'(.{2,7}?(?:ます|です|ません|ましょう|ください))。$', p)
        if m: tails[m.group(1)] += 1

# 同一行の二重登録だけ除外する（別の行に同じ文が繰り返される場合はレビュー対象として残す＝§E-5）
seen, uniq = set(), []
for r in rows:
    k = (r[0], r[1])
    if k in seen: continue
    seen.add(k); uniq.append(r)

with io.open(out, 'w', encoding='utf-8') as f:
    f.write('# 意味レビュー判定（§E-12-b・ゲート3b成果物）\n\n')
    f.write('対象: `%s`\n\n' % src)
    f.write('**使い方**: 1行ずつ「削る6パターン」（writing-manual §E-12-b）に当て、判定列を **そのまま／削除／修正** のどれかで埋める。\n')
    f.write('削除・修正は本文に反映してから lint.sh を再実行する。判定列が空のままの提示は editor が差し戻す。\n\n')
    f.write('| 行 | 種別 | テキスト | 判定 | 反映内容（削除/修正の場合） |\n|---|---|---|---|---|\n')
    for n, kind, text in uniq:
        f.write('| %d | %s | %s | ＿ | |\n' % (n, kind, text.replace('|', '｜')))
    f.write('\n## 文末語尾の頻度（3回以上は分散を検討）\n\n')
    for tail, c in tails.most_common(8):
        f.write('- 「〜%s。」× %d\n' % (tail, c))
    f.write('\n## 判定サマリー（記入必須）\n\n- 削除: ＿件 / 修正: ＿件 / そのまま: ＿件\n')

print('抽出完了: %s（判定対象 %d行）' % (out, len(uniq)))
PY
