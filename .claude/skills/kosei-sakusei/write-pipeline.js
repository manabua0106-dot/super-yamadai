// 確定済み構成（articles/{KW}/outline.md）から本文執筆を並列実行するパイプライン（ヤマダイ版）。
// 実行: Workflow({scriptPath: "<このファイル>", args: "KW"})。前提: outline.md が確定済み（未確定なら先に kosei-sakusei / pipeline.js）。
// フロー: 準備(共起語計画) → 骨格(全H2並列) → 横断dedupe → 文章化(全H2並列・各自lint.sh) → 結合 → 検証5レンズ並列 → 修正 → 最終lint + check-body-kw.py。
// 2026-09-09: 本文のKW・共起語を competitor 比で採点する scripts/check-body-kw.py を最終ゲートに追加した。
// 従来は検証レンズ「KW・共起語」がLLM判断だけで、機械で数える工程が無かった（学び60と同じ型の穴）。
// 2026-10-02 使用量対策（Manabuさん承認）：①service-info.md（約200KB）は自動では読み込まれなくなったので、各エージェントは自分の社の節だけ読む（RULES_COMMON）
//   ②2026-09-17〜18の再開用ワークフロー yamadai-write-resume で実際に指摘された教訓18項目を LESSONS として全エージェント・全検証レンズに渡す（既定をこのパイプラインに切り替えても品質を落とさないため）
//   ④情報台帳（outline.md の「## 情報台帳」）があれば全担当に渡す。args に {kw, lean: true} で、骨格と横断dedupeを省ける（台帳がある構成だけ。台帳が置き場所を先に決めているため）
//   ③導入文をH2の並列執筆と同じバッチで書く（従来は全H2のあとに直列で約3分）。従来どおり全H2のあとに書くときは args に {kw, introLast: true}
// 本体ループの担当: 実行前のoutline確定確認／完成後の意味レビュー（空文・重複・薄さ・硬さの一読）・納品前チェックリスト（CLAUDE.md §G-5）・口コミ実URLの最終確認・チャット報告。
export const meta = {
  name: 'write-pipeline-yamadai',
  description: '確定構成から本文執筆（骨格→dedupe→文章化→検証→修正）を並列実行する（ヤマダイ・WordPress HTML）',
  phases: [
    { title: '準備', detail: 'outline読込・共起語配置計画・サービスデータ抽出' },
    { title: '骨格', detail: '全H2の骨格を並列生成（ゲート2相当）' },
    { title: '文章化', detail: '横断dedupe→全H2と導入文を並列で文章化・各自lint.sh ERROR 0まで' },
    { title: '検証', detail: '結合→重複/表現/KW/論理/日本語の一読の5レンズ並列→修正→最終lint' },
  ],
}

