import { describe, expect, it, vi } from 'vitest'
import {
  BENCH_REWARD, benchStatus, gameReducer, newGame, pickBenchTargets, today,
  type BenchDay, type GameAction, type GameState, type LearnedWord,
} from './state'

const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s)
const lw = (word: string, extra: Partial<LearnedWord> = {}): LearnedWord => ({
  word, input: word, meaning_vi: `nghĩa ${word}`, usage_vi: 'x', placeId: 'cafe', ...extra,
})
const withWords = (words: LearnedWord[], benchDay: BenchDay | null = null): GameState => ({ ...newGame(1), learnedWords: words, benchDay })
const D = '2026-11-14'
const D1 = '2026-11-15'

describe('today', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(today(new Date(2026, 10, 14, 23, 30))).toBe('2026-11-14')
  })
  it('pads single-digit months and days, so dates sort as strings', () => {
    expect(today(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05')
    expect(today(new Date(2026, 1, 1)) < today(new Date(2026, 11, 1))).toBe(true)
  })
  it('does not depend on the browser locale', () => {
    const spy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('1/5/2027')
    expect(today(new Date(2027, 0, 5))).toBe('2027-01-05')
    spy.mockRestore()
  })
})

describe('benchStatus', () => {
  it('is no_words with an empty notebook', () => {
    expect(benchStatus(newGame(1), D)).toBe('no_words')
  })
  it('is limit after 4 chats today, open on another day', () => {
    const s = withWords([lw('menu')], { date: D, chats: 4, rewarded: 0 })
    expect(benchStatus(s, D)).toBe('limit')
    expect(benchStatus(withWords([lw('menu')], { date: '2026-11-13', chats: 4, rewarded: 4 }), D)).toBe('open')
    expect(benchStatus(withWords([lw('menu')]), D)).toBe('open')
  })
})

describe('unusable notebook words', () => {
  const bad = [lw('food to go'), lw('check (bill)'), lw('long', { meaning_vi: 'x'.repeat(201) }), lw('blank', { meaning_vi: '  ' })]
  it('are skipped when picking targets', () => {
    expect(pickBenchTargets(withWords([...bad, lw('menu')])).map((t) => t.word)).toEqual(['menu'])
  })
  it('make the status no_words when nothing qualifies', () => {
    expect(benchStatus(withWords(bad), D)).toBe('no_words')
    expect(benchStatus(withWords([...bad, lw('menu')]), D)).toBe('open')
  })
})

describe('pickBenchTargets', () => {
  const five = [lw('a', { lastTested: '2026-11-10' }), lw('b', { lastTested: '2026-11-12' }), lw('c'), lw('d'), lw('e')]
  it('prefers untested words in notebook order, then oldest tested', () => {
    expect(pickBenchTargets(withWords(five)).map((t) => t.word)).toEqual(['c', 'd', 'e'])
    expect(pickBenchTargets(withWords(five.slice(0, 4))).map((t) => t.word)).toEqual(['c', 'd', 'a'])
  })
  it('returns fewer when the notebook is small', () => {
    expect(pickBenchTargets(withWords([lw('menu')]))).toEqual([{ word: 'menu', meaning_vi: 'nghĩa menu' }])
  })
})

describe('startBenchChat', () => {
  it('counts the chat and stamps only the named words', () => {
    const s = run(withWords([lw('menu'), lw('tip')]), { type: 'startBenchChat', date: D, words: ['Menu'] })
    expect(s.benchDay).toEqual({ date: D, chats: 1, rewarded: 0 })
    expect(s.learnedWords.map((l) => l.lastTested)).toEqual([D, undefined])
  })
  it('resets the record on a new day', () => {
    const s = run(withWords([lw('menu')], { date: D, chats: 4, rewarded: 3 }), { type: 'startBenchChat', date: D1, words: ['menu'] })
    expect(s.benchDay).toEqual({ date: D1, chats: 1, rewarded: 0 })
  })
  it('refuses a fifth chat on the same day', () => {
    const s = withWords([lw('menu')], { date: D, chats: 4, rewarded: 0 })
    expect(run(s, { type: 'startBenchChat', date: D, words: ['menu'] })).toBe(s)
  })
})

describe('rewardBenchChat', () => {
  const reward = (date = D): GameAction => ({ type: 'rewardBenchChat', date })
  it('pays the reward once per started chat', () => {
    const started = run(withWords([lw('menu')]), { type: 'startBenchChat', date: D, words: ['menu'] })
    const s1 = run(started, reward())
    expect(s1.coins).toBe(BENCH_REWARD)
    expect(BENCH_REWARD).toBe(10)
    expect(s1.benchDay).toEqual({ date: D, chats: 1, rewarded: 1 })
    expect(run(s1, reward()).coins).toBe(10)
  })
  it('pays nothing without a chat started that day', () => {
    expect(run(withWords([lw('menu')]), reward()).coins).toBe(0)
    const started = run(withWords([lw('menu')]), { type: 'startBenchChat', date: D, words: ['menu'] })
    expect(run(started, reward(D1)).coins).toBe(0)
  })
  it('allows one reward for each of the day’s chats', () => {
    const s = withWords([lw('menu')], { date: D, chats: 4, rewarded: 0 })
    expect(run(s, reward(), reward(), reward(), reward(), reward()).coins).toBe(40)
  })
})

describe('keeping the bench record', () => {
  it('survives playAgain and levelUp', () => {
    const s = withWords([lw('menu', { lastTested: D })], { date: D, chats: 2, rewarded: 1 })
    for (const type of ['playAgain', 'levelUp'] as const) {
      const n = run(s, { type })
      expect(n.benchDay).toEqual(s.benchDay)
      expect(n.learnedWords[0].lastTested).toBe(D)
    }
  })
})
