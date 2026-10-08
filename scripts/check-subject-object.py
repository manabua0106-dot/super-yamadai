#!/usr/bin/env python3
"""最上位ルール（.claude/rules/writing-manual.md §0）の機械チェック。

使い方: python3 scripts/check-subject-object.py <article.html> [KW語幹]
  KW語幹を省略すると、articles/{KW}/ 直下のファイルはフォルダ名の最初の語（例:「ウォーターサーバー おすすめ」→「ウォーターサーバー」）を使う。
  KW語幹が決まらないときは、0-1（箇条書き・表の直前の文）のチェックだけ飛ばす。
ERROR が1件でもあれば終了コード1。scripts/lint.sh から呼ばれる。

チェックする規則（writing-manual §0）
  0-1 ol・ul・表の直前の1文に、記事の主役の名詞（KW語幹）がない（何の一覧か分からない）
  0-2 「型」だけの言い方（向く型・型を決める）／その見出しの中で初めて出す「宅配型は」のように型の名前だけが主語
  0-3 読者がすることを「決めます」「選びます」と書き手が言い切っている
  0-4 サービス名・機種名の最初の登場に、紹介H3へのジャンプリンクがない
  0-5 日本語として通じない言い回し（「高さが増える」など）
  0-6 「社」「社名」を使っている（「サービス」「サービス名」と書く。「9社」「各社」「会社」は可）
  0-7 注意事項・免責・断り書き（掲載順は優劣でない／金額は税込／確認日／適用条件）が本文にある（記事末尾の「※」に集約する）
  0-8 「〜と案内している」「案内がある」型の伝聞（事実を言い切る）
  0-9 同じ行（同じサービス）を持つ表を、同じ見出しの中で続けて置いている（列を足して1つの表にまとめる）
  0-10 同じ書き出し（先頭6文字）の文が3つ以上続いている（主語を毎回書くのではなく、前の文の新情報で受ける）
  0-11 サービス紹介H3に、解約・休止・手数料などのデメリット（おすすめを紹介する節には書かない）
  0-12 サービス名・機種名を文章（段落・箇条書き）に書いている（表にする。例外は口コミの出典を紹介する行と、サービス紹介H3の中）
  0-14 表・箇条書きの直前に「表にまとめます」「表にしました」のような宣言を書いている（「〜は以下のとおりです。」で渡す）
  0-18 口コミ・投稿・回答の書き手を「使う人」「利用する人」と書いている（「使っている人」「使った人」にする）
  0-17 「確かめましょう」「公式サイトで確認してください」型の丸投げ（確かめる先を示すだけで助言にならない。記事末尾の「※」の免責は可）
  0-16 表の列幅がない・合計が100%でない・行によって違う（全セルに width を付ける）
  0-15 ジャンプ先を <a id> で別に置いている（<h3 id="1a"> に書く）
  0-13 導入（最初のH2より前）が決まった型でない／「＃」が残っている（「悩み」×2行を「」で囲む→「こんなお悩みはありませんか。」→共感→「この記事では〜解説します。」）
口コミ（blockquote）の中は原文ママなので対象外。H2・H3の見出しは構成で固定されているので対象外。
"""
import html
import re
import sys
from pathlib import Path