const INPUT = (args && typeof args === 'object') ? args : { kw: args }
const KW = (INPUT.kw && String(INPUT.kw).trim()) ? String(INPUT.kw).trim() : ''
if (!KW) throw new Error('args にターゲットKWを渡してください（例: Workflow({scriptPath, args: "らでぃっしゅぼーや お試し"})）')
const LEAN = !!INPUT.lean   // 台帳がある構成だけ。骨格と横断dedupeを省く（約12エージェント）
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
  '10. 同じ文型を3回以上続けない。ただし「〜は以下のとおりです。」は表・箇条書きへ渡す標準の文（最上位ルール0-14）なので回数の上限はない。それ以外の誘導文は記事全体で2回まで。表記は「のとおり」（「の通り」にしない。2026-10-08 に統一）・「%」半角',
  '11. 「問い合わせてください」「近くの〇〇に聞いてください」の誘導は、公式に情報がないときだけ。記事全体で3回まで',
  '12. 導入は article-structure.md §2 の型に固定（「悩み」2行を「」で囲む→こんなお悩みはありませんか。→共感1文→この記事では〜をわかりやすく解説します。）。まとめの1文目は導入の悩み・本文と一致率0.5未満の別の角度（数字＋条件など）。まとめで新しい事実を出さない',
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
  '- 執筆前に必ずReadする: ' + ROOT + '/.claude/rules/writing-manual.md（文の書き方）、' + ROOT + '/.claude/rules/article-structure.md（記事の骨格・導入文/サービス紹介/まとめの型）、' + ROOT + '/references/gold-example-style.md（お手本・丸パクリ禁止）、' + ROOT + '/references/gold-article.md（見本記事の地図。§0を満たしてフィックス済みの記事。自分が書くパーツと同じ場所だけを、見出しの位置を grep -n で探して Read の offset/limit で読む。全文は読まない・丸パクリ禁止・サービス固有の事実は写さない）、' + OUTLINE + '\n' +
  '- 構成案のH2/H3見出しは1文字も変えない（変更が必要ならopenIssuesに書く・勝手に変えない）\n' +
  '- 【最上位ルール・2026-10-08（他のどのルールより優先）】' + ROOT + '/.claude/rules/writing-manual.md の §0（0-1〜0-19）を守る。要点：①主語・目的語を省かず、1文で何の話か分かるように書く（ol・ul・表の直前の文にはメインKWの語幹を入れる）。ただし同じ書き出しを3回続けず、前の文の新しい情報を主題にして受ける ②「型」だけで言わず「宅配型のウォーターサーバーは」と書く ③読者の行動を「決めます」と言い切らず「決めましょう」 ④サービス名・機種名は文章・箇条書きに書かず表にし、表の行頭にジャンプリンク（例外：サービス紹介H3の中・表のセル・口コミの出典を紹介する行） ⑤表・箇条書きへは「〜は以下のとおりです。」で渡し、「表にまとめます」と宣言しない ⑥「社」単体・「社名」を使わない（サービス・サービス名） ⑦注意書き・免責・断り書きは本文に書かず記事末尾の「※」に集約 ⑧「案内している」型の伝聞を書かない ⑨同じ行の表を同じ見出しに置かない ⑩おすすめを紹介するサービス紹介H3に解約・休止・手数料などのデメリットを書かない ⑪サービス紹介H3は <h3 id="1a">→[xxx_table]→strong1文目→本文→CTA [xxx] の宅食と同じ構造（<a id>・[btn]を使わない） ⑫導入は「悩み」2行を「」で囲む型（＃は書かない・strongなし） ⑬表は全セル（thとtd）に style=\"width: N%;\" を付け、列の合計を100%・全行で同じ幅にする（内容が長い列を広く） ⑭「確かめましょう」「公式サイトで確認してください」「FAQで見てみましょう」のように確かめる先を示すだけの文を書かない（何を基準にどれを選ぶかを書く。末尾の※免責だけ可） ⑮口コミ・投稿を紹介する文で書き手を「使う人」と書かず「使っている人」「使った人」と書く ⑯数字・場面の具体例を出す文は「たとえば」「具体的には」を頭に付ける（サービス名・機種名の例は表にする）。lint.sh は check-subject-object.py を内蔵しているので、ERROR 0にしてから返す\n' +
  '- pタグ絶対禁止（WordPressが自動付与）。一文一改行（「。」の直後に空行）・1文60字以内\n' +
  '- 推測で数値を書かない。テーブル・画像・CTA・価格は ' + ROOT + '/.claude/rules/service-info.md からコピペ（1文字も変えない）。_table登録済み社はショートコード必須\n' +
  '- 【使用量の節約・2026-10-02】service-info.md は約1,750行・200KBあり、自動では読み込まれない。全文を読まない。`grep -n "^### " ' + ROOT + '/.claude/rules/service-info.md` で節の位置を出し、自分のH2で使う社の節だけを Read の offset/limit で読む（1社の節は、次の「### 」または「## 」の直前まで）\n' +
  '- 【情報台帳・2026-10-02】' + OUTLINE + ' に「## 情報台帳」の節があるときは、自分のH2・H3が置き場所の行だけを書く。他のH3が置き場所の情報と、台帳で「入れない」の情報は書かない（同じ情報を2か所に書かない）。台帳が無い構成には適用しない\n' +
  '- 口コミは outline.md の「口コミ素材」節の実URL・原文ママのみ使用（blockquote＋cite・writing-manual.md §6）。素材がない口コミH3は書かずにopenIssuesへ（捏造絶対禁止）\n' +
  '- ミニ免責は本文で繰り返さず末尾免責に集約。法令セーフ変換表（writing-manual.md 付録：法令セーフ変換）を執筆段階で適用（writing-manual.md §8）\n' +
  '- 1文ごとに自己検算する（消しても意味が変わらない文は書かない・当たり前の総括禁止・中学生が一読で像が浮かぶ・既出と重複しない）\n' +
  LESSONS

