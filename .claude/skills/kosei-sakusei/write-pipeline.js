// 確定済み構成（articles/{KW}/outline.md）から本文執筆を並列実行するパイプライン（ヤマダイ版）。
// 実行: Workflow({scriptPath: "<このファイル>", args: "KW"})。前提: outline.md が確定済み（未確定なら先に kosei-sakusei / pipeline.js）。
// フロー: 準備(共起語計画) → 骨格(全H2並列) → 横断dedupe → 文章化(全H2並列・各自lint.sh) → 結合 → 検証4レンズ並列 → 修正 → 最終lint。
// 本体ループの担当: 実行前のoutline確定確認／完成後の意味レビュー(§E-12-b)・ゲート5（法令チェックリスト）・口コミ実URLの最終確認・チャット報告。
export const meta = {
  name: 'write-pipeline-yamadai',
  description: '確定構成から本文執筆（骨格→dedupe→文章化→検証→修正）を並列実行する（ヤマダイ・WordPress HTML）',
  phases: [
    { title: '準備', detail: 'outline読込・共起語配置計画・サービスデータ抽出' },
    { title: '骨格', detail: '全H2の骨格を並列生成（ゲート2相当）' },
    { title: '文章化', detail: '横断dedupe→全H2を並列で文章化・各自lint.sh ERROR 0まで' },
    { title: '検証', detail: '結合→重複/表現/KW/論理の4レンズ並列→修正→最終lint' },
  ],
}

const INPUT = (args && typeof args === 'object') ? args : { kw: args }
const KW = (INPUT.kw && String(INPUT.kw).trim()) ? String(INPUT.kw).trim() : ''
if (!KW) throw new Error('args にターゲットKWを渡してください（例: Workflow({scriptPath, args: "らでぃっしゅぼーや お試し"})）')
const ROOT = '/Users/manasimac/Projects/super-yamadai'
const DIR = ROOT + '/articles/' + KW
const OUTLINE = DIR + '/outline.md'
const RESEARCH = DIR + '/research.md'
const RULES_COMMON = '【全エージェント共通・最優先ルール（詳細は writing-manual.md が正本）】\n' +
  '- 執筆前に必ずReadする: ' + ROOT + '/.claude/rules/writing-manual.md（序章・該当節・付録1/2）、' + ROOT + '/references/gold-example-style.md（お手本・丸パクリ禁止）、' + OUTLINE + '\n' +
  '- 構成案のH2/H3見出しは1文字も変えない（変更が必要ならopenIssuesに書く・勝手に変えない）\n' +
  '- pタグ絶対禁止（WordPressが自動付与）。一文一改行（「。」の直後に空行）・1文60字以内\n' +
  '- 推測で数値を書かない。テーブル・画像・CTA・価格は ' + ROOT + '/.claude/rules/service-info.md からコピペ（1文字も変えない）。_table登録済み社はショートコード必須\n' +
  '- 口コミは outline.md の「口コミ素材」節の実URL・原文ママのみ使用（blockquote＋cite・§A-7）。素材がない口コミH3は書かずにopenIssuesへ（捏造絶対禁止）\n' +
  '- ミニ免責は本文で繰り返さず末尾免責に集約（§E-11）。法令セーフ変換表（付録1）を執筆段階で適用\n' +
  '- §E-12-a の1文ごとの自己検算（消しても意味が変わらない文は書かない・当たり前の総括禁止・中学生が一読で像が浮かぶ・既出と重複しない）'

