// Recomputes eval/RESULTS.md from saved files: npm run eval:score
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderResults, score } from '../lib/score.ts'
import type { EvalCase, RatingsFile, ResultsFile } from '../lib/types.ts'
import { EVAL_DIR, readJson } from './io.ts'

const cases = readJson<EvalCase[]>(join(EVAL_DIR, 'cases.json'))
const results = {
  baseline: readJson<ResultsFile>(join(EVAL_DIR, 'results/baseline.json')),
  llm: readJson<ResultsFile>(join(EVAL_DIR, 'results/llm.json')),
}
const ratings = readJson<RatingsFile>(join(EVAL_DIR, 'ratings.json'))
const report = score(cases, results, ratings)
writeFileSync(join(EVAL_DIR, 'RESULTS.md'), renderResults(report))
console.log(`baseline ${report.baseline.headline}% · LLM ${report.llm.headline}% → eval/RESULTS.md`)
