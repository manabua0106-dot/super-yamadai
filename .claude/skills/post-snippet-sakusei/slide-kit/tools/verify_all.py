# 反映後の公開ページの確認（読み取り専用）。
#   verify_all.py new  <記事ID> <反映前の公開HTML> <旧→slideの数F> <新規の数M> <直書き置換の数S> <Fの会社の見出し名(カンマ区切り)>
#   verify_all.py same <記事ID> <反映前の公開HTML>          ← 戻したあとの確認
# 環境変数 VERIFY_AFTER_FILE があれば、公開ページの代わりにそのファイルを「後」として読む（試験用）
import os
import re
import subprocess
import sys

mode, pid, before_path = sys.argv[1], sys.argv[2], sys.argv[3]
if os.environ.get("VERIFY_AFTER_FILE"):
    after = open(os.environ["VERIFY_AFTER_FILE"], encoding="utf-8", errors="replace").read()
else:
    after = subprocess.run(["curl", "-s", "-m", "60", "-L", f"https://www.super-yamadai.co.jp/article/{pid}"], capture_output=True).stdout.decode("utf-8", "replace")
before = open(before_path, encoding="utf-8", errors="replace").read()


def body(h):
    m = re.search(r"<article.*?</article>", h, re.S)
    return m.group(0) if m else h


def norm(h):
    h = re.sub(r"<ul>(?:(?!</ul>).)*?rlmg.*?</ul>", "<RELATED/>", h, flags=re.S)
    h = re.sub(r"<li>(?:(?!</li>).)*?rlmg.*?</li>", "<RELATED-LI/>", h, flags=re.S)
    return re.sub(r"\b(?:nonce|_wpnonce|ver|v|t|ts)=[0-9a-zA-Z._-]+", "", h)


def stats(h):
    b = body(h)
    return {
        "h4_口コミ": sorted(re.sub(r"<.*?>", "", x).strip() for x in re.findall(r"<h4[^>]*>.*?</h4>", b, re.S) if "口コミ" in x),
        "スライド枠": len(re.findall(r'class="kc-scroll\b', b)),
        "ボタン(cm-main+cm-sub)": len(re.findall(r'class="cm-(?:main|sub)"', b)),
        "Xの引用": len(re.findall(r'class="twitter-tweet"', b)),
        "style": len(re.findall(r"<style\b", b)),
        "スクリプト": len(re.findall(r"if\(window\.__kcSlide\)", b)),
        "btnリンク": len(re.findall(r'<a[^>]*class="[^"]*\bbtn\b', b)),
        "生ショートコード": re.findall(r"\[(?:btn\b|/btn|[A-Za-z0-9ぁ-んァ-ヶ一-龥_.\-]+_kuchikomi(?:_slide)?\])[^\]]{0,60}\]?", b),
        "文字数": len(b),
    }


sb, sa = stats(before), stats(after)
if mode == "ins":
    I = int(sys.argv[4])
    checks = {
        f"スライド枠={sb['スライド枠']}+{I}": sa["スライド枠"] == sb["スライド枠"] + I,
        f"ボタン={sb['ボタン(cm-main+cm-sub)']}+{2 * I}": sa["ボタン(cm-main+cm-sub)"] == sb["ボタン(cm-main+cm-sub)"] + 2 * I,
        f"Xの引用={sb['Xの引用']}+{2 * I}": sa["Xの引用"] == sb["Xの引用"] + 2 * I,
        f"style>={sb['style']}+{4 * I}・スクリプト={sb['スクリプト']}+{I}": sa["style"] >= sb["style"] + 4 * I and sa["スクリプト"] == sb["スクリプト"] + I,
        f"btnリンク={sb['btnリンク']}（変化なし）": sa["btnリンク"] == sb["btnリンク"],
        "口コミ見出し(旧)の数は変化なし": sa["h4_口コミ"] == sb["h4_口コミ"],
        "生ショートコードなし": not sa["生ショートコード"],
    }
    print(f"記事{pid}  前: {sb}")
    print(f"記事{pid}  後: {sa}")
    print("判定: " + " / ".join(f"{k} {'OK' if v else 'NG'}" for k, v in checks.items()))
    sys.exit(0 if all(checks.values()) else 1)
if mode == "new":
    F, M, S = int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
    labels = [x for x in (sys.argv[7] if len(sys.argv) > 7 else "").split(",") if x]
    N = F + M + S
    want_h4 = list(sb["h4_口コミ"])
    for l in labels:
        t = f"{l}の口コミ"
        if t in want_h4:
            want_h4.remove(t)
    checks = {
        "旧の口コミ見出しがFだけ減った": sorted(sa["h4_口コミ"]) == sorted(want_h4),
        f"スライド枠={sb['スライド枠']}+{N}": sa["スライド枠"] == sb["スライド枠"] + N,
        f"ボタン={sb['ボタン(cm-main+cm-sub)']}+{2 * (F + M) + S}": sa["ボタン(cm-main+cm-sub)"] == sb["ボタン(cm-main+cm-sub)"] + 2 * (F + M) + S,
        f"Xの引用={sb['Xの引用']}+{2 * N}": sa["Xの引用"] == sb["Xの引用"] + 2 * N,
        f"style>={sb['style']}+{4 * N}・スクリプト={sb['スクリプト']}+{N}": sa["style"] >= sb["style"] + 4 * N and sa["スクリプト"] == sb["スクリプト"] + N,
        f"btnリンク={sb['btnリンク']}-{4 * F}-{2 * M}-{S}": sa["btnリンク"] == sb["btnリンク"] - 4 * F - 2 * M - S,
        "生ショートコードなし": not sa["生ショートコード"],
    }
    print(f"記事{pid}  前: {sb}")
    print(f"記事{pid}  後: {sa}")
    print("判定: " + " / ".join(f"{k} {'OK' if v else 'NG'}" for k, v in checks.items()))
    sys.exit(0 if all(checks.values()) else 1)
else:
    same = norm(body(before)) == norm(body(after))
    print(f"記事{pid}  戻した後は反映前と同じ: {'OK' if same else 'NG'}  (スライド枠 {sa['スライド枠']}・反映前 {sb['スライド枠']})")
    sys.exit(0 if same else 1)
