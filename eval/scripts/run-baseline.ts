// Builds the 24 baseline lessons (free, deterministic): npm run eval:baseline
import { join } from 'node:path'
import { buildBaselineLesson, type Dictionary, type Templates } from '../lib/baseline.ts'
import type { EvalCase, ResultsFile } from '../lib/types.ts'
import { EVAL_DIR, readJson, writeJsonAtomic } from './io.ts'

const cases = readJson<EvalCase[]>(join(EVAL_DIR, 'cases.json'))
const dict = readJson<Dictionary>(join(EVAL_DIR, 'baseline/dictionary.json'))
const templates = readJson<Templates>(join(EVAL_DIR, 'baseline/templates.json'))

const results: ResultsFile = {}
for (const c of cases) results[c.id] = { ok: true, lesson: buildBaselineLesson(c, dict, templates) }
writeJsonAtomic(join(EVAL_DIR, 'results/baseline.json'), results)
console.log(`baseline: wrote ${cases.length} lessons to eval/results/baseline.json`)