TYPE_WORDS = "宅配型|浄水型|卓上型|床置き型|補充型|直結型"
READER_VERBS = "決め|選び|測り|確かめ|比べ|数え|調べ|探し|考え|読み|見比べ|見極め"
SOFT_VERBS = "連絡し|行い|申し込み|相談し|確認し"
BAD_PHRASES = ["高さが増", "背が増", "大きさが増"]
BARE_TYPE = re.compile(
    r"(?<!宅配)(?<!浄水)(?<!卓上)(?<!床置き)(?<!補充)(?<!直結)(?<!使い捨て)(?<!大)(?<!小)(?<!新)(?<!旧)型(?![番式])"
)
TYPE_SUBJECT = re.compile(r"(宅配型|浄水型|卓上型|床置き型)(は|が|も|には|では|なら)")
TYPE_INTRO = re.compile(r"((?:" + TYPE_WORDS + r")(?:と|か|・)?(?:" + TYPE_WORDS + r")?)のウォーターサーバー")
DELEGATE = re.compile(r"(確かめ|確認し|チェックし|調べ|読んで)(ましょう|てください|てみてください|てみましょう|て|ておき)")
VOICE_WHO = re.compile(r"(使う|利用する|契約する)(人|方)")
VOICE_WORDS = re.compile(r"投稿|口コミ|回答|声|コメント|レビュー")
DECLARE = re.compile(r"(表|箇条書き|リスト)(に|で)(まと|整理|示|し(ま|て)|比べ)")
SHA = re.compile(r"(?<![会各本他同自弊当全0-9０-９〇一二三四五六七八九十数複])社(?![員長内会宅])")
NOTICE_WORDS = ["優劣", "掲載順", "不課税で", "公式サイトで確認しました", "適用条件"]
ANNAI = re.compile(r"案内して|案内が|と案内")
SERVICE_NG = ["解約", "休止", "手数料", "違約", "強制", "停止", "できません", "別にかかる", "デメリット"]


