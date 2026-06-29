#!/bin/bash
# lint.sh v3.0 — ヤマダイ記事用 機械チェッカー
# 使用法: bash scripts/lint.sh articles/{KW}-article.html
#
# v3.0変更点（2026-04-24）:
#   - 「こと」「〜しましょう」チェックを削除（OK化）
#   - 禁止語レイヤー4〜14のパターンを追加
#   - 1文60字超の検出を追加
#   - 一文一改行チェックを追加
#   - 景表法セーフ変換10パターンの検出を追加
#   - 出典URL併記の形式チェックを追加
#   - 知恵袋引用検出を追加
#
# v2の機能は維持:
#   - サービス紹介テーブル5行チェック
#   - 訴求社CTA直前strong / 非訴求社CTA直前strong検査
#   - 頻出表現カウント
#   - 書き出しパターン単調チェック
#   - strong締めパターン集計
#   - H3の箇条書き/テーブル含有率

set -uo pipefail

FILE="$1"
if [[ ! -f "$FILE" ]]; then echo "ERROR: ファイルが見つかりません: $FILE"; exit 1; fi

# === カウンター: 追記式（サブシェル対策・macOS bash 3.x対応） ===
ERR_FILE=$(mktemp)
WARN_FILE=$(mktemp)
: > "$ERR_FILE"
: > "$WARN_FILE"
trap "rm -f $ERR_FILE $WARN_FILE" EXIT

error() {
  echo "ERROR: $1"
  echo "E" >> "$ERR_FILE"
}
warning() {
  echo "WARNING: $1"
  echo "W" >> "$WARN_FILE"
}

echo "=== lint.sh v3.0 ヤマダイ記事チェック ==="
echo "対象: $FILE"
echo ""

# ============================================
# 1. 表記揺れ・冗長表現（カテゴリF）
# ============================================
echo "--- 表記揺れ ---"
for P in "様々" "行なう" "行なっ" "是非" "下さい" "頂く" "頂き" "致します"; do
  grep -n "$P" "$FILE" | while read -r l; do error "変換必須「$P」: $l"; done || true
done

# ============================================
# 2. AI表現レイヤー2（prohibited-words.md）
# ============================================
echo "--- AI表現 レイヤー2 ---"
for P in "大きな魅力" "充実しています" "ぴったりの" "ぴったりです" "ぴったりな" "への第一歩" "を両立" "の強みです" "魅力のひとつ" "仕上がり" "仕上げられ" "選ばれています" "把握しておけば" "リスクを減らせ" "OKです" "代表です" "代表格" "払拭" "疑問視" "レストラン品質" "手作りした" "手作りの" "候補です" "選択肢に入" "試してほしい" "さまざまなメリット" "多くのメリット"; do
  grep -n "$P" "$FILE" | while read -r l; do error "AI表現「$P」: $l"; done || true
done

# ============================================
# 3. AI表現レイヤー4（文末・文型定型）
# ============================================
echo "--- AI表現 レイヤー4（文末・文型定型） ---"
for P in "と言えるでしょう" "と言っても過言" "に他なりません" "と考えられます" "と思われます" "と言っても良い" "してみてはいかがでしょう" "しておきましょう" "といいです" "ためです。"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "レイヤー4「$P」要確認: $l"; done || true
done

# ============================================
# 4. AI表現レイヤー5（導入・結論定型）
# ============================================
echo "--- AI表現 レイヤー5（導入・結論定型） ---"
for P in "本記事" "いかがでしたでしょうか" "いかがでしたか" "参考になれば幸い" "お役に立てれば" "一助となれば" "最後までお読みいただき"; do
  grep -n "$P" "$FILE" | while read -r l; do error "レイヤー5「$P」: $l"; done || true
done

# ============================================
# 5. AI表現レイヤー6（訴求・推奨）
# ============================================
echo "--- AI表現 レイヤー6（訴求・推奨） ---"
for P in "に最適" "理想的な" "を叶え" "をかなえ" "を実現" "をサポート" "に応えてくれ" "を提供してくれ" "注目を集め" "話題となって" "人気を集め" "高い評価を得" "信頼されて"; do
  grep -n "$P" "$FILE" | while read -r l; do error "レイヤー6「$P」: $l"; done || true
