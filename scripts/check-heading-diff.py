#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-heading-diff.py — 見出しを書き換えたら「消えた語」を機械で出し、3検査の記録がないと合格を出さない

使い方:
  python3 scripts/check-heading-diff.py articles/{KW}/outline.md
  python3 scripts/check-heading-diff.py articles/{KW}/outline.md --accept   # 記録を書いたあとに承認

やること:
  1. 前回のスナップショットと今回の見出しを突き合わせ、**変更された見出しを旧→新で並べる**
  2. 書き換えで**消えた語**を出す（情報の欠落＝2026-09-09に4記事で起きた事故の型）
  3. 変更があるのに `heading-3checks.md` に今回のハッシュが無ければ **ERROR で止める**

なぜ作ったか（ここが本題）:
  2026-09-09、同じ日に**4記事**で同じ事故が起きた。
    ・三ツ星ファーム お試し … 存在しない「お試し」を名詞で全H2に貼った
    ・三ツ星ファーム 冷凍庫 … ブランド名を全H2に貼り10本中3本で主語がすり替わった
    ・食のそよ風 … 「口コミと評判」の同義語重複／「〜は〜が〜」の二重主語
    ・まごころケア食 お試し … 「送料込み」「7食から」が消えて数値の意味が変わった
    ・三ツ星ファーム やばい … 「手数料」「在庫」を削って意味が壊れた

  すべて同じ機構。**KW率・共起語カバー率という数値目標を追って見出しを機械的に書き換えた。**
  auto-memory `midashi-jitsuzai-kensa` に3検査を記録し、
  各スクリプトの出力にも印字したが**止まらなかった**。理由は単純で、

      数値目標は機械的に上げられる。3検査は印字された文章でしかない。
      **文章は数値目標を止められない。**

  だから機械で止める。**見出しを変えたら、3検査の記録を書くまで合格を出さない。**

3検査の記録（articles/{KW}/heading-3checks.md）に書くこと:
  - 今回のハッシュ（このスクリプトが出す文字列をそのまま貼る）
  - 変更した見出しを1本ずつ 旧→新 で並べ、次の3つを書く
      実在検査 … 見出しの名詞がサービスに実在するか（service-info.md と公式で確認）
      音読    … 差し替えた後の文を読んで意味が通るか。主語がすり替わっていないか
      前提検査 … 実測値を目標にしたなら、その実測が成立する前提が同じか
  - **消えた語**（このスクリプトが出す）を1つずつ、落として良いか判断した結果
