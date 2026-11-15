import type { WordFitResult } from '@/shared/word-fit'
import { checkWordFitFn } from './word-fit.functions'

export const WORD_FIT_TIMEOUT_MS = 20_000

/** Asks the server whether `word` fits the place. Any failure allows the word, so the learner is never stuck. */
export async function requestWordFit(scenarioId: string, word: string): Promise<WordFitResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WORD_FIT_TIMEOUT_MS)
  try {
    const res = await checkWordFitFn({ data: { scenarioId, word }, signal: controller.signal })
    return res ?? { fits: true, checked: false }
  } catch {
    return { fits: true, checked: false }
  } finally {
    clearTimeout(timer)
  }
}
