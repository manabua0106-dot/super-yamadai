#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-kw-cooccurrence.py — メインKWと共起語が見出しに入っているかを、競合比で採点する

使い方:
  1) ラッコキーワードMCP で2つのJSONを保存する（MCPはシェルから叩けないのでClaude/Codexが呼ぶ）
       mcp__claude_ai__co-occurrence(keyword="<対象KW>", limit=120, sortBy="siteCountTotal")
         → articles/{KW}/cooccurrence.json
       mcp__claude_ai__headline(keyword="<対象KW>", limit=10, h4=true, lessCharacters=true)
         → articles/{KW}/competitor.json  ※check-coverage.py と同じファイルを使い回す
  2) python3 scripts/check-kw-cooccurrence.py \\
         articles/{KW}/cooccurrence.json articles/{KW}/competitor.json articles/{KW}/outline.md "<メインKW>"

採点（合格ラインは実測から決めた）:
  合格   カバー率 80%以上  ← 媒体で最上位のページ（78.8%）を上回る水準。1位を狙える
  WARN   カバー率 60〜79%  ← 媒体の平均59.1%〜中央値63.6%の帯。上位は狙えるが1位は厳しい
  ERROR  カバー率 60%未満  ← 媒体平均を割る。媒体として土俵に乗っていない
  ERROR  媒体の過半（5サイト以上）が見出しで使う語が、見出しに0本かつ理由も未記載
  ERROR  メインKWの構成要素を含むH2が2本以下（学び93）

  ※ 基準は**競合上位の媒体だけ**。自社の公開記事は基準にしない（2026-09-09 Manabuさん指摘
     「公開記事のクオリティに満足しているわけではないから過信しすぎないで欲しい」）。
     自社記事を基準にすると現状追認になる。実際、自社は競合の5〜7倍 一般語を見出しに入れていた。

  ※ 合格ラインの根拠（2026-09-09「三ツ星ファーム ナッシュ 比較」で実測）
     3位78.8% / 12位72.7% / 4位69.7% / 9位69.7% / 10位57.6% / 6位54.5% / 5位42.4% / 7位27.3%
     媒体8本の平均59.1%・中央値63.6%・最大78.8%。SERP1位は個人noteで6.1%だが、
     一次体験で勝っている型なので媒体の指標には使わない。

カバー率の定義:
  分母 = 必須級の共起語（媒体の3サイト以上が見出しで使っている語）から、禁止語を除いたもの
  分子 = そのうち「見出しに入っている語」＋「outline のメタ節に置き場所か使わない理由を書いた語」
  → check-coverage.py と同じ運用（①入れる ②入れないなら理由を書く）。理由を書けば合格に数える

なぜ作ったか:
  2026-09-09「三ツ星ファーム ナッシュ 比較」で Manabuさんから
  「ターゲットKWと共起語の使用頻度が少ない（SEO的に終わっている）」と指摘された。
  実測すると必須級33語のうち見出しに入っていたのは8語（24.2%）で、媒体平均59.1%を大きく下回っていた。
  とくに「冷凍」「宅配弁当」というカテゴリ語と「料金」「価格」が0本で、構成案は「値段」で統一していた。

  要件定義 §10.2 に「H2・H3にメインKWの構成要素と共起語を左詰めで自然に含める」と
  **すでに書いてあったのに守られなかった。** 原因はルールの不足ではなく、
  ①共起語を取得する工程 ②見出しに入っているか数える工程 の両方が無かったこと。
  feedback_structure 学び94（競合の網羅を数える工程が無かった）と同じ構造の穴なので、
  ルールを増やすのではなく check-coverage.py と同じく工程として機械化する。

設計思想:
  検出は機械、判断は人間またはAI。**見出しに詰め込むための道具ではない。**
  1見出しで満たすルールは2つまで（🚨3・優先順は結論＞平易さ＞KW）。
  言い換えで自然に入るなら、それは元の語選びがSEO語から外れていた合図。
  入らないなら本文に回して理由を書く。
