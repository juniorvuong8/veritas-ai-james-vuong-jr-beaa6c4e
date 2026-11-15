// Generates the LLM lessons through the app's own code (uses AI credits):
// LOVABLE_API_KEY=... bun eval/scripts/run-llm.ts [--set extra] [--only <caseId>]
import { join } from 'node:path'
import { createGatewayAiCaller } from '../../src/shared/ai.ts'
import { generateLesson } from '../../src/shared/generate.ts'
import type { Lesson } from '../../src/shared/types.ts'
import { runCases } from '../lib/runner.ts'
import type { EvalCase, ResultsFile, RunResult } from '../lib/types.ts'
import { evalSetDir, readJson, writeJsonAtomic } from './io.ts'

// Checked here only to fail early: the gateway client reads it from the environment itself.
if (!process.env.LOVABLE_API_KEY) {
  console.error('LOVABLE_API_KEY is missing from the environment')
  process.exit(1)
}

const onlyIdx = process.argv.indexOf('--only')
const only = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : undefined
const { dir } = evalSetDir()
const allCases = readJson<EvalCase[]>(join(dir, 'cases.json'))
const cases = only ? allCases.filter((c) => c.id === only) : allCases
if (cases.length === 0) {
  console.error(`no case with id ${only}`)
  process.exit(1)
}

const callAi = createGatewayAiCaller()
let calls = 0
const timed: typeof callAi = async (messages) => {
  calls++
  return callAi(messages)
}

const outPath = join(dir, 'results/llm.json')
const existing = readJson<ResultsFile>(outPath, {})

const results = await runCases(
  cases,
  existing,
  async (c): Promise<RunResult> => {
    const started = Date.now()
    const r = await generateLesson({ scenarioId: c.scenarioId, words: c.words, level: c.level }, timed)
    const secs = ((Date.now() - started) / 1000).toFixed(1)
    if (r.status === 200) {
      console.log(`  ok    ${c.id}  (${secs}s)`)
      return { ok: true, lesson: r.body as Lesson }
    }
    const code = 'code' in r.body ? r.body.code : `status_${r.status}`
    console.log(`  FAIL  ${c.id}  ${code}  (${secs}s)`)
    return { ok: false, code }
  },
  (all) => writeJsonAtomic(outPath, all),
)

const done = cases.filter((c) => results[c.id]?.ok).length
console.log(`\nllm: ${done}/${cases.length} ok · ${calls} AI calls`)
