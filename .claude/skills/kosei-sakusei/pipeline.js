// KW（または {kw, request}）を渡すと Ahrefs+GSC自動リサーチ→競合WebFetch→構成生成→敵対検証→再検証まで一気通貫で行うパイプライン。
// 実行: Workflow({scriptPath: "<このファイル>", args: "KW"}) または args: {kw: "KW", request: "依頼シート全文"}。
// 依頼シートがある場合は必ず args.request で渡す（訴求順位・掲載サービス・ペルソナ・共起語は依頼情報を1:1で最優先）。
// ⚠️ 三点同期: 見出し・出力ルールを改定したら SKILL.md（🚨節・Phase 5）・要件定義.md と本ファイル（RULES・FORMAT・プロンプト）を同時更新する。
export const meta = {
  name: 'kosei-pipeline',
  description: 'KWだけ渡すと Ahrefs+GSC自動リサーチ→競合WebFetch→構成生成→敵対検証まで一気通貫で行う（ヤマダイ構成作成・見出しルール厳守）',
  phases: [
    { title: 'リサーチ', detail: 'Ahrefs(KW/SERP)＋競合WebFetch＋GSC既存ランクで研究データ収集' },
    { title: '整理', detail: '必須トピック/ギャップ・PAA・ペルソナ・カニバリ/モード判定に整理' },
    { title: '構成', detail: '研究データから主役角度別に構成案を生成（見出しルール厳守）＋判定' },
    { title: '検証', detail: '見出しルール/論理/お手本/差別化/カニバリを敵対検証→最終化→再検証' },
  ],
}

const INPUT = (args && typeof args === 'object') ? args : { kw: args }
const KW = (INPUT.kw && String(INPUT.kw).trim()) ? String(INPUT.kw).trim() : 'コープデリ ミールキット'
const REQUEST = INPUT.request ? String(INPUT.request) : ''
const REQUEST_BLOCK = '【依頼情報（最優先。訴求順位・掲載サービス・ペルソナ・共起語は1:1で反映し勝手に変えない）】\n' + (REQUEST || 'なし（KWのみ受領＝自動リサーチ。ペルソナ・共起語は仮説生成し「仮説」と明示する・要件定義§2.5）')
const COUNTRY = 'jp'
const ROOT = '/Users/manasimac/Projects/super-yamadai'
const SKILL = ROOT + '/.claude/skills/kosei-sakusei/SKILL.md'
const REQ = ROOT + '/.claude/skills/kosei-sakusei/要件定義.md'
const REFS = [
  'スキル入口: ' + SKILL,
  '正本(詳細): ' + REQ,
  'お手本文体: ' + ROOT + '/references/gold-example-style.md',
  '構成合格例: ' + ROOT + '/references/structure-examples.md',
  '内部リンク(カニバリ): ' + ROOT + '/.claude/rules/internal-links.md',
  '訴求順位: ' + ROOT + '/.claude/rules/appeal-ranking.md',
  'サービス情報: ' + ROOT + '/.claude/rules/service-info.md',
  'ライティング正本: ' + ROOT + '/.claude/rules/writing-manual.md',
].join('\n- ')

// SKILL.md「🚨絶対に守る」と同期（三点同期・2026-07-02更新）
const RULES = '【見出しの絶対ルール（最優先・SKILL.md🚨節と同期）】(1)1つのH2（配下H3まで含めて）で1トピック。「〜と〜」「〜や〜」で2トピック並べない。(2)一読で意味が取れない圧縮見出し（例「980円の違い」）を作らない。(3)競合の焼き直し・全部盛り禁止。記事の主役（ペルソナ最大不安/検索意図の核）を1つ決めて尖らせる。(4)見出しは結論・平易（中学生が一読）・カッコ/記号なし・お手本トーン。(5)推測で数値・事実を書かない（裏取り不能は末尾免責へ）。(6)H2・H3は答え・結論を書く（目次だけで結論がわかる。「料金の目安」「中身と種類」等の箱だけ見出しは全否認）。セクション名はSEO標準語（注意点/デメリット/メリット/選び方/口コミ/評判 等）を優先。H2の結論は配下H3を束ねられる広さにする（狭すぎ注意）。(7)FAQは4〜6問（できれば6問）。本文未回収のPAA・サジェストから。(8)H2・H3・タイトルに疑問符（？）を使わない（例外はFAQ質問H3の「〜ですか？」のみ）。(9)指名KWのレビュー/口コミ記事は口コミを厚くする（良い/気になる各3〜4本。別H2に分けてよいが、分けたらH3に「良い口コミ：」等の接頭語は付けない）。(10)指名KW記事は結論型見出しを優先し、H2主語のブランド名反復を許容する（2026-07-02 Manabuさん裁定）。'

