#!/usr/bin/env python3
"""
outline-heading-shape.py — 構成案の見出しの「形」を検査する（H2は抽象・H3は具体）

使い方（lint-outline.sh が呼ぶ。標準入力は extract_headings の出力「行番号:H1 …／H2 …／H3 …」）:
  extract_headings | python3 scripts/outline-heading-shape.py <outline.mdのパス>

出力: ERROR / WARN / INFO の行（lint-outline.sh が数えて集計する）

2026-10-02 新設（Manabuさん指示・花田税理士事務所ブログの 2026-09-30 の方式を移植）。
背景: ヤマダイの構成は H2 が結論の文（「〜は〜になる」）で、H3 も具体の文になり、H2 と H3 が同じ粒度で重なっていた。
      進行中15本の実測では、H2 148本のうち80本（54%）が文だった。
      理想は「H2 は名詞句のセクション名（答えは直下の『約束：』行と H3）、H3 は具体」。

重さ（ERROR か WARN か）:
  - outline.md に「見出し形式：H2抽象」の行がある構成（これから作る構成）→ 下の A〜D は ERROR
  - 行が無い構成（既存の構成）→ 同じ内容を WARN で出すだけ。既存の構成を書き換えなくて済むようにするため
  - 「見出し形式：結論型」の行がある、またはタイトルが やばい・やめとけ・危険・違法・詐欺 系 → A（H2が文）は検査しない
    （結論型KWは H2 に答えを書いてよい。花田の iron-rule 4-4 と同じ）

検査:
  A. H2が文       … 「は」「が」を含む、または動詞・「から」で終わる（まとめ・よくある質問は対象外）
  B. 長さ         … H2・H3 が30字超（FAQ質問H3は35字超）
  C. H3が勧誘形   … 「〜しよう」「〜ましょう」など
  D. 存在説明     … 「〜会社がある」「〜場合がある」「〜ことがある」「〜プランがある」で終える
  E. H3がH2の語を繰り返す … H2が「選び方」なのにH3が「〜で選ぶ」など（常に WARN）
"""
import re
import sys

LEN_MAX = 30
LEN_MAX_FAQ = 35
FAQ_H2 = re.compile(r'よくある質問|FAQ')
EXEMPT_H2 = re.compile(r'^まとめ|よくある質問|FAQ')
CONCLUSION_TITLE = re.compile(r'やばい|やめとけ|危険|違法|詐欺|ひどい|最悪')
STRICT_MARK = re.compile(r'^見出し形式[:：]\s*H2抽象', re.M)
CONCLUSION_MARK = re.compile(r'^見出し形式[:：]\s*結論型', re.M)
EXISTENCE_END = re.compile(r'(会社がある|場合がある|ことがある|プランがある|コースがある|サービスがある)$')
INVITE_END = re.compile(r'(しよう|ましょう|ろう|ぼう|おう|こう|とう|のう|もう|ごう|ください)$')
# 形が勧誘形に見えるだけの普通の動詞（「1か月分そろう」）。形態素解析はしないので、見つけたら足す
INVITE_PLAIN_VERBS = ('そろう',)
# 動詞の辞書形・過去形・否定・丁寧形で終わる（ひらがな）。名詞（違い・頼み方・期限・食費…）は当たらない
VERB_END = re.compile(r'(る|う|く|ぐ|す|つ|ぬ|ぶ|む|た|ない|ます|です)$')
CLAUSE_END = re.compile(r'(から|ので|ため|けど|のに)$')
# 「が」は「らでぃっしゅぼーやが向いている人」のように名詞を修飾する節の中にも出る。名詞で終わるH2は文としない
HEAD_NOUN_END = re.compile(r'(人|方|とき|場合|理由|条件|期限|費用|手順|流れ|仕組み|違い|ケース|商品|コース|プラン|セット|メニュー|質問|口コミ|評判|注意点|デメリット|メリット|選び方|方法|比較|一覧|サービス|宅配弁当)$')
# 「は」を含む普通の語（「はじめて」など）。助詞の「は」と区別する
WA_WORDS = re.compile(r'はじめ|はたら|はず|はや|はこ|はか|はし|はい[^っ]|はな|はん')
# 条件節（「〜すると」「〜なら」）＝答えを条件つきで言い切る形
CONDITION = re.compile(r'(ると|なら|れば|たら)')
# 金額（「5,800円」）＝H2に答えの数字を書いている
MONEY = re.compile(r'[0-9０-９][0-9０-９,，]*円')
REPEAT_WORDS = [
    (re.compile(r'選び方'), ('選ぶ', '選び方', '選ぼう')),
    (re.compile(r'デメリット'), ('デメリット',)),
    (re.compile(r'メリット'), ('メリット',)),
    (re.compile(r'注意点'), ('注意点',)),
]


