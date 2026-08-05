#!/bin/bash
# check-cannibal.sh — 構成案のH2を、公開55記事のH2と突合してカニバリを検出する
# 使い方: bash scripts/check-cannibal.sh "articles/{KW}/outline.md"
#
# 背景（2026-08-05）：見出しの作り方を「お手本に寄せる」方向に変えると、
# トピックまで似てカニバる懸念がある。型見本は「文の作り方」だけを見て、
# トピックの重複は本スクリプトで機械的に弾く、という役割分担にした。
#
# 台帳の更新: bash scripts/build-h2-ledger.sh （公開記事一覧.md の全URLを実取得して再生成）
set -u
export LC_ALL=en_US.UTF-8
FILE="${1:?使い方: bash scripts/check-cannibal.sh <outline.mdのパス>}"
LEDGER="$(dirname "$0")/../articles/H2台帳.md"
[ -f "$FILE" ] || { echo "ERROR: 構成案が見つかりません: $FILE"; exit 1; }
[ -f "$LEDGER" ] || { echo "ERROR: 台帳がありません。bash scripts/build-h2-ledger.sh で生成してください"; exit 1; }

python3 - "$FILE" "$LEDGER" <<'PY'
import sys,io,re
target,ledger=sys.argv[1],sys.argv[2]

s=io.open(target,encoding="utf-8").read()
m=re.search(r'## 見出しツリー(.*?)\n---',s,re.S)
block=m.group(1) if m else s
mine=[l[3:].strip() for l in block.split("\n") if l.startswith("H2 ")]

pub=[]
cur=("","")
for l in io.open(ledger,encoding="utf-8"):
    l=l.rstrip("\n")
    mm=re.match(r'^### \[(\d+)\]\(([^)]+)\) (.+)$', l)
    if mm: cur=(mm.group(1), mm.group(3)); continue
    if l.startswith("- ") and cur[0]:
        pub.append((cur[0],cur[1],l[2:].strip()))

def toks(t):
    t=re.sub(r'[０-９0-9,，]+','N',t)
    return set(re.findall(r'[ぁ-んァ-ヶ一-龥A-Za-z]{2,}',t))

WARN=0
for h in mine:
    a=toks(h)
    if not a: continue
    best=[]
    for aid,at,ph in pub:
        b=toks(ph)
        if not b: continue
        j=len(a&b)/len(a|b)
        if j>=0.45: best.append((j,aid,at,ph))
    for j,aid,at,ph in sorted(best,reverse=True)[:2]:
        lv="ERROR" if j>=0.65 else "WARN "
        if j>=0.65: WARN+=100
        else: WARN+=1
        print(f"{lv} 「{h}」")
        print(f"      ≒ [{aid}] 「{ph}」（一致度{j:.0%}／{at[:34]}）")

print("---")
err=WARN//100; wrn=WARN%100
print(f"check-cannibal: 一致度65%以上={err}件（要対応） 45〜64%={wrn}件（一読して判断）")
print("公開55記事のH2 %d本と突合しました。" % len(pub))
sys.exit(1 if err else 0)
PY
