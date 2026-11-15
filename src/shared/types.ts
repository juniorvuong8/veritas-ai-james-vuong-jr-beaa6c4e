export type Level = 1 | 2 | 3

export interface LessonRequest {
  scenarioId: string
  words: string[]
  level: Level
  /** Debug mode: also ask the AI for the English (`*_en`) fields below. */
  debug?: boolean
}

// The optional `*_en` fields are only filled in debug mode (or by hand in the sample lessons).

export interface LessonLine {
  speaker_vi: string
  text: string
  translation_vi: string | null
  speaker_en?: string
  /** English translation of the whole line. */
  text_en?: string
}

export interface VocabItem {
  /** Exactly what the learner picked or typed (English or Vietnamese). */
  input: string
  /** The English word taught; equals `input` when the input was English. */
  word: string
  meaning_vi: string
  usage_vi: string
  meaning_en?: string
  usage_en?: string
}

export interface QuizQuestion {
  question_vi: string
  options: string[]
  answer_index: number
  explanation_vi: string
  question_en?: string
  explanation_en?: string
}

export interface Lesson {
  title_vi: string
  title_en?: string
  level: Level
  lines: LessonLine[]
  vocab: VocabItem[]
  quiz: QuizQuestion[]
}

export type CheckResult<T> = { ok: true; value: T } | { ok: false; errors: string[] }

export type ErrorCode = 'bad_request' | 'rate_limited' | 'out_of_credits' | 'ai_failed'

export interface ErrorBody {
  code: ErrorCode
  message_vi: string
}
