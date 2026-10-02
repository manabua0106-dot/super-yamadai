#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-ledger.py — 情報台帳を数える（ヤマダイ版・2026-10-02 新設）

使い方: python3 scripts/check-ledger.py <outline.md>
出力  : ERROR / WARN / INFO の行と「check-ledger: ERROR=n WARN=m」。ERRORがあれば終了コード1。

花田税理士事務所ブログの check-ledger.py（2026-09-30 新設）から、ヤマダイに無い「掲載社数ゲート」を除いて移植した。

情報台帳とは、1つの情報を書く場所を、構成の段階で1か所に決める表。
  列＝情報｜競合本数｜置き場所｜備考
  置き場所＝H3見出し（またはH2見出し）／表：〇〇／FAQ：質問／まとめ／導入／入れない
outline.md の「## 情報台帳」節に置く（2つ目の「---」より後ろのメタ節。見出しの検査の対象外）。
本文は台帳の自分の行だけを書き、他のH3が置き場所の情報は書かない。重複や蛇足を、構成と本文の入口で止める。

対象:
  - 「## 情報台帳」がある構成 … 下のERROR/WARNを検査する
  - 「見出し形式：H2抽象」の行があるのに台帳が無い構成 … ERROR（これから作る構成は台帳を置く）
  - どちらも無い既存の構成 … INFOだけ（止めない）

見るもの:
  ERROR: 表が読めない／置き場所が空／置き場所が構成案のどの見出しにも当たらない（表・FAQ・まとめ・導入・入れない を除く）
  ERROR: 競合3本以上の情報を「入れない」にしているのに、備考に iron-rule／実データ／承認済み／景表法／広告主 が無い
  ERROR: 同じ情報の行が2つある
  WARN : 台帳に置き場所が無いH3（蛇足の疑い。FAQ・まとめ・「1.社名」型のH3は除く）
  WARN : 同じ情報らしい行が別の置き場所にある（重複の疑い）

設計思想: 検出は機械、判断は人。ただし「置き場所が無い」は数えるだけで確定するのでERRORにする。
"""
import re
import sys

OK_REASON = re.compile(r'iron-rule|実データ|承認済み|景表法|広告主')
SPECIAL_PLACE = re.compile(r'^(表|FAQ|まとめ|導入|入れない)')
SKIP_H2 = re.compile(r'よくある質問|FAQ|^まとめ')
META_BULLET = re.compile(r'^[-*] *(タイトル|メタ|メタ説明文|URL|URLスラッグ|サブKW|モード|記事の主役|★主役|約束)[:：]')
STRICT_MARK = re.compile(r'^見出し形式[:：]\s*H2抽象', re.M)
META_H2 = re.compile(r'^##\s*(カニバリ|差別化|口コミ素材|執筆時の要裏取り|要裏取り|構成上のメモ|変更操作|変更まとめ|競合トピックの網羅|網羅チェック|情報台帳)')


def bg(t):
    return set(t[i:i + 2] for i in range(len(t) - 1))


def jac(a, b):
    A, B = bg(a), bg(b)
    return len(A & B) / len(A | B) if (A | B) else 0.0


def parse_headings(lines):
    """outline.md（pipeline.js の出力形式）から H2 と H3 を取り出す。2つ目の「---」より前だけを見る。"""
    h2s, cur, sep = [], None, 0
    for raw in lines:
        if re.match(r'^---[ \t]*$', raw):
            sep += 1
            if sep >= 2:
                break
            continue
        if META_H2.match(raw):          # 「---」が無い出力でも、メタ節に入ったら止める（lint-outline.sh と同じ保険）
            break
        if raw.startswith('## '):
            cur = {'h2': raw[3:].strip(), 'h3': []}
            h2s.append(cur)
        elif cur is not None and re.match(r'^[-*] ', raw) and not META_BULLET.match(raw):
            cur['h3'].append(re.sub(r'^[-*] +', '', raw).strip())
    return h2s


def parse_ledger(lines):
    """「## 情報台帳」節の表を読む。戻り値＝(行のリスト, 節があったか)。"""
    start = next((i for i, l in enumerate(lines) if re.match(r'^##\s*情報台帳', l)), None)
    if start is None:
        return [], False
    rows = []
    for l in lines[start + 1:]:
        if l.startswith('## ') or re.match(r'^---[ \t]*$', l):
            break
        if not l.strip().startswith('|'):
            continue
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        if len(cells) < 3 or set(''.join(cells)) <= set('-: '):
            continue
        if cells[0] == '情報':
            continue
        rows.append({'info': cells[0], 'comp': cells[1], 'place': cells[2], 'note': cells[3] if len(cells) > 3 else ''})
    return rows, True


def comp_count(s):
    m = re.match(r'\s*([0-9０-９]+)\s*/', s.translate(str.maketrans('０１２３４５６７８９', '0123456789')))
    return int(m.group(1)) if m else 0