const PLAN_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  h2s: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    index: { type: 'integer' }, heading: { type: 'string' }, promise: { type: 'string' },
    h3s: { type: 'array', items: { type: 'string' } },
    type: { type: 'string', description: 'サービス紹介/口コミ/選び方/メリット/注意点/FAQ/まとめ/とは/その他' },
    services: { type: 'array', items: { type: 'string' }, description: 'サービス紹介H2のみ: 掲載社を訴求順に' },
  }, required: ['index', 'heading', 'h3s', 'type'] } },
  cooccurrencePlanMarkdown: { type: 'string', description: 'ゲート1: 共起語→配置先H2/H3の計画（保存用Markdown）' },
  intro: { type: 'string', description: '導入文の設計メモ（PASONA・メインKW1文目）' },
  notes: { type: 'string' },
}, required: ['h2s', 'cooccurrencePlanMarkdown'] }

const SKELETON_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  index: { type: 'integer' }, heading: { type: 'string' },
  skeletonMarkdown: { type: 'string', description: 'H3ごとの論点(PREP)・使用パーツ(ul/表/ショートコード)・数値と裏取り元' },
  claims: { type: 'array', items: { type: 'string' }, description: 'このH2で述べる論点を1行ずつ（dedupe用）' },
}, required: ['index', 'heading', 'skeletonMarkdown', 'claims'] }

const DEDUPE_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  decisions: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    claim: { type: 'string' }, owner: { type: 'string', description: 'この論点を書くH2見出し' },
    dropFrom: { type: 'array', items: { type: 'string' }, description: 'この論点を削るH2見出し' },
  }, required: ['claim', 'owner'] } },
  note: { type: 'string' },
}, required: ['decisions'] }

const SECTION_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  index: { type: 'integer' }, heading: { type: 'string' },
  file: { type: 'string', description: '保存したファイルパス' },
  lintErrors: { type: 'integer' }, lintWarnings: { type: 'integer' },
  openIssues: { type: 'array', items: { type: 'string' } },
}, required: ['index', 'heading', 'file', 'lintErrors'] }

const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  lens: { type: 'string' }, pass: { type: 'boolean' },
  issues: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
    severity: { type: 'string', enum: ['minor', 'major'] },
  }, required: ['where', 'problem', 'severity'] } },
}, required: ['lens', 'pass', 'issues'] }

const FINAL_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  articleFile: { type: 'string' }, lintFinalErrors: { type: 'integer' },
  appliedFixes: { type: 'integer' }, openIssues: { type: 'array', items: { type: 'string' } },
}, required: ['articleFile', 'lintFinalErrors', 'openIssues'] }

// ---- 準備 ----
phase('準備')
const plan = await agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。執筆準備をする。\n(1) ' + OUTLINE + ' と（あれば）' + RESEARCH + ' をRead。\n(2) 全H2を構造化して返す（見出し・約束・配下H3・タイプ判定。サービス紹介H2は掲載社を訴求順に列挙）。導入文・まとめも h2s に含める（導入文は index=0・type=導入文）。\n(3) 共起語配置計画（ゲート1）: research/outlineの共起語リストを各H2/H3に分配し、保存用Markdownを cooccurrencePlanMarkdown に入れる（このMarkdownは ' + DIR + '/cooccurrence-plan.md にあなたがWriteで保存する）。\n(4) サービス紹介H2がある場合、service-info.md の該当社のショートコード有無（_table登録）を確認して notes に書く。', { schema: PLAN_SCHEMA, phase: '準備', label: '準備:計画', effort: 'medium' })
if (!plan || !plan.h2s || !plan.h2s.length) throw new Error('outline.md からH2計画を作れませんでした。outlineの確定を確認してください')

