# 記事ごとの「差し替え後ファイル」を作る（読み取り専用：控えの生ソースを読み、手元に新ファイルを書くだけ）。
#   規則どおりの位置（plan_lib）にあるCTAを [X] または [X_kuchikomi] から [X_kuchikomi_slide] に置き換える。
#   例外：スニペットが無く直書きの公式サイトボタンしかない2社（楽天マート・わんまいる）は、そのボタンを新スニペットに置き換える。
#   使い方: make_edits_all.py <使うサービス(カンマ区切り)> <出力フォルダ名> [除外記事ID,...]
# 検算：①置換した位置を元に戻すと原文とバイト単位で一致 ②改行コードは元のまま ③トークン数が計画と一致
#       ④前方一致の落とし穴（[X] を全部置換すると [Xなんとか] が文字のまま出る）は、該当の置換を見送る
import difflib
import json
import os
import re
import sys

BASE = "/Users/manasimac/.cache/junni-henkou/wp-backup/yamadai/pre-all-20261013/"
sys.path.insert(0, BASE)
from plan_lib import plan_article, CTA_ALL  # noqa: E402

use = [x for x in sys.argv[1].split(",") if x]
out_dir = BASE + sys.argv[2]
exclude = {int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else "").split(",") if x}
os.makedirs(out_dir, exist_ok=True)
REGISTERED = set(json.load(open(BASE + "registered-tags.json", encoding="utf-8")))
SUF = "_kuchikomi_slide"
LABEL = {"lifemeal": "ライフミール", "watamidirect": "ワタミの宅食ダイレクト", "wellness-dining": "ウェルネスダイニング", "ワタミ": "ワタミの宅食", "筋肉食堂DELI": "筋肉食堂DELI"}
SPECIAL = {  # 記事ID -> [(サービス, 置き換える直書きボタンの全文)]
    656: [("楽天マート", '[btn href="https://sm.rakuten.co.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]楽天マートの公式サイトはこちら[/btn]')],
    157: [("わんまいる", '[btn href="https://www.onemile.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]わんまいるの公式サイトはこちら[/btn]')],
}
idx = [i for i in json.load(open(BASE + "index.json", encoding="utf-8")) if i["status"] == "publish" and i["id"] not in exclude]
rows, summary, allok = [], [], True
for it in sorted(idx, key=lambda i: i["id"]):
    pid = it["id"]
    raw = open(BASE + f"raw-all/post-{pid}.html", encoding="utf-8", newline="").read()
    plan = [(p, s) for p, s, _ in plan_article(raw, CTA_ALL) if s in use]
    edits, skipped = [], []
    unknown = {m.group(1) for m in re.finditer(r"\[([^\]\s=/<>&\[]+)", raw)} - REGISTERED - {"btn"}
    exact_left = {s: len(re.findall(r"\[" + re.escape(s) + r"\]", raw)) for _, s in plan}
    for pos, svc in sorted(plan):
        m = re.compile(r"\[" + re.escape(svc) + r"(_kuchikomi_slide|_kuchikomi)?\]").match(raw, pos)
        assert m, (pid, pos, svc, raw[pos:pos + 30])
        cur = m.group(1) or ""
        if cur == SUF:
            continue
        if cur == "":
            risky = [u for u in unknown if u.startswith(svc) and u != svc]
            if risky and exact_left[svc] <= 1:
                skipped.append((svc, risky))
                continue
            exact_left[svc] -= 1
        edits.append((m.start(), m.end(), svc, cur))
    for svc, btn in SPECIAL.get(pid, []):
        if svc in use:
            assert raw.count(btn) == 1, (pid, svc, raw.count(btn))
            s0 = raw.index(btn)
            edits.append((s0, s0 + len(btn), svc, "btn"))
    edits.sort()
    if not edits:
        if skipped:
            summary.append((pid, 0, 0, 0, [], skipped, True, "CRLF" if "\r\n" in raw else "LF"))
        continue
    out, last = [], 0
    for s0, e0, svc, cur in edits:
        out.append(raw[last:s0]); out.append(f"[{svc}{SUF}]"); last = e0
    out.append(raw[last:])
    new = "".join(out)
    # 逆変換の検算：置換した位置を元の文字列に戻し、原文とバイト単位で一致するか
    pos_new, delta = [], 0
    for s0, e0, svc, cur in edits:
        tok = f"[{svc}{SUF}]"
        pos_new.append((s0 + delta, tok, raw[s0:e0]))
        delta += len(tok) - (e0 - s0)
    restored = new
    for pn, tok, orig in reversed(pos_new):
        assert restored[pn:pn + len(tok)] == tok, (pid, pn)
        restored = restored[:pn] + orig + restored[pn + len(tok):]
    ok_rebuild = restored == raw
    pre_slide = len(re.findall(r"_kuchikomi_slide\]", raw))
    ok_count = len(re.findall(r"_kuchikomi_slide\]", new)) == pre_slide + len(edits)
    ok_eol = ("\r\n" in raw) == ("\r\n" in new)
    ok = ok_rebuild and ok_count and ok_eol
    allok &= ok
    open(out_dir + f"/post-{pid}.new.html", "w", encoding="utf-8", newline="").write(new)
    diff_lines = [l for l in difflib.unified_diff(raw.splitlines(), new.splitlines(), lineterm="", n=0) if l[:1] in "+-" and l[:3] not in ("+++", "---")]
    open(out_dir + f"/post-{pid}.diff", "w", encoding="utf-8").write("\n".join(diff_lines) + "\n")
    flips = [svc for s0, e0, svc, cur in edits if cur == "_kuchikomi"]
    news = [svc for s0, e0, svc, cur in edits if cur == ""]
    specials = [svc for s0, e0, svc, cur in edits if cur == "btn"]
    labels = ",".join(LABEL[s] for s in flips)
    rows.append((pid, len(flips), len(news), len(specials), labels))
    summary.append((pid, len(flips), len(news), len(specials), [e[2] for e in edits], skipped, ok, "CRLF" if "\r\n" in raw else "LF"))
    json.dump({"flips": flips, "news": news, "specials": specials, "skipped": [[a, b] for a, b in skipped]}, open(out_dir + f"/post-{pid}.meta.json", "w"), ensure_ascii=False)
with open(out_dir + "/targets.tsv", "w", encoding="utf-8") as f:
    for r in rows:
        f.write("\t".join(str(x) for x in r) + "\n")
print(f"{'記事':>5} {'旧→slide':>8} {'新規':>5} {'直書き':>6} 検算  改行  内容 / 見送り")
for pid, nf, nn, ns, svcs, skipped, ok, eol in summary:
    print(f"{pid:>5} {nf:>8} {nn:>5} {ns:>6}  {'OK ' if ok else 'NG '} {eol:<5} {', '.join(svcs)}" + (f"  ★見送り: {skipped}" if skipped else ""))
tf = sum(s[1] for s in summary); tn = sum(s[2] for s in summary); ts = sum(s[3] for s in summary)
na = len([s for s in summary if s[1] + s[2] + s[3] > 0])
print(f"\n記事 {na} 本 / 旧→slide {tf} か所 / 新規 {tn} か所 / 直書き置換 {ts} か所 / 全検算 {'OK' if allok else 'NG あり'}")
sys.exit(0 if allok else 1)
