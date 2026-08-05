export const meta = {
  name: 'verify-outline',
  description: '構成案を5レンズ（日本語音読／骨格適合／数値と法務／カニバリ／1位が取れるか）で並列検証し、反証を通過した指摘だけを修正指示書にまとめる',
  whenToUse: '構成案を保存したあと、Manabuさんに提示する前に必ず1回。lint-outline.sh と check-cannibal.sh を通したうえで走らせる（機械チェックは必要条件、本検証が十分条件）。',
  phases: [
    { title: 'Find', detail: '5レンズで並列検出' },
    { title: 'Verify', detail: '検出した指摘を反証させ、潰せないものだけ残す' },
    { title: 'Synthesize', detail: '確定版に反映する修正指示書に統合' },
  ],
}

// ─────────────────────────────────────────────────────────────
// 2026-08-05 新設。
// 背景：2026-08-04 に pipeline 14体・Codex・敵対検証3レンズを回して
// 「文言品質の改善はゼロ」だった（feedback_structure 学び60）。
// 原因は検査対象のズレ＝全部が「ルール適合」「事実の正確さ」「論理構造」の検査で、
// 「一読で意味が取れる日本語か」を見る工程が1つも無かったこと。
//
// 2026-08-05 に本構成でデリピックス お試しを検証したところ、
//   ・★主役のH2が並走記事の資産の借り物だった（カニバリレンズ）
//   ・競合上位5本が全部「実食レビュー」だと判明（SERPレンズ）
//   ・「使わない」と決めた数値を同じファイルが「使う」と指示（数値レンズ）
// を検出できた。反証フェーズは日本語レンズの誤指摘2件を正しく却下している
// （「〜という声がある」は lint チェック7の除外規定で許容＝学び59）。
//
// 使い方：
//   Workflow({ scriptPath: "<このファイルの絶対パス>", args: { kw: "デリピックス お試し" } })
//   args は文字列KWでも可。並走記事は siblings で明示指定できる（省略時は同ブランドを自動推定）。
// ─────────────────────────────────────────────────────────────

const ROOT = '/Users/manasimac/Projects/super-yamadai'
const KW = typeof args === 'string' ? args : (args && args.kw) || ''
if (!KW) throw new Error('args に KW を渡してください（例: {kw: "デリピックス お試し"}）')

const TARGET = `${ROOT}/articles/${KW}/outline.md`
const SIBLINGS = (args && args.siblings) || []
const SIB_TEXT = SIBLINGS.length
  ? SIBLINGS.map((k) => `\`${ROOT}/articles/${k}/outline.md\``).join('、')
  : '同ブランド・同サービスの並走記事（`ls ' + ROOT + '/articles/` で探す。KWの先頭語が一致するフォルダ）'

