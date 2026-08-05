#!/bin/bash
# build-h2-ledger.sh — 公開記事一覧.md の全URLを実取得して articles/H2台帳.md を再生成する
# 使い方: bash scripts/build-h2-ledger.sh
# 前提: articles/公開記事一覧.md が最新（古ければ先に bash scripts/update-article-list.sh）
set -u
export LC_ALL=en_US.UTF-8
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIST="$ROOT/articles/公開記事一覧.md"
CACHE="${TMPDIR:-/tmp}/yamadai-h2-cache"
[ -f "$LIST" ] || { echo "ERROR: $LIST がありません。先に bash scripts/update-article-list.sh"; exit 1; }
mkdir -p "$CACHE"

python3 - "$LIST" > "$CACHE/urls.tsv" <<'PY'
import sys,io,re
s=io.open(sys.argv[1],encoding="utf-8").read()
for m in re.finditer(r'^\| (.+?) \| (https://www\.super-yamadai\.co\.jp/article/\d+) \|', s, re.M):
    print(m.group(2)+"\t"+m.group(1))
PY

N=$(wc -l < "$CACHE/urls.tsv" | tr -d ' ')
echo "対象 $N 記事。未取得分をダウンロードします（キャッシュ: $CACHE）"
while IFS=$'\t' read -r url title; do
  id="${url##*/}"
  [ -s "$CACHE/$id.html" ] && continue
  curl -sS -m 25 -A "Mozilla/5.0" "$url" -o "$CACHE/$id.html" || echo "  取得失敗: $url"
  sleep 0.3
done < "$CACHE/urls.tsv"

python3 - "$CACHE" "$ROOT/articles/H2台帳.md" <<'PY'
import sys,io,re,os,html
from collections import Counter,defaultdict
cache,outpath=sys.argv[1],sys.argv[2]
urls=[l.rstrip("\n").split("\t") for l in io.open(os.path.join(cache,"urls.tsv"),encoding="utf-8") if l.strip()]
def clean(t):
    return html.unescape(re.sub(r'<[^>]*>','',t)).strip()
arts=[]
for url,title in urls:
    aid=url.rsplit("/",1)[-1]; p=os.path.join(cache,aid+".html")
    if not os.path.exists(p): continue
    s=io.open(p,encoding="utf-8",errors="ignore").read()
    m=re.search(r'<div[^>]*class="[^"]*(?:entry-content|post-content|article-body)[^"]*"[^>]*>(.*)', s, re.S)
    body=m.group(1) if m else s
    h2=[c for c in (clean(x) for x in re.findall(r'<h2[^>]*>(.*?)</h2>', body, re.S)) if c and len(c)<80]
    h3=[c for c in (clean(x) for x in re.findall(r'<h3[^>]*>(.*?)</h3>', body, re.S)) if c and len(c)<80]
    arts.append({"id":aid,"url":url,"title":title,"h2":h2,"h3":h3})

BRANDS=["オイシックス","コープデリ","ヨシケイ","らでぃっしゅぼーや","パルシステム","ワタミの宅食ダイレクト","ワタミの宅食",
        "ウェルネスダイニング","ツクリオ","ライフミール","坂ノ途中","DELIPICKS","デリピックス","nosh","ナッシュ"]
def brand(t):
    for b in BRANDS:
        if b in t: return b
    return ""
def kwtype(t):
    for k,v in [("口コミ","口コミ・評判"),("評判","口コミ・評判"),("まずい","口コミ・評判"),
                ("料金","料金・値段"),("値段","料金・値段"),("高い","料金・値段"),("お試し","お試し"),
                ("比較","比較"),("一人暮らし","ライフスタイル"),("二人暮らし","ライフスタイル"),
                ("人家族","ライフスタイル"),("おすすめ","比較・ランキング")]:
        if k in t: return v
    return "その他"

out=["# H2トピック台帳（カニバリ照合用・自動生成）","",
"> **用途**：新規構成のH2を作ったら `bash scripts/check-cannibal.sh` で本台帳と突合する。",
"> 同じトピックが既存記事にあるなら、粒度か角度を変えるか、そのH2を作らない。",
"> **型見本とは役割が違う**：型見本は「文の作り方」だけを見る。トピックをまねるとカニバるので、**トピックは本台帳で弾く**。",
"> 再生成：`bash scripts/build-h2-ledger.sh`","",
f"対象 {len(arts)} 記事／H2 {sum(len(a['h2']) for a in arts)} 本／H3 {sum(len(a['h3']) for a in arts)} 本","",
"## 記事タイプ別",""]
byt=defaultdict(list)
for a in arts: byt[kwtype(a['title'])].append(a)
out += ["| 記事タイプ | 記事数 | H2平均 |","|---|---|---|"]
for t,v in sorted(byt.items(), key=lambda x:-len(x[1])):
    out.append(f"| {t} | {len(v)} | {sum(len(x['h2']) for x in v)/len(v):.1f} |")
out += ["","## ブランド別のH2一覧（指名記事のカニバリはここで弾く）",""]
byb=defaultdict(list)
for a in arts:
    b=brand(a['title'])
    if b: byb[b].append(a)
for b,v in sorted(byb.items(), key=lambda x:-len(x[1])):
    out += [f"### {b}（{len(v)}記事）",""]
    for a in v:
        out += [f"**[{a['id']}]({a['url']}) {a['title']}**",""] + [f"- {h}" for h in a['h2']] + [""]
out += ["---","","## 全記事のH2",""]
for a in arts:
    out += [f"### [{a['id']}]({a['url']}) {a['title']}",""] + [f"- {h}" for h in a['h2']] + [""]
io.open(outpath,"w",encoding="utf-8").write("\n".join(out))
print(f"生成: {outpath}（{len(arts)}記事）")
PY
