// Dictionary-and-template baseline: fixed dialogue lines, one per known word, stitched together.
import { getScenario } from '../../src/shared/scenarios'
import type { Lesson, LessonLine, QuizQuestion, VocabItem } from '../../src/shared/types'
import type { EvalCase } from './types'

export type Dictionary = {
  words: Record<string, { meaning_vi: string; usage_vi: string }>
  vi_to_en: Record<string, string>
}
/** `text` (and `translation_vi`) may contain {w} for the English word and {vi} for its Vietnamese meaning. */
export type TemplateLine = { speaker: 'host' | 'guest'; text: string; translation_vi?: string }
export type LevelTemplates = {
  opening: TemplateLine[]
  closing: TemplateLine[]
  words: Record<string, TemplateLine>
  fallback: TemplateLine
}
export type PlaceTemplates = { roles: { host: string; guest: string }; levels: Record<'1' | '2' | '3', LevelTemplates> }
export type Templates = Record<string, PlaceTemplates>

export function buildBaselineLesson(c: EvalCase, dict: Dictionary, templates: Templates): Lesson {
  const place = templates[c.scenarioId]
  const lv = place.levels[String(c.level) as '1' | '2' | '3']
  const english = c.words.map((w) => dict.vi_to_en[w] ?? w)
  const meaning = (en: string, input: string) => dict.words[en]?.meaning_vi ?? input

  const fill = (s: string, en: string, vi: string) => s.replaceAll('{w}', en).replaceAll('{vi}', vi)
  const toLine = (t: TemplateLine, en = '', vi = ''): LessonLine => ({
    speaker_vi: place.roles[t.speaker],
    text: fill(t.text, en, vi),
    translation_vi: c.level === 3 && t.translation_vi ? fill(t.translation_vi, en, vi) : null,
  })

  const lines: LessonLine[] = [
    ...lv.opening.map((t) => toLine(t)),
    ...english.map((en, i) => toLine(lv.words[en] ?? lv.fallback, en, meaning(en, c.words[i]))),
    ...lv.closing.map((t) => toLine(t)),
  ]

  const vocab: VocabItem[] = english.map((en, i) => ({
    input: c.words[i],
    word: en,
    meaning_vi: meaning(en, c.words[i]),
    usage_vi: dict.words[en]?.usage_vi ?? 'Chưa có trong từ điển.',
  }))

  const quiz: QuizQuestion[] = english.map((en, i) => {
    const distractors = english.filter((_, j) => j !== i).slice(0, 2)
    const options = [...distractors]
    options.splice(i % 3, 0, en)
    return {
      question_vi: `Từ tiếng Anh nào có nghĩa là "${vocab[i].meaning_vi}"?`,
      options,
      answer_index: i % 3,
      explanation_vi: `"${en}" nghĩa là ${vocab[i].meaning_vi}.`,
    }
  })

  return { title_vi: getScenario(c.scenarioId)?.name_vi ?? c.scenarioId, level: c.level, lines, vocab, quiz }
}
