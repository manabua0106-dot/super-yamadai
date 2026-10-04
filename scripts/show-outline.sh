#!/usr/bin/env bash
# show-outline.sh — 構成案のH1/H2/H3を一文字も省略せずに出す
#
# 使い方:
#   bash scripts/show-outline.sh "articles/{KW}/outline.md"
#
# なぜ作ったか:
#   2026-09-09、Manabuさんから2回「構成ができた時・いじった時はH2とH3を一文字も省略せず出して」
#   と言われた。要約したり一部だけ出したりすると、Manabuさんが構成を確認できない。
#   **この出力をそのままチャットに貼る。** 自分で書き写すと省略・言い換えが起きる。
#
# 出すタイミング（省略禁止）:
#   1. 構成案を作り終えたとき
#   2. 見出しを1本でも直したとき（1本の修正でも全体を出す）
#   3. レビュー・検証の指摘を反映したとき
#
# メタ節（2つ目の --- 以降、または「# 差別化メモ」等）は出さない。記事の見出しだけを出す。
set -uo pipefail
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "使い方: bash scripts/show-outline.sh \"articles/{KW}/outline.md\"" >&2
  exit 2
fi

python3 - "$FILE" <<'PY'
import io, re, sys

path = sys.argv[1]
lines = io.open(path, encoding='utf-8').read().split('\n')

META = re.compile(r'^#{1,3} *(カニバリ|差別化|口コミ素材|執筆時の要裏取り|要裏取り|構成上のメモ|'
                  r'変更操作|変更まとめ|競合トピックの網羅|網羅チェック|訴求設計|数値の突合|'
                  r'数字の決まり|検証スクリプト|外部FB|Manabuさんに提起|分量の目標|本文に置く表|'
                  r'共起語の配置|提示前の3検査|音読で検出|Codex|5レンズ|使うショートコード|広告主|'
                  r'service-info)')

title = None
rows = []
sep = 0
meta = False
h2n = 0
for l in lines:
    s = l.strip()
    if s == '---':
        sep += 1
        if sep >= 2:
            meta = True
        continue
    if META.match(s):
        meta = True
        continue
    if s.startswith('# ') and not s.startswith('## '):
        if title is None and not meta:
            title = s[2:].strip()
        continue
    if meta:
        continue
    if s.startswith('## '):
        h2n += 1
        rows.append(('H2', h2n, s[3:].strip()))
    elif s.startswith('### '):
        rows.append(('H3', h2n, s[4:].strip()))
    elif s.startswith('- '):
        rows.append(('H3', h2n, s[2:].strip()))

CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'


def num(i):
    return CIRCLED[i - 1] if 1 <= i <= len(CIRCLED) else '(%d)' % i


if title:
    print('H1  %s  【%d字】' % (title, len(title)))
    print()

n_h2 = sum(1 for r in rows if r[0] == 'H2')
n_h3 = sum(1 for r in rows if r[0] == 'H3')

idx = 0
while idx < len(rows):
    lv, gi, text = rows[idx]
    if lv == 'H2':
        kids = []
        j = idx + 1
        while j < len(rows) and rows[j][0] == 'H3':
            kids.append(rows[j][2])
            j += 1
        print('H2%s %s  【%d字】' % (num(gi), text, len(text)))
        for k, kid in enumerate(kids):
            mark = '└' if k == len(kids) - 1 else '├'
            print('     %s %s' % (mark, kid))
        if kids:
            print()
        idx = j
    else:
        idx += 1

print('── H2 %d本／H3 %d本 ──' % (n_h2, n_h3))
print('※ この出力をそのままチャットに貼る。書き写すと省略・言い換えが起きる')
PY