done

# ============================================
# 6. AI表現レイヤー7-A（抽象形容詞・副詞）
# ============================================
echo "--- AI表現 レイヤー7-A（抽象形容詞） ---"
for P in "多種多様" "さまざまな" "多岐にわたる" "豊富な" "数多くの" "充実した" "快適な" "スムーズ" "円滑な" "シームレス" "的確に" "適切に" "バランスよく" "総合的に"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "レイヤー7-A「$P」要確認（多用回避）: $l"; done || true
done

# ============================================
# 7. AI表現レイヤー9（比喩・イディオム拡張）
# ============================================
echo "--- AI表現 レイヤー9（比喩・イディオム拡張） ---"
for P in "カギを握る" "決め手となる" "分岐点" "起爆剤" "切り札" "追い風" "後押し" "足がかり" "橋渡し" "足を踏み入れ" "光を当て" "スポットライト" "一石を投じる" "風穴を開け" "道を切り拓" "扉を開く" "地盤を固め" "土台となる"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "レイヤー9「$P」要確認: $l"; done || true
done

# ============================================
# 8. AI表現レイヤー11（視点・観点常套句）
# ============================================
echo "--- AI表現 レイヤー11（視点・観点） ---"
for P in "という点において" "という観点" "という視点" "の側面から" "の観点から言え" "の立場から見" "を踏まえると"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "レイヤー11「$P」要確認: $l"; done || true
done

# ============================================
# 9. AI表現レイヤー12（列挙・構造化定型）
# ============================================
echo "--- AI表現 レイヤー12（列挙・構造化） ---"
for P in "以下で詳しく解説" "順に見ていきましょう" "一つずつ見ていき"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "レイヤー12「$P」要確認: $l"; done || true
done

# ============================================
# 10. AI表現レイヤー14（背中押し・着地フレーズ）
# ============================================
echo "--- AI表現 レイヤー14（背中押し） ---"
for P in "後悔のない選択" "失敗しないために" "賢い選択" "一歩踏み出して" "今こそ" "理想の.*を手に入れ"; do
  grep -nE "$P" "$FILE" | while read -r l; do warning "レイヤー14「$P」要確認: $l"; done || true
done

# ============================================
# 11. AI臭いナンバリング
# ============================================
echo "--- AI臭いナンバリング ---"
for P in "[0-9]つのポイント" "[0-9]つのメリット" "[0-9]つの注意点" "[0-9]つの特徴" "[0-9]点を" "[0-9]点に"; do
  grep -nE "$P" "$FILE" | while read -r l; do error "AI臭いナンバリング: $l"; done || true
done

# ============================================
# 12. 比喩表現（レイヤー3）
# ============================================
echo "--- 比喩表現 ---"
for P in "跳ね上が" "ふくらむ" "広がる" "広がり" "近づく" "近づけ" "絞られ" "狭まる" "かみ合" "目を向け" "分かれ目" "道が開け" "判断材料" "検討材料" "参考材料" "材料にして" "材料として"; do
  grep -n "$P" "$FILE" | while read -r l; do error "比喩「$P」: $l"; done || true
done

# ============================================
# 13. 後述系（カテゴリB）
# ============================================
for P in "後ほど紹介" "前述の通り" "上記で触れ"; do
  grep -n "$P" "$FILE" | while read -r l; do error "後述系: $l"; done || true
done

# ============================================
# 14. 冗長表現（レイヤー1）
# ============================================
echo "--- 冗長表現 ---"
grep -n "という" "$FILE" | while read -r l; do warning "「という」要確認（できれば具体的に）: $l"; done || true
grep -n "といった" "$FILE" | while read -r l; do warning "「といった」要確認（できれば「〜や〜など」に）: $l"; done || true
grep -n "として" "$FILE" | while read -r l; do warning "「として」要確認: $l"; done || true
grep -n "することができます" "$FILE" | while read -r l; do error "冗長「することができます」: $l"; done || true

