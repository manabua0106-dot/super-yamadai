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
const RULES = '【見出しの絶対ルール（最優先・SKILL.md🚨節と同期）】(1)1つのH2（配下H3まで含めて）で1トピック。「〜と〜」「〜や〜」で2トピック並べない。(2)一読で意味が取れない圧縮見出し（例「980円の違い」）を作らない。(3)競合の焼き直し・全部盛り禁止。記事の主役（ペルソナ最大不安/検索意図の核）を1つ決めて尖らせる。(4)見出しは結論・平易（中学生が一読）・カッコ/記号なし・お手本トーン。(5)推測で数値・事実を書かない（裏取り不能は末尾免責へ）。(6)H2・H3は答え・結論を書く（目次だけで結論がわかる。「料金の目安」「中身と種類」等の箱だけ見出しは全否認）。セクション名はSEO標準語（注意点/デメリット/メリット/選び方/口コミ/評判 等）を優先。H2の結論は配下H3を束ねられる広さにする（狭すぎ注意）。(7)FAQは4〜6問（できれば6問）。本文未回収のPAA・サジェストから。見出しツリーには質問文をH3として明記し別セクション頼みで省略しない。(8)H2・H3に疑問符（？）を使わない（例外はFAQ質問H3の「〜ですか？」のみ）。タイトル（H1）は？・！を使ってよい（年号は不可・2026-07-02 Manabuさん裁定）。(9)指名KWのレビュー/口コミ記事は口コミを厚くする（良い/気になる各3〜4本。別H2に分けてよいが、分けたらH3に「良い口コミ：」等の接頭語は付けない）。(10)指名KW記事は結論型見出しを優先し、H2主語のブランド名反復を許容する（2026-07-02 Manabuさん裁定）。(11)見出しに修飾語（地域・対象読者・運営主体・カテゴリ等）を3つ以上詰め込まない。核の名詞に対し修飾語は2つまでに絞り残りは本文・H3に譲る。具体的（concrete）と冗長（verbose）は別軸——具体性は核心を1つ経済的に言い切ることで複数事実の列挙ではない。(12)H2とH3で同じ話を繰り返さない。H2が結論を言い切っている場合、配下H3はH2の言い換えでなく別の情報（実態・回避策・根拠等）を持たせる。(13)隣接H2からの文脈が見えない唐突な見出しを作らない。前段のH2群で解消しきれない疑問を受けるなら見出し自体（または導入文）に橋渡しを入れる。(14)「AとB」の対概念も1H2=1トピックの例外にしない（例：向いている人と向いていない人は別H2に分離）。(15)複数H2にまたがる同一事実は1箇所に一本化する（例：預け金の返金を2つのH2に重複して書かない）。(16)見出しの冗長な動詞・連体修飾を削り最短形にする（「〜を頼んだ良い口コミ」「〜で気をつけたい注意点」「〜に関するよくある質問」→「〜の良い口コミ」「〜の注意点」）。異質な名詞を「と」で並列しない（「中身と口コミ」＝野球とみかん・並列は同種のみ）。(17)単独で曖昧な名詞（定期/中身/目的等）は見出しでも具体化する（定期→定期便）。(18)「手順・流れ・方法」を掲げたH2のH3は実際のステップ（注文→支払い→到着等）で揃え、支払い方法・仕様・スペックを手順に混ぜて論理を崩さない。薄い2H3にしない。(19)口コミ・評判系のH3見出しは実在口コミを収集してから実際の声に合わせて確定する。実データ前に「〜という声が多い」等の見出しを作らない。気になる口コミの一次ソースが取れなければ口コミH2を無理に作らず弱みを事実ベースの注意点H2に一本化する（捏造回避）。(20)費用KW（料金/送料/値段/月額）は実額を必ず裏取りする。**H2に金額を置くなら1つまで。金額を範囲（935〜1,030円）で書いたり2つ以上並べたりしない**（実記事らでぃっしゅ991・コープデリ971はH2に金額1つ。2026-08-04改訂・学び61）。「送料が安い」等の相対・抽象の見出しにもしない。(22)**ネガとポジで書き方を変える（非対称）**。否定的な評価は断定せず「〜という声もある」「〜と感じた人もいる」と口コミに帰属させる（訴求社の商品を断定で否定すると信用毀損リスク）。肯定・中立は事実で言い切り、「〜と書く人が多い」「〜をほめている」のような数量の主張と口コミの擬人化は使わない。(23)**読めば分かる総括を見出しにしない**（「〜で決まる」「〜によって変わる」「〜が大切」等の空見出し禁止）。何がどう違うのかを具体名で書く。(24)**中身が2つしかないものをH2にしない**。差別化のために薄い内容をH2へ格上げすると壊れた見出しが生える。本文1文に落とすか削る。(25)**1見出しで満たすルールは2つまで**。結論＋実額＋KWを1本に詰め込まない。優先順は 結論 > 平易さ > KW。実額はH3・表へ逃がす。(26)**同型記事のH2実物に寄せる**。articles/完成済み/ の同カテゴリ記事のH2の字数・数字の有無・語尾を基準にする。(21)タイトル・見出しに付録2カテゴリA硬語（試算/向き不向き/シミュレーション/コスパ/都県/無料ライン等の造語）を使わない（lint-outline.shがERROR検出）。タイトルは一度音読し、数字と助詞のつながりが会話として成立するか確かめる（NG例「手数料198円〜と1か月の食費を解説」）。'

