// Checks that a learner's custom word fits the place, so the AI can use it smoothly in the dialogue.
import { parseJsonObject, type AiCaller } from './ai'
import type { ChatMessage } from './prompt'
import { getScenario, normalizeWord, type Scenario } from './scenarios'
import { isValidWord } from './validate-request'

export interface WordFitRequest {
  scenarioId: string
  word: string
}

/**
 * `checked: false` means the AI could not be asked (busy, offline, bad output). The word is then
 * allowed, so a hiccup never blocks the learner; the lesson prompt still has to use it naturally.
 */
export type WordFitResult =
  | { fits: true; checked: boolean }
  | { fits: false; checked: true; reason_vi: string; reason_en: string }

/** Output cap for the check: a one-line JSON answer, with headroom for thinking. */
export const WORD_FIT_MAX_TOKENS = 2000

const SYSTEM_PROMPT = `You help a beginner English course for Vietnamese speakers. The learner is about to practise a short conversation in a given situation and has typed their own word (English or Vietnamese) to learn in it.

Decide whether the word fits the situation well enough that a natural, everyday conversation there could use it smoothly.

Be generous. It fits if a person in that situation might plausibly say it, hear it, or need it, including general words that come up anywhere (for example "wifi" or "toilet" at a café, "umbrella" in a taxi, "hello" anywhere). It does not fit only if using it would feel forced or random there (for example "volcano" at a café, "algebra" at a supermarket), or if it is not a real word or phrase.

The course is for learners of all ages. "fits" is always false for anything inappropriate, in any language, spelling or disguise: profanity, slurs or insults about any group, sexual words, hate symbols, drugs, or graphic violence. Ordinary words a doctor or shop might use (for example "pain", "pharmacy", "beer" at a supermarket) are fine. When refusing an inappropriate word, do not repeat it in the reasons, and do not suggest a replacement; just say kindly that it isn't suitable and ask for another word.

Respond with ONLY a JSON object, with no other text:
{ "fits": boolean, "reason_vi": string, "reason_en": string }
"reason_vi" is one short, friendly Vietnamese sentence with full diacritics, and "reason_en" says the same in English. When "fits" is false, say why it doesn't fit this place and suggest one related word that would.`

export function buildWordFitMessages(scenario: Scenario, word: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Situation: ${scenario.promptContext}\nWord: ${JSON.stringify(word)}` },
  ]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Reads the model's answer; undefined if it isn't a usable verdict. */
export function parseWordFit(text: string): WordFitResult | undefined {
  const data = parseJsonObject(text)
  if (!isRecord(data) || typeof data.fits !== 'boolean') return undefined
  if (data.fits) return { fits: true, checked: true }
  if (!nonEmpty(data.reason_vi) || !nonEmpty(data.reason_en)) return undefined
  return { fits: false, checked: true, reason_vi: data.reason_vi.trim(), reason_en: data.reason_en.trim() }
}

export function checkWordFitRequest(body: unknown): WordFitRequest | undefined {
  if (!isRecord(body) || typeof body.scenarioId !== 'string' || typeof body.word !== 'string') return undefined
  const word = normalizeWord(body.word)
  if (!getScenario(body.scenarioId) || !isValidWord(word)) return undefined
  return { scenarioId: body.scenarioId, word }
}

/** Returns undefined for a malformed request; otherwise a verdict (allowing the word if the AI fails). */
export async function checkWordFit(body: unknown, callAi: AiCaller): Promise<WordFitResult | undefined> {
  const req = checkWordFitRequest(body)
  if (!req) return undefined
  try {
    const verdict = parseWordFit(await callAi(buildWordFitMessages(getScenario(req.scenarioId)!, req.word)))
    if (verdict) return verdict
    console.error('word-fit: unusable AI output')
  } catch (err) {
    console.error('word-fit: AI call failed', err)
  }
  return { fits: true, checked: false }
}