// ---- 骨格（全H2並列） ----
phase('骨格')
const writable = plan.h2s.filter(function (h) { return h.type !== '導入文' })
const skeletons = (await parallel(writable.map(function (h) {
  return function () {
    return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。H2「' + h.heading + '」（タイプ=' + h.type + '・約束=' + (h.promise || 'outline参照') + '）の骨格を作る。\n- ' + ROOT + '/references/h3-templates.md をReadしH3タイプ別骨格に従う。\n- 各H3のPREP骨格（結論1文目・根拠・具体・strong締め候補の有無）、使用パーツ（ul/表/ショートコード/blockquote）、書く数値とその裏取り元（service-info.md / outline要裏取りリスト）を skeletonMarkdown に。\n- 骨格は ' + DIR + '/skeleton-h2' + h.index + '.md にWriteで保存する（ゲート2）。\n- claims にこのH2で述べる論点を1行ずつ列挙（他H2との重複検出に使う）。\n【このH2のoutline抜粋】\n' + JSON.stringify(h, null, 2), { schema: SKELETON_SCHEMA, phase: '骨格', label: '骨格:' + h.heading.slice(0, 12), effort: 'medium' })
  }
}))).filter(Boolean)

// ---- 横断dedupe（barrier: 全骨格が必要） ----
const dedupe = await agent('対象KW=「' + KW + '」。全H2の骨格の論点リストを横断し、同じ事実・同じ論点が複数H2に出ていないか検出する（writing-manual §G-3・1事実1箇所）。重複ごとに「どのH2が書くか（owner）・どのH2から削るか（dropFrom）」を決めて返す。角度が本当に違う（選び方=判断基準/注意点=失敗と対策）ものは重複としない。\n【全骨格のclaims】\n' + JSON.stringify(skeletons.map(function (s) { return { heading: s.heading, claims: s.claims } }), null, 2), { schema: DEDUPE_SCHEMA, phase: '骨格', label: '横断dedupe', effort: 'high' })

// ---- 文章化（全H2並列・各自lint） ----
phase('文章化')
const sections = (await parallel(writable.map(function (h) {
  return function () {
    const skel = skeletons.find(function (s) { return s.index === h.index })
    const myDedupe = (dedupe && dedupe.decisions ? dedupe.decisions : []).filter(function (d) {
      return d.owner === h.heading || (d.dropFrom || []).indexOf(h.heading) !== -1
    })
    return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。H2「' + h.heading + '」を文章化する。\n手順:\n(1) writing-manual.md の該当節（' + h.type + '＝§A/B/D/E該当箇所）と gold-example-style.md をRead。\n(2) 骨格に従いHTMLで執筆（pタグなし・一文一改行・strongは§D-5の5パターンのみ）。サービス紹介は3〜5社ずつ内部で分割して書き結合（service-info.mdコピペ・_table社はショートコード）。口コミH2はoutlineの口コミ素材（実URL）のみ・blockquote＋cite形式。\n(3) dedupe指示に従う: owner=自分の論点は書く。dropFrom=自分の論点は書かない（別H2が担当）。\n(4) ' + DIR + '/draft-h2-' + h.index + '.html にWriteで保存 → bash で cd ' + JSON.stringify(ROOT) + ' && bash scripts/lint.sh "articles/' + KW + '/draft-h2-' + h.index + '.html" を実行（使い方が違えば scripts/lint.sh の冒頭をReadして確認）→ ERRORを自己修正して再実行（最大3周・ERROR 0まで）。\n(5) §E-12-a の意味自己検算を1周（情報ゼロ文・当たり前の総括・既出の言い換えを削除）。\n最終の lintエラー数・保存パス・自力で解決できなかった点（要裏取り・素材不足等）を返す。\n【骨格】\n' + (skel ? skel.skeletonMarkdown : 'skeleton-h2' + h.index + '.md をReadせよ') + '\n【dedupe指示（自分に関係する分）】\n' + JSON.stringify(myDedupe, null, 2), { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:' + h.heading.slice(0, 12), effort: 'high' })
  }
}))).filter(Boolean)

// ---- 導入文（本文完成後に書く・§0-4） ----
const introSec = await agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。全H2の本文が ' + DIR + '/draft-h2-*.html に揃った。導入文（H2なし・PASONA法・§A-2）とまとめ直前までの整合を確認しつつ、導入文を書いて ' + DIR + '/draft-h2-0.html に保存する。1文目にメインKW・末尾にstrong行動促し1文。直後のH2と内容を重複させない。lint.sh も同様に回して ERROR 0 に。\n【設計メモ】\n' + (plan.intro || 'outline参照'), { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:導入文', effort: 'high' })

