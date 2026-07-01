// KWだけ渡すと Ahrefs自動リサーチ→競合WebFetch→構成生成→敵対検証まで一気通貫で行うパイプライン。
// 実行: Workflow({scriptPath: "<このファイル>"}) 。KWは args(文字列) で渡す。渡せない環境では下の KW 定数を書き換えて再実行。
export const meta = {
  name: 'kosei-pipeline',
  description: 'KWだけ渡すと Ahrefs自動リサーチ→競合WebFetch→構成生成→敵対検証まで一気通貫で行う（ヤマダイ構成作成・見出しルール厳守）',
  phases: [
    { title: 'リサーチ', detail: 'Ahrefs(KW/SERP)＋競合WebFetchで研究データ収集' },
    { title: '整理', detail: '必須トピック/ギャップ・PAA・ペルソナ仮説・カニバリに整理' },
    { title: '構成', detail: '研究データから構成案を生成（見出しルール厳守）＋判定' },
    { title: '検証', detail: '見出しルール/論理/お手本/差別化/カニバリを敵対検証し最終化' },
  ],
}

const KW = (typeof args === 'string' && args.trim()) ? args.trim() : 'コープデリ ミールキット'
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

const RULES = '【見出しの絶対ルール（最優先）】(1)1つのH2（配下H3まで含めて）で1トピック。「〜と〜」「〜や〜」で2トピック並べない。(2)一読で意味が取れない圧縮見出し（例「980円の違い」）を作らない。(3)競合の焼き直し・全部盛り禁止。記事の主役（ペルソナ最大不安/検索意図の核）を1つ決めて尖らせる。(4)見出しは結論・平易(中学生が一読)・カッコ/記号なし・お手本トーン。(5)推測数値を書かない（裏取り不能は末尾免責へ）。'

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
  articleTypesInSerp: { type: 'string' }, note: { type: 'string' },
}, required: ['serp', 'note'] }

const BRIEF_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  researchMarkdown: { type: 'string' }, articleType: { type: 'string' }, searchIntent: { type: 'string' },
  mustTopics: { type: 'array', items: { type: 'string' } }, gaps: { type: 'array', items: { type: 'string' } },
  paa: { type: 'array', items: { type: 'string' } }, cooccurrence: { type: 'array', items: { type: 'string' } },
  personaHypothesis: { type: 'string' }, cannibalization: { type: 'string' },
  mainAngleCandidates: { type: 'array', items: { type: 'string' } },
}, required: ['researchMarkdown', 'mustTopics', 'gaps', 'mainAngleCandidates'] }

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
const researchPair = await parallel([
  () => agent('対象KW=「' + KW + '」。' + AHREFS + '\noverview・search-suggestions・matching-terms を呼び、volume/difficulty/intents/serpFeatures と、サジェスト語・マッチ語（kw,vol）を返す。', { schema: KWDATA_SCHEMA, phase: 'リサーチ', label: 'Ahrefs:KW', effort: 'medium' }),
  () => agent('対象KW=「' + KW + '」。' + AHREFS + '\nserp-overview で上位10（position,url,title,domain_rating,traffic）を取得。次に、その中から「純広告・公式トップLP・自社(super-yamadai.co.jp)」を除いた"媒体レビュー/解説記事"の上位3件を選び、各URLを WebFetch（必要なら ToolSearch("select:WebFetch") で読込）して記事のH2/H3見出しを抽出する。SERP一覧＋競合3件の見出し構造＋SERPの記事タイプ傾向を返す。取得不能なURLは飛ばして取れた分を返す（捏造禁止）。', { schema: SERP_SCHEMA, phase: 'リサーチ', label: 'SERP+競合', effort: 'high' }),
])
const kwData = researchPair[0]
const serpData = researchPair[1]

// ---- 整理 ----
phase('整理')
const brief = await agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n対象KW=「' + KW + '」の研究データを整理する。\n【KWデータ】\n' + JSON.stringify(kwData, null, 2) + '\n【SERP・競合構成】\n' + JSON.stringify(serpData, null, 2) + '\n\n次を出す: (a)検索意図と記事タイプ(SERP適合) (b)必須トピック=競合H2/H3クラスタの過半 (c)ギャップ=競合が薄い所 (d)PAA/よくある質問(SERPのquestion機能・サジェストの疑問形から) (e)共起語候補 (f)ペルソナ仮説(SERP・KW・知恵袋傾向から。断定せず仮説と明示・捏造禁止) (g)カニバリ(internal-links.md と照合し棲み分け判断) (h)記事の主役候補(ペルソナ最大不安/検索意図の核を1〜2案)。researchMarkdown に読みやすくまとめ、構造化フィールドも返す。', { schema: BRIEF_SCHEMA, phase: '整理', label: '研究整理', effort: 'high' })

