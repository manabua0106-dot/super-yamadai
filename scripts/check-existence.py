#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-existence.py — 実在検査の機械化。service-info.md の「存在しない／書いてはいけない」語が
                     見出しや本文に使われていないかを検出する

使い方:
  python3 scripts/check-existence.py articles/{KW}/outline.md
  python3 scripts/check-existence.py articles/{KW}/article.html

  対象ファイルに出てくるサービス名を自動判定し、**そのサービスの禁止語だけ**を当てる。
  （「お試しセット」はオイシックスには実在するがウェルネスダイニングには無いので、
    サービスを限定しないと誤検出になる）

なぜ作ったか:
  2026-09-09、同じ日に2回、同じ事故が起きた。
  ①「三ツ星ファーム お試し」＝お試しセットが存在しないのに全H2に「お試し」を名詞で貼った
  ②「三ツ星ファーム 冷凍庫」＝ブランド名を全H2に貼り、10本中3本で主語がすり替わった

  auto-memory `midashi-jitsuzai-kensa` に3検査（実在・音読・前提）を記録していたが**防げなかった**。
  理由は本人の記録にある通り：
    「lint-outline.sh・check-cannibal.sh・check-coverage.py を回して全部通ったため、検査済みだと錯覚した。
      3検査はどれも機械化されておらず、機械チェックの通過は3検査の代わりにならない」

  さらに 2026-09-09 に check-kw-cooccurrence.py / check-body-kw.py で
  「カバー率80%／90%」という**数値目標**を作った。記録には
  「数値目標を追うときほど発生する（数値は機械的に上げられるが、意味は機械では守れない）」とある。
  つまり圧力を強めた側なので、実在検査を機械で止められるところまで機械化する。

限界（正直に書く）:
  - 「主語のすり替わり」は検出できない。「三ツ星ファームの冷凍庫は途中解約で16,500円かかる」は
    禁止語を含まないのでこのスクリプトを通る。**音読と主語の確認は人がやるしかない**
  - service-info.md に書かれていない不存在は検出できない。未登録サービスは素通りする
  - よって本スクリプトの通過は「実在検査を通した」ことにはならない。**3検査の1つを部分的に自動化しただけ**
