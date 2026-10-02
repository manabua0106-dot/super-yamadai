// 確定済み構成（articles/{KW}/outline.md）から本文執筆を並列実行するパイプライン（ヤマダイ版）。
// 実行: Workflow({scriptPath: "<このファイル>", args: "KW"})。前提: outline.md が確定済み（未確定なら先に kosei-sakusei / pipeline.js）。
// フロー: 準備(共起語計画) → 骨格(全H2並列) → 横断dedupe → 文章化(全H2並列・各自lint.sh) → 結合 → 検証4レンズ並列 → 修正 → 最終lint + check-body-kw.py。
// 2026-09-09: 本文のKW・共起語を competitor 比で採点する scripts/check-body-kw.py を最終ゲートに追加した。
// 従来は検証レンズ「KW・共起語」がLLM判断だけで、機械で数える工程が無かった（学び60と同じ型の穴）。
// 2026-10-02 使用量対策（Manabuさん承認）：①service-info.md（約200KB）は自動では読み込まれなくなったので、各エージェントは自分の社の節だけ読む（RULES_COMMON）
//   ②2026-09-17〜18の再開用ワークフロー yamadai-write-resume で実際に指摘された教訓18項目を LESSONS として全エージェント・全検証レンズに渡す（既定をこのパイプラインに切り替えても品質を落とさないため）
//   ③導入文をH2の並列執筆と同じバッチで書く（従来は全H2のあとに直列で約3分）。従来どおり全H2のあとに書くときは args に {kw, introLast: true}
// 本体ループの担当: 実行前のoutline確定確認／完成後の意味レビュー（空文・重複・薄さ・硬さの一読）・納品前チェックリスト（CLAUDE.md §G-5）・口コミ実URLの最終確認・チャット報告。
export const meta = {
  name: 'write-pipeline-yamadai',
  description: '確定構成から本文執筆（骨格→dedupe→文章化→検証→修正）を並列実行する（ヤマダイ・WordPress HTML）',
  phases: [
    { title: '準備', detail: 'outline読込・共起語配置計画・サービスデータ抽出' },
    { title: '骨格', detail: '全H2の骨格を並列生成（ゲート2相当）' },
    { title: '文章化', detail: '横断dedupe→全H2と導入文を並列で文章化・各自lint.sh ERROR 0まで' },
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
// 2026-10-02 追加：再開用ワークフロー yamadai-write-resume（2026-09-17〜18・正規手順の再開用）で使っていた教訓のうち、本文の品質に関わるもの。番号は元のまま。
// 外した番号：15=見出しを変えるときの手順（本パイプラインは見出しを変えない）／16=service-info.md の更新手順（本パイプラインは更新しない）／17=その日限りの運用方針（確認不要・Codex不使用）／18=旧エージェント定義の廃止注記（本パイプラインの担当は汎用エージェント）
// 1・2・14 は、全担当が同じ作業を繰り返して使用量が増えないよう、誰がやるかを書き足してある（元の趣旨は変えていない）。
const LESSONS = [
  '【過去の指摘（2026-09-17〜18の本文執筆で実際にあった失敗。全工程で守る）】',
  '1. 事実は公式サイトの原文だけ。公式の「お知らせ」ページで販売終了・価格改定・受付休止を必ず確認する（ヨシケイではバリエーションダイニングの販売終了告知を見落としかけた）。公式に書かれていない順番・断定（「必ず電話が来る」「メニューブックが届いてから払う」等）を書かない。推測の文は削る。公式の取り直しは、本体が必要に応じて執筆前に service-freshness で行う。各担当は取り直さず、service-info.md と research.md の値を使う。古い疑い（価格改定・販売終了）があれば openIssues に書く',
  '2. （公式ページを取るとき）curl で取得し、script/style を除いてテキスト化して原文を読む。楽天市場は文字コード EUC-JP（decode("euc_jp")）。HTMLコメント <!-- --> の中の古い告知は表示されていないので事実に使わない。静的HTMLに無い値は無いと書き、推測で埋めない',
  '3. 条件付きの有利な数値は条件と同じ文か直前・直後に置く（初めての人限定／人数／地域／送料込み など。writing-manual §8・学び74）',
  '4. 本文の数字は表の値と同じ精度で書く（表が「約268円」なら本文も「約268円」。公式表記「270円程度」と混ぜない）。表に出した数字を本文で同じ角度で繰り返さない',
  '5. scripts/check-body-kw.py は <table> の中の語を数えない。Tier A（競合の全媒体が本文で使う語）は必ず表の外の本文に1回以上置く',
  '6. lint.sh は本文の「初回半額」を法令セーフ変換の ERROR にする（見出しでも使わない。「初めて頼むと半額」等にする）。「切り替え」「切り替わ」「切替」「迷う」「任せる」「差し替え」「並ぶ／並べる」「絞る」「ほめる」「対処」「〇都府県／都県」は使わない',
  '7. 1文60字以内。書き直した文は必ず数え直す（出典リンクのカッコは除いて数える）。<p>タグは書かない。一文ごとに空行',
  '8. H2直下の予告文は ol の全項目を受ける。リスク文は実在するリスクがあるときだけ（学び88の検算）。H3の1文目は見出しに答え、見出しの条件（「月曜から」等）を入れる',
  '9. 見出しの主張と関係ない公式情報を足さない（§9-g）。「公式サイトは〜にすすめています」には目的語（コース名など）を入れる。理由の文は「〜ため、〜」で結論とのつながりを文の中で言う',
  '10. 同じ文型を3回以上続けない。「次の通りです」「下記の通りです」は記事全体でそれぞれ2回まで。表記は「の通り」（「のとおり」にしない）・「%」半角',
  '11. 「問い合わせてください」「近くの〇〇に聞いてください」の誘導は、公式に情報がないときだけ。記事全体で3回まで',
  '12. 導入文の1文目に記事の価値（安さ・条件）を入れる。まとめの1文目は導入1文目・本文と一致率0.5未満の別の角度（数字＋条件など）。まとめで新しい事実を出さない',
  '13. FAQの回答は1文目で質問に答える（できる／できない／公式に記載がない）',
  '14. 公開済みの同ブランド記事（articles/完成済み/ 配下）と同じ文・ほぼ同じ文を書かない。確認（Python の difflib.SequenceMatcher で一致率0.6以上の文が無いこと）は最終の修正・結合の担当が記事全体で1回だけ行う。各H2の担当は確認せず、完成済みの記事の文をそのまま使わない',
  '【2026-09-18 追加：並列の本文執筆で過去に指摘された欠陥】',
  '19. 記事の構造を指すメタ言及を書かない（「次の見出しから詳しく紹介します」「次で確認します」「上で確認した〜」「以下で」）。書き終えたら `grep -nE "次の見出し|次で確認|次章|後述|上で確認した|以下で"` で探し、削除するか実額・結論に置き換える',
  '20. 導入文や前のパーツで書いた基本事実（運営会社・カテゴリ・特徴）を、後のH2・H3で初出のように説明し直さない。H3の1文目と最後の1文が同じ主張の言い換え（サンドイッチ型）なら最後の文を削る',
  '21. H3の結論文・締め文を一般論で終わらせない（「〜より高くなります」「〜が大変です」「さらに下げられます」）。記事内の他のパーツや表で確定済みの数字（送料・1食あたり・締切日数・割引率）を使って、読者が具体的な金額・日数・行動を思い浮かべられる文にする',
  '22. FAQ・まとめ以外で配下にH3が2本以上あるH2は、H2直下の予告文の直後に配下H3見出しと一字一句同じ li の ol（サービス比較なら表）を必ず置く。一部のH2だけ抜けるムラが過去に起きたので、書いた後に `grep -n "<h2>\\|<h3>\\|<ol>"` で確かめる',
].join('\n')

// 2026-08-06修正：writing-manual v5.0（製本方式）刷新で旧§A-L番号体系が全廃されたのに追随していなかった（write-pipeline.jsは実行コードのため、放置すると廃止済みPASONA法等が本文執筆のたびに実際に発火する）。article-structure.mdをRead対象に追加（writing-manual.mdと「2つで1組」の骨格正本だったが今まで一度も参照されていなかった）。
const RULES_COMMON = '【全エージェント共通・最優先ルール（詳細は writing-manual.md＋article-structure.md が正本・2つで1組）】\n' +
  '- 執筆前に必ずReadする: ' + ROOT + '/.claude/rules/writing-manual.md（文の書き方）、' + ROOT + '/.claude/rules/article-structure.md（記事の骨格・導入文/サービス紹介/まとめの型）、' + ROOT + '/references/gold-example-style.md（お手本・丸パクリ禁止）、' + OUTLINE + '\n' +
  '- 構成案のH2/H3見出しは1文字も変えない（変更が必要ならopenIssuesに書く・勝手に変えない）\n' +
  '- pタグ絶対禁止（WordPressが自動付与）。一文一改行（「。」の直後に空行）・1文60字以内\n' +
  '- 推測で数値を書かない。テーブル・画像・CTA・価格は ' + ROOT + '/.claude/rules/service-info.md からコピペ（1文字も変えない）。_table登録済み社はショートコード必須\n' +
  '- 【使用量の節約・2026-10-02】service-info.md は約1,750行・200KBあり、自動では読み込まれない。全文を読まない。`grep -n "^### " ' + ROOT + '/.claude/rules/service-info.md` で節の位置を出し、自分のH2で使う社の節だけを Read の offset/limit で読む（1社の節は、次の「### 」または「## 」の直前まで）\n' +
  '- 口コミは outline.md の「口コミ素材」節の実URL・原文ママのみ使用（blockquote＋cite・writing-manual.md §6）。素材がない口コミH3は書かずにopenIssuesへ（捏造絶対禁止）\n' +
  '- ミニ免責は本文で繰り返さず末尾免責に集約。法令セーフ変換表（writing-manual.md 付録：法令セーフ変換）を執筆段階で適用（writing-manual.md §8）\n' +
  '- 1文ごとに自己検算する（消しても意味が変わらない文は書かない・当たり前の総括禁止・中学生が一読で像が浮かぶ・既出と重複しない）\n' +
  LESSONS

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
const sectionTasks = writable.map(function (h) {
  return function () {
    const skel = skeletons.find(function (s) { return s.index === h.index })
    const myDedupe = (dedupe && dedupe.decisions ? dedupe.decisions : []).filter(function (d) {
      return d.owner === h.heading || (d.dropFrom || []).indexOf(h.heading) !== -1
    })
    return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。H2「' + h.heading + '」を文章化する。\n手順:\n(1) writing-manual.md の該当節（' + h.type + '＝§A/B/D/E該当箇所）と gold-example-style.md をRead。\n(2) 骨格に従いHTMLで執筆（pタグなし・一文一改行・strongは§D-5の5パターンのみ）。サービス紹介は3〜5社ずつ内部で分割して書き結合（service-info.mdコピペ・_table社はショートコード）。口コミH2はoutlineの口コミ素材（実URL）のみ・blockquote＋cite形式。\n(3) dedupe指示に従う: owner=自分の論点は書く。dropFrom=自分の論点は書かない（別H2が担当）。\n(4) ' + DIR + '/draft-h2-' + h.index + '.html にWriteで保存 → bash で cd ' + JSON.stringify(ROOT) + ' && bash scripts/lint.sh "articles/' + KW + '/draft-h2-' + h.index + '.html" を実行（使い方が違えば scripts/lint.sh の冒頭をReadして確認）→ ERRORを自己修正して再実行（最大3周・ERROR 0まで）。\n(5) §E-12-a の意味自己検算を1周（情報ゼロ文・当たり前の総括・既出の言い換えを削除）。\n最終の lintエラー数・保存パス・自力で解決できなかった点（要裏取り・素材不足等）を返す。\n【骨格】\n' + (skel ? skel.skeletonMarkdown : 'skeleton-h2' + h.index + '.md をReadせよ') + '\n【dedupe指示（自分に関係する分）】\n' + JSON.stringify(myDedupe, null, 2), { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:' + h.heading.slice(0, 12), effort: 'high' })
  }
})