def is_sentence(h2):
    """H2が文（結論・答えを書いている形）か。名詞句のセクション名なら False。"""
    if EXEMPT_H2.search(h2):
        return False
    t = h2.replace('とは', '')          # 「〜とは」は名詞句
    t_wa = WA_WORDS.sub('', t)          # 「はじめて」などは助詞ではない
    if 'は' in t_wa:                    # 主題の助詞＝「AはB」の文
        return True
    if MONEY.search(t) or CONDITION.search(t):
        return True
    if CLAUSE_END.search(t) or VERB_END.search(t):
        return True
    if 'が' in t and not HEAD_NOUN_END.search(t):   # 「AがBする」の文。ただし名詞を修飾する節（〜が向いている人）は除く
        return True
    return False


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else ''
    try:
        text = open(path, encoding='utf-8').read() if path else ''
    except OSError:
        text = ''
    strict = bool(STRICT_MARK.search(text))
    conclusion_mark = bool(CONCLUSION_MARK.search(text))

    h1 = ''
    groups = []
    cur = None
    for raw in sys.stdin:
        raw = raw.rstrip('\n')
        if ':' not in raw:
            continue
        ln, line = raw.split(':', 1)
        line = line.strip()
        if line.startswith('H1 '):
            h1 = line[3:].strip()
        elif line.startswith('H2 '):
            cur = {'ln': ln, 'h2': line[3:].strip(), 'h3': []}
            groups.append(cur)
        elif line.startswith('H3 ') and cur is not None:
            cur['h3'].append(line[3:].strip())
    if not groups:
        return

    conclusion = conclusion_mark or bool(CONCLUSION_TITLE.search(h1))
    lvl = 'ERROR' if strict else 'WARN '

    def emit(level, tag, msg):
        print('%s [%s] %s' % (level, tag, msg))

    for g in groups:
        h2 = g['h2']
        h3 = [x for x in g['h3'] if x]

        # A. H2が文
        if not conclusion and is_sentence(h2):
            emit(lvl, 'H2が文', 'L%s: %s（H2は「ブランド名＋セクション名」の名詞句。答えは直下の「約束：」行とH3に書く）' % (g['ln'], h2))
        # B. 長さ
        if len(h2) > LEN_MAX:
            emit(lvl, 'H2が長い', 'L%s: %s（%d字。上限%d字）' % (g['ln'], h2, len(h2), LEN_MAX))
        lim = LEN_MAX_FAQ if FAQ_H2.search(h2) else LEN_MAX
        for x in h3:
            if len(x) > lim:
                emit(lvl, 'H3が長い', 'H2 %s の配下: %s（%d字。上限%d字。長い条件・理由は本文へ）' % (h2, x, len(x), lim))
            # C. 勧誘形（FAQの質問は「？」で終わるので当たらない）
            if INVITE_END.search(x) and not x.endswith(INVITE_PLAIN_VERBS):
                emit(lvl, 'H3が勧誘形', 'H2 %s の配下: %s（行動を勧めるH3は「〜確認する」「〜避ける」と言い切る）' % (h2, x))
            # D. 存在説明（H3）
            if EXISTENCE_END.search(x):
                emit(lvl, '存在説明の見出し', 'H2 %s の配下: %s（「〜がある」で終えず、読者が何を判断するかを直接書く）' % (h2, x))
        # D. 存在説明（H2）
        if EXISTENCE_END.search(h2):
            emit(lvl, '存在説明の見出し', 'L%s: %s（「〜がある」で終えず、読者が何を判断するかを直接書く）' % (g['ln'], h2))
        # E. H3がH2の語を繰り返す（常にWARN）
        for pat, words in REPEAT_WORDS:
            if pat.search(h2):
                rep = [x for x in h3 if any(w in x for w in words)]
                if rep:
                    print('WARN  [H3がH2の語を繰り返す] L%s: H2 %s の配下 %d本が「%s」を含む（例：%s）。H3は判断項目だけ書く'
                          % (g['ln'], h2, len(rep), '・'.join(words), rep[0]))
                break

    if not strict:
        print('INFO  [見出し形式] この構成に「見出し形式：H2抽象」の行が無いため、上の検査はWARNです（既存の構成。書き換えは不要）。'
              'これから作る構成は、メタ情報に「見出し形式：H2抽象」の行を入れる')
    if conclusion:
        print('INFO  [結論型] 結論型の構成のため、H2が文かどうかは検査していません（H2に答えを書いてよい）')


if __name__ == '__main__':
    main()