const LEAN_SKELETON = '（lean実行のため骨格ファイルは無い）' + OUTLINE + ' の自分のH2の「約束：」行・配下のH3・「## 情報台帳」の自分が置き場所の行・「執筆時の要裏取り」を骨格として使う。H3ごとに、結論の1文目・根拠・具体（数値は service-info.md の該当社の節の値だけ）・使うパーツ（ul/表/ショートコード）を決めてから書く。台帳で他のH3が置き場所の情報は書かない'
const PLAN_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  h2s: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
    index: { type: 'integer' }, heading: { type: 'string' }, promise: { type: 'string' },
    h3s: { type: 'array', items: { type: 'string' } },
    type: { type: 'string', description: 'サービス紹介/口コミ/選び方/メリット/注意点/FAQ/まとめ/とは/その他' },
    services: { type: 'array', items: { type: 'string' }, description: 'サービス紹介H2のみ: 掲載社を訴求順に' },
  }, required: ['index', 'heading', 'h3s', 'type'] } },
  cooccurrencePlanMarkdown: { type: 'string', description: 'ゲート1: 共起語→配置先H2/H3の計画（保存用Markdown）' },
  intro: { type: 'string', description: '導入の設計メモ（article-structure.md §2の型：「悩み」2行を「」で囲む→こんなお悩みはありませんか。→共感1文→この記事では〜解説します。・悩み1にメインKW）' },
  notes: { type: 'string' },
  hasLedger: { type: 'boolean', description: 'outline.md に「## 情報台帳」の節があるか' },
}, required: ['h2s', 'cooccurrencePlanMarkdown', 'hasLedger'] }

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
const plan = await agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。執筆準備をする。\n(1) ' + OUTLINE + ' と（あれば）' + RESEARCH + ' をRead。\n(2) 全H2を構造化して返す（見出し・約束・配下H3・タイプ判定。サービス紹介H2は掲載社を訴求順に列挙）。導入文・まとめも h2s に含める（導入文は index=0・type=導入文）。\n(3) 共起語配置計画（ゲート1）: **' + DIR + '/cooccurrence.json（構成フェーズでラッコ co-occurrence の実測を保存したもの）をReadし、siteCountTotal の高い語から**各H2/H3に分配し、**Tier A（競合の全媒体が本文で使う語）は全語を必ず配置先に割り当てる**。割り当てられない語は「配置しない語」節に理由を書く（後段の check-body-kw.py がこの表と本文を突合する）。cooccurrence.json が無い場合はその旨を notes に書き、LLMの推測で共起語リストを作らない。保存用Markdownを cooccurrencePlanMarkdown に入れる（このMarkdownは ' + DIR + '/cooccurrence-plan.md にあなたがWriteで保存する）。\n(4) サービス紹介H2がある場合、service-info.md の該当社のショートコード有無（_table登録）を確認して notes に書く。\n(5) ' + OUTLINE + ' に「## 情報台帳」の節があるかを hasLedger に true/false で返す。', { schema: PLAN_SCHEMA, phase: '準備', label: '準備:計画', effort: 'medium' })
if (LEAN && plan && !plan.hasLedger) throw new Error('lean は outline.md に「## 情報台帳」がある構成でだけ使えます。台帳が無い構成は lean なしで実行してください')
if (!plan || !plan.h2s || !plan.h2s.length) throw new Error('outline.md からH2計画を作れませんでした。outlineの確定を確認してください')

// ---- 骨格（全H2並列） ----
phase('骨格')
const writable = plan.h2s.filter(function (h) { return h.type !== '導入文' })
const skeletons = LEAN ? [] : (await parallel(writable.map(function (h) {
  return function () {
    return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。H2「' + h.heading + '」（タイプ=' + h.type + '・約束=' + (h.promise || 'outline参照') + '）の骨格を作る。\n- ' + ROOT + '/references/h3-templates.md をReadしH3タイプ別骨格に従う。\n- 各H3のPREP骨格（結論1文目・根拠・具体・strong締め候補の有無）、使用パーツ（ul/表/ショートコード/blockquote）、書く数値とその裏取り元（service-info.md / outline要裏取りリスト）を skeletonMarkdown に。\n- 骨格は ' + DIR + '/skeleton-h2' + h.index + '.md にWriteで保存する（ゲート2）。\n- OUTLINEに「## 情報台帳」があれば、このH2の各H3が置き場所の行を「このH3で初めて出す新情報」として骨格に書く。台帳で他のH3が置き場所の情報は書かない。\n- claims にこのH2で述べる論点を1行ずつ列挙（他H2との重複検出に使う）。\n【このH2のoutline抜粋】\n' + JSON.stringify(h, null, 2), { schema: SKELETON_SCHEMA, phase: '骨格', label: '骨格:' + h.heading.slice(0, 12), effort: 'medium' })
  }
}))).filter(Boolean)

