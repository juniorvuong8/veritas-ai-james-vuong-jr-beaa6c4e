export type Level = 1 | 2 | 3

export interface LessonRequest {
  scenarioId: string
  words: string[]
  level: Level
}

export interface LessonLine {
  speaker_vi: string
  text: string
  translation_vi: string | null
}

export interface VocabItem {
  /** Exactly what the learner picked or typed (English or Vietnamese). */
  input: string
  /** The English word taught; equals `input` when the input was English. */
  word: string
  meaning_vi: string
  usage_vi: string
}

export interface QuizQuestion {
  question_vi: string
  options: string[]
  answer_index: number
  explanation_vi: string
}

export interface Lesson {
  title_vi: string
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
