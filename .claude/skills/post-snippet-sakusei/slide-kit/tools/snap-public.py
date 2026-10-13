# 公開中の全記事・全固定ページの「公開ページの本文」を取って保存する（読み取り専用）。前後で比べて「既存ページが変わっていない」を示す。
#   使い方: snap-public.py <出力JSON> [本文HTMLの保存先フォルダ]
import hashlib
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, "/Users/manasimac/Projects/super-yamadai/.claude/skills/wp-kiji-henshu")
import wpsrc  # noqa: E402

OUT = sys.argv[1]
SAVE = sys.argv[2] if len(sys.argv) > 2 else None
if SAVE:
    os.makedirs(SAVE, exist_ok=True)

items = []
for kind in ("posts", "pages"):
    page = 1
    while True:
        try:
            d = wpsrc.call(f"/wp-json/wp/v2/{kind}?context=edit&status=publish&per_page=50&page={page}&_fields=id,link,type")
        except Exception:
            break
        if not d:
            break
        items += [{"id": p["id"], "link": p["link"], "type": p["type"]} for p in d]
        page += 1
print("公開された投稿・固定ページ:", len(items))


def fetch(p):
    r = subprocess.run(["curl", "-s", "-m", "60", "-L", "-w", "\n%{http_code}", p["link"]], capture_output=True).stdout.decode("utf-8", "replace")
    html, _, code = r.rpartition("\n")
    m = re.search(r"<article.*?</article>", html, re.S)
    body = m.group(0) if m else html
    norm = re.sub(r"\b(?:nonce|_wpnonce|ver|v|t|ts)=[0-9a-zA-Z._-]+", "", body)
    norm = re.sub(r'(?:data-)?nonce="[^"]*"', "", norm)
    if SAVE:
        open(os.path.join(SAVE, f"{p['type']}-{p['id']}.html"), "w", encoding="utf-8").write(body)
    return str(p["id"]), {"type": p["type"], "http": code, "len": len(body), "sha": hashlib.sha256(norm.encode("utf-8")).hexdigest()[:16], "has_article": bool(m)}


with ThreadPoolExecutor(max_workers=4) as ex:
    res = dict(ex.map(fetch, items))
json.dump(res, open(OUT, "w"), ensure_ascii=False, indent=0, sort_keys=True)
print("保存:", OUT, "/ 200以外:", [k for k, v in res.items() if v["http"] != "200"], "/ <article>が取れなかったページ:", [k for k, v in res.items() if not v["has_article"]])