def place_matches(place, heads):
    p = re.sub(r'^(表|FAQ)[:：]\s*', '', place)
    for h in heads:
        if h and (h in place or p in h or (len(p) >= 4 and jac(p, h) >= 0.45)):
            return True
    return False


def main():
    if len(sys.argv) < 2:
        print('使い方: python3 scripts/check-ledger.py <outline.mdのパス>', file=sys.stderr)
        sys.exit(2)
    path = sys.argv[1]
    try:
        text = open(path, encoding='utf-8').read()
    except OSError as e:
        print('ERROR [ファイルが読めない] %s' % e)
        print('check-ledger: ERROR=1 WARN=0')
        sys.exit(1)
    lines = text.split('\n')
    rows, has_ledger = parse_ledger(lines)
    strict = bool(STRICT_MARK.search(text))

    cnt = {'e': 0, 'w': 0}

    def err(m):
        cnt['e'] += 1
        print('ERROR ' + m)

    def warn(m):
        cnt['w'] += 1
        print('WARN  ' + m)

    if not has_ledger:
        if strict:
            err('[情報台帳が無い] 「見出し形式：H2抽象」の構成には「## 情報台帳」の節が必要（列＝情報｜競合本数｜置き場所｜備考。要件定義§10.5c）')
        else:
            print('INFO  [情報台帳] この構成に「## 情報台帳」が無い（既存の構成。書き足しは不要）。これから作る構成は台帳を置く')
        print('check-ledger: ERROR=%d WARN=%d' % (cnt['e'], cnt['w']))
        sys.exit(1 if cnt['e'] else 0)

    groups = parse_headings(lines)
    if not groups:
        err('[見出しの抽出に失敗] H2が1本も読めない（形式が不明で検査できない。0件は合格ではない）')
        print('check-ledger: ERROR=%d WARN=%d' % (cnt['e'], cnt['w']))
        sys.exit(1)
    heads = [g['h2'] for g in groups] + [x for g in groups for x in g['h3']]

    if not rows:
        err('[表が読めない] 「## 情報台帳」の下に「| 情報 | 競合本数 | 置き場所 | 備考 |」の表の行が無い')

    seen = {}
    for r in rows:
        key = re.sub(r'\s+', '', r['info'])
        if key in seen:
            err('[同じ情報が2行] 「%s」' % r['info'])
        seen[key] = r
        place = r['place']
        if not place:
            err('[置き場所が空] 「%s」' % r['info'])
            continue
        if place.startswith('入れない'):
            if comp_count(r['comp']) >= 3 and not OK_REASON.search(r['note']):
                err('[競合3本以上の情報を入れない] 「%s」は競合 %s。備考に iron-rule／実データ／承認済み／景表法／広告主 のどれかで理由を書く'
                    % (r['info'], r['comp']))
            continue
        if SPECIAL_PLACE.match(place):
            continue
        if not place_matches(place, heads):
            err('[置き場所が見出しに当たらない] 「%s」の置き場所「%s」。構成案のH2/H3の文言に合わせる（表・FAQ・まとめ・導入・入れない は可）'
                % (r['info'], place))

    # 重複の疑い: 情報が似ているのに置き場所が違う行
    keep = [r for r in rows if r['place'] and not r['place'].startswith('入れない')]
    for i in range(len(keep)):
        for j in range(i + 1, len(keep)):
            a, b = keep[i], keep[j]
            if a['place'] != b['place'] and jac(a['info'], b['info']) >= 0.5:
                warn('[重複の疑い] 「%s」と「%s」は似ているのに置き場所が違う（%s／%s）' % (a['info'], b['info'], a['place'], b['place']))

    # 蛇足の疑い: 台帳に置き場所が無いH3
    placed = [r['place'] for r in rows if r['place'] and not r['place'].startswith('入れない')]
    orphan = 0
    total = 0
    for g in groups:
        if SKIP_H2.search(g['h2']):
            continue
        for x in g['h3']:
            if re.match(r'^[0-9０-９]+[.．]', x):     # 「1.ライフミール」型の社名H3
                continue
            total += 1
            if not any(place_matches(p, [x]) for p in placed):
                orphan += 1
                warn('[台帳に置き場所が無いH3] H2 %s の配下: %s（蛇足の疑い。台帳に行を足すか、H3を消す）' % (g['h2'], x))

    print('  台帳 %d行（置く%d・入れない%d）／検査したH3 %d本のうち台帳に無い %d本' %
          (len(rows), len(keep), len(rows) - len(keep), total, orphan))
    print('check-ledger: ERROR=%d WARN=%d' % (cnt['e'], cnt['w']))
    sys.exit(1 if cnt['e'] else 0)


if __name__ == '__main__':
    main()
