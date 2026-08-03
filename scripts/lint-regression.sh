#!/bin/bash
# lint-regression.sh — NG回帰コーパスに lint.sh を当て、機械検出の網羅率を測る
# 使い方: bash scripts/lint-regression.sh
# lint.sh を改修したら必ず実行する。検出行が減っていたら回帰（デグレ）。
# 検出できない行＝「意味クラス」であり、meaning-review.md と独立レビューの担当領域。
set -u
export LC_ALL=en_US.UTF-8
CORPUS="articles/_regression/ng-corpus.txt"
[ -f "$CORPUS" ] || { echo "ERROR: $CORPUS が見つかりません"; exit 1; }
[ -f "scripts/lint.sh" ] || { echo "ERROR: scripts/lint.sh が見つかりません（リポジトリルートで実行すること）"; exit 1; }
# ベースライン: これを下回ったら lint.sh のデグレ（検出パターンの消失）
EXPECTED_MIN=20
export EXPECTED_MIN

python3 - "$CORPUS" <<'PY'
# -*- coding: utf-8 -*-
import io, re, subprocess, sys

corpus = sys.argv[1]
# lint.sh は ERROR を stderr にも書く。マルチバイト途中切断を含みうるため、
# stdout+stderr をバイトで受けて置換デコードする
raw = subprocess.run(['bash', 'scripts/lint.sh', corpus],
                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
out = raw.stdout.decode('utf-8', errors='replace')

detected = set()
for line in out.splitlines():
    if not line.startswith('ERROR'):
        continue
    m = re.search(r'[:：]\s*(\d+):', line)
    if m:
        detected.add(int(m.group(1)))

print('=== NG回帰コーパス 検出状況 ===')
total = hit = 0
misses = []
for i, raw in enumerate(io.open(corpus, encoding='utf-8'), 1):
    t = raw.strip()
    if not t or t.startswith('#'):
        continue
    total += 1
    if i in detected:
        hit += 1
        print('検出済 L%d: %s' % (i, t[:42]))
    else:
        misses.append((i, t))

for i, t in misses:
    print('未検出 L%d: %s  ← 意味レビュー担当' % (i, t[:42]))

print('---')
print('機械検出: %d / NG文 %d 行（残りは meaning-review.md＋独立レビューで拾う）' % (hit, total))

import os
expected = int(os.environ.get('EXPECTED_MIN', '0'))
if '結果:' not in out:
    print('ERROR: lint.sh が正常終了していません（結果行なし）')
    sys.exit(1)
if hit < expected:
    print('ERROR: 検出数がベースライン %d を下回りました（デグレ）。lint.sh の変更を確認してください' % expected)
    sys.exit(1)
PY