# ============================================
# 15. 指示語（レイヤー1）
# ============================================
echo "--- 指示語（口コミ除外・ERROR） ---"
# 口コミ(blockquote)内は原文ママで改変できないため、本文のみを対象にする(行番号は保持するため空行で潰す)
BODY=$(awk '/<blockquote/{inbq=1} {if(inbq) print ""; else print} /<\/blockquote>/{inbq=0}' "$FILE")
echo "$BODY" | grep -n "この" | grep -v "この記事\|この口コミ" | while read -r l; do error "指示語「この」(具体名詞に。例外:この記事では/この口コミ): $l"; done || true
echo "$BODY" | grep -n "その" | grep -v "そのまま\|そのもの\|そのため" | while read -r l; do error "指示語「その」(具体名詞に): $l"; done || true
echo "$BODY" | grep -n "これ[はをがも]" | while read -r l; do error "指示語「これ」(具体名詞に): $l"; done || true
echo "$BODY" | grep -n "それ" | grep -v "それぞれ\|それでも\|それなり\|それとも" | while read -r l; do error "指示語「それ」(具体名詞に): $l"; done || true
echo "$BODY" | grep -n "こうした\|そうした" | while read -r l; do error "指示語「こうした/そうした」(具体名詞に): $l"; done || true

# ============================================
# 15b. 無責任系語尾（口コミ除外・ERROR）
# ============================================
echo "--- 無責任系語尾 ---"
for P in "とされています" "とされている" "ようです" "案内されて" "とのことです" "とのこと" "と思われます" "と見られます"; do
  echo "$BODY" | grep -n "$P" | while read -r l; do error "無責任系語尾「$P」(事実は言い切る): $l"; done || true
done

# ============================================
# 15c. 見出し(H2/H3)内の（）（ERROR）
# ============================================
echo "--- 見出し内の（） ---"
grep -n "<h2>[^<]*（\|<h3>[^<]*（" "$FILE" | while read -r l; do error "見出しに（）: $l"; done || true

# ============================================
# 15d. 強調用「」（WARNING・会話/固有名詞/口コミは誤検出しやすい）
# ============================================
echo "--- 強調用「」 ---"
echo "$BODY" | grep -n "「" | while read -r l; do warning "「」使用（会話・固有名詞以外なら削除）: $l"; done || true

# ============================================
# 16. 記号・HTML（UTF-8対応）
# ============================================
echo "--- 記号・HTML ---"
LC_ALL=C.UTF-8 grep -nP '<h2>.*[【】]' "$FILE" | while read -r l; do error "H2に【】: $l"; done || true
grep -n "!" "$FILE" | grep -v "href\|class\|src\|alt\|style\|rel\|target\|<" | while read -r l; do warning "半角!: $l"; done || true
grep -n "<li>.*。</li>" "$FILE" | while read -r l; do error "li内に句点: $l"; done || true
grep -n "<tr><tr>\|<td><td>" "$FILE" | while read -r l; do error "タグ二重: $l"; done || true

# ============================================
# 17. CTA（shortcodes準拠）
# ============================================
echo "--- CTA ---"
grep -n "\[btn " "$FILE" | grep -v 'rel="nofollow"' | while read -r l; do
  # 訴求社でPost Snippets未登録の場合（rel="nofollow"なし）はスキップ、それ以外はエラー
  warning "btnにnofollow無（訴求社でPost Snippets未登録の場合のみOK）: $l"
done || true
grep -n "\[btn " "$FILE" | grep -v 'class="raised main-bc strong"' | while read -r l; do error "btnのclass不正: $l"; done || true
grep -n "gad_campaignid\|gbraid\|gclid" "$FILE" | while read -r l; do error "Googleパラメータ: $l"; done || true

# ============================================
# 18. 追加NG表現（v4.0強化）
# ============================================
echo "--- 追加NG ---"
grep -n "あなた" "$FILE" | while read -r l; do error "「あなた」: $l"; done || true
grep -n "かどうかを" "$FILE" | while read -r l; do warning "間接疑問文: $l"; done || true
grep -n "知恵袋\|Yahoo知恵袋\|2ch\|5ch" "$FILE" | while read -r l; do error "外部情報源引用: $l"; done || true