// SKILL.md「出力（§10）」と同期
const FORMAT = '【出力フォーマット（SKILL.md§出力厳守）】見出し行にカッコ注記を付けない（「(約束: …)」「（主役）」等は禁止）。各H2見出しの次の行に「約束：…」を別行で書く。記事の主役は「★主役＝…」の別行で示す。'

const AHREFS = 'Ahrefs MCPの使い方: まず ToolSearch("select:mcp__claude_ai_Ahrefs__keywords-explorer-overview,mcp__claude_ai_Ahrefs__keywords-explorer-search-suggestions,mcp__claude_ai_Ahrefs__keywords-explorer-matching-terms,mcp__claude_ai_Ahrefs__serp-overview") でスキーマを読み込み→呼ぶ。国=' + COUNTRY + '。overview は select="keyword,volume,difficulty,cpc,intents,serp_features"。suggestions/matching は select="keyword,volume,difficulty", order_by="volume:desc", limit=30。serp-overview は select="position,url,title,domain_rating,traffic,top_keyword", keyword=対象KW, top_positions=10。APIエラー時は取れた分だけ返し未取得を明示（捏造禁止）。'

const KWDATA_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  volume: { type: ['integer', 'null'] }, difficulty: { type: ['integer', 'null'] },
  intents: { type: 'array', items: { type: 'string' } }, serpFeatures: { type: 'array', items: { type: 'string' } },
  suggestions: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { kw: { type: 'string' }, vol: { type: ['integer', 'null'] } }, required: ['kw'] } },
  matching: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { kw: { type: 'string' }, vol: { type: ['integer', 'null'] } }, required: ['kw'] } },
  note: { type: 'string' },
}, required: ['suggestions', 'note'] }

const SERP_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  serp: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { position: { type: ['integer', 'null'] }, url: { type: 'string' }, title: { type: 'string' }, domain_rating: { type: ['number', 'null'] }, traffic: { type: ['integer', 'null'] } }, required: ['url'] } },
  competitors: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { url: { type: 'string' }, title: { type: 'string' }, headings: { type: 'array', items: { type: 'string' } } }, required: ['url', 'headings'] } },
  paa: { type: 'array', items: { type: 'string' }, description: '実SERP・実検索結果由来の関連質問のみ（推測は入れない）' },
  articleTypesInSerp: { type: 'string' }, note: { type: 'string' },
}, required: ['serp', 'note'] }

const GSC_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  existing: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, url: { type: 'string' }, position: { type: ['number', 'null'] }, impressions: { type: ['integer', 'null'] } }, required: ['query', 'url'] } },
  verdict: { type: 'string', description: '新規でカニバらないか／実はリライト案件か の一次判定と根拠' },
  source: { type: 'string' }, note: { type: 'string' },
}, required: ['existing', 'verdict', 'note'] }

const BRIEF_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  researchMarkdown: { type: 'string' }, articleType: { type: 'string' }, searchIntent: { type: 'string' },
  mustTopics: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } },
  paa: { type: 'array', items: { type: 'string' } }, cooccurrence: { type: 'array', items: { type: 'string' } },
  personaHypothesis: { type: 'string' }, cannibalization: { type: 'string' },
  mode: { type: 'string', description: 'A リライト / B リポジショニング / C 新規 の一次判定と根拠（GSC実データ基準）' },
  mainAngleCandidates: { type: 'array', items: { type: 'string' } },
}, required: ['researchMarkdown', 'mustTopics', 'gaps', 'mainAngleCandidates', 'mode'] }

const OUTLINE_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  approach: { type: 'string' }, mainSubject: { type: 'string', description: '記事の主役（1つ）' },
  title: { type: 'string' }, meta: { type: 'string' }, urlSlug: { type: 'string' },
  subKeywords: { type: 'array', items: { type: 'string' } },
  outline: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { h2: { type: 'string' }, promise: { type: 'string' }, h3s: { type: 'array', items: { type: 'string' } } }, required: ['h2', 'promise', 'h3s'] } },
  faq: { type: 'array', items: { type: 'string' } }, differentiation: { type: 'string' }, cannibalization: { type: 'string' },
}, required: ['mainSubject', 'title', 'outline', 'faq'] }