// SKILL.md「出力（§10）」と同期
const FORMAT = '【出力フォーマット（SKILL.md§出力厳守）】見出し行にカッコ注記を付けない（「(約束: …)」「（主役）」等は禁止）。各H2見出しの次の行に「約束：…」を別行で書く。記事の主役は「★主役＝…」の別行で示す。'

const AHREFS = 'Ahrefs MCPの使い方: まず ToolSearch("select:mcp__claude_ai_Ahrefs__keywords-explorer-overview,mcp__claude_ai_Ahrefs__keywords-explorer-search-suggestions,mcp__claude_ai_Ahrefs__keywords-explorer-matching-terms,mcp__claude_ai_Ahrefs__serp-overview") でスキーマを読み込み→呼ぶ。国=' + COUNTRY + '。overview は select="keyword,volume,difficulty,cpc,intents,serp_features"。suggestions/matching は select="keyword,volume,difficulty", order_by="volume:desc", limit=30。serp-overview は select="position,url,title,domain_rating,traffic,top_keyword", keyword=対象KW, top_positions=10。パラメータ不明・APIエラー時は mcp__claude_ai_Ahrefs__doc で該当ツールの使い方を確認してから再試行し、それでも取れない分は未取得と明示して返す（捏造禁止）。'

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

const KUCHIKOMI_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  skip: { type: 'boolean', description: '指名/口コミ/レビュー/お試し系KWでない場合 true（収集しない）' },
  items: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    source: { type: 'string', description: 'X / AppStore / GooglePlay / 公式アンケート 等' },
    url: { type: 'string' }, quote: { type: 'string', description: '原文ママ（要約・改変禁止）' },
    author: { type: 'string' }, date: { type: 'string' },
    sentiment: { type: 'string', enum: ['良い', '気になる'] },
  }, required: ['source', 'url', 'quote', 'sentiment'] } },
  note: { type: 'string' },
}, required: ['skip', 'items', 'note'] }

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
  () => agent('対象KW=「' + KW + '」。' + AHREFS + '\n(1) serp-overview で上位10（position,url,title,domain_rating,traffic）を取得。\n(2) その中から「純広告・公式トップLP・自社(super-yamadai.co.jp)」を除いた"媒体レビュー/解説記事"を上位から最大8件（最低5件を目標）選び、各URLを WebFetch（ToolSearch("select:WebFetch")で読込）して記事のH2/H3見出しを抽出する。⚠️ 見出しは原文の文言をそのまま（verbatim）抽出する。WebFetchの要約が見出しを創作する事故が過去にあったため、取得結果が要約文になっている・見出し形式が崩れている場合は https://r.jina.ai/{元URL} で原文を再取得して照合する。推測で補完しない。⏱WebFetchのリトライは1回まで。タイムアウトしたドメインは以後 https://r.jina.ai/{URL} 固定（radishbo-ya.co.jp はタイムアウト常習のため最初から r.jina.ai）。\n(2b) 対象KWが費用系（料金/送料/値段/月額）の場合は、当該サービス公式の料金・送料ページも取得し、実額（エリア別・注文金額別）を note に記録する（構成段階の実額裏取り＝feedback_structure 学びS1）。\n(3) WebSearch（ToolSearch("select:WebSearch")）で「' + KW + '」を検索し、PAA（他の人はこちらも質問）相当の関連質問・疑問形クエリを paa に集める（実検索結果由来のみ・推測は note に区別して書く）。\nSERP一覧＋競合見出し構造（8件分）＋記事タイプ傾向＋paa を返す。取得不能なURLは飛ばして取れた分を返す（捏造禁止）。', { schema: SERP_SCHEMA, phase: 'リサーチ', label: 'SERP+競合8件', effort: 'high' }),
  () => agent('対象KW=「' + KW + '」。自サイト super-yamadai.co.jp/article の既存ランクを確認する（カニバリ・リライト/新規のモード判定用・SKILL.md Phase 2「着手前に必ず」）。\n(1) ToolSearch("select:mcp__claude_ai_Windsor_ai__get_data") で Windsor を読み込み、searchconsole コネクタ（接続済み・サイト https://www.super-yamadai.co.jp/article/）で対象KWとその複合語（指名語・サジェスト語）のクエリ×ページ×平均順位×表示回数を取得する。⏱get_fields は呼ばない（fields=query,page,clicks,impressions,position・直近3ヶ月・対象KW部分一致で get_data を直接叩く）。結果はアンカー付きURL（#…）の行を除外し、クエリ×ページの上位20行に圧縮して返す（全量を返さない）。\n(2) エラー時は Ahrefs site-explorer-organic-keywords（ToolSearchで読込・target=super-yamadai.co.jp/article）で代替し、source にどちらを使ったか書く。\n(3) ' + ROOT + '/articles/公開記事一覧.md（sitemap由来の全公開記事・存在すれば最優先の台帳）と ' + ROOT + '/.claude/rules/internal-links.md をReadし既存記事一覧と照合する。\nどの既存URLが対象KW群を既に拾っているか（新規で作るとカニバるか・実はリライト案件か）の一次判定 verdict を返す。取得不能なら existing=[] で「未取得」と明示（捏造禁止・沈黙で埋めない）。', { schema: GSC_SCHEMA, phase: 'リサーチ', label: 'GSC:既存ランク', effort: 'medium' }),
  () => agent('対象KW=「' + KW + '」。このKWが指名・口コミ・評判・お試し・レビュー系（単一ブランドの購入判断KW）の場合のみ、実在口コミの候補を収集する（🚨15・19：口コミH2の見出しは実口コミ収集後に確定するため、リサーチ段階で先に集める）。比較・一般KW（「野菜 宅配」等）なら skip=true・items=[] で即返す。\n**3経路すべてを必ず試す（2026-08-04必須化）。1経路でも取れなかったら note にその旨と試したURLを書く。** 経路1=X（一次投稿）／経路2=みん評など中立の口コミ集約サイト（403のとき https://r.jina.ai/ 経由で再試行。デリピックス回はここに★2「不味い」が2件あり、Xだけで結論を出していたら「まずいという声はゼロ」という誤りのまま進むところだった）／経路3=App Store・Google Playの公式アプリレビュー（APPLION等の転載も可）。\n収集手順（writing-manual §A-7 の迂回路・死ぬ気で探す）:\n(1) ToolSearch("select:WebSearch,WebFetch") で読込 → WebSearch「{ブランド名} 口コミ」等で競合口コミ記事URLを2〜3件特定 → 各URLをWebFetchし「この記事に埋め込まれているX/Twitter投稿のURLを全て列挙して」と指示して実投稿URLを抽出する（競合記事自体は出典にしない・一次投稿URLだけ使う）。\n(2) 取得したツイートIDで https://cdn.syndication.twimg.com/tweet-result?id={ID}&token=a&lang=ja をWebFetchし、本文・表示名・@ハンドル・投稿日時を原文ママで取得する（要約・改変・捏造禁止）。\n(3) 公式アプリの App Store / Google Play レビューページ、公式が公開するアンケートページも探す。\n良い/気になる 各3〜4件を目標に、取れた分だけ返す（1件も取れなければ items=[] で「未取得」と note に明示。絶対に捏造しない）。⏱WebFetchのリトライは1回まで・タイムアウトしたドメインは以後 r.jina.ai 固定。', { schema: KUCHIKOMI_SCHEMA, phase: 'リサーチ', label: '口コミハンター', effort: 'high' }),
])
const kwData = researchTrio[0]
const serpData = researchTrio[1]
const gscData = researchTrio[2]
const kuchikomiData = researchTrio[3]