// ---- 構成 ----
phase('構成')
const genAngles = [
  { key: '不安解消主役', p: '記事の主役を「ペルソナの最大不安の解消」に置く角度。' },
  { key: '中身価格主役', p: '記事の主役を「中身と価格の実態（検索意図の核）」に置く角度。' },
]
const candidates = (await parallel(genAngles.map(function (a) {
  return function () {
    return agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n' + RULES + '\n\n対象KW=「' + KW + '」。下の研究ブリーフに基づき、要件定義書§6（固定テンプレ禁止・競合＋依頼/研究ドリブン）に従って構成案を作れ。角度: ' + a.p + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n\n必須: mainSubject（記事の主役を1つ明記）／タイトルはメインKW左詰め・記号年号なし・35〜45字／各H2は1トピック・結論・平易・カッコなし・各H2に約束1文／FAQはPAAのうち本文未回収のみ／お手本トーンに寄せる。構造化して返す。', { schema: OUTLINE_SCHEMA, phase: '構成', label: '構成:' + a.key, effort: 'high' })
  }
}))).filter(Boolean)

const judge = await agent('対象KW=「' + KW + '」。2つの構成案候補を、見出しルール（1H2=1トピック/意味不明なし/焼き直しでない/主役が明確）・§9論理整合・§8お手本文言・差別化・カニバリ・研究ブリーフ反映で採点し、最良を選び、他案から取り込む要素を挙げよ。\n【候補】\n' + JSON.stringify(candidates, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2), { schema: { type: 'object', additionalProperties: false, properties: { winnerIndex: { type: 'number' }, graft: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } }, required: ['winnerIndex', 'graft'] }, phase: '構成', label: '判定', effort: 'high' })

const wi = (judge && typeof judge.winnerIndex === 'number' && judge.winnerIndex >= 0 && judge.winnerIndex < candidates.length) ? judge.winnerIndex : 0
const winner = candidates[wi]

// ---- 検証 ----
phase('検証')
const lenses = [
  { key: '見出しルール+論理', p: RULES + '\n各H2が1トピックか(「〜と〜」で2論点にしていないか)・意味不明な圧縮見出しがないか・競合の焼き直しでなく主役が1つに尖っているか・§9の4テスト(約束/同粒度/前提/MECE)を、H2を1つずつ突き合わせて厳密に。違反を全て挙げ、直し見出し案を添える。' },
  { key: 'お手本文言', p: 'お手本(gold-example-style.md/structure-examples.md)をReadし、各見出しが結論・平易・非AI・カッコ記号なし・タイトルの数値/訴求を三重掲載しない、を満たすか。§8の14基準で外れを挙げ直し案を添える。' },
  { key: '差別化カニバリ研究反映', p: 'internal-links.md/service-info.mdをReadし、(1)既存記事とのカニバリ棲み分け(単一指名記事を多社比較化していないか) (2)競合上位の改善余地を突けているか (3)研究ブリーフの必須トピック取りこぼし・ギャップ独占ができているか を検証。' },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。下の構成案を敵対的に検証(観点=' + L.key + ')。「概ねOK」で通さない。\n【構成案】\n' + JSON.stringify(winner, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n\n観点: ' + L.p, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
  }
}))).filter(Boolean)

const final = await agent('【参照ファイル】\n- ' + REFS + '\n\n' + RULES + '\n\n対象KW=「' + KW + '」。最良案に、判定のgraftと敵対検証の指摘（特にmajor）を全て反映して完成構成案を作れ。\n【最良案】\n' + JSON.stringify(winner, null, 2) + '\n【判定】\n' + JSON.stringify(judge, null, 2) + '\n【検証】\n' + JSON.stringify(verifications, null, 2) + '\n\nfinalOutlineMarkdown に保存用の完成Markdown(# タイトル/メタ/URL/サブKW/記事の主役1文/各H2見出し＋(約束: …)＋H3箇条書き/FAQ/カニバリ・差別化メモ)を入れる。skillNotes に、この実走で気づいたスキル(要件定義書/SKILL.md)の改善案を挙げる。', { schema: FINAL_SCHEMA, phase: '検証', label: '最終化', effort: 'high' })

return {
  kw: KW,
  researchMarkdown: brief ? brief.researchMarkdown : null,
  finalOutlineMarkdown: final ? final.finalOutlineMarkdown : null,
  mainSubject: final ? final.mainSubject : null,
  differentiation: final ? final.differentiation : null,
  cannibalization: final ? final.cannibalization : null,
  skillNotes: final ? (final.skillNotes || []) : [],
  openIssues: final ? (final.openIssues || []) : [],
  winnerIndex: wi,
  serpRaw: serpData ? serpData.serp : null,
  kwDataNote: kwData ? kwData.note : null,
}
