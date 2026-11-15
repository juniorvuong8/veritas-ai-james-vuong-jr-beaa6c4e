import { getScenario } from '../../src/shared/scenarios'
import { checkLesson } from '../../src/shared/validate-lesson'
import { dialogueHash } from './hash.ts'
import { METHODS, dialogueId, type EvalCase, type Method, type RatingsFile, type ResultsFile } from './types.ts'

export type MethodReport = {
  /** % of cases where Q1 and Q2 are both "Có" (a failed run counts as a fail). */
  headline: number
  q1Rate: number
  q2Rate: number
  /** % of cases whose lesson passes the app's structure checks. */
  structurePass: number
  failedRuns: string[]
  byLevel: Record<number, number>
  byPlace: Record<string, number>
  /** Notes on this method's dialogues that failed Q1 or Q2. */
  notes: { caseId: string; note: string }[]
}
export type Report = { total: number } & Record<Method, MethodReport>

const pct = (n: number, of: number) => (of === 0 ? 0 : Math.round((n / of) * 100))

export function score(cases: EvalCase[], results: Record<Method, ResultsFile>, ratings: RatingsFile): Report {
  for (const m of METHODS) {
    const absent = cases.filter((c) => !(c.id in results[m])).map((c) => c.id)
    if (absent.length) throw new Error(`Cases missing from ${m} results: ${absent.join(', ')} (rerun eval:${m})`)
  }
  const expected = cases.flatMap((c) => METHODS.filter((m) => results[m][c.id]?.ok).map((m) => dialogueId(m, c.id)))
  const missing = expected.filter((id) => ratings[id]?.q1 === undefined || ratings[id]?.q2 === undefined)
  if (missing.length) throw new Error(`Unrated dialogues: ${missing.join(', ')}`)
  const stale = expected.filter((id) => {
    const h = ratings[id].h
    const [m, caseId] = id.split(':') as [Method, string]
    const r = results[m][caseId]
    return h !== undefined && r.ok && h !== dialogueHash(r.lesson)
  })
  if (stale.length) throw new Error(`Ratings given for different dialogue text (re-rate these): ${stale.join(', ')}`)
  const unknown = Object.keys(ratings).filter((id) => !expected.includes(id))
  if (unknown.length) throw new Error(`Ratings for dialogues that don't exist: ${unknown.join(', ')}`)

  const report = { total: cases.length } as Report
  for (const m of METHODS) {
    const passed = (c: EvalCase) => {
      const r = ratings[dialogueId(m, c.id)]
      return results[m][c.id]?.ok === true && r?.q1 === true && r?.q2 === true
    }
    const share = (subset: EvalCase[]) => pct(subset.filter(passed).length, subset.length)
    const group = <K extends string | number>(key: (c: EvalCase) => K) => {
      const out = {} as Record<K, number>
      for (const k of [...new Set(cases.map(key))]) out[k] = share(cases.filter((c) => key(c) === k))
      return out
    }
    report[m] = {
      headline: share(cases),
      q1Rate: pct(cases.filter((c) => ratings[dialogueId(m, c.id)]?.q1 === true).length, cases.length),
      q2Rate: pct(cases.filter((c) => ratings[dialogueId(m, c.id)]?.q2 === true).length, cases.length),
      structurePass: pct(
        cases.filter((c) => {
          const r = results[m][c.id]
          return r?.ok === true && checkLesson(r.lesson, c).ok
        }).length,
        cases.length,
      ),
      failedRuns: cases.filter((c) => !results[m][c.id]?.ok).map((c) => c.id),
      byLevel: group((c) => c.level),
      byPlace: group((c) => c.scenarioId),
      notes: cases
        .filter((c) => results[m][c.id]?.ok && !passed(c) && ratings[dialogueId(m, c.id)]?.note?.trim())
        .map((c) => ({ caseId: c.id, note: ratings[dialogueId(m, c.id)].note.trim() })),
    }
  }
  return report
}