# ============================================
# 19. 内部リンク誘導文
# ============================================
grep -n "参考にしてみてください\|詳しく知りたい方は" "$FILE" | while read -r l; do error "内部リンク誘導文: $l"; done || true

# ============================================
# 20. FAQ番号プレフィックス
# ============================================
grep -n "質問[0-9]\|Q[0-9]" "$FILE" | while read -r l; do error "FAQ番号: $l"; done || true

# ============================================
# 20b. ヤマダイ固有カテゴリA：硬い漢語・読者に伝わらない表現（2026-05新規）
# ============================================
echo ""
echo "--- カテゴリA：硬い漢語・読者に伝わらない表現 ---"
for P in "実質単価" "実質[0-9]" "圧迫" "ぎゅうぎゅう" "占有" "家庭の食材" "タイプ別の" "観点別の" "ポイント別の" "用途別の" "選択型" "コース型" "設定です" "仕組みで" "仕組みです" "構成で" "構成です" "手がけ" "手掛け" "揃えてい" "揃えた" "ノウハウ" "知見" "休息" "事態" "均等化" "リラックスの機会" "落とし穴" "最大の特徴は" "掲げ" "基本です" "見極め" "リーフレット" "解放" "備え" "左右"; do
  grep -n "$P" "$FILE" | while read -r l; do error "カテゴリA「$P」: $l"; done || true
done
# 「設計です」は「献立設計」を除いて検出
grep -n "設計です" "$FILE" | grep -v "献立設計" | while read -r l; do error "カテゴリA「設計です」: $l"; done || true
# 「有無」はテーブル行を除いて検出
grep -n "有無" "$FILE" | grep -v "<th\|<td" | while read -r l; do error "カテゴリA「有無」: $l"; done || true
# 「よね」（〜ですよね・〜ますよね）
grep -n "よね[。、]" "$FILE" | while read -r l; do warning "「よね」要確認（共感文では可）: $l"; done || true

# ============================================
# 21. ヤマダイ固有 - テーブル5行チェック
# ============================================
echo ""
echo "--- ヤマダイ固有チェック ---"

TABLE_IDX=0
IN_TABLE=0
TR_COUNT=0
IS_SERVICE_TABLE=0
while IFS= read -r line; do
  if echo "$line" | grep -q "<table"; then
    IN_TABLE=1; TR_COUNT=0; IS_SERVICE_TABLE=0; ((TABLE_IDX++))
  fi
  if [[ "$IN_TABLE" -eq 1 ]]; then
    echo "$line" | grep -q "25.8158%" && IS_SERVICE_TABLE=1
    echo "$line" | grep -q "<tr>" && ((TR_COUNT++))
    if echo "$line" | grep -q "</table>"; then
      IN_TABLE=0
      if [[ "$IS_SERVICE_TABLE" -eq 1 && "$TR_COUNT" -ne 5 && "$TR_COUNT" -gt 0 ]]; then
        error "サービステーブル(#${TABLE_IDX})の行数が${TR_COUNT}行（5行固定のはず）"
      fi
    fi
  fi
done < "$FILE"

# ============================================
# 21b. _tableショートコード未使用検出（2026-05新規）
# ============================================
echo ""
echo "--- _tableショートコード未使用検出 ---"
for SC in '\[Oisix\]' '\[ヨシケイ\]' '\[ラディッシュボーヤ\]' '\[コープデリ\]' '\[Dr\.ツルガメキッチン\]' '\[筋肉食堂DELI\]' '\[watamidirect\]' '\[Meals\]' '\[タイヘイ\]' '\[ワタミ\]'; do
  SC_NAME=$(echo "$SC" | tr -d '\\[]')
  CTA_LINE=$(grep -n "$SC" "$FILE" | head -1 | cut -d: -f1)
  if [[ -n "$CTA_LINE" && "$CTA_LINE" -gt 5 ]]; then
    # CTA行の20行前から該当H3直下の_tableショートコード使用を確認
    START=$(( CTA_LINE - 30 < 1 ? 1 : CTA_LINE - 30 ))
    SECTION=$(sed -n "${START},${CTA_LINE}p" "$FILE")
    # 同セクション内に_tableショートコードがなく、かつ25.8158%テーブルがある場合 → ERROR
    if echo "$SECTION" | grep -qE '_table\]'; then
      :  # _tableが使われている、OK
    elif echo "$SECTION" | grep -q "25.8158%"; then
      # _tableが未使用なのにサービス紹介テーブルが直書き → ERROR
      error "サービス [${SC_NAME}] で画像＋テーブルが直書きされています。[${SC_NAME%]*}_table] ショートコードに置き換えてください（${CTA_LINE}行目付近）"
    fi
  fi
