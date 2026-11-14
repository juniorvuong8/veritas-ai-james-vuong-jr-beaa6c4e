import { SCENARIOS } from '@/shared/scenarios'
import type { Level } from '@/shared/types'

export const COINS_PER_CORRECT = 10
export const PLACE_IDS: string[] = SCENARIOS.map((s) => s.id)

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
}

export type GameAction =
  | { type: 'earnCoins'; amount: number }
  | { type: 'finishPlace'; placeId: string }
  | { type: 'rememberWords'; placeId: string; words: string[] }
  | { type: 'openCelebration' }
  | { type: 'dismissCelebration' }
  | { type: 'playAgain' }
  | { type: 'levelUp' }

export function newGame(level: Level, lastWords: Record<string, string[]> = {}): GameState {
  return { level, stamps: [], coins: 0, complete: false, celebrationOpen: false, lastWords }
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
    case 'openCelebration':
      return state.complete ? { ...state, celebrationOpen: true } : state
    case 'dismissCelebration':
      return { ...state, celebrationOpen: false }
    case 'playAgain':
      return newGame(state.level, state.lastWords)
    case 'levelUp':
      return canLevelUp(state) ? newGame((state.level + 1) as Level, state.lastWords) : state
  }
}