const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  lens: { type: 'string' }, pass: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } }, severity: { type: 'string', enum: ['none', 'minor', 'major'] },
}, required: ['lens', 'pass', 'issues', 'severity'] }

const FINAL_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  finalOutlineMarkdown: { type: 'string' }, title: { type: 'string' }, mainSubject: { type: 'string' },
  differentiation: { type: 'string' }, cannibalization: { type: 'string' },
  skillNotes: { type: 'array', items: { type: 'string' } }, openIssues: { type: 'array', items: { type: 'string' } },
}, required: ['finalOutlineMarkdown', 'mainSubject'] }

// ---- リサーチ ----
phase('リサーチ')
const researchTrio = await parallel([
  () => agent('対象KW=「' + KW + '」。' + AHREFS + '\noverview・search-suggestions・matching-terms を呼び、volume/difficulty/intents/serpFeatures と、サジェスト語・マッチ語（kw,vol）を返す。', { schema: KWDATA_SCHEMA, phase: 'リサーチ', label: 'Ahrefs:KW', effort: 'medium' }),
  () => agent('対象KW=「' + KW + '」。' + AHREFS + '\n(1) serp-overview で上位10（position,url,title,domain_rating,traffic）を取得。\n(2) その中から「純広告・公式トップLP・自社(super-yamadai.co.jp)」を除いた"媒体レビュー/解説記事"を上位から最大8件（最低5件を目標）選び、各URLを WebFetch（ToolSearch("select:WebFetch")で読込）して記事のH2/H3見出しを抽出する。⚠️ 見出しは原文の文言をそのまま（verbatim）抽出する。WebFetchの要約が見出しを創作する事故が過去にあったため、取得結果が要約文になっている・見出し形式が崩れている場合は https://r.jina.ai/{元URL} で原文を再取得して照合する。推測で補完しない。\n(3) WebSearch（ToolSearch("select:WebSearch")）で「' + KW + '」を検索し、PAA（他の人はこちらも質問）相当の関連質問・疑問形クエリを paa に集める（実検索結果由来のみ・推測は note に区別して書く）。\nSERP一覧＋競合見出し構造（8件分）＋記事タイプ傾向＋paa を返す。取得不能なURLは飛ばして取れた分を返す（捏造禁止）。', { schema: SERP_SCHEMA, phase: 'リサーチ', label: 'SERP+競合8件', effort: 'high' }),
  () => agent('対象KW=「' + KW + '」。自サイト super-yamadai.co.jp/article の既存ランクを確認する（カニバリ・リライト/新規のモード判定用・SKILL.md Phase 2「着手前に必ず」）。\n(1) ToolSearch("select:mcp__claude_ai_Windsor_ai__get_fields,mcp__claude_ai_Windsor_ai__get_data") で Windsor を読み込み、searchconsole コネクタで対象KWとその複合語（指名語・サジェスト語）のクエリ×ページ×平均順位×表示回数を取得する。\n(2) 未接続・エラー時は Ahrefs site-explorer-organic-keywords（ToolSearchで読込・target=super-yamadai.co.jp/article）で代替し、source にどちらを使ったか書く。\n(3) ' + ROOT + '/.claude/rules/internal-links.md をReadし既存記事一覧とも照合する。\nどの既存URLが対象KW群を既に拾っているか（新規で作るとカニバるか・実はリライト案件か）の一次判定 verdict を返す。取得不能なら existing=[] で「未取得」と明示（捏造禁止・沈黙で埋めない）。', { schema: GSC_SCHEMA, phase: 'リサーチ', label: 'GSC:既存ランク', effort: 'medium' }),
])
const kwData = researchTrio[0]
const serpData = researchTrio[1]
const gscData = researchTrio[2]