done

# ============================================
# 21c. サービス紹介H3の_table / ジャンプリンク機械チェック（2026-06新規）
# ============================================
echo ""
echo "--- サービス紹介H3の_table / ジャンプリンク ---"

# (1) ジャンプリンク整合: href="#X" に対応する id="X" があるか
grep -oE 'href="#[^"]+"' "$FILE" | sed -E 's/.*#([^"]+)".*/\1/' | sort -u | while read -r ANCHOR; do
  [ -z "$ANCHOR" ] && continue
  if ! grep -q "id=\"${ANCHOR}\"" "$FILE"; then
    error "ジャンプリンク先 #${ANCHOR} に対応する id 属性がない"
  fi
done || true

# (2) id付きH3（サービス紹介H3）は直下に [○○_table] / <table> / <img> のいずれかが必須
awk '
  function flush(){ if(inblock && !has) print hdr; inblock=0 }
  /<h3[^>]*id=/ { flush(); inblock=1; has=0; hdr=NR": "$0; next }
  /<h2|<h3/ { flush() }
  inblock && (/_table\]/ || /<table/ || /<img/) { has=1 }
  END { flush() }
' "$FILE" | while read -r MISS; do
  error "サービス紹介H3に_table/テーブル/画像がない（${MISS}）。[サービス名_table]をH3直下に置く"
done || true

# ============================================
# 22.（廃止）訴求社CTA直前strongチェック — 2026-06ルール改定で撤廃
#     strong価格訴求文は任意。具体的な価格・割引があるときのみ配置し、
#     「割引価格で用意されています」等の情報の薄い決まり文句は置かない。
#     strongを強制しないため、欠如チェックは行わない。
# ============================================

# ============================================
# 23. 非訴求社CTA直前にstrongがないことを確認
# ============================================
grep -n "\[btn " "$FILE" | while read -r line; do
  BTN_LINE=$(echo "$line" | cut -d: -f1)
  PREV_LINE=$((BTN_LINE - 1))
  PREV_CONTENT=$(sed -n "${PREV_LINE}p" "$FILE")
  if echo "$PREV_CONTENT" | grep -q "<strong>"; then
    warning "非訴求社CTA直前にstrongがある（不要）: ${BTN_LINE}行目付近"
  fi
done || true

# ============================================
# 24. olリストとH3の一致チェック
# ============================================
grep -oP '(?<=<li>).*?(?=</li>)' "$FILE" 2>/dev/null | while read -r li_text; do
  li_clean=$(echo "$li_text" | sed 's/^[0-9]*\.\s*//')
  if ! grep -q "<h3[^>]*>.*${li_clean}" "$FILE" 2>/dev/null; then
    warning "olリストの「${li_text}」に対応するH3が見つからない"
  fi
done || true

# ============================================
# 25. 体言止めチェック
# ============================================
grep -nE "を実施。|に対応。|を実現。|を提供。" "$FILE" | while read -r l; do error "体言止め: $l"; done || true

# ============================================
# 26. 「〜い。」で終わるアドバイス文
# ============================================
grep -n "[やすにくほし]い。" "$FILE" | grep -v "<\|>\|\[" | while read -r l; do warning "「〜い。」で終わるアドバイス文: $l"; done || true

