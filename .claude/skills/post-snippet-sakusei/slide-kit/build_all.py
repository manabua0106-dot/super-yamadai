# 口コミあり版（横スライド）スニペット本文を、サービスごとに組み立てる。WordPressには何も書かない。
#   入力: picks.json（サービス→表示名・ツイートID2件）, reserve.json（サービス→[r1,r2]、実測値）, existing-cta-snippets.json（元のCTA）
#   出力: bodies/<スニペット名>.body.html と bodies/_index.json
#   部品（CSS・スクリプト）は、公開済みの `lifemeal_kuchikomi_slide`（修正版）の本文から取り出す＝既存5社と同じ見た目・動き
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta

BASE = "/Users/manasimac/.cache/junni-henkou/wp-backup/yamadai/pre-all-20261013/"
PS = "/Users/manasimac/.cache/junni-henkou/wp-backup/yamadai/pre-slide-20261009/"
os.makedirs(BASE + "bodies", exist_ok=True)

tmpl = open(PS + "new-snippet-bodies-v2/lifemeal_kuchikomi_slide.body.html", encoding="utf-8", newline="").read()
CSS = tmpl[: tmpl.index('<div class="kc-scroll')]
SCRIPT = tmpl[tmpl.index("<script>"):]
assert CSS.count("<style>") == 4 and SCRIPT.count("if(window.__kcSlide)") == 1

picks = json.load(open(BASE + "picks.json", encoding="utf-8"))
reserve = json.load(open(BASE + "reserve.json", encoding="utf-8")) if os.path.exists(BASE + "reserve.json") else {}
cta_src = {o["title"]: o["content"] for o in json.load(open(BASE + "existing-cta-snippets.json", encoding="utf-8")).values()}
# CTAスニペットが無い2社：記事に直書きされている公式サイトへのボタンと同じ内容（記事656・157の該当節）
cta_src["楽天マート"] = '[btn href="https://sm.rakuten.co.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]楽天マートの公式サイトはこちら[/btn]'
cta_src["わんまいる"] = '[btn href="https://www.onemile.jp/" class="raised main-bc strong" target="_blank" rel="nofollow"]わんまいるの公式サイトはこちら[/btn]'


def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=40).read().decode("utf-8", "replace")


def tweet(tid):
    j = json.loads(get(f"https://cdn.syndication.twimg.com/tweet-result?id={tid}&token=a&lang=ja"))
    assert j.get("__typename") == "Tweet", f"取得不可 {tid}"
    raw = re.sub(r"\s*https://t\.co/\S+\s*$", "", j["text"]).strip()
    t = datetime.strptime(j["created_at"], "%Y-%m-%dT%H:%M:%S.000Z") + timedelta(hours=9)
    return {"id": tid, "text": raw, "name": j["user"]["name"], "h": j["user"]["screen_name"], "date": f"{t.year}年{t.month}月{t.day}日"}


def esc(s):
    # HTMLとして安全に。さらに、WordPressが勝手に解釈する文字（[ ] \ { }）は文字参照にする
    s = html.escape(html.unescape(s), quote=False)
    return s.replace("[", "&#91;").replace("]", "&#93;").replace("\\", "&#92;").replace("{", "&#123;").replace("}", "&#125;")


def nb(text, name):
    return f'<span style="white-space:nowrap">{name}</span>' + text[len(name):] if name and text.startswith(name) else text


def parse_cta(content):
    micros = [re.sub(r"<.*?>", "", m).strip() for m in re.findall(r'<p[^>]*class="center_micro"[^>]*>(.*?)</p>', content, re.S)]
    btns = re.findall(r'\[btn ([^\]]*)\](.*?)\[/btn\]', content, re.S)
    out = []
    for a, label in btns:
        out.append({"href": re.search(r'href="([^"]+)"', a).group(1), "label": re.sub(r"<.*?>", "", label).strip()})
    return micros, out


def cta_html(svc, name, label_fix=None):
    micros, btns = parse_cta(cta_src[svc])
    if len(btns) == 1 and not micros:  # 公式サイトへのボタンだけ（提携外のサービス）。目立たせすぎない枠線のボタンにする
        u = html.escape(btns[0]["href"], quote=True)
        return f'<div class="cm-cta"><a class="cm-sub" href="{u}" target="_blank" rel="nofollow noopener">{nb(esc(btns[0]["label"]), esc(name))}</a></div>'
    assert micros and len(btns) == 2, (svc, micros, btns)
    L = [b["label"] for b in btns]
    if label_fix:
        L = [label_fix.get(x, x) for x in L]
    h = lambda u: html.escape(u, quote=True)
    if len(micros) == 1:
        return (f'<div class="cm-cta"><p class="cm-micro">{esc(micros[0])}</p>'
                f'<a class="cm-main" href="{h(btns[0]["href"])}" rel="nofollow">{nb(esc(L[0]), esc(name))}</a>'
                f'<a class="cm-sub" href="{h(btns[1]["href"])}" rel="nofollow">{nb(esc(L[1]), esc(name))}</a></div>')
    # コープデリ型：マイクロコピーとボタンが2組（どちらも主ボタン）
    return (f'<div class="cm-cta"><p class="cm-micro">{esc(micros[0])}</p>'
            f'<a class="cm-main" href="{h(btns[0]["href"])}" rel="nofollow">{nb(esc(L[0]), esc(name))}</a>'
            f'<p class="cm-micro" style="margin-top:14px">{esc(micros[1])}</p>'
            f'<a class="cm-main" href="{h(btns[1]["href"])}" rel="nofollow">{nb(esc(L[1]), esc(name))}</a></div>')


FIX = {"ウェルネスダイニングを公式サイトで見る": "ウェルネスダイニングの注文はこちら"}  # 副ボタンと文言が被るため（既存5社と同じ扱い）
bodies, index = {}, {}
only = sys.argv[1:] or list(picks)
for svc in only:
    p = picks[svc]
    tws = [tweet(i) for i in p["ids"]]
    embeds = "".join(
        f'<div class="kc-emb"><blockquote class="twitter-tweet" data-width="300" data-conversation="none" data-dnt="true" data-lang="ja">'
        f'<p lang="ja" dir="ltr">{esc(t["text"]).replace(chr(10), "<br>")}</p>&mdash; {esc(t["name"])} (@{esc(t["h"])}) '
        f'<a href="https://twitter.com/{t["h"]}/status/{t["id"]}?ref_src=twsrc%5Etfw">{t["date"]}</a></blockquote></div>' for t in tws)
    r1, r2 = reserve.get(svc, [318, 696])
    block = f'<div class="kc-scroll kc-top kc-res" role="region" aria-label="{esc(p["label"])}の口コミ" style="--r1:{r1}px;--r2:{r2}px">{embeds}</div>\n{cta_html(svc, p["name_for_nowrap"], FIX)}'
    body = CSS + block + "\n" + SCRIPT
    name = f"{svc}_kuchikomi_slide"
    open(BASE + f"bodies/{name}.body.html", "w", encoding="utf-8", newline="").write(body)
    index[name] = {"svc": svc, "len": len(body), "sha": hashlib.sha256(body.encode("utf-8")).hexdigest()[:12], "tweets": [t["id"] for t in tws], "reserve": [r1, r2]}
    print(f"{name:<40}{len(body):>6}字 指紋={index[name]['sha']} 予約高さ={r1}/{r2}")
json.dump(index, open(BASE + "bodies/_index.json", "w"), ensure_ascii=False, indent=1)
