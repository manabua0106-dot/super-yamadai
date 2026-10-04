#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-appeal.py — 訴求の向きを検査する。非訴求社への送客になっている見出しを機械検出する

使い方:
  python3 scripts/check-appeal.py "articles/{KW}/outline.md"

判定:
  ERROR : 訴求社の指名記事なのに、非訴求社の安さ・割引・価格を語る見出しがある
  WARN  : 非訴求社の名前が見出しに複数あるのに、記事タイトルにその社名が無い
  INFO  : 訴求社・非訴求社の判定に使った一覧

なぜ作ったか（2026-09-09）:
  「ニチレイ 気くばり御膳 口コミ」の構成に、他社比較のH2を1本足した。
  きっかけは check-coverage.py が「他社比較」を4サイト保有のERRORとして出したこと。
  **ERRORを消す目的で見出しを足した結果**、H3 3本のうち2本が
    「ナッシュは1食620円から1食ずつ選べる」
    「初回の割引額はナッシュのほうが300円多い」
  という**非訴求社（ナッシュ）の安さの宣伝**になった。
  訴求社であるニチレイの指名記事で、読者を非訴求社へ送る形になっていた。
  Manabuさんに「蛇足では？」と指摘されて気づいた。

  蛇足かどうかは機械では判定できないが、**訴求の向きが逆になっていること**は判定できる。
  そこだけを機械で止める。

判定の作り方:
  service-info.md の各サービスから、非訴求社を次の条件で拾う。
    ・CTAが [btn ...] （Post Snippet のショートコードを持たない）
    ・かつ 見出しに【訴求社…】の印が無い
  この2つを満たすものだけを非訴求社とみなす。
  （「## 非訴求社」の節にあっても Post Snippet を持つサービス＝ウェルネスダイニング・
    パルシステム・食のそよ風 は提携済みなので非訴求社に数えない。節の並びは古い）

対象外:
  記事タイトル（H1）にその社名が入っている比較記事は対象外。
  「三ツ星ファーム ナッシュ 比較」のようにナッシュを扱うと宣言している記事では、
  ナッシュの価格を書くのが正しい。