"""
import io
import json
import re
import sys
import os
import statistics

PASS_RATE = 80.0   # 合格ライン（媒体最上位78.8%を上回る）
WARN_RATE = 60.0   # これを割るとERROR（媒体平均59.1%）

# ---- 共起語の上位に出ても、ヤマダイでは使わないと決めている語（分母から除く）----
# 出典: .claude/rules/prohibited-words.md ／ SKILL.md 🚨3
EXCLUDE = {
    'コスパ': 'prohibited-words カテゴリA で完全禁止（学び54・lint.sh ERROR）。「食費が下がる／高くなる」に言い換える',
    '徹底': 'prohibited-words レイヤー2「徹底的に／徹底調査」＝誇張の枕詞',
    '魅力': 'prohibited-words レイヤー2「〜も魅力のひとつです」＝AI定型',
    'クオリティ': 'レイヤー8 ビジネスカタカナ語。「味」「食材」で具体に書く',
    '重視': '評価語で中身がない。「〜を見て選びたい人」に言い換える',
    '通常価格': '内訳が説明できない通常価格は二重価格表示のリスク（writing-manual §8）',
    '印象': '主観語。事実で書く',
    '実質': 'prohibited-words カテゴリA「実質単価／実質〇〇円」完全禁止',
    '把握': 'prohibited-words カテゴリA「把握しておけば」→「知っておくだけで」',
    '見極め': 'prohibited-words カテゴリA「見極める／見極め」→「判断する」',
    '試算': 'prohibited-words カテゴリA。「計算する」「目安を出す」',
    'シミュレーション': 'prohibited-words カテゴリA。「月額の目安」',
    '向き不向き': 'prohibited-words カテゴリA（単独使用）。「どんな人に合うか」',
    '対処': 'prohibited-words レイヤー2 で ERROR（学び90）。「避ける」「防ぐ」',
}

# ---- 一般語すぎて指標にならない語（分母から除く）----
STOPWORDS = {
    'あたり', '以降', '必要', '追加', '用意', '対象', '自由', '完了', '時点', '好み', '理由',
    '方法', '選択', '合計', '毎回', '毎週', '負担', '全国', '一律', '最大', '通常', '手間',
    'こと', 'もの', 'ため', 'それ', 'これ', 'cm', '高さ', '以上', '以下', '場合', '内容',
    '確認', '利用', '購入', '可能', '自分', '解説', 'チェック', '紹介', 'ポイント',
}

# 個人ブログ・Q&Aは母数から外す（見出し設計の指標にならない）
NON_MEDIA = ('note.com', 'chiebukuro', 'ameblo.jp', 'hatenablog', 'detail.chiebukuro')


def load_words(path):
    """co-occurrence のレスポンスJSONから候補語のリストを作る"""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    items = data.get('data', {}).get('items', [])
    if not items:
        items = data if isinstance(data, list) else []
    out = []
    for it in items:
        w = (it.get('word') or '').strip()
        if w and len(w) >= 2:
            out.append(w)
    return out


def load_competitor_headings(path):
    """headline のレスポンスJSONから [(順位, url, [見出し...])] を作る"""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    items = data.get('data', {}).get('items', [])
    if not items:
        items = data if isinstance(data, list) else []
    out = []
    for it in items:
        page = it.get('page', {})
        url = page.get('url', '')
        pos = it.get('metrics', {}).get('position')
        hs = [h.get('text', '').strip() for h in it.get('headlines', [])]
        out.append((pos if pos is not None else 999, url, [h for h in hs if h]))
    return sorted(out)


def competitor_benchmark():
    """articles/*/competitor.json から「フォルダ名の最後の一般語」が競合の見出しに入る率を集計する。

    ⚠️ 2026-09-09 変更：**自社の公開記事は基準にしない。**
    Manabuさんから「公開記事のクオリティに満足しているわけではない」と指摘され、
    自社記事を基準にするのは現状追認だと判明したため、競合上位だけを見る。

    切り替えた結果わかったこと（実測）:
      一般語   競合の見出し（中央値）   自社の公開記事
      お試し        14%              80〜100%
      料金          11%              62〜88%
      口コミ        10%              11〜78%
    自社は競合の5〜7倍、一般語を見出しに詰めている。

    戻り値: {語: {'median': 中央値, 'max': 最大, 'sites': 媒体数}}
    """
    import glob
    import statistics
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    acc = {}
    for fp in glob.glob(os.path.join(root, 'articles', '*', 'competitor.json')):
        folder = os.path.basename(os.path.dirname(fp))
        toks = folder.split()
        if len(toks) < 2:
            continue
        word = toks[-1]
        try:
            data = json.load(io.open(fp, encoding='utf-8'))
        except Exception:
            continue
        for it in data.get('data', {}).get('items', []):
            url = it.get('page', {}).get('url', '')
            if any(n in url for n in NON_MEDIA):
                continue
            hs = [h.get('text', '') for h in it.get('headlines', [])
                  if h.get('level') in ('h2', 'h3')]
            if len(hs) < 4:
                continue
            acc.setdefault(word, []).append(sum(1 for h in hs if word in h) / len(hs))
    out = {}
    for w, rates in acc.items():
        if len(rates) >= 3:   # 媒体3本未満の語は基準にしない
            out[w] = {'median': statistics.median(rates), 'max': max(rates), 'sites': len(rates)}
    return out


def split_outline(path):
    """構成案を「見出しツリー」と「メタ節」に分ける。
    1つ目の --- から2つ目の --- までがツリー。以降がメタ節。"""
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    tree, meta = [], []
    seps = 0
    for l in lines:
        if l.strip() == '---':
            seps += 1
            continue
        (tree if seps == 1 or (seps == 0 and l.startswith('# ')) else meta).append(l)
    return tree, meta


def tree_headings(tree_lines):
    heads = []
    for l in tree_lines:
        s = l.strip()
        if s.startswith('# ') and not s.startswith('## '):
            heads.append(('H1', s[2:].strip()))
        elif s.startswith('## '):
            heads.append(('H2', s[3:].strip()))
        elif s.startswith('### '):
            heads.append(('H3', s[4:].strip()))
        elif s.startswith('- '):
            heads.append(('H3', s[2:].strip()))
    return heads


def main():
    if len(sys.argv) < 5:
        print(__doc__)
        print('引数: <cooccurrence.json> <competitor.json> <outline.md> "<メインKW>"')
        sys.exit(2)
    cpath, hpath, opath, kw = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    for p in (cpath, hpath, opath):
        if not os.path.exists(p):
            print(f'ERROR: ファイルがない: {p}')
            sys.exit(2)

    words = load_words(cpath)
    comp = load_competitor_headings(hpath)
    media = [(p, u, h) for p, u, h in comp if not any(n in u for n in NON_MEDIA)]
    if not media:
        print('ERROR: 媒体サイトが0件。competitor.json を確認する')
        sys.exit(2)

    tree_lines, meta_lines = split_outline(opath)
    heads = tree_headings(tree_lines)
    if not heads:
        print('ERROR: 見出しを1本も抽出できなかった。outline.md の形式を確認する')
        print('  期待する形式: 1行目「# タイトル」／--- のあと「## H2」「- H3」／2つ目の --- 以降はメタ節')
        sys.exit(2)
    tree_blob = '\n'.join(t for _, t in heads)
    meta_blob = '\n'.join(meta_lines)
    h2s = [t for lv, t in heads if lv == 'H2']

    # パース結果のサニティチェック（2026-09-09 追加）
    # 見出しが取れていないのにカバー率だけ出すと、実態と食い違ったまま合格になる。
    # 実記事のH2は5〜13本。3本未満なら切り出しに失敗している可能性が高い。
    if len(h2s) < 3:
        print('ERROR: H2を %d本しか取れなかった。見出しの切り出しに失敗している可能性が高い' % len(h2s))
        print('  outline.md の形式を確認する。期待する形式:')
        print('    1行目「# タイトル」／1つ目の --- のあとに「## H2」「- H3」／2つ目の --- 以降はメタ節')
        print('  bash scripts/show-outline.sh <outline.md> で何本取れているか確かめる')
        sys.exit(2)

    err = 0
    warn = 0
    parts = [p for p in re.split(r'[\s　]+', kw.strip()) if p]

    # ---- 1. メインKWの構成要素（学び93）----
    print('■ メインKWの見出し出現')
    # 2026-09-09 修正：generic セットで一律スキップするのをやめた。
    #   KWが「まごころケア食 お試し」のとき「お試し」が generic だったため検査が飛び、
    #   「メインKWそのものが足りない」を見落としたまま カバー率96.7% で合格と出していた。
    #   代わりに **同じ語を使った公開記事の実測レンジ** と比べる。語ごとにレンジが全く違うため。
    bench = competitor_benchmark()
    for p in parts:
        n_h2 = sum(1 for t in h2s if p in t)
        n_all = sum(1 for _, t in heads if p in t)
        rate = n_h2 / len(h2s) * 100 if h2s else 0
        b = bench.get(p)
        tag = ''
        if b:
            med, mx, n_site = b['median'] * 100, b['max'] * 100, b['sites']
            ref = '  競合%d媒体 中央%.0f%% 最大%.0f%%' % (n_site, med, mx)
            if rate > mx:
                tag = '  ← WARN 競合の最大%.0f%%を超える。詰め込みすぎを疑う' % mx
                warn += 1
            elif n_h2 == 0 and med >= 20:
                tag = '  ← WARN H2に0本。競合は中央%.0f%%で入れている' % med
                warn += 1
        else:
            # 競合に同じ一般語の前例がない＝ブランド名など固有語。H2 2本以下でERROR（学び93）
            ref = '  競合に前例なし（固有語とみなす）'
            if n_h2 <= 2:
                tag = '  ← ERROR 構成要素を含むH2が2本以下（学び93）'
                err += 1
        print(f'   {p:<14} H2 {n_h2:>2}/{len(h2s)}本 ({rate:>3.0f}%)  全見出し {n_all:>2}/{len(heads)}本{ref}{tag}')
    print('   ※ 基準は**競合上位の媒体のみ**。自社の公開記事は基準にしない（2026-09-09 Manabuさん指摘）')
    print('   ※ 自社は競合の5〜7倍 一般語を見出しに入れている（お試し 自社80-100% vs 競合中央14%）')
    print()

    # ---- 2. 必須級の共起語を媒体の見出しから算出 ----
    def site_heading_count(w):
        return sum(1 for _, _, hs in media if any(w in h for h in hs))

    n_media = len(media)
    must_th = 3                      # 媒体3サイト以上が見出しで使う＝必須級
    major_th = max(5, (n_media // 2) + 1)  # 過半＝落としたら致命的

    cand = []
    seen = set()
    for w in words:
        if w in seen or w in STOPWORDS or any(w == p for p in parts):
            continue
        seen.add(w)
        c = site_heading_count(w)
        if c >= must_th:
            cand.append((w, c))
    cand.sort(key=lambda x: -x[1])

    denom, hit, documented, miss, excluded = [], [], [], [], []
    for w, c in cand:
        if w in EXCLUDE:
            excluded.append((w, c, EXCLUDE[w]))
            continue
        denom.append((w, c))
        if w in tree_blob:
            hit.append((w, c))
        elif w in meta_blob:
            documented.append((w, c))
        else:
            miss.append((w, c))

    if not denom:
        print('■ 必須級の共起語が0語。co-occurrence の取得結果を確認する')
        sys.exit(2)

    covered = len(hit) + len(documented)
    rate = covered / len(denom) * 100

    # 競合各ページのカバー率（同じ分母で）
    print(f'■ 必須級の共起語 ＝ 媒体{n_media}本のうち{must_th}サイト以上が見出しで使う語')
    print(f'   対象 {len(denom)}語（禁止語 {len(excluded)}語を分母から除外）')
    print('   ' + ' / '.join(f'{w}({c})' for w, c in denom))
    print()
    print('■ カバー率の競合比')
    rates = []
    for p, u, hs in comp:
        blob = '\n'.join(hs)
        n = sum(1 for w, _ in denom if w in blob)
        r = n / len(denom) * 100
        kind = '個人/QA' if any(x in u for x in NON_MEDIA) else '媒体  '
        if kind == '媒体  ':
            rates.append(r)
        print(f'   {p:>3}位 {n:>2}/{len(denom)}語 = {r:>5.1f}%  [{kind}] {u[:46]}')
    mx, avg, med = max(rates), statistics.mean(rates), statistics.median(rates)
    print(f'   媒体の平均 {avg:.1f}%／中央値 {med:.1f}%／最大 {mx:.1f}%')
    print()
    print(f'   ★ 本構成案 {covered}/{len(denom)}語 = {rate:.1f}%'
          f'（見出しに {len(hit)}語／メタ節に理由を記載 {len(documented)}語）')
    print(f'   ★ 媒体トップを100としたとき {rate/mx*100:.0f}'
          f'（媒体トップ {mx:.1f}% / 平均 {avg:.1f}%）')
    print()

    # ---- 3. 判定 ----
    if rate >= PASS_RATE:
        verdict = f'合格（{PASS_RATE:.0f}%以上）'
    elif rate >= WARN_RATE:
        verdict = f'WARN（{WARN_RATE:.0f}〜{PASS_RATE-1:.0f}%＝媒体の中位帯。上位は狙えるが1位は厳しい）'
        warn += 1
    else:
        verdict = f'ERROR（{WARN_RATE:.0f}%未満＝媒体平均を割る）'
        err += 1
    print(f'■ 判定: {verdict}')
    print()

    if miss:
        print('■ 見出しにも理由にも無い語')
        for w, c in miss:
            if c >= major_th:
                print(f'   ERROR 「{w}」は媒体{c}/{n_media}サイト（過半）が見出しで使用。落とすなら理由が必須')
                err += 1
            else:
                print(f'   miss  「{w}」媒体{c}/{n_media}サイトが見出しで使用')
        print()
    if documented:
        print('■ 見出しには入れず、メタ節に置き場所か理由を書いた語（合格に数える）')
        print('   ' + ' / '.join(f'{w}({c})' for w, c in documented))
        print()
    if excluded:
        print('■ 禁止語なので分母から除いた語')
        for w, c, why in excluded:
            print(f'   INFO  「{w}」媒体{c}サイト → {why}')
        print()

    print(f'check-kw-cooccurrence: ERROR={err} WARN={warn}／カバー率 {rate:.1f}%（合格ライン {PASS_RATE:.0f}%）')
    print()
    print('── カバー率の上げ方は2つ。どちらかを必ずやる ──')
    print('  1. 意味が良くなる形で見出しに入れる')
    print('     言い換えで自然に入るなら、それは元の語選びがSEO語から外れていた合図')
    print('     （実例: 「値段」で統一していて「料金」「価格」が0本だった）')
    print('  2. 入れないなら outline.md の「共起語の配置計画」節に書く。書けば合格に数える')
    print('     ・本文で拾う場合 → どのH2の本文に置くかまで書く')
    print('     ・使わない場合  → 禁止語／注記を見出しに付けられない／カナ表記が薄まる 等の理由を書く')
    print()
    print('⚠️ 見出しに詰め込むための道具ではない。1見出しで満たすルールは2つまで')
    print('   （🚨3・優先順は 結論 ＞ 平易さ ＞ KW）。カバー率のために意味を壊したら本末転倒。')
    print()
    print('── よく出る誤検出（判断は人がする）──')
    print('  ・地域名（北海道・関東など）：競合も見出しに入れていないことが多い。表に置けば足りる')
    print('  ・数値語（kcal・2.5g など）：広告主指定の注記を見出しに付けられないため表に置く')
    print('  ・表記ゆれ（nosh / ナッシュ）：本KWの表記を薄めるなら見出しに入れない判断でよい')

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

    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