"""
import io
import re
import sys
import os
import html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVC = os.path.join(ROOT, '.claude', 'rules', 'service-info.md')

# サービス名の別表記（service-info.md の見出し名 → 記事で使われる表記）
ALIAS = {
    'Dr.つるかめキッチン': ['つるかめキッチン', 'Dr.ツルガメキッチン'],
    'Meals（ミールズ）': ['Meals', 'ミールズ'],
    'nosh（ナッシュ）': ['ナッシュ', 'nosh'],
    'ワタミの宅食ダイレクト': ['ワタミの宅食ダイレクト'],
    'ワタミの宅食': ['ワタミの宅食'],
    'ニチレイフーズダイレクト': ['ニチレイ'],
    'まごころケア食': ['まごころケア食'],
    'ウェルネスダイニング': ['ウェルネスダイニング'],
    'DELIPICKS（デリピックス）': ['DELIPICKS', 'デリピックス'],
    'ツクリオ（旧つくりおき.jp）': ['ツクリオ', 'つくりおき'],
    'マッスルデリ（Muscle Deli）': ['マッスルデリ', 'Muscle Deli'],
    '三ツ星ファーム': ['三ツ星ファーム'],
    'Oisix（オイシックス）': ['Oisix', 'オイシックス'],
    'ヨシケイ': ['ヨシケイ'],
    'らでぃっしゅぼーや': ['らでぃっしゅぼーや', 'ラディッシュボーヤ'],
    'コープデリ': ['コープデリ'],
    'パルシステム': ['パルシステム'],
    '食のそよ風': ['食のそよ風'],
    'わんまいる': ['わんまいる'],
    '食宅便': ['食宅便'],
    'タイヘイ': ['タイヘイ'],
    '筋肉食堂DELI': ['筋肉食堂DELI'],
    'オイシエ': ['オイシエ'],
}

# 「使わない」と書かれていても検出対象にしない語（一般的すぎる／文脈依存）
IGNORE = {'送料無料', '無添加', '手作り', '一流シェフ', 'コスパ', '実質'}


def parse_service_info():
    """service-info.md から {サービス名: [禁止語...]} を作る。
    拾う対象は ⚠️ 行と「書いてはいけないもの」節の中の 「…」 で囲まれた語。"""
    if not os.path.exists(SVC):
        return {}
    text = io.open(SVC, encoding='utf-8').read()
    # ### N. サービス名 で分割
    blocks = re.split(r'\n#{2,3}\s+', text)
    out = {}
    for b in blocks:
        head = b.split('\n', 1)[0].strip()
        m = re.match(r'\d+\.\s*([^【\n]+?)(?:【|$)', head)
        if not m:
            continue
        name = m.group(1).strip()
        bans = set()
        for line in b.split('\n'):
            s = line.strip()
            hit = ('書いてはいけない' in s or '存在しない' in s
                   or '使わない' in s or '書かない' in s or 'は無い' in s or 'はない' in s)
            if not hit:
                continue
            # 「X」以外は書かない ＝ X は許可されている。誤検出になるので拾わない
            if '以外' in s:
                continue
            for q in re.findall(r'「([^」]{2,40})」', s):
                q = q.strip()
                if q and q not in IGNORE and not re.fullmatch(r'[0-9０-９,，.\s円%％]+', q):
                    bans.add(q)
        if bans:
            out[name] = sorted(bans)
    return out


def target_text(path):
    raw = io.open(path, encoding='utf-8').read()
    if path.endswith('.html'):
        raw = re.sub(r'<table.*?</table>', ' ', raw, flags=re.S)
        return html.unescape(re.sub(r'<[^>]+>', ' ', raw))
    return raw


def headings_only(path):
    """見出しだけを抜く（outline.md はツリー部分、article.html は h1-h3）"""
    raw = io.open(path, encoding='utf-8').read()
    if path.endswith('.html'):
        return [re.sub(r'<[^>]+>', '', m) for m in
                re.findall(r'<h[123][^>]*>.*?</h[123]>', raw, re.S)]
    heads, seps = [], 0
    for l in raw.split('\n'):
        if l.strip() == '---':
            seps += 1
            if seps >= 2:
                break
            continue
        s = l.strip()
        if s.startswith('# ') and not s.startswith('## '):
            heads.append(s[2:].strip())
        elif seps == 1 and s.startswith('## '):
            heads.append(s[3:].strip())
        elif seps == 1 and s.startswith('- '):
            heads.append(s[2:].strip())
    return heads


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print('引数: <outline.md | article.html>')
        sys.exit(2)
    path = sys.argv[1]
    if not os.path.exists(path):
        print('ERROR: ファイルがない: %s' % path)
        sys.exit(2)

    bans = parse_service_info()
    if not bans:
        print('ERROR: service-info.md から禁止語を1件も抽出できなかった。パスと書式を確認する')
        print('  想定パス: %s' % SVC)
        sys.exit(2)

    body = target_text(path)
    heads = headings_only(path)
    head_blob = '\n'.join(heads)

    # 記事の「主題」であるサービスだけを見る。
    # 本文に1回出てくるだけの他社（比較の引き合い・内部リンク）の禁止語を当てると誤検出になる。
    # 主題＝タイトル（H1）に名前が出るサービス。無ければ見出しに3回以上出るサービス。
    title = (heads[0] if heads else '')
    active = []
    for name, words in bans.items():
        keys = ALIAS.get(name, [name])
        is_subject = any(k in title for k in keys)
        if not is_subject:
            n = sum(head_blob.count(k) for k in keys)
            is_subject = n >= 3
        if is_subject:
            active.append((name, words, keys))

    print('■ 対象ファイル: %s' % path)
    print('   見出し %d本／本文 %s字' % (len(heads), format(len(re.sub(r'\s', '', body)), ',')))
    print('   service-info.md から禁止語を抽出できたサービス %d件、うち本ファイルに登場 %d件'
          % (len(bans), len(active)))
    if active:
        print('   対象: %s' % ' / '.join(n for n, _, _ in active))
    print()

    err = 0
    warn = 0
    for name, words, keys in active:
        hits_h = [w for w in words if w in head_blob]
        hits_b = [w for w in words if w in body and w not in hits_h]
        if hits_h:
            for w in hits_h:
                print('   ERROR [%s] 見出しに「%s」がある。service-info.md が存在しない／使わないと明記している' % (name, w))
                err += 1
        if hits_b:
            for w in hits_b:
                print('   WARN  [%s] 本文に「%s」がある。service-info.md が存在しない／使わないと明記している' % (name, w))
                warn += 1

    if not err and not warn:
        print('   OK 禁止語の使用は見つからなかった')
    print()
    print('check-existence: ERROR=%d WARN=%d' % (err, warn))
    print()
    print('══ このスクリプトの限界（通過を「実在検査を通した」と数えない）══')
    print('  ✗ 主語のすり替わりは検出できない')
    print('     例「三ツ星ファームの冷凍庫は途中解約で16,500円かかる」＝冷凍庫の値段が16,500円と読める')
    print('       （実際は解約手数料）。禁止語を含まないのでこのスクリプトを通る')
    print('  ✗ service-info.md に書かれていない不存在は検出できない')
    print()
    print('  → **音読と主語の確認は人がやる。** 見出しを1本でも書き換えたら、')
    print('     変更した見出しだけを表にして「意味が通るか」「主語がすり替わっていないか」を1本ずつ書く')
    print('     （auto-memory midashi-jitsuzai-kensa。2026-09-09 に同じ日に2回起こした事故）')

    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