# ============================================
# 27. strongタグの過剰使用（1行に2箇所以上）
# ============================================
LINE_NUM=0
while IFS= read -r line; do
  ((LINE_NUM++))
  STRONG_COUNT=$(echo "$line" | grep -o "<strong>" | wc -l)
  if [[ "$STRONG_COUNT" -ge 2 ]]; then
    error "1行にstrongが${STRONG_COUNT}箇所: ${LINE_NUM}行目"
  fi
done < "$FILE"

# ============================================
# 28. 1文60字超のチェック（v4.0 新規）
# ============================================
echo ""
echo "--- 1文60字チェック（v4.0新規） ---"
LINE_NUM=0
while IFS= read -r line; do
  ((LINE_NUM++))
  # HTMLタグ・空行・見出し行・ショートコード行・テーブル行はスキップ
  if echo "$line" | grep -qE "^<|^\[|^$|<h[1-6]>|<table|<tr|<td|<th|<ul|<ol|<li"; then
    continue
  fi
  # 「。」で分割して60字超をチェック
  echo "$line" | tr '。' '\n' | while read -r sentence; do
    # HTMLタグを除去してから文字数カウント
    clean=$(echo "$sentence" | sed 's/<[^>]*>//g')
    len=$(echo -n "$clean" | wc -m)
    if [[ "$len" -gt 60 ]]; then
      warning "1文60字超（${len}字）: ${LINE_NUM}行目: ${clean:0:60}..."
    fi
  done
done < "$FILE"

# ============================================
# 29. 法令セーフ変換10パターンのチェック（v4.0 新規）
# ============================================
echo ""
echo "--- 法令セーフ変換チェック（v4.0新規） ---"
for P in "管理栄養士が監修" "専門医の指導のもと" "栄養バランスの整った食事がとれ" "初回半額" "制限食" "食事制限向け" "国産食材100" "無添加" "ダイエット向け" "筋力アップ向け" "レストラン品質" "一流シェフ" "全額返金保証"; do
  grep -n "$P" "$FILE" | while read -r l; do error "法令セーフ変換未適用「$P」: $l"; done || true
done

# 「〇〇%OFF」単独（条件併記がない可能性）
grep -nE "[0-9]+%OFF" "$FILE" | while read -r l; do
  if ! echo "$l" | grep -qE "条件|定期|対象|公式"; then
    warning "「%OFF」に条件併記がない可能性: $l"
  fi
done || true

# 「送料無料」単独（条件併記がない可能性）
grep -n "送料無料" "$FILE" | while read -r l; do
  if ! echo "$l" | grep -qE "条件|定期|対象|公式"; then
    warning "「送料無料」に条件併記がない可能性: $l"
  fi
done || true

# ============================================
# 30. 出典URL併記チェック（v4.0 新規）
# ============================================
echo ""
echo "--- 出典URL併記チェック（v4.0新規） ---"
# 数値（円・食・人・%等）を含む行で[出典名](URL)形式がない場合を検出
grep -nE "[0-9]+(円|食|人|%|万|件|年|ヶ月|か月|%OFF)" "$FILE" | grep -v "<table\|<tr\|<td\|<th" | while read -r l; do
  if ! echo "$l" | grep -qE "\[.+\]\(https?://"; then
    warning "数値に出典URL併記がない可能性: $l"
  fi
done || true

# ============================================
# 30b. ul前の誘導文チェック（2026-05新規）
# ============================================
echo ""
echo "--- ul前の誘導文チェック ---"
PREV_LINE_CONTENT=""
LINE_NUM=0
while IFS= read -r line; do
  ((LINE_NUM++))
  if echo "$line" | grep -q "^<ul>"; then
    CLEAN_PREV=$(echo "$PREV_LINE_CONTENT" | sed 's/^[[:space:]]*//')
    if [[ -z "$CLEAN_PREV" || "$CLEAN_PREV" == "" ]]; then
      warning "ul前に誘導文がない: ${LINE_NUM}行目（任意・自然な導入文で代替可）"
    fi
  fi
  PREV_LINE_CONTENT="$line"
done < "$FILE"