// ---- 整理 ----
phase('整理')
const brief = await agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」の研究データを整理する。\n【KWデータ】\n' + JSON.stringify(kwData, null, 2) + '\n【SERP・競合構成】\n' + JSON.stringify(serpData, null, 2) + '\n【自サイト既存ランク（GSC/Ahrefs）】\n' + JSON.stringify(gscData, null, 2) + '\n【実在口コミ候補（指名/レビュー系KWのみ・原文ママ）】\n' + JSON.stringify(kuchikomiData, null, 2) + '\n\n※口コミ候補がある場合、口コミH2のH3見出しは実際の声の内容に合わせて設計する（🚨15）。候補が空なら口コミH2を無理に作らず注意点に一本化する方針も検討する。\n\n次を出す: (a)検索意図と記事タイプ(SERP適合) (b)必須トピック=競合H2/H3クラスタの過半（8件基準） (c)ギャップ=競合が薄い所 (d)PAA/よくある質問（serpDataのpaa＝実SERP由来を優先し、サジェスト疑問形は補助。出所を区別） (e)共起語候補（依頼情報にあればそれを優先） (f)ペルソナ（依頼情報にあればそれを1:1で使い生成しない。なければSERP・KWから仮説化し「仮説」と明示・捏造禁止） (g)カニバリ（GSC実データ＋internal-links.md 照合。既存が拾っていれば棲み分け/統合/強化の対処方針まで） (h)モード一次判定（A リライト/B リポジショニング/C 新規。GSC実データ基準・依頼が新規でも既存が拾っていればリライト案件と明示） (i)記事の主役候補（ペルソナ最大不安/検索意図の核を2案・この後の構成生成の角度になるので互いに違う角度で）。researchMarkdown に読みやすくまとめ、構造化フィールドも返す。', { schema: BRIEF_SCHEMA, phase: '整理', label: '研究整理', effort: 'high' })

