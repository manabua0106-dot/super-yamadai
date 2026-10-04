#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-coverage.py — 競合上位の見出しと自分の構成案を突合し、拾えていない必須トピックを機械検出する

使い方:
  1) ラッコキーワードMCP の headline で上位10件を取得し、レスポンスJSONをファイルに保存する
     （MCPはシェルから直接叩けないため、Claude/Codex が呼んで保存する）
       mcp__claude_ai__headline(keyword="<対象KW>", limit=10, h4=true, lessCharacters=true)
  2) python3 scripts/check-coverage.py <competitor.json> <outline.md>

判定:
  ERROR : 2サイト以上が見出しに持つトピックが構成案のどこにも無い（＝必須トピックの取りこぼし）
  WARN  : 1サイトだけが持つトピックが構成案に無い（入れるかは判断。入れないなら理由を outline に書く）
  INFO  : 語彙に当たらなかった競合見出し（人が読んで判断する）

なぜ作ったか:
  2026-09-08「まごころケア食 口コミ」で、上位3社すべてが独立H2で扱っていた「8種類のコース」を
  構成に入れ忘れた。要件定義 §6.3 に「必須トピック（上位の過半が持つ）は抜け漏れ禁止」と
  書いてあったにもかかわらず素通りしたのは、**数える工程が無かった**ため。
  同じ型の穴（feedback_writing v4.2「部分適用がそのまま素通りの穴になる」）なので、
  ルールを増やすのではなく工程として機械化する。

設計思想:
  検出は機械、判断は人間またはAI。トピックの同一性判定は語彙マッチで十分に粗く、
  誤検出は出る前提。「competitor に有り／outline に無し」を**必ず目に入れる**ことが目的。
