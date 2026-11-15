import type { Scenario } from './scenarios'
import type { LessonRequest } from './types'

export type ChatMessage = { role: 'system' | 'user'; content: string }

const SYSTEM_PROMPT = `You write short practice conversations that teach English vocabulary to Vietnamese speakers who are beginners in English.

The learner picks a situation, 3-5 words and a level. You write one realistic conversation (4-8 lines, exactly two speakers with Vietnamese role names such as "Nhân viên" and "Khách") that uses every chosen word naturally, in the sense people really use it in that situation. Then you explain each word and write a short quiz.

The first line is spoken by the person who works there (staff, cashier, driver, doctor). The other speaker is the learner's role (customer, passenger, patient).

How much English goes in the conversation depends on the level:
- Level 1: Vietnamese sentences with only the chosen English words inserted. Example: "Chị uống ở đây hay to go ạ?"
- Level 2: Vietnamese sentences with short English phrases built around the chosen words. Example: "Dạ, em muốn a coffee to go, cảm ơn."
- Level 3: Whole lines in English. Every line also gets a natural Vietnamese translation in "translation_vi". Example: "Can I get it to go?" / "Cho em mang đi được không?"
At levels 1 and 2, "translation_vi" is null. At every level, explanations and quiz questions are in Vietnamese.

If a chosen word is Vietnamese (for example "hóa đơn"), pick the most common beginner English word for it in this situation (for example "receipt"). Set "input" to the learner's word exactly as given and "word" to the English word. For English input, "word" equals "input". Use the English "word" in the conversation, spelled exactly as in "word". Do not pluralize, conjugate or otherwise change the form of a chosen word (write "straw", never "straws").

"vocab" has one entry per chosen word, in the order given. "meaning_vi" is a short Vietnamese meaning. "usage_vi" says in Vietnamese when and how to use the word, in one or two sentences.

"quiz" has one question per chosen word, in the same order. Each question puts the learner in a NEW situation (not a line from the conversation) and asks which English word or phrase fits. Each has exactly 3 options: the correct one is that question's "word", the other two are other chosen words or plausible distractors. "answer_index" is the 0-based index of the correct option. Vary its position. "explanation_vi" explains the answer in one Vietnamese sentence.

Write correct, natural Vietnamese with full diacritics, and simple, beginner-friendly English.

Respond with ONLY a JSON object in exactly this shape, with no other text:
{
  "title_vi": string,
  "level": 1 | 2 | 3,
  "lines": [{ "speaker_vi": string, "text": string, "translation_vi": string | null }],
  "vocab": [{ "input": string, "word": string, "meaning_vi": string, "usage_vi": string }],
  "quiz": [{ "question_vi": string, "options": [string, string, string], "answer_index": 0 | 1 | 2, "explanation_vi": string }]
}`

/** Debug mode only: an extra instruction asking for English versions of the Vietnamese text. */
export const DEBUG_INSTRUCTION = `Debug mode: also add English translations so a non-Vietnamese reader can follow everything. Add "title_en" to the lesson; "speaker_en" and "text_en" (a natural English translation of the whole line; at level 3 repeat "text") to every line; "meaning_en" and "usage_en" to every vocab entry; "question_en" and "explanation_en" to every quiz question. Keep every other field exactly as described.`

export function buildMessages(scenario: Scenario, req: LessonRequest): ChatMessage[] {
  const user = [
    `Situation: ${scenario.promptContext}`,
    `Words: ${JSON.stringify(req.words)}`,
    `Level: ${req.level}`,
    ...(req.debug ? ['', DEBUG_INSTRUCTION] : []),
  ].join('\n')
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}
