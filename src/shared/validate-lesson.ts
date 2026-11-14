import { normalizeWord } from './scenarios'
import type { CheckResult, Lesson, LessonRequest } from './types'

export const MIN_LINES = 4
export const MAX_LINES = 8
export const OPTIONS_PER_QUESTION = 3

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Case-insensitive whole-word match: no letter directly before or after. */
export function containsWord(text: string, word: string): boolean {
  const w = normalizeWord(word)
  if (!w) return false
  const re = new RegExp(`(?<![\\p{L}\\p{M}])${escapeRegExp(w)}(?![\\p{L}\\p{M}])`, 'iu')
  return re.test(text.normalize('NFC'))
}

const key = (s: string) => normalizeWord(s).toLowerCase()
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

function checkShape(data: unknown, errors: string[]): data is Lesson {
  if (!isRecord(data)) {
    errors.push('lesson must be an object')
    return false
  }
  if (!isNonEmptyString(data.title_vi)) errors.push('title_vi missing')
  if (data.level !== 1 && data.level !== 2 && data.level !== 3) errors.push('level invalid')

  if (!Array.isArray(data.lines)) errors.push('lines must be an array')
  else
    data.lines.forEach((line, i) => {
      if (!isRecord(line) || !isNonEmptyString(line.speaker_vi) || !isNonEmptyString(line.text))
        errors.push(`line ${i} invalid`)
      else if (line.translation_vi !== null && typeof line.translation_vi !== 'string')
        errors.push(`line ${i} translation_vi invalid`)
    })

  if (!Array.isArray(data.vocab)) errors.push('vocab must be an array')
  else
    data.vocab.forEach((v, i) => {
      if (
        !isRecord(v) ||
        !isNonEmptyString(v.input) ||
        !isNonEmptyString(v.word) ||
        !isNonEmptyString(v.meaning_vi) ||
        !isNonEmptyString(v.usage_vi)
      )
        errors.push(`vocab ${i} invalid`)
    })

  if (!Array.isArray(data.quiz)) errors.push('quiz must be an array')
  else
    data.quiz.forEach((q, i) => {
      if (
        !isRecord(q) ||
        !isNonEmptyString(q.question_vi) ||
        !isNonEmptyString(q.explanation_vi) ||
        !Array.isArray(q.options) ||
        !q.options.every(isNonEmptyString) ||
        typeof q.answer_index !== 'number'
      )
        errors.push(`quiz ${i} invalid`)
    })

  return errors.length === 0
}

export function checkLesson(data: unknown, req: LessonRequest): CheckResult<Lesson> {
  const errors: string[] = []
  if (!checkShape(data, errors)) return { ok: false, errors }
  const lesson = data

  if (lesson.level !== req.level) errors.push('level does not match request')

  if (lesson.lines.length < MIN_LINES || lesson.lines.length > MAX_LINES)
    errors.push(`expected ${MIN_LINES}-${MAX_LINES} lines`)

  if (lesson.vocab.length !== req.words.length) errors.push('vocab count does not match words')
  else
    lesson.vocab.forEach((v, i) => {
      if (key(v.input) !== key(req.words[i])) errors.push(`vocab ${i} input does not match`)
    })

  for (const v of lesson.vocab) {
    if (!lesson.lines.some((line) => containsWord(line.text, v.word)))
      errors.push(`word not used in conversation: ${v.word}`)
  }

  if (lesson.quiz.length !== req.words.length) errors.push('quiz needs one question per word')
  lesson.quiz.forEach((q, i) => {
    if (q.options.length !== OPTIONS_PER_QUESTION) errors.push(`quiz ${i} needs 3 options`)
    if (!Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index >= q.options.length)
      errors.push(`quiz ${i} answer_index invalid`)
  })
  const answers = new Set(
    lesson.quiz
      .filter((q) => Number.isInteger(q.answer_index) && q.options[q.answer_index] !== undefined)
      .map((q) => key(q.options[q.answer_index])),
  )
  for (const v of lesson.vocab) {
    if (!answers.has(key(v.word))) errors.push(`no quiz question tests: ${v.word}`)
  }

  if (lesson.level === 3 && lesson.lines.some((line) => !isNonEmptyString(line.translation_vi)))
    errors.push('level 3 needs a translation on every line')

  return errors.length === 0 ? { ok: true, value: lesson } : { ok: false, errors }
}
