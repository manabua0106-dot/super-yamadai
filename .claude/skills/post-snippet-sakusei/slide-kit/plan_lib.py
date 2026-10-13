# 記事の生ソースから「口コミあり版にする位置」を決める（読み取り専用）。
# 規則（2026-10-08 のマナブさん決定を実装）:
#   ①最初のH2より前（目次の上）にある最初のCTA → 口コミあり
#   ②「ランキング形式」のH2（H3の節に、別々のサービスのCTAが2種類以上ある）の、1〜5番目のH3の節のCTA → 口コミあり
#   ③同じ記事で同じサービスは最初の1か所だけ（同じ口コミを何度も出さない）
import re

CTA_ALL = ["ヨシケイ", "コープデリ", "sakanototyu_vegetable", "Oisix", "GreenBeans", "ラディッシュボーヤ", "palsystem", "pakumogu", "attogohan",
           "tsukurio", "Dr.ツルガメキッチン", "MITSUBOSHI", "DELIPICKS", "MuscleDeli", "Meals", "タイヘイ",
           "lifemeal", "watamidirect", "wellness-dining", "ワタミ", "筋肉食堂DELI", "magokorokea", "nitireifoods", "shokunosoyokaze", "健康直球便"]


def tok_re(names, suffixes=("_kuchikomi_slide", "_kuchikomi")):
    alt = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    # 末尾の _table 等は別のスニペット。ここで拾うのは「CTA本体」とその口コミ版だけ
    return re.compile(r"\[(" + alt + r")(" + "|".join(suffixes) + r")?\]")


def plan_article(raw, names):
    """戻り値: [(位置, サービス, 理由)]  ※位置は raw 内の文字オフセット"""
    rx = tok_re(names)
    h2 = [(m.start(), re.sub(r"<.*?>", "", m.group(1)).strip()) for m in re.finditer(r"<h2[^>]*>(.*?)</h2>", raw, re.S)]
    h3 = [(m.start(), re.sub(r"<.*?>", "", m.group(1)).strip()) for m in re.finditer(r"<h3[^>]*>(.*?)</h3>", raw, re.S)]
    toks = [(m.start(), m.group(1), m.group(2) or "") for m in rx.finditer(raw)]
    cand = []
    first_h2 = h2[0][0] if h2 else 10 ** 12
    # ① 最初のH2より前の最初のCTA
    pre = [t for t in toks if t[0] < first_h2]
    if pre:
        cand.append((pre[0][0], pre[0][1], "目次の上の最初のCTA"))
    # ② ランキング形式のH2の 1〜5番目のH3
    bounds = [p for p, _ in h2] + [len(raw)]
    for i, (p2, t2) in enumerate(h2):
        end = bounds[i + 1]
        subs = [(p, t) for p, t in h3 if p2 < p < end]
        secs = []
        for j, (p, t) in enumerate(subs):
            e = subs[j + 1][0] if j + 1 < len(subs) else end
            secs.append((j + 1, p, e, t))
        # 別々のサービスのCTAを持つ節が2種類以上あるH2をランキング形式とみなす
        svc_by_sec = []
        for idx, s, e, t in secs:
            svc_by_sec.append({x[1] for x in toks if s <= x[0] < e})
        distinct = set().union(*svc_by_sec) if svc_by_sec else set()
        sec_with = sum(1 for s in svc_by_sec if s)
        if len(distinct) >= 2 and sec_with >= 2:
            for idx, s, e, t in secs:
                if idx > 5:
                    break
                for pos, svc, suf in toks:
                    if s <= pos < e:
                        cand.append((pos, svc, f"ランキング形式「{t2[:14]}」の{idx}番目"))
                        break  # 1つの節では最初のCTAだけ
    # ③ 同じ記事で同じサービスは最初の1か所だけ
    cand.sort()
    seen, out = set(), []
    for pos, svc, why in cand:
        if svc in seen:
            continue
        seen.add(svc)
        out.append((pos, svc, why))
    return out
