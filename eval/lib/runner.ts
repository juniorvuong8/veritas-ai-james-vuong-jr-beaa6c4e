import type { EvalCase, ResultsFile, RunResult } from './types'

/**
 * Run each case that doesn't already have a successful result, saving after every case,
 * so an interrupted run resumes without paying again for finished cases.
 */
export async function runCases(
  cases: EvalCase[],
  existing: ResultsFile,
  generate: (c: EvalCase) => Promise<RunResult>,
  save: (results: ResultsFile) => void,
): Promise<ResultsFile> {
  const results: ResultsFile = { ...existing }
  for (const c of cases) {
    if (results[c.id]?.ok) continue
    try {
      results[c.id] = await generate(c)
    } catch {
      results[c.id] = { ok: false, code: 'exception' }
    }
    save(results)
  }
  return results
}