// ---- 導入文（2026-10-02から、H2の並列執筆と同じバッチで書く。args の introLast:true で従来の「全H2のあと」に戻せる） ----
const introTask = function () {
  const claimsText = JSON.stringify(skeletons.map(function (s) { return { heading: s.heading, claims: s.claims } }), null, 2)
  const when = INPUT.introLast
    ? '全H2の本文が ' + DIR + '/draft-h2-*.html に揃った。まとめ直前までの整合を確認しつつ、'
    : '各H2の本文は別の担当が並行して書いている（まだ揃っていない）。下の「各H2が扱う論点」だけを前提にし、各H2が担当する事実を導入文で先取りして書かない。'
  return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。' + when + '導入文（H2なし・article-structure.md §2の4文構成：事実→リスク→この記事の内容→strong行動促し）を書いて ' + DIR + '/draft-h2-0.html に保存する。1文目にメインKW・末尾にstrong行動促し1文。直後のH2と内容を重複させない。lint.sh も同様に回して ERROR 0 に。\n【設計メモ】\n' + (plan.intro || 'outline参照') + '\n【各H2が扱う論点（骨格のclaims）】\n' + claimsText, { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:導入文', effort: 'high' })
}
const written = await parallel(INPUT.introLast
  ? [function () { return parallel(sectionTasks) }]
  : [function () { return parallel(sectionTasks) }, introTask])
