#!/bin/bash
# lint-outline.sh — 構成案（outline.md）の見出しツリーを機械チェックする（ヤマダイ版）
# 使い方: bash scripts/lint-outline.sh "articles/{KW}/outline.md"
# 対象: 2形式に対応（2026-08-07 修正：旧形式のみ対応で新形式が0件のまま素通りしていたバグを修正）
#   (a) 旧形式：「H1 」「H2 」「　H3 」プレフィックス行＋「- タイトル：」行
#   (b) 新形式（pipeline.js実出力）：Markdown「# 」「## 」＋H2直下の箇条書き「- 」をH3相当として扱う。
#       「## カニバリ・差別化メモ」等のメタ節に入ったら箇条書きの拾い出しを止める（本文チェック対象外）。
#       新形式のタイトルは先頭の「# 」行から取る。
# ERROR 1件でも exit 1。提示前に ERROR 0 にする（kosei-sakusei SKILL.md ⚡標準フロー）。
set -u
export LC_ALL=en_US.UTF-8
FILE="${1:?使い方: bash scripts/lint-outline.sh <outline.mdのパス>}"
[ -f "$FILE" ] || { echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; }

ERR=0; WARN=0
err() { echo "ERROR [$1] L$2: $3"; ERR=$((ERR+1)); }
warn() { echo "WARN  [$1] L$2: $3"; WARN=$((WARN+1)); }

# 見出しツリー行（H1/H2/H3）を行番号付きで抽出し、新形式は「H1 」「H2 」「H3 」プレフィックスへ正規化する
extract_headings() {
  awk '
    BEGIN { in_meta = 0; sep = 0 }
    # 2026-09-09 修正：メタ節の切り落ちを「2つ目の --- 以降」に変えた。
    #   従来は節名の一致だけで、H1で書いたメタ節や一覧に無い節名（競合トピックの網羅チェック・
    #   訴求設計・数値の突合表・数字の決まり・外部FBの採否・Manabuさんに提起すること 等）を
    #   見出しとして検査していた。公開1163のoutlineでERROR 45件出ていたのはほぼ全部これ。
    #   check-coverage.py / check-kw-cooccurrence.py と同じ切り方に揃える。
    /^---[ \t]*$/ { sep++; if (sep >= 2) in_meta = 1; next }
    # 旧形式のドキュメントヘッダ・メタ行は見出しではないので除外（2026-09-09）
    #   例: 「# デリピックス ナッシュ 比較｜構成案（確定版）」「- タイトル：…」「- モード：C 新規（…）」
    /^#{1,3} .*(構成案|リサーチ|ファクト)/ { next }
    /^[-*] *(タイトル|メタ|メタ説明文|URL|URLスラッグ|サブKW|モード|記事の主役|★主役|約束)[:：]/ { next }
    /^H1 / { print NR":"$0; next }
    /^H2 / { print NR":"$0; next }
    /^[　 \t]*H3 / { print NR":"$0; next }
    # 保険：`---` を使っていない旧形式のために節名一致も残す（H1〜H3のどれでも効くようにした）
    /^#{1,3} *(カニバリ|差別化|口コミ素材|執筆時の要裏取り|要裏取り|構成上のメモ|変更操作|変更まとめ|FAQ|競合トピックの網羅|網羅チェック|訴求設計|数値の突合|数字の決まり|検証スクリプト|外部FB|Manabuさんに提起|分量の目標|本文に置く表|共起語の配置|提示前の3検査|音読で検出|Codexレビュー|Codex構成レビュー|5レンズ|使うショートコード|広告主)/ { in_meta = 1; next }
    /^### / { if (!in_meta) { line = $0; sub(/^### +/, "H3 ", line); print NR":"line }; next }
    /^## / { if (!in_meta) { line = $0; sub(/^## +/, "H2 ", line); print NR":"line }; next }
    /^# / { if (!in_meta) { line = $0; sub(/^# +/, "H1 ", line); print NR":"line }; next }
    /^[　 \t]*- / { if (!in_meta) { line = $0; sub(/^[　 \t]*- +/, "H3 ", line); print NR":"line } }
  ' "$FILE"
}

