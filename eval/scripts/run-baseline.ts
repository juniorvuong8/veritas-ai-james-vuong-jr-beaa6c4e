// Builds the baseline lessons (free, deterministic): bun eval/scripts/run-baseline.ts [--set extra]
import { join } from 'node:path'
import { buildBaselineLesson, type Dictionary, type Templates } from '../lib/baseline.ts'
import type { EvalCase, ResultsFile } from '../lib/types.ts'
import { EVAL_DIR, evalSetDir, readJson, writeJsonAtomic } from './io.ts'

const { dir } = evalSetDir()

const cases = readJson<EvalCase[]>(join(dir, 'cases.json'))
const dict = readJson<Dictionary>(join(EVAL_DIR, 'baseline/dictionary.json'))
const templates = readJson<Templates>(join(EVAL_DIR, 'baseline/templates.json'))

const results: ResultsFile = {}
for (const c of cases) results[c.id] = { ok: true, lesson: buildBaselineLesson(c, dict, templates) }
const out = join(dir, 'results/baseline.json')
writeJsonAtomic(out, results)
console.log(`baseline: wrote ${cases.length} lessons to ${out}`)