"""
import io
import os
import re
import sys

MONEY = re.compile(r'[0-9０-９][0-9０-９,，]*\s*円')
CHEAP = re.compile(r'安い|安く|お得|割引|OFF|オフ|無料|多い|勝る|上回|優れ|おすすめ')

# 表記ゆれ（service-info.md の見出し名だけでは記事中の表記に当たらないため）
ALIASES = {
    'nosh（ナッシュ）': ['nosh', 'ナッシュ'],
    '食宅便': ['食宅便'],
    'わんまいる': ['わんまいる'],
    '生活クラブ': ['生活クラブ'],
    '大地を守る会': ['大地を守る会'],
    'ショクブン': ['ショクブン'],
    'おうちコープ': ['おうちコープ'],
    'パクモグ（PAKU MOGU）': ['パクモグ', 'PAKU MOGU'],
    'ココノミ（Coconomi）': ['ココノミ', 'Coconomi'],
}


def load_services(root):
    """service-info.md から 訴求社／非訴求社 を判定して返す。

    非訴求社の条件（2つとも満たすもの）:
      ① CTAが [btn ...] ＝ Post Snippet のショートコードを持たない
      ② 見出しに【訴求社…】の印が無い
    """
    p = os.path.join(root, '.claude', 'rules', 'service-info.md')
    if not os.path.isfile(p):
        print('ERROR: service-info.md が見つかりません: %s' % p)
        sys.exit(2)
    s = io.open(p, encoding='utf-8').read()
    appeal, non = [], []
    for blk in re.split(r'\n### ', s)[1:]:
        head = blk.split('\n', 1)[0]
        name = re.sub(r'^[0-9]+\.\s*', '', head)
        name = re.sub(r'【.*', '', name).strip()
        if not name:
            continue
        marked = '【訴求社' in head
        cta = re.search(r'\*\*CTA[^*]*\*\*:?\s*`?(\[[^\]]*)', blk)
        btn = bool(cta and cta.group(1).startswith('[btn'))
        if not btn:
            # コードブロックで [btn を書いている形式も拾う
            btn = bool(re.search(r'\*\*CTA[^\n]*\n+```\n\[btn', blk))
        (non if (btn and not marked) else appeal).append(name)
    return appeal, non


def headings(path):
    """outline.md から H1/H2/H3 を行番号つきで取り出す（2つ目の --- 以降はメタ節として捨てる）"""
    out, sep, meta = [], 0, False
    for i, raw in enumerate(io.open(path, encoding='utf-8'), 1):
        t = raw.rstrip('\n')
        if re.match(r'^---[ \t]*$', t):
            sep += 1
            if sep >= 2:
                meta = True
            continue
        if meta:
            continue
        m = re.match(r'^(#{1,3}) +(.*)$', t)
        if m:
            out.append((i, 'H%d' % len(m.group(1)), m.group(2).strip()))
            continue
        m = re.match(r'^[　 \t]*- +(.*)$', t)
        if m and out:
            out.append((i, 'H3', m.group(1).strip()))
    return out


def main():
    if len(sys.argv) < 2:
        print('使い方: python3 scripts/check-appeal.py <outline.md>')
        sys.exit(2)
    opath = sys.argv[1]
    if not os.path.isfile(opath):
        print('ERROR: ファイルが見つかりません: %s' % opath)
        sys.exit(2)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    appeal, non = load_services(root)

    heads = headings(opath)
    if not heads:
        print('ERROR: 見出しを1本も取れませんでした。outline.md の形式を確認する')
        sys.exit(2)
    title = next((t for _, lv, t in heads if lv == 'H1'), '')
    body = [(ln, lv, t) for ln, lv, t in heads if lv != 'H1']

    # 記事の主役が訴求社かどうか（タイトルに社名が入っているか）
    subject = [n for n in appeal if n and n.split('（')[0] in title]
    # ニチレイ等、service-info の正式名と記事の呼び方が違うケースを補う
    if not subject:
        for n in appeal:
            short = re.sub(r'（.*', '', n)
            if len(short) >= 3 and short[:3] in title:
                subject.append(n)

    err = warn = 0
    print('記事タイトル: %s' % (title or '（H1が取れませんでした）'))
    print('訴求社として認識: %s' % ('／'.join(subject) if subject else 'なし（比較記事・一般KWなら正常）'))
    print('')

    for n in non:
        names = ALIASES.get(n, [re.sub(r'（.*', '', n)])
        if any(a in title for a in names):
            continue  # タイトルで扱うと宣言している比較記事は対象外
        hit = [(ln, lv, t) for ln, lv, t in body if any(a in t for a in names)]
        if not hit:
            continue
        promo = [(ln, lv, t) for ln, lv, t in hit if MONEY.search(t) or CHEAP.search(t)]
        if promo and subject:
            err += len(promo)
            print('ERROR [訴求の向きが逆] 非訴求社「%s」の安さ・割引・価格を見出しで書いている' % names[0])
            print('        この記事の主役は訴求社「%s」。読者を非訴求社へ送る形になっている' % subject[0])
            for ln, lv, t in promo:
                print('        L%s %s %s' % (ln, lv, t))
            print('        直し方: その見出しを消すか、価格を出さずに「他社を探す条件」として書く')
        elif len(hit) >= 2:
            warn += 1
            print('WARN  [非訴求社の露出] 「%s」が見出し%d本に出るが、記事タイトルには無い' % (names[0], len(hit)))
            for ln, lv, t in hit[:4]:
                print('        L%s %s %s' % (ln, lv, t))
            print('        比較を主題にするならタイトルに入れる。しないなら本数を減らす')

    print('')
    print('---')
    print('check-appeal: ERROR=%d WARN=%d（ERRORは提示前に必ず解消する）' % (err, warn))
    print('')
    print('※ 非訴求社と判定したのは %d社: %s' % (len(non), '／'.join(re.sub(r'（.*', '', x) for x in non)))
    print('※ 蛇足かどうかは機械では判定できない。ここで見るのは**訴求の向きだけ**。')
    print('   「競合が持っているから足す」で生まれた見出しは、向きが逆になりやすい（2026-09-09 ニチレイの事例）')
    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