extract_headings | while IFS=: read -r LN TEXT; do
  H=$(echo "$TEXT" | sed -E 's/^[　[:space:]]*//')
  IS_H1=0; echo "$H" | grep -q '^H1 ' && IS_H1=1
  # 1. 見出し内のカッコ・記号（🚨4・§8-2）※！はH1（タイトル）のみ可（2026-07-02裁定）
  #    ⚠️ 2026-09-09 修正：「｜」を禁止対象から外した。
  #    禁じたいのは「見出しに補足を足して情報を詰め込むこと」であって、区切り記号そのものではない。
  #    「｜」は補足ではなく前後を対等につなぐ区切りで、公開記事で実際に10箇所使われている
  #    （例：「まとめ｜ヨシケイの一人暮らしはお試し5daysから始めよう」
  #      「包丁を減らして時短したい人｜カット済み食材のカットミール」）。記事タイトルにも4件。
  #    実運用と乖離したルールだったため削除した（Manabuさん指摘）。
  echo "$H" | grep -qE '（|）|【|】|※|★' && err "カッコ記号" "$LN" "$H"
  [ "$IS_H1" -eq 0 ] && echo "$H" | grep -qE '!|！' && err "感嘆符" "$LN" "$H"
  # 2. 疑問符（H1は可・H2/H3はFAQ質問H3「〜ですか？/ありますか？/ますか？」のみ許容・§10.2）
  if [ "$IS_H1" -eq 0 ] && echo "$H" | grep -q '？\|?'; then
    echo "$H" | grep -qE '(ですか？|ありますか？|ますか？)$' || err "疑問符" "$LN" "$H"
  fi
  # 2b. FAQ語尾の？漏れ（「〜ですか/ますか」で終わるのに？がない）
  echo "$H" | grep -qE '(ですか|ますか)$' && err "FAQ語尾" "$LN" "${H}（「〜ですか？」と全角？で締める）"
  # 3. AI臭ナンバリング「○つの」（writing-manual 付録：機械で落とす語）
  echo "$H" | grep -qE '([0-9]|１|２|３|４|５|６|７|８|９|一|二|三|四|五|六|七|八|九|十)つの' && err "○つの" "$LN" "$H"
  # 4. 冗長な動詞・連体修飾（🚨13・2026-07-02 FB）→ 最短形に
  echo "$H" | grep -qE 'に関するよくある質問|で気をつけたい|を頼んだ(良い|気になる)|を利用する際の' && err "冗長修飾" "$LN" "${H}（→「〜のよくある質問」「〜の注意点」「〜の良い口コミ」等の最短形に）"
  # 5. 単独で曖昧な名詞（🚨13）
  if echo "$H" | grep -q '定期' && ! echo "$H" | grep -qE '定期便|定期コース|定期宅配|定期購入'; then
    warn "曖昧名詞" "$LN" "${H}（「定期」→「定期便」等に具体化）"
  fi
  # 6. 業界語・硬語（writing-manual 付録：機械で落とす語・見出しでの使用）
  echo "$H" | grep -qE '実質単価|出資金|有無$|試算|向き不向き|シミュレーション|コスパ|割高感|定番品|都県|無料ライン|見合う|見返り' && err "硬語" "$LN" "$H"
  # 7. 口コミのメタ記述（2026-08-04 追加・学び48の拡張／同日 帰属表現を除外して再調整）
  #    禁じるのは「数量の主張」と「口コミを主語にした擬人化」。
  #    NG例: 〜と書く人が多い／〜と感じた人が多い／〜をほめている／〜に集まっています／〜という声が多い
  #    ⚠️ 「〜という声もある」「〜と感じた人もいる」は**帰属表現なので許容**（禁止しない）。
  #    ネガティブ評価の見出しは断定すると信用毀損リスクがあるため、むしろ帰属が必須（学び59）。
  echo "$H" | grep -qE '(人が多い|方が多い|声が多い|口コミが多い|と書く人|と書いて|ほめて|ほめる|評価する声|に集ま|を指して|に向けられ|挙がって|挙げている)' \
    && err "口コミのメタ記述" "$LN" "${H}（数量の主張と擬人化は禁止。肯定・中立は事実で言い切る。例：×メインのおかずをおいしいと書く人が多い → ○メインは肉や魚がしっかり入っていておいしい）"
  # 7b. ネガティブ評価の断定（2026-08-04 追加・学び59）
  #    商品を否定する評価を事実として断定すると信用毀損リスク。「〜という声もある」等で口コミに帰属させる。
  #    ※「まずい」等が鉤括弧つきの検索KW引用（例:「まずい」と検索される）の場合は対象外。
  HN=$(echo "$H" | sed -E 's/「[^」]*」//g')
  if [ "$IS_H1" -eq 0 ] && echo "$HN" | grep -qE '(まずい|おいしくない|が雑|雑に|当たり外れ|喉が渇く|物足りない|足りない|味が薄い|濃すぎ|期待した味とは違う|期待に届か)'; then
    echo "$H" | grep -qE '(声もある|人もいる|口コミもある|と言われる|と検索される|ですか？|おすすめ|と感じたら|によるところ)' \
      || err "ネガ断定" "$LN" "${H}（否定的な評価は断定せず「〜という声もある」「〜と感じた人もいる」と口コミに帰属させる・学び59）"
  fi
  # ※H1（タイトル）は7bの対象外。2026-07-02裁定でタイトルの「？」フックは許容済みで、
  #   「〜はまずい？」等の疑問形は断定ではなく問いかけのため信用毀損リスクが質的に異なる（2026-08-07修正）。
  # 11. 見出しの個数宣言と配下の実数の突合（2026-09-09 追加・学び97）
  #    「N種類」「N選」と書いたのに配下がN個そろっていない事故を防ぐ。
  #    2026-09-08「まごころケア食 口コミ」で H2「8種類のコース」の配下が7種類しかなかった
  #    （健康バランスが抜けていた）。Manabuさん指摘「というか一個コース足りてねえな」。
  #    ※ H2ごとの配下H3を数える必要があるため、実処理はファイル走査後（末尾）で行う。

  # 8. 「そりゃそうだろ」の空見出し（2026-08-04 追加・学び60）
  #    読めば誰でも分かる総括を見出しにしない。何がどうなのかを具体名で書く。
  echo "$H" | grep -qE '(で決まる|によって変わる|により変わる|で変わります|が大切|が重要|は人それぞれ|次第です|によって異なる|は様々|はさまざま)$' \
    && warn "空見出し" "$LN" "${H}（読めば分かる総括。何がどう違うのかを具体名で書く）"
  # 9. H2見出しの金額の詰め込み（2026-08-04 追加・学び61）
  #    実記事を実測した結果、H2に金額を1つ置くのは通常運用（らでぃっしゅ991「年会費は年1,100円」
  #    「初回お試しセットを1,980円で試せる」／コープデリ971「1食約885円〜で自炊より高め」）。
  #    読みにくくなるのは**金額を範囲で書く・2つ以上並べる**とき。そこだけを警告する。
  if echo "$H" | grep -q '^H2 '; then
    YEN=$(echo "$H" | grep -oE '[0-9０-９,，]+円' | wc -l | tr -d ' ')
    if echo "$H" | grep -qE '[0-9０-９,，]+〜[0-9０-９,，]+円'; then
      warn "H2の金額" "$LN" "${H}（金額の範囲はH3か表へ。H2は結論だけにする・学び61）"
    elif [ "${YEN:-0}" -ge 2 ]; then
      warn "H2の金額" "$LN" "${H}（H2に金額を2つ以上並べない。1つに絞るかH3へ移す・学び61）"
    fi
  fi
  # 10. 見出しの長さ（2026-08-04 追加・checklist-outline.md C群）
  #    実記事のH2は26〜31字。32字を超えたら詰め込みを疑う。H1（タイトル）は別基準なので除外。
  if [ "$IS_H1" -eq 0 ]; then
    BODY=$(echo "$H" | sed -E 's/^H[23] //')
    LEN=$(echo -n "$BODY" | python3 -c 'import sys;print(len(sys.stdin.read()))' 2>/dev/null || echo 0)
    [ "$LEN" -gt 32 ] && warn "見出しが長い" "$LN" "${H}（${LEN}字。実記事のH2は26〜31字。詰め込みを疑う）"
  fi
  # 12. 指示語（2026-09-09 追加・prohibited-words レイヤー1-a 完全禁止）
  #    ⚠️ 本文用 lint.sh には8件入っていたのに、構成用の本スクリプトには0件だった。
  #    「三ツ星ファーム 冷凍庫」で「7食のコースにこのプランはない」が素通りした。
  #    見出しは前後の文脈が無いので、本文以上に指示語が読めない。
  echo "$H" | grep -qE 'この' && ! echo "$H" | grep -qE 'この記事|この口コミ' \
    && err "指示語" "$LN" "${H}（「この」を具体名詞に。見出しは前後の文脈がないので指示語が読めない）"
  echo "$H" | grep -qE 'その' && ! echo "$H" | grep -qE 'そのまま|そのもの|そのため' \
    && err "指示語" "$LN" "${H}（「その」を具体名詞に）"
  echo "$H" | grep -qE 'これ(は|を|が|も|ら)' && ! echo "$H" | grep -qE 'これまで' \
    && err "指示語" "$LN" "${H}（「これ」を具体名詞に）"
  echo "$H" | grep -qE 'それ' && ! echo "$H" | grep -qE 'それぞれ|それでも|それなり|それとも' \
    && err "指示語" "$LN" "${H}（「それ」を具体名詞に）"
  echo "$H" | grep -qE 'こうした|そうした' \
    && err "指示語" "$LN" "${H}（「こうした/そうした」を具体名詞に）"

  # 13. 本文用 lint.sh にあって構成用に無かった禁止語（2026-09-09 移植）
  #    prohibited-words の登録語が、構成用スクリプトにだけ入っていなかった分。
  #    feedback_writing v4.2 の教訓「部分適用がそのまま素通りの穴になる」の再発。
  echo "$H" | grep -qE '迷う|迷い|迷って|迷わず|迷いやすい' && ! echo "$H" | grep -q '迷惑' \
    && err "カテゴリA" "$LN" "${H}（「迷う」は例外なしの全面禁止。不安を感じる／決めかねる／分かりにくい 等に）"
  echo "$H" | grep -qE 'ためら|躊躇' \
    && err "カテゴリA" "$LN" "${H}（「ためらう」は禁止。不安を感じる／決めかねる 等に）"
  echo "$H" | grep -qE '切り替え|切替' \
    && err "カテゴリA" "$LN" "${H}（「切り替える」→「変える」「変えられる」）"
  echo "$H" | grep -qE '差し替え|差替' \
    && err "カテゴリA" "$LN" "${H}（「差し替える」→「代わりに〜が届く」「〜に変わる」）"
  echo "$H" | grep -qE '対処' \
    && err "レイヤー2" "$LN" "${H}（「対処」→「避ける」「防ぐ」「やり方」）"
  echo "$H" | grep -qE '並びま|並びました|並んでいま|が並ぶ|並べま|並べた|並べると|並べて' \
    && warn "レイヤー2" "$LN" "${H}（「並ぶ/並べる」で列挙しない→「入っています」「届きます」）"
  echo "$H" | grep -qE '絞る|絞れば|絞れま|しぼって|絞られ' && ! echo "$H" | grep -qE '体を絞|絞り込' \
    && warn "レイヤー3" "$LN" "${H}（比喩の「絞る」→「減らす」「〜だけを扱う」）"
  echo "$H" | grep -qE '判断材料|検討材料|参考材料' \
    && err "レイヤー3" "$LN" "${H}（「材料」は比喩→「参考にしてください」「判断のヒント」）"
  # 16. 「約束」（2026-09-09 追加・Manabuさん「約束やめろ」）
  #     公開35記事のH2 307本に**0本**。誤検出しない。
  #     サービスとの契約条件を「約束」と書くと、誰と何を約束したのかが読者に伝わらない。
  #     「6回続けるのが条件」「合計6回以上が条件」のように条件として書く。
  echo "$H" | grep -qE '約束' \
    && err "カテゴリA" "$LN" "${H}（「約束」は誰と何をか伝わらない→「条件」「〜を続けると」に。公開記事のH2に0本）"
  # 21. 主語がモノなのに述語が読者の行動（2026-09-09 追加・Manabuさん指摘）
  #     実物: H2「気くばり御膳のお試しセットは4食3,300円で公式サイトから頼む」
  #           主語＝お試しセット（モノ）／述語＝頼む（読者の行動）でねじれている。
  #     直し方は2つ。可能形にする（頼める）か、体言止めにする。
  #     公開記事の見出し1206本で3本ヒット・誤検出0。3本とも同じねじれで直すべきもの。
  #     「は」の前が人（人・方・者・自分）なら読者が主語なので対象外。
  if echo "$H" | grep -q 'は'; then
    if echo "$H" | grep -qE '(頼む|申し込む|申込む|買う|試す|測る|払う|探す|注文する|解約する|確かめる|比べる)$'; then
      SUBJ="${H%は*}"
      echo "$SUBJ" | grep -qE '(人|方|者|自分|あなた|みなさん|家族|親)$' \
        || err "主語のねじれ" "$LN" "${H}（主語がモノなのに述語が読者の行動になっている。可能形にする（頼む→頼める）か体言止めにする）"
    fi
  fi

  # 19. 読者への行動指示で終わるH2（2026-09-09 追加・設計ワークフローS3）
  #     実物: H2⑤「注文の前にアプリでメニューの在庫を確かめておく」＝主語が無く誰の話か分からない。
  #     公開35記事のH2 307本に**0本**。誤検出しない。
  #     H2は結論を言い切る場所で、読者への指示は本文かまとめの役割（🚨2）。
  if echo "$H" | grep -q '^H2 '; then
    echo "$H" | grep -qE 'ておく$|ておこう$|ておきたい$' \
      && warn "行動指示のH2" "$LN" "${H}（H2が読者への指示で終わっている。主語が無く誰の話か分からない。事実を言い切る形にするか、指示は本文へ。公開記事のH2に0本）"
  fi
  echo "$H" | grep -qE '任せる|任せて' && ! echo "$H" | grep -qE '業者に任せ|人に任せ' \
    && warn "カテゴリA" "$LN" "${H}（サービスに「任せる」は人を雇う語感→「届けてもらう」「届く」）"

  # 11. H3に実数（金額・%・g等）を2つ以上（2026-08-04 追加・checklist-outline.md C群）
  #    「1食」「8食」「1回」等の単位表現は数えない。数えるのは 円・%・g・kcal の付いた実数だけ。
  #    2社の数字を1行に並べるのは表の仕事。見出しは結論を書く。
  if echo "$H" | grep -q '^H3 '; then
    FIG=$(echo "$H" | grep -oE '[0-9０-９][0-9０-９,，\.]*(円|%|％|g|kcal)' | wc -l | tr -d ' ')
    [ "${FIG:-0}" -ge 2 ] && warn "数値の詰め込み" "$LN" "${H}（実数${FIG}個。2社の数字を並べるのは表の仕事。見出しは結論だけにする）"
  fi