const sections = (written[0] || []).filter(Boolean)
const introSec = INPUT.introLast ? await introTask() : written[1]

// ---- 検証（結合→4レンズ並列） ----
phase('検証')
const assembleNote = 'draft-h2-0.html（導入文）→ index順の全draft-h2-N.html を結合したものが記事全文。'
const lenses = [
  { key: '重複・情報ゼロ文', p: 'セクション間の同一論点重複（1事実1箇所）・情報ゼロ文（消しても意味が変わらない文・当たり前の総括・既出の言い換え）・strong締めと本文の重複を、全draftファイルをReadして検出する。導入文は各H2と並行して書いているため、導入文が各H2の事実を先取りして重複していないか、導入1文目とまとめ1文目の一致率が0.5未満かも見る。' },
  { key: '表現・お手本', p: 'gold-example-style.md と prohibited-words.md のレイヤー8/10/13（文脈判断系）・付録2カテゴリA（硬い漢語）・AIメタ説明（学び35）・「〜済みます」等、lintで拾えない文脈違反を検出する。書き出しパターンの偏り（同型3回以上）も見る。' },
  { key: 'KW・共起語', p: 'cooccurrence-plan.md をReadし、メインKW配置（§F-1: 導入1文目・各H2・まとめ）・共起語の計画どおりの配置・過剰反復（スパム）を検証する。' },
  { key: 'PREP・論理', p: '各H3の1文目が結論か・主述一致・見出しと本文の整合・olリストとH3の完全一致・テーブル5行・H2タグ重複なし、を検証する。' },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。' + DIR + '/ の draft-h2-*.html 全部をReadし、記事全体を敵対的に検証する（観点=' + L.key + '）。「概ねOK」で通さない。指摘は where（ファイルとH2/H3）・problem・fix（具体的な直し）・severity で返す。\n' + assembleNote + '\n観点詳細: ' + L.p + '\n\n【過去の指摘（この型の違反を探す。見つけたら where に番号つきで書く）】\n' + LESSONS, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
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