# ============================================
# 30c. strong締めの品質チェック（2026-05新規）
# ============================================
echo ""
echo "--- strong締めの品質チェック ---"
for P in "公式サイトで確認してから申し込めば" "想定外の出費を避けられます" "安心して利用できます" "後悔せずに済みます" "不満が残らずに済みます" "失敗を防げます。</strong>"; do
  grep -n "$P" "$FILE" | while read -r l; do warning "情報ゼロのstrong締め候補: $l"; done || true
done

# ============================================
# 30d. 誘導文の重複チェック（2026-05新規）
# ============================================
echo ""
echo "--- 誘導文の重複チェック ---"
for P in "まとめました" "次の通りです" "以下の通りです" "下記の通りです"; do
  COUNT=$(grep -c "$P" "$FILE" || echo 0)
  if [[ "$COUNT" -ge 3 ]]; then
    warning "誘導文「${P}」が${COUNT}回出現（3回以上は分散させる）"
  fi
done

# ============================================
# 31. H2情報
# ============================================
H2_COUNT=$(grep -c "<h2>" "$FILE" || echo 0)
IMG_COUNT=$(grep -c '<img ' "$FILE" || echo 0)
echo "  H2数: ${H2_COUNT} / imgタグ数: ${IMG_COUNT}"

# ============================================
# 32. 頻出表現の自動カウント
# ============================================
echo ""
echo "--- 頻出表現チェック ---"
for PHRASE in "に合わせて選べます" "に向いています" "で安心" "が魅力です" "に定評があります" "を楽しめます" "が特徴です" "で届きます" "気軽に始められます"; do
  COUNT=$(grep -c "$PHRASE" "$FILE" 2>/dev/null || true)
  COUNT=${COUNT:-0}; COUNT=$(echo "$COUNT" | head -1 | tr -d '[:space:]')
  if [[ "$COUNT" -ge 3 ]]; then
    warning "「${PHRASE}」が${COUNT}回出現（3回以上は分散させる）"
  fi
done

# 条件付き許容レイヤー7-B（3回以上で警告）
for PHRASE in "あらゆる" "効率的に" "効率的な" "効果的に" "効果的な" "トータルで"; do
  COUNT=$(grep -c "$PHRASE" "$FILE" 2>/dev/null || true)
  COUNT=${COUNT:-0}; COUNT=$(echo "$COUNT" | head -1 | tr -d '[:space:]')
  if [[ "$COUNT" -ge 3 ]]; then
    warning "「${PHRASE}」が${COUNT}回出現（条件付き許容・3回以上で警告）"
  fi
done

# ============================================
# 33. サービス紹介の書き出しパターン単調チェック
# ============================================
echo ""
echo "--- 書き出しパターンチェック ---"
PATTERN_A=$(grep -c "宅配弁当です。</strong>" "$FILE" 2>/dev/null || echo 0)
PATTERN_A=$(echo "$PATTERN_A" | head -1 | tr -d '[:space:]'); PATTERN_A=${PATTERN_A:-0}
PATTERN_B=$(grep -c "サービスです。</strong>" "$FILE" 2>/dev/null || echo 0)
PATTERN_B=$(echo "$PATTERN_B" | head -1 | tr -d '[:space:]'); PATTERN_B=${PATTERN_B:-0}
TOTAL_SERVICES=$(grep -c '<h3 id=' "$FILE" 2>/dev/null || echo 0)
TOTAL_SERVICES=$(echo "$TOTAL_SERVICES" | head -1 | tr -d '[:space:]'); TOTAL_SERVICES=${TOTAL_SERVICES:-0}
if [[ "$TOTAL_SERVICES" -gt 0 ]]; then
  DOMINANT=$(( PATTERN_A > PATTERN_B ? PATTERN_A : PATTERN_B ))
  RATIO=$(( DOMINANT * 100 / TOTAL_SERVICES ))
  if [[ "$RATIO" -gt 60 ]]; then
    warning "サービス紹介の書き出しが${DOMINANT}/${TOTAL_SERVICES}社で同じパターン（60%超）"
  fi
  echo "  書き出し「〜宅配弁当です。」: ${PATTERN_A}社 / 「〜サービスです。」: ${PATTERN_B}社 / 全${TOTAL_SERVICES}社"
