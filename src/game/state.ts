import type { BenchTarget } from '@/shared/bench'
import { MAX_TARGETS } from '@/shared/bench'
import { normalizeWord, SCENARIOS } from '@/shared/scenarios'
import { isValidWord } from '@/shared/validate-request'
import type { Level, VocabItem } from '@/shared/types'
import { GENDERS, getItem, type Gender, type Outfit } from './shop'

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
  /** Last day (YYYY-MM-DD) a bench chat tested this word. */
  lastTested?: string
}

export const BENCH_CHATS_PER_DAY = 4
/** Paid at the end of a bench chat in which the learner understood every word tested. */
export const BENCH_REWARD = 10

/** One local day's bench record: chats started and chats rewarded. */
export interface BenchDay {
  date: string
  chats: number
  rewarded: number
}

/** Local calendar date as YYYY-MM-DD, built by hand: locale date formats differ between browsers. */
export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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
  /** Today's bench chats and payouts; kept across rounds and levels. */
  benchDay: BenchDay | null
  /** Shop items bought with coins (ids from SHOP_ITEMS). Kept across rounds and levels. */
  owned: string[]
  /** What the player is wearing. Kept across rounds and levels. */
  outfit: Outfit
  /** The player's character, chosen for free in the shop. Kept across rounds and levels. */
  gender: Gender
  /** Words the learner starred (as `wordKey`s), shown under Starred in the notebook. Kept across rounds and levels. */
  starred: string[]
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
  | { type: 'startBenchChat'; date: string; words: string[] }
  | { type: 'rewardBenchChat'; date: string }
  | { type: 'buyItem'; itemId: string }
  | { type: 'toggleItem'; itemId: string }
  | { type: 'setGender'; gender: Gender }
  | { type: 'toggleStar'; word: string }

export function newGame(
  level: Level,
  lastWords: Record<string, string[]> = {},
  learnedWords: LearnedWord[] = [],
  benchDay: BenchDay | null = null,
  starred: string[] = [],
): GameState {
  return {
    level,
    stamps: [],
    coins: 0,
    complete: false,
    celebrationOpen: false,
    lastWords,
    learnedWords,
    benchDay,
    owned: [],
    outfit: {},
    gender: 'neutral',
    starred,
  }
}

/** A new round that keeps what lasts across rounds: words, the notebook and its stars, today's bench limits and the shop items. */
function nextRound(state: GameState, level: Level): GameState {
  return { ...newGame(level, state.lastWords, state.learnedWords, state.benchDay, state.starred), ...keptLook(state) }
}

/** Whether a word is starred. */
export const isStarred = (starred: string[], word: string) => starred.includes(wordKey(word))

/** The shop items, outfit and character, which last across rounds and new games. */
export function keptLook(state: GameState): Pick<GameState, 'owned' | 'outfit' | 'gender'> {
  return { owned: state.owned, outfit: state.outfit, gender: state.gender }
}

/** The day's record for `date`: a fresh one when there is none or it is from another day. */
const dayRecord = (state: GameState, date: string): BenchDay =>
  state.benchDay?.date === date ? state.benchDay : { date, chats: 0, rewarded: 0 }

export type BenchStatus = 'no_words' | 'limit' | 'open'

/** Words the bench server will accept (it validates the same way). */
const benchable = (l: LearnedWord): boolean => {
  const meaning = l.meaning_vi.trim()
  return isValidWord(normalizeWord(l.word)) && meaning.length >= 1 && meaning.length <= 200
}

export function benchStatus(state: GameState, date: string): BenchStatus {
  if (!state.learnedWords.some(benchable)) return 'no_words'
  return dayRecord(state, date).chats >= BENCH_CHATS_PER_DAY ? 'limit' : 'open'
}

/** Up to MAX_TARGETS words: never-tested first, then the longest ago; ties in notebook order. */
export function pickBenchTargets(state: GameState): BenchTarget[] {
  return state.learnedWords
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => benchable(l))
    .sort((a, b) => {
      const x = a.l.lastTested ?? ''
      const y = b.l.lastTested ?? ''
      return x < y ? -1 : x > y ? 1 : a.i - b.i
    })
    .slice(0, MAX_TARGETS)
    .map(({ l }) => ({ word: l.word, meaning_vi: l.meaning_vi }))
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
      return nextRound(state, state.level)
    case 'levelUp':
      return canLevelUp(state) ? nextRound(state, (state.level + 1) as Level) : state
    case 'startBenchChat': {
      const day = dayRecord(state, action.date)
      if (day.chats >= BENCH_CHATS_PER_DAY) return state
      const keys = action.words.map(wordKey)
      return {
        ...state,
        benchDay: { ...day, chats: day.chats + 1 },
        learnedWords: state.learnedWords.map((l) => (keys.includes(wordKey(l.word)) ? { ...l, lastTested: action.date } : l)),
      }
    }
    case 'rewardBenchChat': {
      // `date` is the day the chat started. Each started chat pays at most once.
      const day = dayRecord(state, action.date)
      if (day.rewarded >= day.chats) return state
      return { ...state, coins: state.coins + BENCH_REWARD, benchDay: { ...day, rewarded: day.rewarded + 1 } }
    }
    case 'buyItem': {
      // Buying puts the item on straight away.
      const item = getItem(action.itemId)
      if (!item || state.owned.includes(item.id) || state.coins < item.price) return state
      return {
        ...state,
        coins: state.coins - item.price,
        owned: [...state.owned, item.id],
        outfit: { ...state.outfit, [item.slot]: item.id },
      }
    }
    case 'toggleItem': {
      // Put an owned item on, or take it off if it's already on.
      const item = getItem(action.itemId)
      if (!item || !state.owned.includes(item.id)) return state
      const wearing = state.outfit[item.slot] === item.id
      return { ...state, outfit: { ...state.outfit, [item.slot]: wearing ? undefined : item.id } }
    }
    case 'setGender':
      return GENDERS.includes(action.gender) ? { ...state, gender: action.gender } : state
    case 'toggleStar': {
      const k = wordKey(action.word)
      if (!k) return state
      return { ...state, starred: state.starred.includes(k) ? state.starred.filter((w) => w !== k) : [...state.starred, k] }
    }
  }
}