// ---- 検証（結合→4レンズ並列） ----
phase('検証')
const assembleNote = 'draft-h2-0.html（導入文）→ index順の全draft-h2-N.html を結合したものが記事全文。'
const lenses = [
  { key: '重複・情報ゼロ文', p: 'セクション間の同一論点重複（§G-3）・情報ゼロ文（§E-12-a: 消しても意味が変わらない文・当たり前の総括・既出の言い換え）・strong締めと本文の重複を、全draftファイルをReadして検出する。' },
  { key: '表現・お手本', p: 'gold-example-style.md と prohibited-words.md のレイヤー8/10/13（文脈判断系）・付録2カテゴリA（硬い漢語）・AIメタ説明（学び35）・「〜済みます」等、lintで拾えない文脈違反を検出する。書き出しパターンの偏り（同型3回以上）も見る。' },
  { key: 'KW・共起語', p: 'cooccurrence-plan.md をReadし、メインKW配置（§F-1: 導入1文目・各H2・まとめ）・共起語の計画どおりの配置・過剰反復（スパム）を検証する。' },
  { key: 'PREP・論理', p: '各H3の1文目が結論か・主述一致・見出しと本文の整合・olリストとH3の完全一致・テーブル5行・H2タグ重複なし、を検証する。' },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。' + DIR + '/ の draft-h2-*.html 全部をReadし、記事全体を敵対的に検証する（観点=' + L.key + '）。「概ねOK」で通さない。指摘は where（ファイルとH2/H3）・problem・fix（具体的な直し）・severity で返す。\n' + assembleNote + '\n観点詳細: ' + L.p, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
  }
}))).filter(Boolean)

// ---- 修正→結合→最終lint ----
const finalOut = await agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。検証指摘を反映して記事を完成させる。\n(1) 検証のmajor指摘を全て・minorは妥当なものを、該当draftファイルにEditで反映する（H2/H3見出しは1文字も変えない）。\n(2) draft-h2-0.html → index順に全draftを結合し ' + DIR + '/article.html に保存。末尾免責ブロック（価格時点・%OFF/送料無料/返金保証の条件集約・§E-11）を確認、なければ追加。\n(3) bash で cd ' + JSON.stringify(ROOT) + ' && bash scripts/lint.sh "articles/' + KW + '/article.html" | tee "articles/' + KW + '/lint-final.txt" を実行し ERROR 0 まで修正（ゲート4）。\n(4) 対応できなかった指摘・人の判断が要る点（口コミ素材不足・要裏取り数値・法令の際どい表現）を openIssues に列挙。\n【検証指摘】\n' + JSON.stringify(verifications, null, 2) + '\n【各セクションのopenIssues】\n' + JSON.stringify(sections.concat(introSec ? [introSec] : []).map(function (s) { return { heading: s.heading, openIssues: s.openIssues || [] } }), null, 2), { schema: FINAL_SCHEMA, phase: '検証', label: '修正・結合・最終lint', effort: 'high' })

return {
  kw: KW,
  articleFile: finalOut ? finalOut.articleFile : DIR + '/article.html',
  lintFinalErrors: finalOut ? finalOut.lintFinalErrors : null,
  sections: sections.map(function (s) { return { heading: s.heading, lintErrors: s.lintErrors } }),
  verificationsSummary: verifications.map(function (v) { return { lens: v.lens, pass: v.pass, majors: v.issues.filter(function (i) { return i.severity === 'major' }).length } }),
  openIssues: (finalOut && finalOut.openIssues) || [],
  note: '本体ループの残タスク: §E-12-b意味レビュー1周・ゲート5（法令チェックリスト§G-5）・チャット報告。完成報告はゲート5通過後のみ。',
}
