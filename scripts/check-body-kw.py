#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-body-kw.py — 本文のメインKWと共起語を競合比で採点する（構成の check-kw-cooccurrence.py の本文版）

使い方:
  python3 scripts/check-body-kw.py \\
      articles/{KW}/cooccurrence.json articles/{KW}/competitor.json \\
      articles/{KW}/article.html "<メインKW>" [articles/{KW}/cooccurrence-plan.md]

  cooccurrence.json は構成フェーズで保存したものを使い回す。
  第5引数（共起語配置計画）を渡すと「計画に書いたのに本文に無い語」も検出する（推奨）。

採点（**競合だけを基準にする**・2026-09-09 変更）:
  ⚠️ 自社の公開記事は基準にしない。Manabuさんから
     「公開記事のクオリティに満足しているわけではないから過信しすぎないで欲しい」と指摘された。
     旧版は「6位の1163（89.5%）を上回る90%」を合格ラインにしていたが、
     **6位の記事を基準にしても1位は取れない**。現状追認だった。

  Tier A ＝ 競合の**全媒体**が本文で使っている語。定義上、競合は全員100%持っている
    合格   100%（競合が全員持っている語なので、これが競合基準の水準）
    ただし**入れられない語は cooccurrence-plan.md に理由を書けば合格に数える**
    （check-coverage.py と同じ運用。①入れる ②入れないなら理由を書く）

  Tier B ＝ 6〜7サイトが本文で使う語。**ERROR/WARNにしない（INFO表示のみ）**
    競合の保有率がそのまま基準にならない（語ごとに持っている媒体が違うため）。
    「配置計画に入れる候補」として見るだけにする。

  メインKWの密度 ＝ **下限だけ見る。上限は設けない**
    下限は競合の実測（2.72〜2.90／1,000字）。これを下回ったらERROR。
    ⚠️ **上限を設けないのは、競合データから上限の根拠が出せないから**であって、
       自社記事が濃いから許容しているわけではない。自社は競合の3倍前後あり（1163=8.32／
       1173=10.91／1253=5.31）、**これが適正という根拠はない**。詰め込みの是非は人が判断する。

  計画遵守 ＝ cooccurrence-plan.md に「配置予定」と書いた語が本文に0回ならERROR
    ここが本命。ゲート1で計画は作るが、**書いたあとに本文と照合する工程が無かった**。

なぜ作ったか:
  2026-09-09、Manabuさんから「ターゲットKWと共起語の使用頻度が少ない」と構成案について指摘され、
  構成側は check-kw-cooccurrence.py で機械化した。続けて「本文執筆の際も気をつけて欲しい」と依頼された。
  調べると `scripts/lint.sh`（47KB・本文チェッカー）に共起語・KW密度のチェックは **0件**で、
  `cooccurrence-plan.md` はゲート1で作るのに**守れたか数える工程が無かった**。
  学び94（競合の網羅を数える工程が無かった）と同じ構造の穴。

設計思想:
  検出は機械、判断は人間またはAI。**詰め込むための道具ではない。**
  本文の共起語は「自然に書けば入る」のが正常で、入らない語は
  ①そのトピックを扱っていない（＝構成の問題）②その語を使わないと決めた（＝理由を書く）のどちらか。
  語を機械的にねじ込むと writing-manual §9「削る8パターン」に触れる。