// ---- 横断dedupe（barrier: 全骨格が必要） ----
const dedupe = LEAN ? null : await agent('対象KW=「' + KW + '」。全H2の骨格の論点リストを横断し、同じ事実・同じ論点が複数H2に出ていないか検出する（1事実1箇所の原則）。重複ごとに「どのH2が書くか（owner）・どのH2から削るか（dropFrom）」を決めて返す。角度が本当に違う（選び方=判断基準/注意点=失敗と対策）ものは重複としない。\n【全骨格のclaims】\n' + JSON.stringify(skeletons.map(function (s) { return { heading: s.heading, claims: s.claims } }), null, 2), { schema: DEDUPE_SCHEMA, phase: '骨格', label: '横断dedupe', effort: 'high' })

// ---- 文章化（全H2並列・各自lint） ----
phase('文章化')
const sectionTasks = writable.map(function (h) {
  return function () {
    const skel = skeletons.find(function (s) { return s.index === h.index })
    const myDedupe = (dedupe && dedupe.decisions ? dedupe.decisions : []).filter(function (d) {
      return d.owner === h.heading || (d.dropFrom || []).indexOf(h.heading) !== -1
    })
    return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。H2「' + h.heading + '」を文章化する。\n手順:\n(1) writing-manual.md（該当タイプ=' + h.type + '）と article-structure.md（該当セクション）と gold-example-style.md と見本記事の同じ種類のパーツ（gold-article.md の地図で場所を確認）をRead。\n(2) 骨格に従いHTMLで執筆（pタグなし・一文一改行・strongはwriting-manual.md §5の3パターンのみ：サービス紹介の1文目／CTA直前の価格訴求／まとめの行動促し）。サービス紹介は3〜5社ずつ内部で分割して書き結合（service-info.mdコピペ・_table社はショートコード）。口コミH2はoutlineの口コミ素材（実URL）のみ・blockquote＋cite形式。\n(3) dedupe指示に従う: owner=自分の論点は書く。dropFrom=自分の論点は書かない（別H2が担当）。\n(4) ' + DIR + '/draft-h2-' + h.index + '.html にWriteで保存 → bash で cd ' + JSON.stringify(ROOT) + ' && bash scripts/lint.sh "articles/' + KW + '/draft-h2-' + h.index + '.html" を実行（使い方が違えば scripts/lint.sh の冒頭をReadして確認）→ ERRORを自己修正して再実行（最大3周・ERROR 0まで）。\n(5) 意味自己検算を1周（情報ゼロ文・当たり前の総括・既出の言い換えを削除）。\n最終の lintエラー数・保存パス・自力で解決できなかった点（要裏取り・素材不足等）を返す。\n【骨格】\n' + (skel ? skel.skeletonMarkdown : (LEAN ? LEAN_SKELETON : 'skeleton-h2' + h.index + '.md をReadせよ')) + '\n【dedupe指示（自分に関係する分）】\n' + JSON.stringify(myDedupe, null, 2), { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:' + h.heading.slice(0, 12), effort: 'high' })
  }
})

// ---- 導入文（2026-10-02から、H2の並列執筆と同じバッチで書く。args の introLast:true で従来の「全H2のあと」に戻せる） ----
const introTask = function () {
  const claimsText = LEAN ? '（骨格を作らない実行のため省略。' + OUTLINE + ' の各H2の「約束：」行と「## 情報台帳」を読む）' : JSON.stringify(skeletons.map(function (s) { return { heading: s.heading, claims: s.claims } }), null, 2)
  const when = INPUT.introLast
    ? '全H2の本文が ' + DIR + '/draft-h2-*.html に揃った。まとめ直前までの整合を確認しつつ、'
    : '各H2の本文は別の担当が並行して書いている（まだ揃っていない）。下の「各H2が扱う論点」だけを前提にし、各H2が担当する事実を導入文で先取りして書かない。'
  return agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。' + when + '導入（H2なし・article-structure.md §2の型：「読者の悩み」2行をそれぞれ「」で囲んで続けて置く／空行／こんなお悩みはありませんか。／空行／共感の1文（〜ですよね。）／空行／この記事では、〜をわかりやすく解説します。。＃は書かない・strongは置かない）を書いて ' + DIR + '/draft-h2-0.html に保存する。悩み1にメインKWを入れる。直後のH2と内容を重複させない。lint.sh も同様に回して ERROR 0 に。\n【設計メモ】\n' + (plan.intro || 'outline参照') + '\n【各H2が扱う論点（骨格のclaims）】\n' + claimsText, { schema: SECTION_SCHEMA, phase: '文章化', label: '執筆:導入文', effort: 'high' })
}
const written = await parallel(INPUT.introLast
  ? [function () { return parallel(sectionTasks) }]
  : [function () { return parallel(sectionTasks) }, introTask])