fi

# ============================================
# 34. strong締めのパターン集計
# ============================================
echo ""
echo "--- strong締めパターンチェック ---"
STRONG_FUSEGE=$(grep -c "防げます。</strong>" "$FILE" 2>/dev/null || echo 0)
STRONG_FUSEGE=$(echo "$STRONG_FUSEGE" | head -1 | tr -d '[:space:]'); STRONG_FUSEGE=${STRONG_FUSEGE:-0}
STRONG_DEKI=$(grep -c "できます。</strong>" "$FILE" 2>/dev/null || echo 0)
STRONG_DEKI=$(echo "$STRONG_DEKI" | head -1 | tr -d '[:space:]'); STRONG_DEKI=${STRONG_DEKI:-0}
STRONG_NARI=$(grep -c "なります。</strong>" "$FILE" 2>/dev/null || echo 0)
STRONG_NARI=$(echo "$STRONG_NARI" | head -1 | tr -d '[:space:]'); STRONG_NARI=${STRONG_NARI:-0}
for PAT in "防げます:$STRONG_FUSEGE" "できます:$STRONG_DEKI" "なります:$STRONG_NARI"; do
  NAME="${PAT%%:*}"; CNT="${PAT##*:}"
  if [[ "$CNT" -ge 3 ]]; then
    warning "strong締め「〜${NAME}」が${CNT}回（3回以上はバリエーション不足）"
  fi
done
echo "  strong締め「〜防げます」: ${STRONG_FUSEGE} / 「〜できます」: ${STRONG_DEKI} / 「〜なります」: ${STRONG_NARI}"

# ============================================
# 35. H3の箇条書き/テーブル含有率チェック
# ============================================
echo ""
echo "--- H3の箇条書き/テーブル率チェック ---"
TOTAL_H3=$({ grep -cE "<h3[^>]*>" "$FILE" 2>/dev/null || echo 0; } | head -1 | tr -d '\n')
SERVICE_H3=$({ grep -c '<h3 id=' "$FILE" 2>/dev/null || echo 0; } | head -1 | tr -d '\n')
TOTAL_H3=${TOTAL_H3:-0}
SERVICE_H3=${SERVICE_H3:-0}
CONTENT_H3=$(( TOTAL_H3 - SERVICE_H3 ))
UL_COUNT=$(grep -c "<ul>" "$FILE" 2>/dev/null || echo 0)
UL_COUNT=$(echo "$UL_COUNT" | head -1 | tr -d '[:space:]'); UL_COUNT=${UL_COUNT:-0}
if [[ "$CONTENT_H3" -gt 0 && "$UL_COUNT" -eq 0 ]]; then
  warning "選び方・メリット・注意点のH3に箇条書き(ul)が1つもない。8割のH3にul or テーブルを入れる"
fi
echo "  コンテンツH3数: ${CONTENT_H3} / ul数: ${UL_COUNT}"

# ============================================
# 結果サマリー
# ============================================
echo ""
FINAL_ERRORS=$(wc -l < "$ERR_FILE" | tr -d ' ')
FINAL_WARNINGS=$(wc -l < "$WARN_FILE" | tr -d ' ')
echo "=== 結果: ERROR ${FINAL_ERRORS}件 / WARNING ${FINAL_WARNINGS}件 ==="
echo "※ ERROR=機械・安全系（体言止め・ら抜き・表記揺れ・btn class・表構造・比喩・ナンバリング等）の必須修正。"
echo "※ WARNING=意味判断系（という・指示語・AI定型・抽象形容詞等）。文脈で自然なら使用可。極力具体名詞・具体動詞に置き換える努力はする。"
if [[ "$FINAL_ERRORS" -gt 0 ]]; then
  echo "→ ERRORが${FINAL_ERRORS}件あります。修正してから次のステップに進んでください。"
  exit 1
else
  echo "→ ERROR 0。WARNINGは一読して、意味が空・不自然な箇所だけ直す（機械的な全置換はしない）。"
  exit 0
fi
