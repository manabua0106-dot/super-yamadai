# 保存した「公開ページの本文」を2つのフォルダで突き合わせる（読み取り専用）。
# ランダムに入れ替わる関連記事リスト（rlmg）と、毎回変わるnonce等は除いて比べる。
#   使い方: compare-public.py <前のフォルダ> <後のフォルダ> [変わってよいページID(カンマ区切り)]
import glob
import os
import re
import sys

A, B = sys.argv[1], sys.argv[2]
ALLOW = {x for x in (sys.argv[3] if len(sys.argv) > 3 else "").split(",") if x}


def norm(h):
    h = re.sub(r"<ul>(?:(?!</ul>).)*?rlmg.*?</ul>", "<RELATED/>", h, flags=re.S)
    h = re.sub(r"<li>(?:(?!</li>).)*?rlmg.*?</li>", "<RELATED-LI/>", h, flags=re.S)
    h = re.sub(r"\b(?:nonce|_wpnonce|ver|v|t|ts)=[0-9a-zA-Z._-]+", "", h)
    return h


names = sorted(os.path.basename(f) for f in glob.glob(os.path.join(A, "*.html")))
changed, missing, same = [], [], 0
for n in names:
    pb = os.path.join(B, n)
    if not os.path.exists(pb):
        missing.append(n)
        continue
    a = norm(open(os.path.join(A, n), encoding="utf-8").read())
    b = norm(open(pb, encoding="utf-8").read())
    if a == b:
        same += 1
    else:
        pid = re.search(r"-(\d+)\.html", n).group(1)
        changed.append((pid, n))
unexpected = [c for c in changed if c[0] not in ALLOW]
print(f"比較 {len(names)} ページ / 同一 {same} / 変化 {len(changed)}（うち許可外 {len(unexpected)}） / 後に無い {len(missing)}")
if changed:
    print("変化したページ:", ", ".join(c[0] for c in changed))
if unexpected:
    print("★許可していないのに変わったページ:", ", ".join(c[0] for c in unexpected))
if missing:
    print("★後のフォルダに無いページ:", missing)
sys.exit(0 if (not unexpected and not missing) else 1)
