import { getScenario, normalizeWord } from './scenarios'
import type { CheckResult, LessonRequest, Level } from './types'

export const MIN_WORDS = 3
export const MAX_WORDS = 5
const WORD_RULE = /^[\p{L}\p{M}' -]{1,30}$/u

/** Letters (any language), spaces, hyphens and apostrophes, 1-30 chars, with at least one letter. Expects a normalized word. */
export function isValidWord(w: string): boolean {
  return WORD_RULE.test(w) && /\p{L}/u.test(w)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function checkLessonRequest(body: unknown): CheckResult<LessonRequest> {
  if (!isRecord(body)) return { ok: false, errors: ['body must be an object'] }
  const errors: string[] = []

  const { scenarioId, words, level, debug } = body
  if (typeof scenarioId !== 'string' || !getScenario(scenarioId)) {
    errors.push('unknown scenarioId')
  }
  if (level !== 1 && level !== 2 && level !== 3) {
    errors.push('level must be 1, 2 or 3')
  }

  let normalized: string[] = []
  if (!Array.isArray(words) || !words.every((w) => typeof w === 'string')) {
    errors.push('words must be an array of strings')
  } else {
    normalized = words.map(normalizeWord)
    if (normalized.length < MIN_WORDS || normalized.length > MAX_WORDS) {
      errors.push(`choose ${MIN_WORDS}-${MAX_WORDS} words`)
    }
    for (const w of normalized) {
      if (!isValidWord(w)) errors.push(`invalid word: ${JSON.stringify(w)}`)
    }
    const keys = normalized.map((w) => w.toLowerCase())
    if (new Set(keys).size !== keys.length) errors.push('duplicate words')
  }

  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      scenarioId: scenarioId as string,
      words: normalized,
      level: level as Level,
      ...(debug === true ? { debug: true } : {}),
    },
  }
}
