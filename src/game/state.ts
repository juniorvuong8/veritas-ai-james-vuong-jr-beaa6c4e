import { normalizeWord, SCENARIOS } from '@/shared/scenarios'
import type { Level, VocabItem } from '@/shared/types'

export const COINS_PER_CORRECT = 10
export const PLACE_IDS: string[] = SCENARIOS.map((s) => s.id)

/** A word the learner finished a lesson with (made it through the quiz). Shown in the notebook. */
export interface LearnedWord {
  /** The English word taught. */
  word: string
  /** What the learner picked or typed (may be Vietnamese, e.g. "hóa đơn" for "receipt"). */
  input: string
  meaning_vi: string
  usage_vi: string
  meaning_en?: string
  usage_en?: string
  /** Where it was first learned. */
  placeId: string
}

/** How words are compared: trimmed, single-spaced, lowercase. */
export const wordKey = (w: string) => normalizeWord(w).toLowerCase()

/** Whether a word (English, or the Vietnamese the learner typed for it) is already learned. */
export function isLearned(learned: LearnedWord[], w: string): boolean {
  const k = wordKey(w)
  return learned.some((l) => wordKey(l.word) === k || wordKey(l.input) === k)
}

export interface GameState {
  level: Level
  /** Finished places, in PLACE_IDS order. */
  stamps: string[]
  coins: number
  /** All places stamped this round. */
  complete: boolean
  celebrationOpen: boolean
  /** Last words used in each place, pre-selected on the next visit. */
  lastWords: Record<string, string[]>
  /** Every word learned so far, oldest first. Kept across rounds and levels. */
  learnedWords: LearnedWord[]
}

export type GameAction =
  | { type: 'earnCoins'; amount: number }
  | { type: 'finishPlace'; placeId: string }
  | { type: 'rememberWords'; placeId: string; words: string[] }
  | { type: 'learnWords'; placeId: string; vocab: VocabItem[] }
  | { type: 'openCelebration' }
  | { type: 'dismissCelebration' }
  | { type: 'playAgain' }
  | { type: 'levelUp' }

export function newGame(
  level: Level,
  lastWords: Record<string, string[]> = {},
  learnedWords: LearnedWord[] = [],
): GameState {
  return { level, stamps: [], coins: 0, complete: false, celebrationOpen: false, lastWords, learnedWords }
}

export function canLevelUp(state: GameState): boolean {
  return state.level < 3
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'earnCoins':
      return { ...state, coins: state.coins + action.amount }
    case 'finishPlace': {
      if (!PLACE_IDS.includes(action.placeId) || state.stamps.includes(action.placeId)) return state
      const stamps = PLACE_IDS.filter((id) => id === action.placeId || state.stamps.includes(id))
      const nowComplete = stamps.length === PLACE_IDS.length
      return { ...state, stamps, complete: nowComplete, celebrationOpen: nowComplete && !state.complete }
    }
    case 'rememberWords':
      if (!PLACE_IDS.includes(action.placeId)) return state
      return { ...state, lastWords: { ...state.lastWords, [action.placeId]: action.words } }
    case 'learnWords': {
      const learnedWords = [...state.learnedWords]
      for (const v of action.vocab) {
        if (isLearned(learnedWords, v.word)) continue
        const { word, input, meaning_vi, usage_vi, meaning_en, usage_en } = v
        learnedWords.push({
          word,
          input,
          meaning_vi,
          usage_vi,
          ...(meaning_en ? { meaning_en } : {}),
          ...(usage_en ? { usage_en } : {}),
          placeId: action.placeId,
        })
      }
      return learnedWords.length === state.learnedWords.length ? state : { ...state, learnedWords }
    }
    case 'openCelebration':
      return state.complete ? { ...state, celebrationOpen: true } : state
    case 'dismissCelebration':
      return { ...state, celebrationOpen: false }
    case 'playAgain':
      return newGame(state.level, state.lastWords, state.learnedWords)
    case 'levelUp':
      return canLevelUp(state) ? newGame((state.level + 1) as Level, state.lastWords, state.learnedWords) : state
  }
}
