import { getScenario, normalizeWord } from './scenarios'
import type { CheckResult, LessonRequest, Level } from './types'

export const MIN_WORDS = 3
export const MAX_WORDS = 5
const WORD_RULE = /^[\p{L}\p{M}' -]{1,30}$/u

/** English: at most 2 words ("sore throat"). */
export const MAX_ENGLISH_WORDS = 2
/** Vietnamese writes each syllable apart, so 2 words can be up to 4 syllables ("kem đánh răng"). */
export const MAX_VIETNAMESE_SYLLABLES = 4
const VIETNAMESE_LETTER = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu

export type WordProblem = 'chars' | 'too_long'

/**
 * Why a normalized word can't be used, or null if it can.
 * 'chars': only letters (any language), spaces, hyphens and apostrophes, 1-30 chars, at least one letter.
 * 'too_long': a whole phrase or sentence rather than one or two words.
 */
export function wordProblem(w: string): WordProblem | null {
  if (!WORD_RULE.test(w) || !/\p{L}/u.test(w)) return 'chars'
  const parts = w.split(' ').filter(Boolean).length
  const max = VIETNAMESE_LETTER.test(w) ? MAX_VIETNAMESE_SYLLABLES : MAX_ENGLISH_WORDS
  return parts > max ? 'too_long' : null
}

/** Expects a normalized word. See `wordProblem`. */
export function isValidWord(w: string): boolean {
  return wordProblem(w) === null
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