const sections = (written[0] || []).filter(Boolean)
const introSec = INPUT.introLast ? await introTask() : written[1]

// ---- 検証（結合→5レンズ並列） ----
phase('検証')
const assembleNote = 'draft-h2-0.html（導入文）→ index順の全draft-h2-N.html を結合したものが記事全文。'
const lenses = [
  { key: '重複・情報ゼロ文', p: 'セクション間の同一論点重複（1事実1箇所）・情報ゼロ文（消しても意味が変わらない文・当たり前の総括・既出の言い換え）・strong締めと本文の重複を、全draftファイルをReadして検出する。' + OUTLINE + ' に「## 情報台帳」があれば、台帳の置き場所以外に同じ情報が書かれていないかも見る。導入文は各H2と並行して書いているため、導入文が各H2の事実を先取りして重複していないか、導入の悩み1とまとめ1文目の一致率が0.5未満かも見る。' },
  { key: '表現・お手本', p: 'gold-example-style.md・見本記事（gold-article.md の地図）と prohibited-words.md のレイヤー8/10/13（文脈判断系）・付録2カテゴリA（硬い漢語）・AIメタ説明（学び35）・「〜済みます」等、lintで拾えない文脈違反を検出する。書き出しパターンの偏り（同型3回以上）も見る。あわせて writing-manual.md §0（最上位ルール）のうち機械で見られない部分を全文で検証する：各文を単独で読んで何の話か分かるか（0-1）、主語を毎回書いて羅列になっていないか（0-10）、読者の行動を言い切っていないか（0-3）、サービス名が文章・箇条書きに出ていないか（0-12）、表への渡しが「表にまとめます」の宣言になっていないか（0-14）。' },
  { key: 'KW・共起語', p: 'まず機械で数える。bash で cd <ROOT> && python3 scripts/check-body-kw.py "articles/<KW>/cooccurrence.json" "articles/<KW>/competitor.json" "articles/<KW>/article.html" "<メインKW>" "articles/<KW>/cooccurrence-plan.md" を実行し、出力をそのまま根拠として引用する（実行できない場合はその旨を明記し、目視だけで合格と書かない）。'
    + '判定基準: Tier A（競合の全媒体が本文で使う語）のカバー率が100%（入れない語は cooccurrence-plan.md の「配置しない語」に理由を書けば合格に数える）で合格・理由なしの未達はWARN・80%未満はERROR。メインKWの密度が競合平均を下回ったらERROR（上限は設けない）。cooccurrence-plan.md に書いたのに本文に無い語があればERROR。'
    + 'そのうえで cooccurrence-plan.md をReadし、メインKW配置（導入の悩み1・各H2・まとめ）・共起語の計画どおりの配置・過剰反復（スパム）を検証する。'
    + '⚠️ 語を入れ替えたら3検査を通す（auto-memory midashi-jitsuzai-kensa）＝(a)実在検査: 見出しや本文で名詞として使う語がサービスに実在するか。実在しないなら名詞で貼らず動詞形にする（「お試しセット」が存在しないのに名詞で貼った事故） (b)入れ替え後の音読: 差し替えた後の文を読み直す (c)前提検査: 競合が持っていて自社ブランドに無い商品・機能の語はカバー率のために貼らない。'
    + '⚠️ 語を機械的にねじ込ませない。入らない語は(1)そのトピックを本文で扱っていない＝構成の抜け (2)使わないと決めた＝cooccurrence-plan.md の「配置しない語」節に理由を書く、のどちらかで解消する。埋めるために文を足すと writing-manual §9「削る8パターン」に触れる。' },
  { key: '日本語の一読', p: 'ルール適合ではなく、全draftファイルを頭から1文ずつ声に出して読み、日本語ネイティブの読者が引っかかる不自然な箇所を挙げる（ルールや過去の指摘に引きずられず、読んでの違和感を優先する）。観点：時制・アスペクトのずれ（実際に使っている人の投稿を「Xを使う人の投稿」と書くなど）、主語と述語がかみ合わない文、主語が省かれて何の話か分からない文、助詞の不自然さ、読者が日常で使わない硬い語、何を指すか曖昧な名詞、近接した同語の繰り返し。口コミ引用の中身は原文ママなので対象外。事実の正誤は見ない。各指摘に直した文の案を付ける。' },
  { key: 'PREP・論理', p: '各H3の1文目が結論か・主述一致・見出しと本文の整合・olリストとH3の完全一致・テーブル5行・H2タグ重複なし、を検証する。' },
]
const verifications = (await parallel(lenses.map(function (L) {
  return function () {
    return agent('対象KW=「' + KW + '」。' + DIR + '/ の draft-h2-*.html 全部をReadし、記事全体を敵対的に検証する（観点=' + L.key + '）。「概ねOK」で通さない。指摘は where（ファイルとH2/H3）・problem・fix（具体的な直し）・severity で返す。\n' + assembleNote + '\n観点詳細: ' + L.p + '\n\n【過去の指摘（この型の違反を探す。見つけたら where に番号つきで書く）】\n' + LESSONS, { schema: VERIFY_SCHEMA, phase: '検証', label: '検証:' + L.key, effort: 'high' })
  }
}))).filter(Boolean)