"""
import io
import os
import re
import sys
import json
import hashlib

SNAP = '.heading-snapshot.json'
REC = 'heading-3checks.md'


def headings(path):
    raw = io.open(path, encoding='utf-8').read()
    if path.endswith('.html'):
        return [re.sub(r'<[^>]+>', '', m).strip()
                for m in re.findall(r'<h[123][^>]*>.*?</h[123]>', raw, re.S)]
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
    return [h for h in heads if h]


def tokens(t):
    """見出しから語を切り出す。漢字・カタカナ・英数の2文字以上の連なりを語とみなす"""
    return set(re.findall(r'[一-龥]{2,}|[ァ-ヶー]{2,}|[A-Za-z]{2,}|[0-9０-９,，.]+[食円gkcal%]*', t))


def similar(a, b):
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print('引数: <outline.md | article.html> [--accept]')
        sys.exit(2)
    path = sys.argv[1]
    accept = '--accept' in sys.argv
    if not os.path.exists(path):
        print('ERROR: ファイルがない: %s' % path)
        sys.exit(2)

    d = os.path.dirname(os.path.abspath(path))
    snap_p = os.path.join(d, SNAP)
    rec_p = os.path.join(d, REC)

    cur = headings(path)
    if not cur:
        print('ERROR: 見出しを1本も抽出できなかった')
        sys.exit(2)
    cur_hash = hashlib.sha1('\n'.join(cur).encode('utf-8')).hexdigest()[:12]

    print('■ 対象: %s' % path)
    print('   見出し %d本／今回のハッシュ %s' % (len(cur), cur_hash))
    print()

    if not os.path.exists(snap_p):
        json.dump({'hash': cur_hash, 'headings': cur},
                  io.open(snap_p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('   初回なのでスナップショットを作成した。次回から差分を出す')
        print()
        print('check-heading-diff: ERROR=0 WARN=0（初回）')
        sys.exit(0)

    prev = json.load(io.open(snap_p, encoding='utf-8'))
    old = prev.get('headings', [])
    if prev.get('hash') == cur_hash:
        print('   前回から見出しの変更なし')
        print()
        print('check-heading-diff: ERROR=0 WARN=0（変更なし）')
        sys.exit(0)

    # ---- 変更の対応づけ（類似度で旧見出しとペアにする）----
    unmatched_old = list(old)
    changed, added = [], []
    for h in cur:
        if h in unmatched_old:
            unmatched_old.remove(h)
            continue
        best, score = None, 0.0
        for o in unmatched_old:
            sc = similar(o, h)
            if sc > score:
                best, score = o, sc
        if best and score >= 0.34:
            unmatched_old.remove(best)
            changed.append((best, h))
        else:
            added.append(h)
    removed = unmatched_old

    print('■ 変更のまとめ  書き換え %d本／新規 %d本／削除 %d本'
          % (len(changed), len(added), len(removed)))
    print()

    lost_total = []
    if changed:
        print('■ 書き換えた見出し（旧 → 新）と消えた語')
        for o, n in changed:
            lost = sorted(tokens(o) - tokens(n))
            gained = sorted(tokens(n) - tokens(o))
            print('   旧 %s' % o)
            print('   新 %s' % n)
            if lost:
                print('      ⚠️ 消えた語: %s' % ' / '.join(lost))
                lost_total.extend(lost)
            if gained:
                print('         入れた語: %s' % ' / '.join(gained))
            print()
    if added:
        print('■ 新しく足した見出し')
        for h in added:
            print('   + %s' % h)
        print()
    if removed:
        print('■ 消した見出し')
        for h in removed:
            print('   - %s' % h)
        print()

    if lost_total:
        print('■ ⚠️ 消えた語の一覧（情報の欠落がいちばん多い事故）')
        print('   %s' % ' / '.join(sorted(set(lost_total))))
        print('   2026-09-09の実例: 「手数料」「在庫」「送料込み」「専属の」「7食から」が')
        print('   共起語を入れる差し替えで消え、数値の意味が変わったり因果が壊れたりした')
        print()

    # ---- 3検査の記録があるか ----
    err = 0
    rec_ok = False
    if os.path.exists(rec_p):
        rec = io.open(rec_p, encoding='utf-8').read()
        rec_ok = cur_hash in rec
    if rec_ok:
        print('■ 3検査の記録: OK  %s に今回のハッシュ %s がある' % (REC, cur_hash))
    else:
        print('■ 3検査の記録: ERROR')
        if not os.path.exists(rec_p):
            print('   %s が無い' % os.path.join(os.path.basename(d), REC))
        else:
            print('   %s はあるが、今回のハッシュ %s が書かれていない（前回の記録のまま）'
                  % (REC, cur_hash))
        print()
        print('   → 見出しを書き換えたので、下記を %s に書いてから再実行する' % REC)
        print('     1行目に: ハッシュ %s' % cur_hash)
        print('     変更した見出しを1本ずつ 旧→新 で並べ、それぞれに3検査の結果を書く')
        print('       実在検査 … その名詞がサービスに実在するか（service-info.md と公式で確認）')
        print('       音読    … 差し替えた後の文を読んで意味が通るか。主語がすり替わっていないか')
        print('       前提検査 … 実測値を目標にしたなら、その実測が成立する前提が同じか')
        print('     上の「消えた語」を1つずつ、落として良いか判断した結果も書く')
        err += 1
    print()

    if accept and err == 0:
        json.dump({'hash': cur_hash, 'headings': cur},
                  io.open(snap_p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('   --accept: スナップショットを更新した')
        print()

    print('check-heading-diff: ERROR=%d（記録が揃うまで合格にしない）' % err)
    print()
    print('══ なぜこの仕組みが要るか ══')
    print('  KW率・共起語カバー率は**機械的に上げられる**。だが意味は機械では守れない。')
    print('  2026-09-09、同じ日に4記事が同じ壊れ方をした。3検査を記憶にもスクリプトの印字にも')
    print('  入れたが止まらなかった。**印字された文章は数値目標を止められない。**')
    print('  だから「見出しを変えたら記録を書くまで合格を出さない」形にした。')

    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