export function renderResults(r: Report): string {
  const row = (label: string, b: number | string, l: number | string) => `| ${label} | ${b} | ${l} |`
  const levels = Object.keys(r.baseline.byLevel)
  const places = Object.keys(r.baseline.byPlace)
  const failedNote = r.llm.failedRuns.length
    ? `The LLM could not produce a valid lesson for ${r.llm.failedRuns.length} case(s): ${r.llm.failedRuns.join(', ')}. These count as fails.`
    : 'The LLM produced a valid lesson for every case.'
  const notes = [...r.llm.notes.map((n) => `- **LLM** \`${n.caseId}\`: ${n.note}`), ...r.baseline.notes.map((n) => `- Baseline \`${n.caseId}\`: ${n.note}`)]
  return `# LLM evaluation results

> We use a pretrained LLM to generate contextual dialogues with target vocabulary. Our baseline substitutes English vocabulary into fixed Vietnamese dialogues using a dictionary. On the same ${r.total} test cases, the baseline achieved ${r.baseline.headline}% and the LLM achieved ${r.llm.headline}%. The LLM still failed when ___ (see notes below).

**Score:** the share of test cases where a native Vietnamese speaker answered "yes" to both questions:
1. *Is every English word used in the right sense for this situation?*
2. *Does the Vietnamese read naturally, like something a person would actually say?*

| | Baseline | LLM |
|---|---|---|
${row('**Headline (both yes)**', `**${r.baseline.headline}%**`, `**${r.llm.headline}%**`)}
${row('Words used correctly (Q1)', `${r.baseline.q1Rate}%`, `${r.llm.q1Rate}%`)}
${row('Natural Vietnamese (Q2)', `${r.baseline.q2Rate}%`, `${r.llm.q2Rate}%`)}
${row('Passes the app\'s structure checks', `${r.baseline.structurePass}%`, `${r.llm.structurePass}%`)}
${levels.map((k) => row(`Level ${k}`, `${r.baseline.byLevel[Number(k)]}%`, `${r.llm.byLevel[Number(k)]}%`)).join('\n')}
${places.map((k) => row(getScenario(k)?.name_vi ?? k, `${r.baseline.byPlace[k]}%`, `${r.llm.byPlace[k]}%`)).join('\n')}

${failedNote}

## How it was measured

- **Test cases** (\`eval/cases.json\`): 4 places × 3 levels × 2 word sets. Each place has one set of 3 suggested words and one set of 4 words that includes a word typed in Vietnamese. Cases were fixed before any dialogue was generated.
- **Baseline** (\`eval/baseline/\`): a bilingual dictionary plus fixed dialogue lines: an opening and closing per place, and one ready-made example line for each suggested word. A case's dialogue is those lines stitched together.
- **LLM** (\`eval/results/llm.json\`): generated by the app's own lesson code (\`src/shared/generate.ts\`), with the same prompt, model, settings, checks and single retry as the live app.
- **Rating** (\`eval/ratings.json\`): every dialogue rated by a native speaker on a page that shows one dialogue at a time, shuffled with a fixed seed, with no method name, title or badge.

**Limits:**
- One rater, who is also the developer.
- The rating is shuffled and unlabelled but **not fully blind**: the two methods can be told apart by length and turn-taking (the baseline's lines are stitched together, so the same speaker often talks twice in a row), and the baseline's fixed lines repeat across cases.
- 24 cases is a small sample, and every Vietnamese input in the test set maps to a word the baseline has a ready-made line for, which favours the baseline.
- Three LLM cases failed the app's checks on the first attempt and passed on the app's automatic retry, as they would for a real player.

## Rater notes on dialogues that failed

${notes.length ? notes.join('\n') : '_No notes._'}

## Rerun

\`\`\`bash
npm run eval:baseline   # free: rebuild the baseline dialogues
npm run eval:llm        # paid (~$2–4): regenerate the LLM dialogues (needs ANTHROPIC_API_KEY in supabase/.env)
npm run dev             # then open /eval.html to rate, and save ratings.json into eval/
npm run eval:score      # recompute this file
\`\`\`
`
}