// ---- 構成 ----
phase('構成')
const fallbackAngles = ['ペルソナの最大不安の解消', '検索意図の核（実SERPが最も厚く答えている論点）']
const angleSrc = (brief && Array.isArray(brief.mainAngleCandidates)) ? brief.mainAngleCandidates.filter(Boolean) : []
const angles = (angleSrc.length >= 2 ? angleSrc.slice(0, 2) : angleSrc.concat(fallbackAngles).slice(0, 2))
const candidates = (await parallel(angles.map(function (a, i) {
  return function () {
    return agent('【参照ファイル（Readして反映）】\n- ' + REFS + '\n\n' + RULES + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」。下の研究ブリーフに基づき、要件定義書§6（固定テンプレ禁止・競合＋依頼/研究ドリブン）に従って構成案を作れ。角度: 記事の主役を「' + a + '」に置く。\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n\n必須: mainSubject（記事の主役を1つ明記）／タイトルはメインKW左詰め・35〜45字・年号記号なし（？・！は使ってよい）／各H2は1トピック・結論・平易・カッコなし・最短形（冗長修飾なし）・各H2に約束1文（promiseフィールドに）／FAQは本文未回収のPAA・サジェストから4〜6問（できれば6問・語尾「〜ですか？」）／お手本トーンに寄せる。構造化して返す。', { schema: OUTLINE_SCHEMA, phase: '構成', label: '構成:角度' + (i + 1), effort: 'high' })
  }
}))).filter(Boolean)

const judge = await agent('対象KW=「' + KW + '」。構成案候補を、見出しルール（1H2=1トピック/意味不明なし/焼き直しでない/主役が明確/結論型見出し/FAQ4〜6問）・§9論理整合・§8お手本文言・差別化・カニバリ・研究ブリーフ反映・依頼情報反映で採点し、最良を選び、他案から取り込む要素を挙げよ。\n' + REQUEST_BLOCK + '\n【候補】\n' + JSON.stringify(candidates, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2), { schema: { type: 'object', additionalProperties: false, properties: { winnerIndex: { type: 'number' }, graft: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' } }, required: ['winnerIndex', 'graft'] }, phase: '構成', label: '判定', effort: 'high' })

const wi = (judge && typeof judge.winnerIndex === 'number' && judge.winnerIndex >= 0 && judge.winnerIndex < candidates.length) ? judge.winnerIndex : 0
const winner = candidates[wi]

// ---- 検証 ----
phase('検証')
const lenses = [
  { key: '見出しルール+論理', p: RULES + '\n各H2が1トピックか(「〜と〜」で2論点にしていないか)・意味不明な圧縮見出しがないか・箱だけ見出し（結論のないトピック名）がないか・疑問符が入っていないか・FAQが4〜6問か・競合の焼き直しでなく主役が1つに尖っているか・§9の4テスト(約束/同粒度/前提/MECE)を、H2を1つずつ突き合わせて厳密に。違反を全て挙げ、直し見出し案を添える。' },
  { key: '日本語が一読で通じるか', p: '**ルール適合ではなく日本語そのものを検査する専用レンズ（2026-08-04新設）**。ルールブックは読まず、見出しを1本ずつ声に出して読み、次を判定せよ。(a)中学生が一読で像が浮かぶか（浮かばない例:「口に合わないときの食べ方」「副菜の出来」「おかずの質」）(b)口コミを主語にした擬人化になっていないか（例:「〜をほめている」「〜と書く人が多い」）(c)読めば分かる総括の空見出しでないか（例:「〜で決まる」「〜が大切」）(d)修飾語の詰め込みがないか (e)H2だけを上から読んで記事の筋が通るか (f)同じ語尾が3連続していないか。**「概ね読める」で通さず、1本でも引っかかったら直し見出し案を必ず添える。** 事実の正確さ・論理構造・カニバリは他レンズが見るので触れなくてよい。' },
  { key: 'お手本文言と法務', p: 'お手本(gold-example-style.md/structure-examples.md)と articles/完成済み/ の同カテゴリ記事のH2実物をReadし、(1)各見出しが結論・平易・非AI・カッコ記号疑問符なし・タイトルの数値/訴求を三重掲載しない、を満たすか（§8の14基準）(2)**H2に数字が入っていないか**（実額はH3・表へ・学び61）(3)**景表法**＝自社集計の数量（「口コミ20件中2件だけ」等）を優良方向の訴求に使っていないか(4)**信用毀損**＝訴求社の商品への否定的評価を断定していないか、を検証し直し案を添える。' },
  { key: '差別化カニバリ研究反映', p: 'internal-links.md/service-info.mdをReadし、(1)既存記事とのカニバリ棲み分け(単一指名記事を多社比較化していないか・GSCで既存記事が拾っているのに新規前提になっていないか) (2)競合上位の改善余地を突けているか (3)研究ブリーフの必須トピック取りこぼし・ギャップ独占ができているか (4)依頼情報（訴求順位・掲載サービス）が1:1で反映されているか を検証。\n【GSC既存ランク】\n' + JSON.stringify(gscData, null, 2) },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。下の構成案を敵対的に検証(観点=' + L.key + ')。「概ねOK」で通さない。\n【構成案】\n' + JSON.stringify(winner, null, 2) + '\n【研究ブリーフ】\n' + JSON.stringify(brief, null, 2) + '\n' + REQUEST_BLOCK + '\n\n観点: ' + L.p, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
  }
}))).filter(Boolean)

const final = await agent('【参照ファイル】\n- ' + REFS + '\n\n' + RULES + '\n\n' + FORMAT + '\n\n' + REQUEST_BLOCK + '\n\n対象KW=「' + KW + '」。最良案に、判定のgraftと敵対検証の指摘（特にmajor）を全て反映して完成構成案を作れ。\n【口コミ素材（実URL・原文ママ・改変禁止）】\n' + JSON.stringify(kuchikomiData, null, 2) + '\n【最良案】\n' + JSON.stringify(winner, null, 2) + '\n【判定】\n' + JSON.stringify(judge, null, 2) + '\n【検証】\n' + JSON.stringify(verifications, null, 2) + '\n\nfinalOutlineMarkdown に保存用の完成Markdownを入れる。構成: # タイトル／メタ／URLスラッグ／サブKW／「★主役＝…」の別行／各H2（見出し行は見出しのみ・次の行に「約束：…」を別行で・その下にH3箇条書き）／FAQ 4〜6問／カニバリ・差別化メモ／口コミ素材リスト（口コミハンターの実URL付き候補を「## 口コミ素材（実URL・原文ママ）」節として全件転記。空なら「未取得＝人が用意 or 注意点に一本化」と明記）／執筆時の要裏取りリスト。見出し行にカッコ注記は絶対に付けない。skillNotes に、この実走で気づいたスキル(要件定義書/SKILL.md/pipeline.js)の改善案を挙げる。', { schema: FINAL_SCHEMA, phase: '検証', label: '最終化', effort: 'high' })

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
  kuchikomi: kuchikomiData || null,
  skillNotes: finalOut ? (finalOut.skillNotes || []) : [],
  openIssues: openIssues,
  winnerIndex: wi,
  serpRaw: serpData ? serpData.serp : null,
  kwDataNote: kwData ? kwData.note : null,
}