log(`検証対象: ${TARGET}`)

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          location: { type: 'string', description: '構成案のどこか（H2番号・行・見出し文言）' },
          problem: { type: 'string', description: '何が問題か1文' },
          evidence: { type: 'string', description: '根拠。構成案や規則の該当文言をそのまま引用する' },
          fix: { type: 'string', description: '具体的な修正案。見出しなら書き換え後の文言をそのまま書く' },
        },
        required: ['id', 'severity', 'location', 'problem', 'evidence', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT = {
  type: 'object',
  properties: {
    survives: { type: 'boolean', description: '反証を試みたうえで、なお本当の欠陥だと言えるか' },
    reason: { type: 'string' },
    refined_fix: { type: 'string', description: '生き残る場合の、より正確な修正案' },
  },
  required: ['survives', 'reason'],
}

const LENSES = [
  {
    key: 'japanese',
    // ⚠️ このレンズにだけはルールブックを渡さない（学び60）。
    // ルールを渡すと「ルール適合の検査」に戻り、読みにくさを見なくなる。
    prompt: `あなたは日本語の読みやすさだけを見る校閲者です。SEOの知識もルールブックも使わないでください。

\`${TARGET}\` を Read し、「## 見出しツリー」の H1・H2・H3 だけを抜き出してください。約束文・執筆メモは無視します。

抜き出した見出しを1本ずつ声に出して読むつもりで読み、次だけを判定してください。

1. 一読で意味が取れるか。取れないなら、何がどう分からないかを書く
2. そのままの意味で受け取ったとき、日本語として成立しているか（比喩・擬人化・ねじれ・主語の欠落）
3. 中学生が読んで、何の話か像が浮かぶか
4. H2だけを上から続けて読んだとき、記事の筋が通るか。飛んでいる箇所はどこか
5. 同じ語尾・同じ構文が続いて単調になっていないか
6. 見出しが長すぎて詰め込みになっていないか（字数も数えて書く）
7. 1つの見出しに主語（ブランド名・サービス名）を2つ以上入れていないか

「ルール上OK」という判定は禁止です。読んで分かりにくければ、それは欠陥です。
指摘には必ず「書き換え後の見出し文言」をそのまま fix に書いてください。`,
  },
  {
    key: 'structure',
    prompt: `あなたは記事の骨格を検査します。

読むもの:
- 対象: \`${TARGET}\`
- 骨格の正本: \`${ROOT}/.claude/rules/article-structure.md\`
- 文の書き方の正本: \`${ROOT}/.claude/rules/writing-manual.md\`

この2ファイルは2026-08-05に、アクセス上位13記事を実測して作り直したものです。
**旧マニュアル（v4.1）の記憶で判定しないでください。** PASONA法・FAB法は実測の結果、上位記事で使われていないことが確認され廃止されています。

検査項目:
1. セクションの並びが article-structure §1 に合っているか（記事タイプに対するH2本数・H3本数も実測レンジと比べる）
2. H2直下が §3（事実→リスク→予告の3文）で開ける設計になっているか
3. FAQ が §6（4〜6問・語尾統一・ol無し・番号なし）に合うか
4. まとめが §7（5〜6文・strong2箇所）に合う指示になっているか。**まとめH2が並走記事のまとめと酷似していないか**
5. 訴求設計が §9 に合うか（CTAの置き場所・単一ブランド指名記事で他社比較の独立H2を作っていないか）
6. §10「記事タイプ別の差分」の該当タイプの要件を満たしているか
7. **「見出しツリー」と「セクション別の執筆メモ」で、同じH2を指す記述が矛盾していないか**（片方が禁止した数値をもう片方が使う指示になっていないか）
8. H3が2本しか立たないH2を作っていないか（中身の水増し）

各指摘に、article-structure か writing-manual の該当節と実際の文言を evidence として引用してください。`,
  },
  {
    key: 'facts',
    prompt: `あなたは数値の整合と景表法リスクだけを見ます。

読むもの:
- 対象: \`${TARGET}\`
- サービスの正本: \`${ROOT}/.claude/rules/service-info.md\`（該当サービスの「書いてはいけないもの」の節を必ず読む）
- 数値と法令のルール: \`${ROOT}/.claude/rules/writing-manual.md\` の §8

検査項目:
1. **構成案が自分で「使わない」と決めた数値を、別の箇所で使う指示になっていないか。** 全文を走査して矛盾を全部挙げる（最頻の事故。同じ数値の可否判断が複数ブロックに分散していると必ず取り残す）
2. 金額をすべて再計算して突合する。食品は**軽減税率8%**で「税抜で割引→×1.08」の順。報告値／独立再計算値／差分 を evidence に書く
3. service-info.md の値と構成案の値が一致するか
4. 二重価格表示のリスク（通常価格の内訳が説明できない割引率を使っていないか）
5. 条件付きで有利な数値を、条件なしで見出し・タイトルに出していないか（「関東なら」「12食なら」等・学び74）
6. 公式で確認できない数値を書く指示になっていないか
7. 訴求社の商品への否定的評価を地の文で断定していないか（信用毀損）

矛盾を見つけたら、**どちらが正しいか**まで判断して fix に書いてください。`,
  },
  {
    key: 'cannibal',
    prompt: `あなたは記事同士の食い合いだけを見ます。

読むもの:
- 対象: \`${TARGET}\`
- 並走記事: ${SIB_TEXT}
- 公開記事の台帳: \`${ROOT}/articles/H2台帳.md\`

**重要: H2だけ見ると見逃します。H3単位で突き合わせてください**（学び73）。
また \`check-cannibal.sh\` は公開記事としか突合しないので、**並走中の未公開記事との重複は人が見るしかありません**。

検査項目:
1. 同ブランドの並走記事の**H3を全部一覧にして**、同じデータ・同じ事実を扱っているH3を洗い出す
2. **まとめH2が並走記事のまとめと酷似していないか**（2026-08-05に実際に発生した）
3. FAQの質問が記事間で重複していないか。1問ずつ突合する
4. 構成案の「カニバリ判定」節に書かれた棲み分けの約束が、実際の見出しツリーで守られているか
5. 公開記事（H2台帳）と食い合っていないか
6. 重複が見つかったら、**どちらの記事に寄せるべきか**まで判断する
7. **記事の★主役に据えたH2が、並走記事の資産の借り物になっていないか**（2026-08-05に実際に発生した最重要の型）

evidence には、突き合わせた2本のH3見出しを両方そのまま引用してください。`,
  },
  {
    key: 'serp',
    prompt: `あなたは「このKWで検索1位が取れる構成か」だけを見ます。KWは「${KW}」です。

読むもの:
- 対象: \`${TARGET}\`

やること:
1. **Ahrefsで検索数を取る。** ToolSearch("select:mcp__claude_ai_Ahrefs__keywords-explorer-overview") でスキーマを読み、country="jp"、keywords は**カンマ区切り**で対象KWとその複合語を渡す（⚠️改行区切りだと空配列が返り「データなし」と誤判定する。2026-08-05に実際に誤報告した）。select="keyword,volume,difficulty,cpc"。
   - **サブKWの検索数を必ず実測し、構成が取りこぼしている大きなKWがないか**を見る（2026-08-05に「メニュー350」の取りこぼしを検出）
   - CPCが高いKWは商業価値が高い。該当セクションが薄くないか見る
2. \`serp-overview\` を試す。**空配列が返ったら「データなし」と断定せず**、既知の大きいKW（例「ナッシュ お試し」）で同じ呼び出しを試してツールの正常性を切り分ける。低ボリュームKWはSERPスナップショットが無いだけのことがある
3. WebSearch で対象KWを検索し、上位に出ている記事を実際に WebFetch して H2/H3 構成を抜き出す（3〜5本）
4. 上位記事が共通して扱っているトピックを列挙し、**この構成案に無いもの**を挙げる（＝致命的な欠落）
5. 上位記事が扱っていない、この構成案の独自要素を挙げる（＝勝ち筋）
6. **タイトルが疑問形なら、H2①がその疑問への回答になっているか**（学び70）
7. **この構成のまま公開して1位が取れるか。取れないなら何が足りないかを1つに絞って述べる。** 一次情報（実体験・実測）の有無で競合に負けていないかを必ず見る

競合の実URLと実際の見出し文言を evidence に引用してください。**推測で競合の構成を書かないこと。**`,
  },
]

phase('Find')
log('5レンズで並列検出を開始します')

const results = await pipeline(
  LENSES,
  (lens) => agent(lens.prompt, { label: `find:${lens.key}`, phase: 'Find', schema: FINDINGS }),
  (found, lens) => {
    const list = (found && found.findings) || []
    if (!list.length) return { lens: lens.key, verified: [], minor: [] }
    // blocker/major だけ反証にかける（minor は素通しでコストを使わない）
    const heavy = list.filter((f) => f.severity !== 'minor').slice(0, 4)
    const light = list.filter((f) => f.severity === 'minor')
    return parallel(
      heavy.map((f) => () =>
        agent(
          `次の指摘を**反証してください**。あなたの仕事は指摘を潰すことです。潰せないときだけ survives=true にしてください。

対象の構成案: \`${TARGET}\`

指摘:
- 場所: ${f.location}
- 問題: ${f.problem}
- 根拠: ${f.evidence}
- 修正案: ${f.fix}

必ず対象ファイルを Read して現物を確認してください。次のどれかに当たれば survives=false です。
- 指摘が現物を誤読している
- 指摘された箇所は、構成案の別の場所で既に手当てされている
- 修正案のほうが元より悪い（**見出しの修正案は \`bash ${ROOT}/scripts/lint-outline.sh\` に通して確かめる**）
- ルールの解釈が2026-08-05のv5.0体系と違う（旧マニュアルv4.1の記憶で判定している）

迷ったら survives=false に倒してください。`,
          { label: `verify:${lens.key}:${f.id}`, phase: 'Verify', schema: VERDICT }
        ).then((v) => ({ ...f, lens: lens.key, verdict: v }))
      )
    ).then((vs) => ({
      lens: lens.key,
      verified: vs.filter(Boolean).filter((f) => f.verdict && f.verdict.survives),
      minor: light.map((f) => ({ ...f, lens: lens.key })),
    }))
  }
)

const alive = results.filter(Boolean)
const confirmed = alive.flatMap((r) => r.verified || [])
const minors = alive.flatMap((r) => r.minor || [])
log(`反証を通過した指摘 ${confirmed.length}件／minor ${minors.length}件`)

phase('Synthesize')
const plan = await agent(
  `以下は構成案（\`${TARGET}\`）に対する、5レンズ検証で反証を通過した指摘です。

確定した指摘:
${JSON.stringify(confirmed, null, 2)}

参考（反証にかけていない軽微な指摘）:
${JSON.stringify(minors, null, 2)}

やること:
1. \`${TARGET}\` を Read して現物を確認する
2. 重複する指摘を統合する
3. **確定版に反映すべき修正を、実行順に並べた指示書**にまとめる
4. 見出しの修正は「変更前 → 変更後」の実文言で書く
5. 修正後の見出しツリー（H1/H2/H3）を完成形で1つ提示する
6. 「これは直さない」と判断したものがあれば、理由付きで別枠に書く

出力は日本語のMarkdown。最初に3行で結論を書いてください。`,
  { label: 'synthesize', phase: 'Synthesize' }
)

return { kw: KW, confirmedCount: confirmed.length, minorCount: minors.length, confirmed, plan }