done > /tmp/lint-outline-body.$$ 2>&1
cat /tmp/lint-outline-body.$$
BODY_ERR=$(grep -c '^ERROR' /tmp/lint-outline-body.$$ || true)
BODY_WARN=$(grep -c '^WARN' /tmp/lint-outline-body.$$ || true)
rm -f /tmp/lint-outline-body.$$

# タイトル行のチェック（？・！は使用可＝2026-07-02裁定。年号・記号は不可）
# 旧形式「- タイトル：」を優先し、無ければ新形式（先頭の「# 」Markdown H1）にフォールバックする
TLINE=$(grep -nE '^\- タイトル：' "$FILE" | head -1)
if [ -n "$TLINE" ]; then
  LN="${TLINE%%:*}"; TITLE=$(echo "$TLINE" | sed -E 's/^[0-9]+:- タイトル：//')
else
  TLINE=$(grep -nE '^# ' "$FILE" | head -1)
  if [ -n "$TLINE" ]; then
    LN="${TLINE%%:*}"; TITLE=$(echo "$TLINE" | sed -E 's/^[0-9]+:# +//')
  fi
fi
if [ -n "${TITLE:-}" ]; then
  echo "$TITLE" | grep -qE '【?20[0-9]{2}' && { echo "ERROR [タイトル年号] L$LN: $TITLE"; BODY_ERR=$((BODY_ERR+1)); }
  # ⚠️ 2026-09-09：タイトルからも「｜」を除外した。公開記事のタイトルに4件の使用実績がある（学び96）
  echo "$TITLE" | grep -qE '【|】|※' && { echo "ERROR [タイトル記号] L$LN: $TITLE"; BODY_ERR=$((BODY_ERR+1)); }
  # 硬語（writing-manual 付録：機械で落とす語）はタイトルにも適用（2026-07-31「向き不向き」「シミュレーション」混入の再発防止）
  echo "$TITLE" | grep -qE '実質単価|出資金|試算|向き不向き|シミュレーション|コスパ|割高感|定番品|都県|無料ライン|見合う|見返り' && { echo "ERROR [タイトル硬語] L$LN: $TITLE"; BODY_ERR=$((BODY_ERR+1)); }
  TLEN=$(echo -n "$TITLE" | python3 -c 'import sys;print(len(sys.stdin.read()))' 2>/dev/null || echo 0)
  if [ "$TLEN" -gt 0 ] && { [ "$TLEN" -lt 30 ] || [ "$TLEN" -gt 48 ]; }; then
    echo "WARN  [タイトル字数] L$LN: ${TLEN}字（目安35〜45字）"; BODY_WARN=$((BODY_WARN+1))
  fi