def plain(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def derive_stem(path):
    p = Path(path).resolve()
    if p.parent.parent.name in ("articles", "完成済み"):
        return p.parent.name.split()[0]
    return ""


def main():
    if len(sys.argv) < 2:
        print("使い方: check-subject-object.py <article.html> [KW語幹]")
        return 2
    path = sys.argv[1]
    stem = sys.argv[2] if len(sys.argv) > 2 else derive_stem(path)
    lines = Path(path).read_text(encoding="utf-8").split("\n")
    out = []

    def err(rule, no, msg, snip=""):
        out.append(("ERROR", rule, no, msg, snip))

    def warn(rule, no, msg, snip=""):
        out.append(("WARNING", rule, no, msg, snip))

    # --- 紹介H3（<h3 id="1a">1.サービス名</h3>）からサービス名とジャンプ先を集める ---
    companies = {}
    company_h3_lines = set()
    for i, l in enumerate(lines):
        m = re.match(r'<h3 id="([^"]+)">(\d+)\.(.*?)</h3>', l.strip())
        if m:
            company_h3_lines.add(i)
            name = m.group(3).strip()
            companies[name] = m.group(1)
            for part in name.split():
                if len(part) >= 4:
                    companies.setdefault(part, m.group(1))
    names_re = None
    if companies:
        names_re = re.compile("|".join(re.escape(n) for n in sorted(companies, key=len, reverse=True)))

    heading_texts = set()
    for l in lines:
        m = re.match(r"<h[23][^>]*>(.*?)</h[23]>", l.strip())
        if m:
            heading_texts.add(plain(m.group(1)))

    # --- 0-13: 導入の型（完成済みフォルダ以外は必須＝ERROR、完成済みは警告） ---
    first_h2 = next((i for i, l in enumerate(lines) if l.strip().startswith("<h2")), len(lines))
    intro = [(i + 1, l.strip()) for i, l in enumerate(lines[:first_h2]) if l.strip()]
    legacy = "完成済み" in Path(path).resolve().parts
    emit13 = warn if legacy else err
    for no, l in intro:
        if l.startswith(("＃", "#")):
            err("0-13", no, "導入の「＃」は指示用の記号で、記事には書かない（悩みは「」で囲む）", l)
    if intro:
        ok = (len(intro) >= 5
              and all(re.fullmatch(r"「.+」", intro[k][1]) for k in (0, 1))
              and intro[2][1] == "こんなお悩みはありませんか。"
              and intro[3][1].endswith("ですよね。")
              and intro[-1][1].startswith("この記事では") and intro[-1][1].endswith("わかりやすく解説します。"))
        if not ok:
            emit13("0-13", intro[0][0], "導入が型と違う（「悩み」×2行を「」で囲む→「こんなお悩みはありませんか。」→「〜ですよね。」→「この記事では〜をわかりやすく解説します。」）", intro[0][1])

    h2_starts = [i for i, l in enumerate(lines) if l.strip().startswith("<h2")]
    h2_starts.append(len(lines))
    skip_company_sections = set()
    for a, b in zip(h2_starts, h2_starts[1:]):
        if any(j in company_h3_lines for j in range(a, b)):
            skip_company_sections.add((a, b))
    seen_in_section = {}

    def section_of(i):
        for a, b in zip(h2_starts, h2_starts[1:]):
            if a <= i < b:
                return (a, b)
        return (0, h2_starts[0] if h2_starts else len(lines))

    h23_starts = [i for i, l in enumerate(lines) if re.match(r"<h[23]", l.strip())] + [len(lines)]

    def block_of(i):
        for a, b in zip(h23_starts, h23_starts[1:]):
            if a <= i < b:
                return (a, b)
        return (0, h23_starts[0])

    # --- 0-9: 同じ行を持つ表を続けて置かない ---
    tables = []
    i = 0
    while i < len(lines):
        if lines[i].strip().startswith("<table"):
            j = i
            while j < len(lines) and "</table>" not in lines[j]:
                j += 1
            block = "\n".join(lines[i : j + 1])
            keys = set()
            ths = re.findall(r"<th[^>]*>(.*?)</th>", block, flags=re.S)
            by_machine = len(ths) > 1 and plain(ths[1]) == "機種"
            for row in re.findall(r"<tr[^>]*>(.*?)</tr>", block, flags=re.S):
                cells = re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)
                if cells:
                    key = re.sub(r"^\d+\.", "", plain(cells[0]))
                    if by_machine and len(cells) > 1:
                        key += "|" + plain(cells[1])
                    keys.add(key)
            tables.append((i, keys, block_of(i)))
            i = j
        i += 1
    for (ia, ka, sa), (ib, kb, sb) in zip(tables, tables[1:]):
        if sa == sb and len(ka) >= 3 and len(ka & kb) / max(1, len(ka | kb)) >= 0.8:
            err("0-9", ib + 1, "同じ見出しの中に、直前の表と同じ行（同じサービス）の表がある（列を足して1つの表にまとめる）", "表の先頭: %d行目" % (ia + 1))

    # --- 0-16: 表の列幅（全セルに width を付け、列の合計を100%、全行で同じ幅にする） ---
    emit16 = warn if legacy else err
    emit17 = emit16
    text_all = "\n".join(lines)
    for m in re.finditer(r"<table[^>]*>.*?</table>", text_all, flags=re.S):
        tb = m.group(0)
        tno = text_all[: m.start()].count("\n") + 1
        if "colspan" in tb:
            continue
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tb, flags=re.S)
        if not rows:
            continue
        widths = []
        for r in rows:
            ws = []
            for tag in re.findall(r"<t[hd]([^>]*)>", r):
                mw = re.search(r"width:\s*([0-9.]+)%", tag)
                ws.append(float(mw.group(1)) if mw else None)
            widths.append(ws)
        if any(w is None for ws in widths for w in ws):
            emit16("0-16", tno, "表の列幅（<th style=\"width: 25%;\"> のように全セルに指定。列の合計は100%）がない。幅がないと列が崩れる", "列数: %d" % len(widths[0]))
            continue
        head = widths[0]
        if abs(sum(head) - 100) > 1.0:
            emit16("0-16", tno, "表の列幅の合計が100%でない（合計 %s%%）" % round(sum(head), 1), "")
        if any(len(ws) == len(head) and ws != head for ws in widths[1:]):
            emit16("0-16", tno, "表の行によって列幅が違う（全行で同じ幅にする）", "")

    in_bq = False
    in_table = False
    in_list = False
    list_ul = False
    last_para = ("", 0)
    in_company_h3 = False
    introduced = set()
    recent_starts = []

    def next_nonempty(i):
        for j in range(i + 1, len(lines)):
            if lines[j].strip():
                return lines[j].strip()
        return ""

    for i, raw in enumerate(lines):
        no = i + 1
        s = raw.strip()
        if not s:
            continue
        if "<blockquote" in s:
            in_bq = True
        if in_bq:
            if "</blockquote>" in s:
                in_bq = False
                last_para = ("", 0)
            continue
        if re.match(r"<h[23]", s):
            last_para = ("", 0)
            introduced = set()
            recent_starts = []
            in_company_h3 = i in company_h3_lines
            continue
        if re.match(r'<a id="[^"]+"></a>', s):
            err("0-15", no, "ジャンプ先は <h3 id=\"1a\"> に書く（<a id> を別に置かない）", s)
            continue
        if re.match(r"\[[^\]]+\]$", s) or s.startswith("[btn") or s.startswith("※"):
            continue

        if re.match(r"<(ol|ul|table)\b", s):
            if DECLARE.search(last_para[0]):
                err("0-14", no, "「表にまとめます」型の宣言は書かない（「〜は以下のとおりです。」で表・箇条書きに渡す）", last_para[0])
            if stem and (not last_para[0] or stem not in last_para[0]):
                err("0-1", no, "箇条書き・表の直前の文に「%s」がなく、何の一覧か分からない" % stem, last_para[0] or "（直前に文なし）")
            if s.startswith("<table"):
                in_table = True
            else:
                in_list = True
                list_ul = s.startswith("<ul")
        if in_table:
            for cell in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", s):
                c = plain(cell)
                if BARE_TYPE.search(c):
                    err("0-2", no, "「型」だけの言い方（宅配型・浄水型のように書く）", c)
                if SHA.search(c) or "社名" in c:
                    err("0-6", no, "「社」「社名」は使わない（「サービス」「サービス名」と書く）", c)
            if "</table>" in s:
                in_table = False
            continue
        if in_list:
            if "</ol>" in s or "</ul>" in s:
                in_list = False
                continue
            if s.startswith("<li"):
                t = plain(s)
                if t in heading_texts:
                    continue
                if BARE_TYPE.search(t):
                    err("0-2", no, "「型」だけの言い方", t)
                if SHA.search(t) or "社名" in t:
                    err("0-6", no, "「社」「社名」は使わない（「サービス」「サービス名」と書く）", t)
                if ANNAI.search(t):
                    err("0-8", no, "「案内している」型の伝聞（事実を言い切る）", t)
                if DELEGATE.search(t):
                    emit17("0-17", no, "「確かめましょう」型の丸投げ（確かめる先を示すだけで助言にならない。何を基準に選ぶかを書く）", t)
                if names_re and section_of(i) not in skip_company_sections and names_re.search(t):
                    err("0-12", no, "サービス名・機種名を箇条書きに書かない（サービス名を出すときは表にする）", t)
                if names_re and section_of(i) not in skip_company_sections:
                    sec = section_of(i)
                    seen = seen_in_section.setdefault(sec, set())
                    link_spans = [m.span(1) for m in re.finditer(r'<a [^>]*href="#[^"]*"[^>]*>(.*?)</a>', s)]
                    for m in names_re.finditer(s):
                        cid = companies[m.group(0)]
                        if cid in seen:
                            continue
                        seen.add(cid)
                        if not any(a <= m.start() < b for a, b in link_spans):
                            err("0-4", no, "「%s」の最初の登場に、紹介H3へのジャンプリンク（#%s）がない" % (m.group(0), cid), t)
            continue

        t = plain(s)
        if not t:
            continue
        if BARE_TYPE.search(t):
            err("0-2", no, "「型」だけの言い方（宅配型・浄水型のように書く）", t)
        # その見出しの中で初めて型の名前を主語にするときは、「〜型のウォーターサーバー」と書く（2回目以降は「宅配型は」でよい）
        if not in_company_h3:
            for m in TYPE_SUBJECT.finditer(t):
                if m.group(1) not in introduced:
                    err("0-2", no, "この見出しで初めて出す型の名前が主語（「%sのウォーターサーバーは」と書く）" % m.group(1), t)
                    break
        for m in TYPE_INTRO.finditer(t):
            for w in re.findall(TYPE_WORDS, m.group(1)):
                introduced.add(w)
        for sent in [x for x in re.split(r"。", t) if x]:
            if re.search(r"(" + READER_VERBS + r")ます$", sent):
                err("0-3", no, "読者がすることを書き手が言い切っている（「〜しましょう」「〜が必要です」にする）", sent + "。")
            elif re.search(r"(" + SOFT_VERBS + r")ます$", sent):
                warn("0-3", no, "読者がすることの言い切りの疑い（サービス側の手順でなければ「〜しましょう」「〜が必要です」）", sent + "。")
        if SHA.search(t) or "社名" in t:
            err("0-6", no, "「社」「社名」は使わない（「サービス」「サービス名」と書く）", t)
        if ANNAI.search(t):
            err("0-8", no, "「案内している」型の伝聞（事実を言い切る）", t)
        if DELEGATE.search(t):
            emit17("0-17", no, "「確かめましょう」型の丸投げ（確かめる先を示すだけで助言にならない。何を基準に選ぶか、どれを選ぶかを書く）", t)
        if VOICE_WHO.search(t) and VOICE_WORDS.search(t):
            emit17("0-18", no, "口コミ・投稿の書き手を「使う人」と書かない（これから使う人にも読める。実際に使っているので「使っている人」「使った人」）", t)
        for w in NOTICE_WORDS:
            if w in t:
                err("0-7", no, "注意事項・断り書き（「%s」）は本文に書かず、記事末尾の「※」に集約する" % w, t)
                break
        for bad in BAD_PHRASES:
            if bad in t:
                err("0-5", no, "日本語として通じない言い回し「%s」（「高くなる」などにする）" % bad, t)
        if in_company_h3:
            for w in SERVICE_NG:
                if w in t:
                    err("0-11", no, "サービス紹介H3に「%s」（おすすめを紹介する節には、解約・休止・手数料などのデメリットを書かない）" % w, t)
                    break

        # 0-10: 同じ書き出しが3つ続かない
        recent_starts.append(t[:6])
        if len(recent_starts) >= 3 and recent_starts[-1] == recent_starts[-2] == recent_starts[-3]:
            err("0-10", no, "同じ書き出し（%s…）の文が3つ続いている（前の文の新情報を主題にして受ける）" % t[:6], t)

        if names_re and section_of(i) not in skip_company_sections:
            sec = section_of(i)
            seen = seen_in_section.setdefault(sec, set())
            link_spans = [m.span(1) for m in re.finditer(r'<a [^>]*href="#[^"]*"[^>]*>(.*?)</a>', s)]
            for m in names_re.finditer(s):
                cid = companies[m.group(0)]
                if cid in seen:
                    continue
                seen.add(cid)
                inside = any(a <= m.start() < b for a, b in link_spans)
                if not inside:
                    err("0-4", no, "「%s」の最初の登場に、紹介H3へのジャンプリンク（#%s）がない" % (m.group(0), cid), t)
            if names_re.search(t) and not next_nonempty(i).startswith("<blockquote"):
                err("0-12", no, "サービス名・機種名を文章に書かない（サービス名を出すときは表にして、サービス名にジャンプリンクを付ける）", t)
        last_para = (t, no)

    for level, rule, no, msg, snip in out:
        tail = (" → " + snip[:60]) if snip else ""
        print("%s: [最上位ルール%s] %d行目: %s%s" % (level, rule, no, msg, tail))
    errs = sum(1 for o in out if o[0] == "ERROR")
    warns = sum(1 for o in out if o[0] == "WARNING")
    print("check-subject-object: ERROR=%d WARNING=%d（KW語幹=%s）" % (errs, warns, stem or "なし"))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