"""
import json
import re
import sys
import os

# ---- ジャンル語彙（食材宅配・宅配弁当）。トピック名 → その話題を指す表記のゆれ ----
TOPICS = {
    'コース・プラン': ['コース', 'プラン', '制限食', '介護食', '種類から'],
    'メニュー内容': ['メニュー', '献立', '品数', '主菜', '副菜', 'おかず'],
    '料金': ['料金', '値段', '価格', '費用', '月額', '最安', 'いくら'],
    '送料': ['送料', '配送料', '配達料'],
    'お試し・初回': ['お試し', 'おためし', 'トライアル', '初回'],
    'クーポン・キャンペーン': ['クーポン', 'キャンペーン', '割引', 'セール', 'OFF'],
    '解約・退会': ['解約', '退会', '停止', 'スキップ', '休止', '縛り', 'やめ'],
    '冷凍庫・レンタル': ['冷凍庫', '冷蔵庫', 'レンタル'],
    '置き配・受け取り': ['置き配', '受け取り', '不在', '宅配ボックス'],
    '配達エリア': ['エリア', '配達可能', '対応地域'],
    '注文方法・流れ': ['注文', '申し込み', '申込', '頼み方', '手順', '流れ', '届く'],
    '支払い方法': ['支払', '決済', 'クレジット', '後払い', 'Pay'],
    '添加物・産地': ['添加物', '産地', '国産', '原材料', '無添加'],
    '保存期間': ['保存', '賞味期限', '消費期限', '日持ち', 'ストック'],
    '温め方': ['温め', 'レンジ', '解凍', '加熱', 'チン'],
    '味の評価': ['まずい', 'おいしい', '美味しい', '味付け', '薄味', '濃い', '食感'],
    '量・ボリューム': ['ボリューム', '物足り', '足りな', '量は', '量が', '少なめ'],
    '口コミ・評判': ['口コミ', '評判', 'レビュー', '声'],
    'メリット': ['メリット', '良い点', 'いい点', '魅力'],
    'デメリット・注意点': ['デメリット', '注意点', '悪い', '気になる'],
    '向いている人': ['向いて', 'おすすめ', 'こんな人', '誰向け', '選びたい理由'],
    '他社比較': ['比較', '違い', 'nosh', 'ナッシュ', 'ワタミ', '三ツ星', 'つくりおき',
                 'ツクリオ', 'つるかめ', 'タイヘイ', 'わんまいる', 'VS', 'ＶＳ'],
    '栄養・成分': ['カロリー', 'kcal', '塩分', '糖質', 'たんぱく', '栄養', '成分'],
    '容器・ごみ': ['容器', 'ゴミ', 'ごみ', 'パッケージ', 'かさば'],
    '実食レビュー': ['実食', '食べてみた', '試してみた', '体験', '正直', '検証'],
    '運営会社': ['会社', '運営', '企業'],
    'アプリ': ['アプリ'],
    '一人暮らし': ['一人暮らし', '単身', 'ひとり暮らし'],
    '高齢者・介護': ['高齢', 'シニア', '年配', '介護', '親に', '母', '父'],
    'ダイエット': ['ダイエット', '痩せ', '減量', '体重'],
    'アレルギー': ['アレルギー', 'アレルゲン'],
}

# 競合ページのナビ・定型見出し（トピック判定から除外する）
NAV_PATTERNS = [
    '目次', '関連キーワード', '最近の投稿', '最近のコメント', 'アーカイブ', 'カテゴリー',
    'アクセスランキング', '最新記事', 'ピックアップ', '今読んでおきたい', 'TAG',
    'ご利用の流れ', '資料請求', '口コミ投稿フォーム', 'ベストアンサー', 'あわせて知りたい',
    'あなたも答えてみません', 'Q&Aランキング', 'カテゴリ一覧', '質問内容', '回答文',
    'レビューの投稿画像', 'レビュー一覧', 'レビューのAI要約', '都道府県から',
    '配達可能な宅配弁当を探す', '食事宅配', '一覧', 'こんな人におすすめ！',
]


def load_competitor(path):
    """ラッコ headline のレスポンスJSONから {url: [見出し...]} を作る"""
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    items = data.get('data', {}).get('items', [])
    if not items:
        # 生配列で渡された場合にも対応
        items = data if isinstance(data, list) else []
    sites = {}
    for it in items:
        page = it.get('page', {})
        url = page.get('url', '(url不明)')
        pos = it.get('metrics', {}).get('position')
        key = f"{pos}位 {url}" if pos else url
        hs = [h.get('text', '').strip() for h in it.get('headlines', [])]
        sites[key] = [h for h in hs if h]
    return sites


def load_outline(path):
    """構成案から、判定対象にする全テキスト（見出し＋約束文＋箇条書き）を返す"""
    with open(path, encoding='utf-8') as f:
        raw = f.read()
    # メタ節（差別化メモ・カニバリ判定・訴求設計・執筆時の注意・レビュー記録・網羅チェック）以降は
    # 「構成に入っている」と見なさない。実際の見出しツリーだけを対象にする。
    for marker in ['\n# 差別化メモ', '\n# カニバリ判定', '\n# 訴求設計',
                   '\n# 執筆時の注意', '\n# 第三者レビュー', '\n# 競合トピックの網羅チェック']:
        idx = raw.find(marker)
        if idx > 0:
            raw = raw[:idx]
    return raw


def is_nav(text):
    return any(p in text for p in NAV_PATTERNS)


def detect_topics(text):
    hit = set()
    for topic, words in TOPICS.items():
        for w in words:
            if w in text:
                hit.add(topic)
                break
    return hit


def count_topic_headings(text_lines):
    """見出し行のリストから トピック -> 該当見出し数 を数える"""
    cnt = {}
    for h in text_lines:
        for t in detect_topics(h):
            cnt[t] = cnt.get(t, 0) + 1
    return cnt


def outline_headings(raw):
    """構成案から見出し行（## と 箇条書き）だけを取り出す"""
    hs = []
    for line in raw.split('\n'):
        line = line.strip()
        if line.startswith('## '):
            hs.append(line[3:].strip())
        elif line.startswith('# ') and not line.startswith('## '):
            hs.append(line[2:].strip())
        elif line.startswith('- '):
            hs.append(line[2:].strip())
    return hs