fi

# --- チェック11の実処理：H2の個数宣言と配下の実数を突合（学び97） ---
#     数え方：H3に「｜」があれば右側を「・」で分割した項目数、なければ1件として数える。
#     （「数値をおさえたコース｜糖質制限食・塩分制限食」は2件と数える）
C11=$(extract_headings "$FILE" | awk -F: '
  function flush() {
    if (h2 != "" && want > 0 && got != want) {
      printf "ERROR [個数の不一致] L%d: %s（見出しは%d個と書いているが配下は%d件。数えて合わせる・学び97）\n", ln, h2, want, got
    }
  }
  {
    line = $0; sub(/^[0-9]+:/, "", line); n = $1
    if (line ~ /^H2 /) {
      flush()
      h2 = line; ln = n; got = 0; want = 0
      if (match(line, /[0-9]+(種類|選|つの)/)) {
        t = substr(line, RSTART, RLENGTH); gsub(/[^0-9]/, "", t); want = t + 0
      }
    } else if (line ~ /^H3 /) {
      body = line
      if (index(body, "｜") > 0) { body = substr(body, index(body, "｜") + length("｜")) }
      k = split(body, parts, "・")
      got += (k > 0 ? k : 1)
    }
  }
  END { flush() }
')
if [ -n "$C11" ]; then
  echo "$C11"
  BODY_ERR=$((BODY_ERR + $(printf "%s\n" "$C11" | grep -c '^ERROR')))
fi

# --- チェック14・15：H2ごとにH3を「束で」見る（2026-09-09 追加） ---
#     1行ずつ見ると違反にならないが、5本並べて初めて分かる冗長がある。
#     14: 同一H2配下のH3で末尾6文字が3本以上一致 → WARN
#     15: 口コミ/評判H2の配下で帰属表現が2本以上 → WARN（学び93。H2が帰属を担うので体言止めに）
#     除外は本文コメント参照。7bのネガ語を含むH3は帰属が必須なので15の対象から外す。
C1415=$(extract_headings "$FILE" | python3 -c '
import sys, re
from collections import defaultdict

SKIP_H2 = re.compile(r"よくある質問|向いている人|向いていない人|Q&A|よくある疑問")
ATTR = re.compile(r"という口コミもある|との声もある|という声もある|という口コミがある|という投稿もある|との口コミもある|という声がある")
# lint-outline.sh チェック7b のネガ語と同じ（体言止めにすると7bのERRORになるため15の対象外）
NEG = re.compile(r"まずい|おいしくない|が雑|雑に|当たり外れ|喉が渇く|物足りない|足りない|味が薄い|濃すぎ|期待した味とは違う|期待に届か")
LIMIT = re.compile(r"だけ|のみ|しか")
COND = re.compile(r"だと|なら|の場合|したとき|ときは")
OUTSIDE = re.compile(r"^通常|^普通|^普段|^基本|通常の|それ以外")
MADOGUCHI = ["電話", "アプリ", "LINE", "サイト", "メール", "マイページ", "フォーム", "店頭", "はがき"]
MULTI = re.compile(r"理由|メリット|デメリット|注意点|ポイント|選び方|違い|特徴|使い方|コツ")
SKIP_ZERO = re.compile(r"まとめ|よくある質問")

groups = []
cur = None
for raw in sys.stdin:
    raw = raw.rstrip("\n")
    if ":" not in raw:
        continue
    ln, line = raw.split(":", 1)
    line = line.strip()
    if line.startswith("H2 "):
        cur = {"ln": ln, "h2": line[3:].strip(), "h3": []}
        groups.append(cur)
    elif line.startswith("H3 ") and cur is not None:
        cur["h3"].append(line[3:].strip())

for g in groups:
    h3 = [h for h in g["h3"] if h]
    # 18. 複数項目を予告しているのにH3が0本（2026-09-09 追加）
    #     実物: H2「三ツ星ファームがやばいと言われる理由」にH3が0本。目次に1行しか出ない。
    #     SKILL.md 🚨2 は「書くべき別の事実が無いならH3は0本でよい」としているので一律には出さない。
    #     「理由」「メリット」「注意点」等の**複数項目を予告する語**があるときだけ出す。
    #     公開35記事のH2 307本中1本（0.3%）。ほぼ誤検出しない。
    if not h3 and MULTI.search(g["h2"]) and not SKIP_ZERO.search(g["h2"]):
        print("WARN  [予告とH3の不一致] L%s: H2 %s（「理由」「メリット」等で複数項目を予告しているのにH3が0本。目次に1行しか出ず網羅性が見えない。H3を立てるか見出しから予告語を外す）"
              % (g["ln"], g["h2"]))
    if len(h3) < 3 or SKIP_H2.search(g["h2"]):
        continue
    # 14. 末尾6文字の一致
    tails = defaultdict(list)
    for h in h3:
        tails[h[-6:]].append(h)
    for tail, hs in tails.items():
        if len(hs) >= 3:
            print("WARN  [語尾の連続] L%s: H2 %s（配下H3 %d本のうち %d本が「%s」で終わる。束で読むと冗長。語尾を分散させる）"
                  % (g["ln"], g["h2"], len(h3), len(hs), tail))
            break
    # 17. H2の限定・条件と、配下H3の「通常/それ以外」が噛み合っていない（2026-09-09 追加）
    #     実物: H2「…プランだと解約が電話だけになる」/ H3「通常のプランはアプリとLINEとサイトからやめられる」
    #     H2が特定の条件に限定しているのに、配下H3がその条件の**外側**を語っている。
    #     公開記事253セクションで0件。誤検出しない。
    if LIMIT.search(g["h2"]) or COND.search(g["h2"]):
        out = [h for h in h3 if OUTSIDE.search(h)]
        if out:
            print("WARN  [H2とH3の噛み合い] L%s: H2 %s（配下に「%s」があり、H2が限定した条件の外側を語っている。H2の主張とH3が逆を向いていないか確かめる）"
                  % (g["ln"], g["h2"], out[0]))

    # 20. 窓口を限定したH2なのに、配下H3が別の窓口を2つ以上挙げている（2026-09-09 追加・LOGIC-2）
    #     実物: H2「…解約が電話だけになる」/ 配下に アプリ・LINE・サイト・メール が出てくる。
    #     17（通常/それ以外）より語彙レベルで確実に当たる高信頼版。公開307本で0件。
    if LIMIT.search(g["h2"]):
        in_h2 = [m for m in MADOGUCHI if m in g["h2"]]
        if in_h2:
            others = [m for m in MADOGUCHI if m not in g["h2"] and any(m in x for x in h3)]
            if len(others) >= 2:
                print("ERROR [窓口の限定と矛盾] L%s: H2 %s（H2は「%s」に限定しているのに、配下H3が %s を挙げている。どちらが本当かを1つに決める）"
                      % (g["ln"], g["h2"], "・".join(in_h2), "・".join(others)))

    # 15. 帰属表現の重複（口コミ/評判H2のみ・ネガ語を含むH3は除外）
    if re.search(r"口コミ|評判|声", g["h2"]):
        attr = [h for h in h3 if ATTR.search(h) and not NEG.search(h)]
        if len(attr) >= 2:
            print("WARN  [帰属表現の重複] L%s: H2 %s（配下に帰属表現が%d本。H2が口コミだと示しているので体言止めにする・学び93。※ネガ語を含むH3は7bのため帰属が必須なので除外済み）"
                  % (g["ln"], g["h2"], len(attr)))
')
if [ -n "$C1415" ]; then
  echo "$C1415"
  BODY_WARN=$((BODY_WARN + $(printf "%s\n" "$C1415" | grep -c '^WARN')))
  BODY_ERR=$((BODY_ERR + $(printf "%s\n" "$C1415" | grep -c '^ERROR')))
fi

# --- H2は抽象・H3は具体（2026-10-02 新設・Manabuさん指示）---
#     「見出し形式：H2抽象」の行がある構成は ERROR、無い既存の構成は同じ内容を WARN で出す。詳細は outline-heading-shape.py
SHAPE=$(extract_headings "$FILE" | python3 "$(dirname "${BASH_SOURCE[0]}")/outline-heading-shape.py" "$FILE")
if [ -n "$SHAPE" ]; then
  echo "$SHAPE"
  BODY_WARN=$((BODY_WARN + $(printf "%s\n" "$SHAPE" | grep -c '^WARN')))
  BODY_ERR=$((BODY_ERR + $(printf "%s\n" "$SHAPE" | grep -c '^ERROR')))
fi

echo "---"
echo "lint-outline: ERROR=${BODY_ERR} WARN=${BODY_WARN}（ERRORは提示前に必ず修正・WARNは一読して判断）"

# --- INFO：止めないが必ず印字する4つの兆候（2026-09-09 追加・C）---
#     ERROR/WARN にはしない。**基準を置ける根拠が無いため。**
#     公開記事にも当たるが、それは「公開記事が正しい」証明にならない
#     （2026-09-09 Manabuさん「公開記事のクオリティに満足しているわけではない」）。
#     数える工程だけ用意して、判断は人がする。ERROR/WARN の集計には加えない。
extract_headings "$FILE" | python3 -c '
import sys, re
from collections import defaultdict

PARTICLE = re.compile(r"[はがのをにでとも]")
SKIP_ZERO = re.compile(r"まとめ|よくある質問")

h1 = ""
groups = []
cur = None
for raw in sys.stdin:
    raw = raw.rstrip("\n")
    if ":" not in raw:
        continue
    ln, line = raw.split(":", 1)
    line = line.strip()
    if line.startswith("H1 "):
        h1 = line[3:].strip()
    elif line.startswith("H2 "):
        cur = {"ln": ln, "h2": line[3:].strip(), "h3": []}
        groups.append(cur)
    elif line.startswith("H3 ") and cur is not None:
        cur["h3"].append(line[3:].strip())

if not groups:
    sys.exit(0)
h2s = [g["h2"] for g in groups]
out = []

# 1. H3が0本のH2（チェック18は「理由/メリット」等の予告語があるときだけ拾う。ここは残り全部）
zero = [g for g in groups if not [x for x in g["h3"] if x] and not SKIP_ZERO.search(g["h2"])]
if zero:
    out.append("INFO  [H3が0本] %d本 … %s"
               % (len(zero), " / ".join("L%s %s" % (g["ln"], g["h2"]) for g in zero[:4])))
    out.append("        SKILL.md 🚨2 は「書くべき別の事実が無ければ0本でよい」。目次に1行しか出ない点だけ確かめる")

# 2. 他の全H2にある語が、そのH2にだけ無い（ブランド名の抜け落ちを想定）
#    タイトルから3〜10字の部分文字列を作り、H2への出現数が最大のものを共通語とみなす。
if h1 and len(h2s) >= 5:
    best, best_n = "", 0
    for L in range(10, 2, -1):
        for i in range(len(h1) - L + 1):
            sub = h1[i:i + L]
            n = sum(1 for t in h2s if sub in t)
            if n > best_n:
                best, best_n = sub, n
    if best and best_n == len(h2s) - 1:
        miss = [g for g in groups if best not in g["h2"]]
        out.append("INFO  [共通語が1本だけ欠ける] 「%s」がH2 %d本中%d本にあり、L%s だけに無い … %s"
                   % (best, len(h2s), best_n, miss[0]["ln"], miss[0]["h2"]))
        out.append("        そのH2だけ記事の主題から外れていないか読む。外れていなければそのままでよい")

# 3. （2026-10-02 削除）「主語の助詞が無いH2」を名詞の羅列として疑うINFOは、H2を名詞句にする方針（outline-heading-shape.py）と逆を向くため外した。

# 4. H2配下のH3どうしの語彙の重なり（低いほど1つのH2に別の話が同居している疑い）
def bigrams(t):
    return set(t[i:i + 2] for i in range(len(t) - 1))
scores = []
for g in groups:
    h3 = [x for x in g["h3"] if len(x) >= 4]
    if len(h3) < 2:
        continue
    sets = [bigrams(x) for x in h3]
    pair, tot = 0, 0
    for i in range(len(sets)):
        for j in range(i + 1, len(sets)):
            u = sets[i] | sets[j]
            if u:
                pair += len(sets[i] & sets[j]) / len(u)
                tot += 1
    if tot:
        scores.append((pair / tot, g))
if scores:
    scores.sort()
    med = scores[len(scores) // 2][0]
    lo = scores[0]
    out.append("INFO  [H3どうしの語彙の重なり] 中央値 %.3f ／ 最も低いのは L%s %s（%.3f）"
               % (med, lo[1]["ln"], lo[1]["h2"], lo[0]))
    out.append("        0に近いH2は別の話が同居している疑い。ただし公開記事の中央値も0.000で、これ単独では判定できない")

if out:
    print("")
    print("── INFO（止めない・基準は置かない・判断は人がする）──")
    for line in out:
        print(line)
'


# 機械で見られない項目を毎回その場に出す（2026-08-05）
# 背景: checklist-outline.md を作った直後の出力で開き忘れ、同じ型の指摘が再発した。
# 「開くと決める」では守られないので、lintの出力に混ぜて必ず目に入るようにする。
cat <<'CHECKLIST'

── ここからは機械では見られない。提示前に全見出しへ1本ずつ当てる ──
  □ タイトルが疑問形なら、H2①がその疑問への回答になっているか（学び70）
  □ H1とH2①が同じことを言っていないか（三重掲載）
  □ 各H2の約束に、配下H3が全部答えているか
  □ H3が2本しか立たないH2を作っていないか（学び68）
  □ 1つの見出しに主語（ブランド名）を2つ以上入れていないか
  □ ブランド名が全H2に入っていないか（目安はH2の半分以下）
  □ 1見出しで満たすルールは2つまでか（結論 > 平易さ > KW・学び62）
  □ 中学生が一読で像が浮かぶか。声に出して読んだか
  □ 同じ語尾が3連続していないか／32字を超えていないか
  □ H2だけを上から読んで記事の筋が通るか
  □ 並走記事・既存公開記事とH3単位で突合したか（H2だけ見ると見逃す・学び73）
  □ まとめH2が並走記事のまとめと酷似していないか（check-cannibalは公開記事しか見ない）
  □ 条件付きの有利な数値を無条件で出していないか（学び74）
  □ 全数値を別経路で独立再計算して突合したか。食品は軽減税率8%
詳細は .claude/rules/checklist-outline.md
CHECKLIST

[ "$BODY_ERR" -eq 0 ] || exit 1
exit 0
