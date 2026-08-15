#!/usr/bin/env python3
"""公開済みWordPress記事の「生ソース」を安全に読み書きするヘルパー。

前提：呼ぶ前に認証情報を環境変数に読み込んでおく（Keychainから取る）。

    eval "$(grep -E '^(SVC=|export WORDPRESS_)' ~/.claude/mcp-servers/wordpress/run-yamadai.sh)"

使い方：
    python3 wpsrc.py get  546 article546_raw.html
    python3 wpsrc.py put  546 article546_new.html
    python3 wpsrc.py show 546            # 描画結果を rendered_<id>.html に保存

なぜ必要か：WordPress連携（MCP）の wp_get_post が返すのは「表示用に変換されたHTML」で、
ショートコードが展開され、目次・loading="lazy"・srcset が混ざっている。それを書き戻すと
記事が壊れる。REST の context=edit だけが編集画面と同じ生ソースを返す。
"""
import base64
import json
import os
import re
import sys
import urllib.request


def creds():
    u = os.environ.get("WORDPRESS_USERNAME")
    p = os.environ.get("WORDPRESS_APP_PASSWORD")
    s = (os.environ.get("WORDPRESS_SITE_URL") or "").rstrip("/")
    if not (u and p and s):
        sys.exit(
            "認証情報がありません。先に次を実行してください:\n"
            '  eval "$(grep -E \'^(SVC=|export WORDPRESS_)\' '
            '~/.claude/mcp-servers/wordpress/run-yamadai.sh)"'
        )
    return u, p, s


def call(path, data=None, method="GET"):
    u, p, s = creds()
    tok = base64.b64encode(f"{u}:{p}".encode()).decode()
    headers = {"Authorization": "Basic " + tok}
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(s + path, data=body, method=method, headers=headers)
    return json.load(urllib.request.urlopen(req, timeout=60))


def shortcodes(text):
    return sorted(set(re.findall(r"\[([a-zA-Z0-9ぁ-んァ-ヶ一-龥_.\-]{2,40})[\s\]]", text)))


def cmd_get(post_id, outfile):
    d = call(f"/wp-json/wp/v2/posts/{post_id}?context=edit")
    raw = d["content"]["raw"]
    with open(outfile, "w") as f:
        f.write(raw)
    print(f"✅ 生ソース取得: {len(raw)}文字 → {outfile}")
    print("タイトル:", d["title"]["raw"])
    print("含まれるショートコード:", shortcodes(raw) or "なし（ベタHTML記事）")


def cmd_put(post_id, infile):
    new = open(infile).read()
    if not new.strip():
        sys.exit("❌ 中身が空です。送信しません。")

    cur = call(f"/wp-json/wp/v2/posts/{post_id}?context=edit")["content"]["raw"]
    # 事故防止：現状より極端に短い内容は送らない（差し替えミス・取りこぼしの検出）
    if len(new) < len(cur) * 0.7:
        sys.exit(
            f"❌ 送信を中止しました。新:{len(new)}文字 / 現:{len(cur)}文字 で3割以上減っています。\n"
            "   意図した削減なら、差分を確認したうえで手動で送ってください。"
        )
    # 事故防止：表示用HTMLの特徴が「増えて」いたら止める。
    # 「有無」では判定しない。過去に表示用HTMLが貼られた記事は最初から srcset 等を含むため。
    for ng, why in [
        ("js-toc-list", "目次の展開後HTML"),
        ('srcset="', "画像のsrcset（表示時に自動付与）"),
        ('loading="lazy"', "画像のlazy属性（表示時に自動付与）"),
    ]:
        if new.count(ng) > cur.count(ng):
            sys.exit(
                f"❌ 送信を中止しました。{why} が {cur.count(ng)}件 → {new.count(ng)}件 に増えています"
                "（表示用HTMLを書き戻そうとしています）。"
            )

    d = call(f"/wp-json/wp/v2/posts/{post_id}", data={"content": new}, method="POST")
    print("✅ 更新完了 / status:", d["status"], "/ modified:", d["modified"])

    saved = call(f"/wp-json/wp/v2/posts/{post_id}?context=edit")["content"]["raw"]
    ok = saved.replace("\r\n", "\n") == new.replace("\r\n", "\n")
    print("保存ソース == 送信内容:", ok)
    if not ok:
        print("⚠️ 一致しません。WordPress側で整形された可能性があります。差分を確認してください。")


def cmd_show(post_id):
    d = json.load(
        urllib.request.urlopen(
            urllib.request.Request(f"{creds()[2]}/wp-json/wp/v2/posts/{post_id}"), timeout=60
        )
    )
    out = f"rendered_{post_id}.html"
    with open(out, "w") as f:
        f.write(d["content"]["rendered"])
    print(f"描画結果を {out} に保存（{len(d['content']['rendered'])}文字）")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    op = sys.argv[1]
    if op == "get":
        cmd_get(sys.argv[2], sys.argv[3])
    elif op == "put":
        cmd_put(sys.argv[2], sys.argv[3])
    elif op == "show":
        cmd_show(sys.argv[2])
    else:
        sys.exit(__doc__)