def main():
    if len(sys.argv) < 3:
        print('使い方: python3 scripts/check-coverage.py <competitor.json> <outline.md>')
        print('  competitor.json = ラッコキーワードMCP headline のレスポンスを保存したもの')
        sys.exit(2)
    cpath, opath = sys.argv[1], sys.argv[2]
    for p in (cpath, opath):
        if not os.path.isfile(p):
            print(f'ERROR: ファイルが見つかりません: {p}')
            sys.exit(1)

    sites = load_competitor(cpath)
    raw = load_outline(opath)
    my_headings = outline_headings(raw)
    my_count = count_topic_headings(my_headings)
    outline_topics = set(my_count.keys())

    holders = {}    # topic -> set(site)
    comp_count = {} # topic -> 競合の該当見出し数（全サイト合計）
    examples = {}
    unmatched = []
    for site, headings in sites.items():
        for h in headings:
            if not h or is_nav(h):
                continue
            ts = detect_topics(h)
            if not ts:
                unmatched.append((site, h))
                continue
            for t in ts:
                holders.setdefault(t, set()).add(site)
                comp_count[t] = comp_count.get(t, 0) + 1
                examples.setdefault(t, []).append((site, h))

    total_sites = len(sites)
    err = warn = 0
    print(f'競合 {total_sites} サイトの見出しを読み込みました（{cpath}）')
    print(f'構成案: {opath}（見出し {len(my_headings)}本）')
    print('')

    # ① 取りこぼし：2サイト以上が持つのに構成案に1本も無い
    for topic, sset in sorted(holders.items(), key=lambda x: -len(x[1])):
        if topic in outline_topics:
            continue
        n = len(sset)
        # 2026-09-09 追加：過半が持つかを必ず出す。
        #   「2サイト以上＝ERROR」だけを見せると、過半に届かないトピックまで
        #   「足せば消える」と扱われる。実際にそれで蛇足のH2が生まれた（ニチレイの事例）。
        majority = n * 2 >= total_sites
        if n >= 2:
            err += 1
            mark = '過半が持つ＝必須' if majority else '過半に届かない＝足す根拠は弱い'
            print(f'ERROR [取りこぼし] 「{topic}」を {n}/{total_sites} サイトが持つが、構成案に1本も無い（{mark}）')
            if not majority:
                print('        足す前に確かめる: ①question-search の質問に出るか ②自社の同型記事が持っているか')
                print('        どちらも無ければ、足さずに「入れない理由」を書くほうが正解')
        else:
            warn += 1
            print(f'WARN  [単独保有] 「{topic}」を {n}/{total_sites} サイトが持つが、構成案に1本も無い')
        for s, h in examples[topic][:3]:
            print(f'        例: [{s}] {h}')

    # ② 厚みの不足：競合が大きく割いているのに、構成案では1本しか触れていない
    #    2026-09-08「8種類のコース」を良い口コミのH3 1本に埋めて見逃した事故の再発防止
    for topic, cn in sorted(comp_count.items(), key=lambda x: -x[1]):
        if topic not in outline_topics:
            continue  # ①で既に出している
        mn = my_count.get(topic, 0)
        if cn >= 5 and mn <= 1:
            err += 1
            print(f'ERROR [厚みの不足] 「{topic}」に競合は見出し {cn}本を割いているが、構成案は {mn}本しかない')
            print(f'        {len(holders[topic])}/{total_sites} サイトが保有。独立H2に切り出すか、H3を増やすか判断する')
            for s, h in examples[topic][:3]:
                print(f'        例: [{s}] {h}')
    print('')

    gaps = sorted(outline_topics - set(holders.keys()))
    if gaps:
        print('（参考）構成案にあって競合の見出しに無いトピック＝差別化の候補:')
        for g in gaps:
            print(f'        + {g}（構成案 {my_count[g]}本）')
        print('')

    if unmatched:
        print(f'INFO  語彙に当たらなかった競合見出し {len(unmatched)}本。独自トピックが埋もれていることがあるため必ず目を通す:')
        for s, h in unmatched[:30]:
            print(f'        [{s}] {h}')
        if len(unmatched) > 30:
            print(f'        …ほか {len(unmatched)-30}本')
        print('')

    print('---')
    print(f'check-coverage: ERROR={err} WARN={warn}（ERRORは提示前に必ず解消する）')
    print('')
    print('── ERRORへの対応。この順で判断する（2026-09-09 改定）──')
    print('  ⚠️ **足すのが既定ではない。** ERRORの数を減らすことを目的にしない。')
    print('     ERRORを消す目的で見出しを足すと、記事の目的から外れたH2が生まれる')
    print('     （2026-09-09 ニチレイ：他社比較H2を足したら、H3 3本中2本が非訴求社の安さの宣伝になった）')
    print('')
    print('  1. まず「読者がそれを求めている証拠」を確かめる')
    print('       ・question-search の質問にその語が出るか')
    print('       ・競合の過半が持っているか（上の各行に印字済み）')
    print('       ・自社の同型記事が持っているか')
    print('  2. 証拠があれば構成案に足す（H2かH3、またはFAQ）')
    print('  3. 証拠が無ければ足さず、outline.md の網羅チェック節に「入れない理由」を数字つきで書く')
    print('     （実食レビューのように自社で持てない一次情報／法令リスク／需要が確認できない 等）')
    print('  ※ 理由を書かずに黙って落とすのは禁止。3を選ぶのは「逃げ」ではなく判断。')
    print('')
    print('  ※ 足した見出しは python3 scripts/check-appeal.py <outline.md> にも通す。')
    print('     非訴求社の安さ・割引を書いてしまうと、訴求の向きが逆になる')
    print('')
    print('── よく出る誤検出（語彙マッチの限界。判断は人がする）──')
    print('  ・「実食レビュー」：ヤマダイは実食しない。毎回この理由で除外してよい')
    print('  ・「メリット」「デメリット・注意点」：良い口コミ／気になる口コミH2が担っていれば足りている')
    print('  ・「運営会社」「容器・ごみ」：口コミ本文がヒットしているだけのことが多い')
    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