// ---- 整理 ----
phase('整理')
const brief = await agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」の研究データを整理する。\n【KWデータ】\n' + JSON.stringify(kwData, null, 2) + '\n【SERP・競合構成】\n' + JSON.stringify(serpData, null, 2) + '\n【自サイト既存ランク（GSC/Ahrefs）】\n' + JSON.stringify(gscData, null, 2) + '\n\n次を出す: (a)検索意図と記事タイプ(SERP適合) (b)必須トピック=競合H2/H3クラスタの過半（8件基準） (c)ギャップ=競合が薄い所 (d)PAA/よくある質問（serpDataのpaa＝実SERP由来を優先し、サジェスト疑問形は補助。出所を区別） (e)共起語候補（依頼情報にあればそれを優先） (f)ペルソナ（依頼情報にあればそれを1:1で使い生成しない。なければSERP・KWから仮説化し「仮説」と明示・捏造禁止） (g)カニバリ（GSC実データ＋internal-links.md 照合。既存が拾っていれば棲み分け/統合/強化の対処方針まで） (h)モード一次判定（A リライト/B リポジショニング/C 新規。GSC実データ基準・依頼が新規でも既存が拾っていればリライト案件と明示） (i)記事の主役候補（ペルソナ最大不安/検索意図の核を2案・この後の構成生成の角度になるので互いに違う角度で）。researchMarkdown に読みやすくまとめ、構造化フィールドも返す。', { schema: BRIEF_SCHEMA, phase: '整理', label: '研究整理', effort: 'high' })

// ---- 構成 ----
phase('構成')
const fallbackAngles = ['ペルソナの最大不安の解消', '検索意図の核（実SERPが最も厚く答えている論点）']
const angleSrc = (brief && Array.isArray(brief.mainAngleCandidates)) ? brief.mainAngleCandidates.filter(Boolean) : []
const angles = (angleSrc.length >= 2 ? angleSrc.slice(0, 2) : angleSrc.concat(fallbackAngles).slice(0, 2))
const candidates = (await parallel(angles.map(function (a, i) {
  return function () {
    return agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n' + RULES + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」。下の研究ブリーフに基づき、要件定義書§6（固定テンプレ禁止・競合＋依頼/研究ドリブン）に従って構成案を作れ。角度: 記事の主役を「' + a + '」に置く。\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n\n必須: mainSubject（記事の主役を1つ明記）／タイトルはメインKW左詰め・記号年号疑問符なし・35〜45字／各H2は1トピック・結論・平易・カッコなし・各H2に約束1文（promiseフィールドに）／FAQは本文未回収のPAA・サジェストから4〜6問（できれば6問・語尾「〜ですか？」）／お手本トーンに寄せる。構造化して返す。', { schema: OUTLINE_SCHEMA, phase: '構成', label: '構成:角度' + (i + 1), effort: 'high' })
  }
}))).filter(Boolean)

const judge = await agent('対象KW=「' + KW + '」。構成案候補を、見出しルール（1H2=1トピック/意味不明なし/焼き直しでない/主役が明確/結論型見出し/FAQ4〜6問）・§9論理整合・§8お手本文言・差別化・カニバリ・研究ブリーフ反映・依頼情報反映で採点し、最良を選び、他案から取り込む要素を挙げよ。\n' + REQUEST_BLOCK + '\n【候補】\n' + JSON.stringify(candidates, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2), { schema: { type: 'object', additionalProperties: false, properties: { winnerIndex: { type: 'number' }, graft: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } }, required: ['winnerIndex', 'graft'] }, phase: '構成', label: '判定', effort: 'high' })

const wi = (judge && typeof judge.winnerIndex === 'number' && judge.winnerIndex >= 0 && judge.winnerIndex < candidates.length) ? judge.winnerIndex : 0
const winner = candidates[wi]

// ---- 検証 ----
phase('検証')
const lenses = [
  { key: '見出しルール+論理', p: RULES + '\n各H2が1トピックか(「〜と〜」で2論点にしていないか)・意味不明な圧縮見出しがないか・箱だけ見出し（結論のないトピック名）がないか・疑問符が入っていないか・FAQが4〜6問か・競合の焼き直しでなく主役が1つに尖っているか・§9の4テスト(約束/同粒度/前提/MECE)を、H2を1つずつ突き合わせて厳密に。違反を全て挙げ、直し見出し案を添える。' },
  { key: 'お手本文言', p: 'お手本(gold-example-style.md/structure-examples.md)をReadし、各見出しが結論・平易・非AI・カッコ記号疑問符なし・タイトルの数値/訴求を三重掲載しない、を満たすか。§8の14基準で外れを挙げ直し案を添える。' },
  { key: '差別化カニバリ研究反映', p: 'internal-links.md/service-info.mdをReadし、(1)既存記事とのカニバリ棲み分け(単一指名記事を多社比較化していないか・GSCで既存記事が拾っているのに新規前提になっていないか) (2)競合上位の改善余地を突けているか (3)研究ブリーフの必須トピック取りこぼし・ギャップ独占ができているか (4)依頼情報（訴求順位・掲載サービス）が1:1で反映されているか を検証。\n【GSC既存ランク】\n' + JSON.stringify(gscData, null, 2) },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。下の構成案を敵対的に検証(観点=' + L.key + ')。「概ねOK」で通さない。\n【構成案】\n' + JSON.stringify(winner, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n' + REQUEST_BLOCK + '\n\n観点: ' + L.p, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
  }
}))).filter(Boolean)

