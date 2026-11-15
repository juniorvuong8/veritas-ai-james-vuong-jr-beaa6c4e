import { describe, expect, it } from 'vitest'
import {
  BENCH_COINS, benchPayouts, benchStatus, gameReducer, newGame, pickBenchTargets, today,
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
})

describe('benchStatus', () => {
  it('is no_words with an empty notebook', () => {
    expect(benchStatus(newGame(1), D)).toBe('no_words')
  })
  it('is limit after 4 chats today, open on another day', () => {
    const s = withWords([lw('menu')], { date: D, chats: 4, paid: {} })
    expect(benchStatus(s, D)).toBe('limit')
    expect(benchStatus(withWords([lw('menu')], { date: '2026-11-13', chats: 4, paid: {} }), D)).toBe('open')
    expect(benchStatus(withWords([lw('menu')]), D)).toBe('open')
  })
})

describe('unusable notebook words', () => {
  const bad = [lw('food to go'), lw('check (bill)'), lw('long', { meaning_vi: 'x'.repeat(201) }), lw('blank', { meaning_vi: '  ' })]
  it('are skipped when picking targets', () => {
    expect(pickBenchTargets(withWords([...bad, lw('menu')]), D).map((t) => t.word)).toEqual(['menu'])
  })
  it('make the status no_words when nothing qualifies', () => {
    expect(benchStatus(withWords(bad), D)).toBe('no_words')
    expect(benchStatus(withWords([...bad, lw('menu')]), D)).toBe('open')
  })
  it('does not pay prototype keys as checks', () => {
    const s = withWords([lw('menu')])
    expect(benchPayouts(s, D, [{ word: 'menu', check: 'toString' as never, passed: true }])).toEqual([])
  })
})

describe('pickBenchTargets', () => {
  const five = [lw('a', { lastTested: '2026-11-10' }), lw('b', { lastTested: '2026-11-12' }), lw('c'), lw('d'), lw('e')]
  it('prefers untested words in notebook order, then oldest tested', () => {
    expect(pickBenchTargets(withWords(five), D).map((t) => t.word)).toEqual(['c', 'd', 'e'])
    expect(pickBenchTargets(withWords(five.slice(0, 4)), D).map((t) => t.word)).toEqual(['c', 'd', 'a'])
  })
  it('returns fewer when the notebook is small', () => {
    const t = pickBenchTargets(withWords([lw('menu')]), D)
    expect(t).toEqual([{ word: 'menu', meaning_vi: 'nghĩa menu', paid: [] }])
  })
  it('reflects what is paid today only', () => {
    const s = withWords([lw('menu')], { date: D, chats: 1, paid: { menu: ['use'] } })
    expect(pickBenchTargets(s, D)[0].paid).toEqual(['use'])
    expect(pickBenchTargets(s, D1)[0].paid).toEqual([])
  })
})

describe('startBenchChat', () => {
  it('counts the chat and stamps only the named words', () => {
    const s = run(withWords([lw('menu'), lw('tip')]), { type: 'startBenchChat', date: D, words: ['Menu'] })
    expect(s.benchDay).toEqual({ date: D, chats: 1, paid: {} })
    expect(s.learnedWords.map((l) => l.lastTested)).toEqual([D, undefined])
  })
  it('resets the record on a new day', () => {
    const s = run(withWords([lw('menu')], { date: D, chats: 4, paid: { menu: ['use'] } }), { type: 'startBenchChat', date: D1, words: ['menu'] })
    expect(s.benchDay).toEqual({ date: D1, chats: 1, paid: {} })
  })
})

describe('benchPayouts and awardBench', () => {
  const base = () => withWords([lw('menu')], { date: D, chats: 1, paid: {} })
  const v = (check: 'use' | 'understand', passed = true, word = 'menu') => ({ word, check, passed })
  it('pays use 10 once per day, understand still pays 5', () => {
    const s1 = run(base(), { type: 'awardBench', date: D, verdicts: [v('use')] })
    expect(s1.coins).toBe(BENCH_COINS.use)
    const s2 = run(s1, { type: 'awardBench', date: D, verdicts: [v('use')] })
    expect(s2.coins).toBe(10)
    expect(benchPayouts(s1, D, [v('use')])).toEqual([])
    const s3 = run(s2, { type: 'awardBench', date: D, verdicts: [v('understand')] })
    expect(s3.coins).toBe(15)
    expect(s3.benchDay?.paid.menu).toEqual(['use', 'understand'])
  })
  it('never pays failed, unknown or repeated verdicts in one batch', () => {
    expect(benchPayouts(base(), D, [v('use', false), v('use', true, 'nope')])).toEqual([])
    expect(benchPayouts(base(), D, [v('use'), v('use')])).toEqual([{ word: 'menu', check: 'use', coins: 10 }])
  })
  it('pays again the next day and moves the record', () => {
    const s = run(base(), { type: 'awardBench', date: D, verdicts: [v('use')] }, { type: 'awardBench', date: D1, verdicts: [v('use')] })
    expect(s.coins).toBe(20)
    expect(s.benchDay?.date).toBe(D1)
  })
})

describe('keeping the bench record', () => {
  it('survives playAgain and levelUp', () => {
    const s = withWords([lw('menu', { lastTested: D })], { date: D, chats: 2, paid: { menu: ['use'] } })
    for (const type of ['playAgain', 'levelUp'] as const) {
      const n = run(s, { type })
      expect(n.benchDay).toEqual(s.benchDay)
      expect(n.learnedWords[0].lastTested).toBe(D)
    }
  })
})