"""
import io
import json
import re
import sys
import os
import html

PASS_A = 100.0  # Tier A の合格ライン（競合の全媒体が持つ語なので競合基準は100%。理由を書けば合格に数える）
WARN_A = 80.0   # これを割るとERROR

EXCLUDE = {
    'コスパ': 'prohibited-words カテゴリA で完全禁止（学び54・lint.sh ERROR）',
    '徹底': 'prohibited-words レイヤー2「徹底的に／徹底調査」＝誇張の枕詞',
    '魅力': 'prohibited-words レイヤー2「〜も魅力のひとつです」＝AI定型',
    'クオリティ': 'レイヤー8 ビジネスカタカナ語',
    '重視': '評価語で中身がない',
    '通常価格': '内訳が説明できない通常価格は二重価格表示のリスク（writing-manual §8）',
    '印象': '主観語',
    '実質': 'prohibited-words カテゴリA「実質単価」完全禁止',
    '把握': 'prohibited-words カテゴリA',
    '見極め': 'prohibited-words カテゴリA',
    '試算': 'prohibited-words カテゴリA',
    'シミュレーション': 'prohibited-words カテゴリA',
    '向き不向き': 'prohibited-words カテゴリA（単独使用）',
    '対処': 'prohibited-words レイヤー2 で ERROR（学び90）',
    '並び': 'prohibited-words レイヤー2「並びます」WARNING（学び83）',
}

STOPWORDS = {
    'あたり', '以降', '必要', '追加', '用意', '対象', '自由', '完了', '時点', '好み', '理由',
    '方法', '選択', '合計', '毎回', '毎週', '負担', '全国', '一律', '最大', '通常', '手間',
    'こと', 'もの', 'ため', 'cm', '高さ', '以上', '以下', '場合', '内容', '確認', '利用',
    '購入', '可能', '自分', '解説', 'チェック', '紹介', '管理', '時間', '結論', '構成',
    '傾向', '品数', '指定', '適用', '登場', '本当', '候補', '世帯', '制限', '対応', '保存',
    '人気', '食事',
}

NON_MEDIA = ('note.com', 'chiebukuro', 'ameblo.jp', 'hatenablog')


def load_cooc(path):
    data = json.load(io.open(path, encoding='utf-8'))
    items = data.get('data', {}).get('items', [])
    out = []
    for it in items:
        w = (it.get('word') or '').strip()
        if not w or len(w) < 2:
            continue
        m = it.get('metrics', {})
        out.append((w, m.get('siteCountTotal') or 0, m.get('occurrencePageCount') or 0))
    return out


def media_stats(path):
    """competitor.json から媒体数と総字数を返す"""
    data = json.load(io.open(path, encoding='utf-8'))
    items = data.get('data', {}).get('items', [])
    media = [i for i in items if not any(n in i.get('page', {}).get('url', '') for n in NON_MEDIA)]
    wcs = [i.get('metrics', {}).get('wordCount') for i in media]
    wcs = [w for w in wcs if w]
    return len(media), sum(wcs), len(wcs)


def body_text(path):
    """記事HTMLから本文だけを取り出す。表とショートコードは本文から除く"""
    raw = io.open(path, encoding='utf-8').read()
    raw = re.sub(r'<table.*?</table>', ' ', raw, flags=re.S)
    raw = re.sub(r'\[[^\]]{1,60}\]', ' ', raw)          # ショートコード
    t = html.unescape(re.sub(r'<[^>]+>', ' ', raw))
    return re.sub(r'\s', '', t)


def plan_words(path):
    """cooccurrence-plan.md の表から「配置予定がある語」を拾う。
    | 語 | サイト数 | 配置予定 | の1列目を語として扱い、／や・で区切られた表記ゆれも展開する"""
    if not path or not os.path.exists(path):
        return None
    words = set()
    for line in io.open(path, encoding='utf-8'):
        s = line.strip()
        if not s.startswith('|') or s.startswith('|---') or '---' in s.split('|')[1:2]:
            continue
        cells = [c.strip() for c in s.strip('|').split('|')]
        if len(cells) < 2:
            continue
        head = cells[0]
        if head in ('語', '共起語', ''):
            continue
        # 「配置しない」節の語は対象外にしたいが、表以外に書かれる運用なので表だけを見る
        for w in re.split(r'[／/・、,]', head):
            w = w.strip().strip('*` ')
            if 2 <= len(w) <= 12 and not w.startswith('#'):
                words.add(w)
    return words


def load_excused(path):
    """cooccurrence-plan.md の「## 配置しない語」節に、理由つきで書いた語を返す。
    形式：「- 語・語・1位〜9位：理由」の箇条書き、または「| 語 | 理由 |」の表の1列目。
    「1位〜9位」のような連番は「1位」「2位」…に展開する。"""
    if not path or not os.path.exists(path):
        return set()
    txt = io.open(path, encoding='utf-8').read()
    m = re.search(r'^##\s*配置しない語[^\n]*\n(.*?)(?=^##\s|\Z)', txt, re.S | re.M)
    if not m:
        return set()
    words = set()
    for line in m.group(1).split('\n'):
        t = line.strip()
        mm = re.match(r'^[-*]\s*(.+?)[：:]', t)
        if mm:
            head = mm.group(1)
        elif t.startswith('|') and not t.startswith('|---'):
            head = t.strip('|').split('|')[0]
        else:
            continue
        for w in re.split(r'[／/・、,\s]+', head):
            w = w.strip().strip('*` ')
            if not w or w in ('語', '共起語'):
                continue
            r = re.match(r'^(\d+)(\D+?)〜(\d+)\2$', w)
            if r:
                for i in range(int(r.group(1)), int(r.group(3)) + 1):
                    words.add('%d%s' % (i, r.group(2)))
            words.add(w)
    return words


def main():
    if len(sys.argv) < 5:
        print(__doc__)
        print('引数: <cooccurrence.json> <competitor.json> <article.html> "<メインKW>" [cooccurrence-plan.md]')
        sys.exit(2)
    cpath, hpath, apath, kw = sys.argv[1:5]
    ppath = sys.argv[5] if len(sys.argv) > 5 else None
    for p in (cpath, hpath, apath):
        if not os.path.exists(p):
            print('ERROR: ファイルがない: %s' % p)
            sys.exit(2)

    cooc = load_cooc(cpath)
    n_media, base_wc, n_wc = media_stats(hpath)
    body = body_text(apath)
    if not body:
        print('ERROR: 本文が空。article.html を確認する')
        sys.exit(2)
    n_body = len(body)
    err = 0
    warn = 0

    print('■ 本文の規模')
    print('   本記事 %s字（表とショートコードを除く）' % format(n_body, ','))
    if n_wc:
        print('   競合の媒体 %d本の平均 %s字（字数がわかる%d本の合計 %s字）'
              % (n_media, format(base_wc // n_wc, ','), n_wc, format(base_wc, ',')))
    print()

    # ---- 1. メインKWの密度（下限だけ見る）----
    print('■ メインKWの本文密度（1,000字あたり・下限だけ見る）')
    parts = [p for p in re.split(r'[\s　]+', kw.strip()) if p]
    generic = {'比較', 'おすすめ', '口コミ', '評判', '料金', '値段', '違い', 'まずい', 'やばい', 'お試し', '安い'}
    cmap = {w: (st, op) for w, st, op in cooc}
    for p in parts:
        n = body.count(p)
        dens = n / n_body * 1000
        ref = None
        note = ''
        if p in cmap and base_wc:
            ref = cmap[p][1] / base_wc * 1000
        elif base_wc:
            # 複合ブランド名（例: 三ツ星ファーム）はラッコが「三ツ星」「ファーム」に分割するため、
            # KWの一部に含まれる共起語の密度の平均を基準にする
            subs = [cmap[w][1] / base_wc * 1000 for w in cmap if len(w) >= 2 and w in p and w != p]
            if subs:
                ref = sum(subs) / len(subs)
                note = '  ※分割語の平均を基準にした'
        if ref:
            ratio = dens / ref * 100
            tag = ''
            if p not in generic and ratio < 100:
                tag = '  ← ERROR 競合平均を下回る'
                err += 1
            print('   %-14s %3d回  密度 %.2f  競合平均 %.2f  比 %3.0f%%%s%s'
                  % (p, n, dens, ref, ratio, tag, note))
        else:
            print('   %-14s %3d回  密度 %.2f  （競合の実測値なし）' % (p, n, dens))
    print('   基準＝競合の媒体 2.72〜2.90／1,000字（下限のみ）')
    print('   ※ 上限を設けないのは競合データから根拠が出せないため。自社は競合の3倍前後あるが')
    print('     （1163=8.32／1173=10.91／1253=5.31）、**これが適正という根拠はない**。詰め込みは人が判断する')
    print()

    # ---- 2. Tier A / Tier B ----
    tierA, tierB = [], []
    excluded = []
    for w, st, op in cooc:
        if w in STOPWORDS or len(w) < 2:
            continue
        if w in EXCLUDE:
            if st >= n_media - 2:
                excluded.append((w, st, EXCLUDE[w]))
            continue
        if st >= n_media:
            tierA.append((w, st))
        elif st >= max(6, n_media - 2):
            tierB.append((w, st))

    if not tierA:
        print('■ Tier A が0語。cooccurrence.json の siteCountTotal と競合の媒体数を確認する')
        sys.exit(2)

    hitA = [w for w, _ in tierA if w in body]
    missA = [w for w, _ in tierA if w not in body]
    excused = load_excused(ppath)
    excA = [w for w in missA if w in excused]
    rawA = len(hitA) / len(tierA) * 100
    rateA = (len(hitA) + len(excA)) / len(tierA) * 100   # 理由を書いた語は合格に数える（docstringどおり）
    hitB = [w for w, _ in tierB if w in body]
    rateB = len(hitB) / len(tierB) * 100 if tierB else 0

    print('■ Tier A ＝ 競合の全媒体（%d本）が本文で使う語 … 本文の必須語' % n_media)
    if excA:
        print('   %d/%d語 = %.1f%%（本文にある語だけ）／理由を書いた%d語を合格に数えると %.1f%%' % (len(hitA), len(tierA), rawA, len(excA), rateA))
    else:
        print('   %d/%d語 = %.1f%%' % (len(hitA), len(tierA), rateA))
    if rateA >= PASS_A:
        print('   判定: 合格（%.0f%%以上）' % PASS_A)
    elif rateA >= WARN_A:
        print('   判定: WARN（%.0f〜%.0f%%。競合は全員100%%持っている語なので、入れるか理由を書く）'
              % (WARN_A, PASS_A - 1))
        warn += 1
    else:
        print('   判定: ERROR（%.0f%%未満＝本文が薄い）' % WARN_A)
        err += 1
    unexA = [w for w in missA if w not in excused]
    if excA:
        print('   理由を書いて入れなかった語（%d語）: %s' % (len(excA), ' / '.join(excA)))
    if unexA:
        print('   本文に無く、理由も書いていない語: %s' % ' / '.join(unexA))
        print('   → 扱っていないトピックなら構成の問題。使わないと決めた語なら cooccurrence-plan.md の「配置しない語」節に理由を書く')
    print()

    if tierB:
        print('■ Tier B ＝ 6〜%dサイトが本文で使う語 … INFO（ERRORにしない）' % (n_media - 1))
        print('   %d/%d語 = %.1f%%（判定しない。語ごとに持っている媒体が違うため基準にならない）' % (len(hitB), len(tierB), rateB))
        mb = [w for w, _ in tierB if w not in body]
        if mb:
            print('   本文に無い語（配置計画に入れる候補）:')
            for i in range(0, len(mb), 12):
                print('     ' + ' / '.join(mb[i:i + 12]))
        print()

    # ---- 3. 計画遵守 ----
    pw = plan_words(ppath)
    if pw is None:
        print('■ 共起語配置計画（cooccurrence-plan.md）が未指定')
        print('   ⚠️ 第5引数で渡すと「計画に書いたのに本文に無い語」を検出できる。CLAUDE.md ゲート1の実効化になる')
        print()
    else:
        gone = sorted(w for w in pw if w not in body)
        print('■ 共起語配置計画の遵守  計画 %d語' % len(pw))
        if gone:
            print('   ERROR 計画に書いたのに本文に無い語 %d語:' % len(gone))
            for i in range(0, len(gone), 12):
                print('     ' + ' / '.join(gone[i:i + 12]))
            print('   → 本文に入れるか、計画側から消して理由を書く。計画と本文の食い違いを残さない')
            err += 1
        else:
            print('   OK 計画の語はすべて本文にある')
        print()

    print('check-body-kw: ERROR=%d WARN=%d／Tier A %.1f%%（理由つき免除%d語を含む。本文にある語だけなら %.1f%%）／合格ライン %.0f%%' % (err, warn, rateA, len(excA), rawA, PASS_A))
    print()
    print('── Tier A の上げ方は2つ。どちらかを必ずやる ──')
    print('  1. その語が指すトピックを本文で扱う（扱っていないなら構成の抜け。構成に戻る）')
    print('  2. 使わないと決めたなら cooccurrence-plan.md の「配置しない語」節に理由を書く')
    print()
    print('⚠️ 語を機械的にねじ込まない。本文の共起語は自然に書けば入るのが正常で、')
    print('   入らない語は「トピックを扱っていない」か「使わないと決めた」のどちらか。')
    print('   埋めるために文を足すと writing-manual §9「削る8パターン」に触れる。')
    print()
    print()
    print('══ ここから先は必ず通す3検査（auto-memory midashi-jitsuzai-kensa）══')
    print('  ⚠️ カバー率を上げる前に読む。**この3つを飛ばすと指摘の往復が延々と続く。**')
    print()
    print('  1. 実在検査 — 見出しに使う名詞が、そのサービスに実在するものを指しているか')
    print('     service-info.md と公式で1本ずつ確認する。**実在しないなら名詞で貼らず動詞形にする**')
    print('     ✗「三ツ星ファームのお試しは冷凍庫の空きを先に確かめよう」（お試しという商品が存在しない）')
    print('     ✓「三ツ星ファームを試す前に冷凍庫の空きを確かめよう」')
    print('     → 実在しない語は「実在しないので動詞形にした」と書けば、このスクリプトの合格に数える')
    print()
    print('  2. 入れ替え後の音読 — 語を差し替えたら、差し替えた**後**の文を声に出して読み直す')
    print('     「音読チェック済み」と報告する前に、変更した見出しだけを抜き出して読む')
    print()
    print('  3. 前提検査 — この合格ラインは競合の実測から出している。**前提が同じか確認する**')
    print('     競合が持っていて自社ブランドに無い商品・機能の語は、カバー率のために貼ってはいけない')
    print('     商品構成・訴求条件・記事タイプが違えば数値目標も違う。違うなら理由を書いて外す')
    print()
    print('  ⚠️ 2026-09-09の事故：KW出現率を公開6記事の93%に合わせようとして全H2に「お試し」を貼ったが、')
    print('     三ツ星ファームにお試しセットは存在せず、H2①で「ない」と書いた直後に')
    print('     存在しないものを主語にする論理破綻を起こした。**目標にした6記事は全社にお試し商品が実在していた。**')

    print('── よく出る誤検出（判断は人がする）──')
    print('  ・「初回限定」：公開3記事すべてに無い。ヤマダイの文体では使わない語なので理由を書いて外す')
    print('  ・地域名（中部・四国・九州など）：送料表の中にあれば本文カウントから漏れる。表は本文から除外している')
    print('  ・「2.5g」「17.7cm」等の数値語：表に置く運用なら本文には出ない。理由を書いて外す')

    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