const final = await agent('【参照ファイル】\n- ' + REFS + '\n\n' + RULES + '\n\n' + FORMAT + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」。最良案に、判定のgraftと敵対検証の指摘（特にmajor）を全て反映して完成構成案を作れ。\n【最良案】\n' + JSON.stringify(winner, null, 2) + '\n【判定】\n' + JSON.stringify(judge, null, 2) + '\n【検証】\n' + JSON.stringify(verifications, null, 2) + '\n\nfinalOutlineMarkdown に保存用の完成Markdownを入れる。構成: # タイトル／メタ／URLスラッグ／サブKW／「★主役＝…」の別行／各H2（見出し行は見出しのみ・次の行に「約束：…」を別行で・その下にH3箇条書き）／FAQ 4〜6問／カニバリ・差別化メモ／執筆時の要裏取りリスト。見出し行にカッコ注記は絶対に付けない。skillNotes に、この実走で気づいたスキル(要件定義書/SKILL.md/pipeline.js)の改善案を挙げる。', { schema: FINAL_SCHEMA, phase: '検証', label: '最終化', effort: 'high' })

// 最終化での書き換えが新たな違反を生んでいないか、見出しルールレンズで1周再検証
const recheck = final ? await agent('対象KW=「' + KW + '」。完成構成案の最終再チェック。\n' + RULES + '\n' + FORMAT + '\n\n完成Markdownの全H2/H3とタイトルを1本ずつ、上記ルール違反（2トピック見出し・箱だけ見出し・疑問符・カッコ注記・FAQ問数4〜6・約束とH3の整合）がないか確認する。違反を全て挙げる。\n【完成構成案】\n' + final.finalOutlineMarkdown, { schema: VERIFY_SCHEMA, phase: '検証', label: '再検証:最終', effort: 'high' }) : null

let finalOut = final
if (final && recheck && !recheck.pass && recheck.severity === 'major') {
  finalOut = (await agent(RULES + '\n\n' + FORMAT + '\n\n対象KW=「' + KW + '」。完成構成案に再検証でmajor指摘が出た。指摘箇所だけを修正して完成Markdownを再出力せよ（指摘のない箇所は1文字も変えない）。\n【完成構成案】\n' + final.finalOutlineMarkdown + '\n【再検証の指摘】\n' + JSON.stringify(recheck.issues, null, 2), { schema: FINAL_SCHEMA, phase: '検証', label: '最終修正', effort: 'high' })) || final
}

const openIssues = []
if (finalOut && Array.isArray(finalOut.openIssues)) openIssues.push.apply(openIssues, finalOut.openIssues)
if (!(serpData && Array.isArray(serpData.paa) && serpData.paa.length)) openIssues.push('実SERPのPAAが未取得。ユーザー提示前に実SERPで確認してFAQを最終化する')
if (brief && brief.mode && brief.mode.indexOf('新規') === -1) openIssues.push('モード一次判定が新規以外: ' + brief.mode + '（本体ループでManabuさんに確認してから確定）')
if (recheck && !recheck.pass && recheck.severity !== 'major') openIssues.push('最終再検証のminor残指摘: ' + (recheck.issues || []).join(' / '))

return {
  kw: KW,
  mode: brief ? brief.mode : null,
  researchMarkdown: brief ? brief.researchMarkdown : null,
  finalOutlineMarkdown: finalOut ? finalOut.finalOutlineMarkdown : null,
  mainSubject: finalOut ? finalOut.mainSubject : null,
  differentiation: finalOut ? finalOut.differentiation : null,
  cannibalization: finalOut ? finalOut.cannibalization : null,
  gscVerdict: gscData ? gscData.verdict : null,
  skillNotes: finalOut ? (finalOut.skillNotes || []) : [],
  openIssues: openIssues,
  winnerIndex: wi,
  serpRaw: serpData ? serpData.serp : null,
  kwDataNote: kwData ? kwData.note : null,
}
