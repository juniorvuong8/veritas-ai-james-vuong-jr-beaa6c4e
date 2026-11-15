// Recomputes RESULTS.md from saved files: bun eval/scripts/score.ts [--set extra]
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderExtraResults, renderResults, score } from '../lib/score.ts'
import type { EvalCase, RatingsFile, ResultsFile } from '../lib/types.ts'
import { evalSetDir, readJson } from './io.ts'

const { name, dir } = evalSetDir()
const cases = readJson<EvalCase[]>(join(dir, 'cases.json'))
const results = {
  baseline: readJson<ResultsFile>(join(dir, 'results/baseline.json')),
  llm: readJson<ResultsFile>(join(dir, 'results/llm.json')),
}
const ratings = readJson<RatingsFile>(join(dir, 'ratings.json'))
const report = score(cases, results, ratings)
const out = join(dir, 'RESULTS.md')
writeFileSync(out, name === 'extra' ? renderExtraResults(cases, report, ratings) : renderResults(report))
console.log(`baseline ${report.baseline.headline}% · LLM ${report.llm.headline}% → ${out}`)