// ---- 修正→結合→最終lint ----
const finalOut = await agent(RULES_COMMON + '\n\n対象KW=「' + KW + '」。検証指摘を反映して記事を完成させる。\n(1) 検証のmajor指摘を全て・minorは妥当なものを、該当draftファイルにEditで反映する（H2/H3見出しは1文字も変えない）。\n(2) draft-h2-0.html → index順に全draftを結合し ' + DIR + '/article.html に保存。末尾免責ブロック（価格時点・%OFF/送料無料/返金保証の条件集約・writing-manual.md §8）を、記事末尾の「※」の行にまとめて確認、なければ追加（注意書きを本文に書かない・§0 0-7）。\n(3) bash で cd ' + JSON.stringify(ROOT) + ' && bash scripts/lint.sh "articles/' + KW + '/article.html" | tee "articles/' + KW + '/lint-final.txt" を実行し ERROR 0 まで修正（ゲート4）。\n(3b) 続けて cd ' + JSON.stringify(ROOT) + ' && python3 scripts/check-body-kw.py "articles/' + KW + '/cooccurrence.json" "articles/' + KW + '/competitor.json" "articles/' + KW + '/article.html" "' + KW + '" "articles/' + KW + '/cooccurrence-plan.md" | tee "articles/' + KW + '/body-kw-final.txt" を実行し **ERROR 0 かつ Tier A 100%（入れない語は「配置しない語」に理由を書けば合格に数える）**にする。足りない語は本文で扱うか、cooccurrence-plan.md の「配置しない語」節に理由を書く。**語をねじ込んで埋めない**。\n(4) 対応できなかった指摘・人の判断が要る点（口コミ素材不足・要裏取り数値・法令の際どい表現）を openIssues に列挙。\n【検証指摘】\n' + JSON.stringify(verifications, null, 2) + '\n【各セクションのopenIssues】\n' + JSON.stringify(sections.concat(introSec ? [introSec] : []).map(function (s) { return { heading: s.heading, openIssues: s.openIssues || [] } }), null, 2), { schema: FINAL_SCHEMA, phase: '検証', label: '修正・結合・最終lint', effort: 'high' })

return {
  kw: KW,
  articleFile: finalOut ? finalOut.articleFile : DIR + '/article.html',
  lintFinalErrors: finalOut ? finalOut.lintFinalErrors : null,
  sections: sections.map(function (s) { return { heading: s.heading, lintErrors: s.lintErrors } }),
  verificationsSummary: verifications.map(function (v) { return { lens: v.lens, pass: v.pass, majors: v.issues.filter(function (i) { return i.severity === 'major' }).length } }),
  openIssues: (finalOut && finalOut.openIssues) || [],
  note: '本体ループの残タスク: 意味レビュー1周（空文・重複・薄さ・硬さの一読）・CLAUDE.md ゲート5（納品前チェックリスト）・チャット報告。完成報告はゲート5通過後のみ。',
}
