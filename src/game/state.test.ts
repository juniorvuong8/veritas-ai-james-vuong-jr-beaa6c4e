import { describe, expect, it } from 'vitest'
import { canLevelUp, gameReducer, isLearned, newGame, type GameAction, type GameState } from './state'

const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s)
const finish = (placeId: string): GameAction => ({ type: 'finishPlace', placeId })
const allFour = [finish('cafe'), finish('supermarket'), finish('taxi'), finish('clinic')]

describe('gameReducer', () => {
  it('starts empty at the chosen level', () => {
    expect(newGame(2)).toEqual({
      level: 2, stamps: [], coins: 0, complete: false, celebrationOpen: false, lastWords: {}, learnedWords: [], benchDay: null,
      owned: [], outfit: {}, gender: 'neutral', starred: [],
    })
  })

  it('adds stamps in place order and only once', () => {
    const s = run(newGame(1), finish('taxi'), finish('cafe'), finish('taxi'))
    expect(s.stamps).toEqual(['cafe', 'taxi'])
  })

  it('adds coins', () => {
    expect(run(newGame(1), { type: 'earnCoins', amount: 10 }, { type: 'earnCoins', amount: 10 }).coins).toBe(20)
  })

  it('completes the round and opens the celebration on the fourth stamp', () => {
    const s = run(newGame(1), ...allFour)
    expect(s.complete).toBe(true)
    expect(s.celebrationOpen).toBe(true)
  })

  it('keeps the round complete when the celebration is dismissed', () => {
    const s = run(newGame(1), ...allFour, { type: 'dismissCelebration' })
    expect(s.complete).toBe(true)
    expect(s.celebrationOpen).toBe(false)
  })

  it('does not reopen the celebration when replaying a place after completion', () => {
    const s = run(newGame(1), ...allFour, { type: 'dismissCelebration' }, finish('cafe'))
    expect(s.stamps).toHaveLength(4)
    expect(s.celebrationOpen).toBe(false)
  })

  it('does not complete the round when a stamped place is finished again', () => {
    const s = run(newGame(1), finish('cafe'), finish('taxi'), finish('clinic'), finish('cafe'))
    expect(s.stamps).toHaveLength(3)
    expect(s.complete).toBe(false)
    expect(s.celebrationOpen).toBe(false)
  })

  it('only opens the celebration when the round is complete', () => {
    expect(run(newGame(1), { type: 'openCelebration' }).celebrationOpen).toBe(false)
    const s = run(newGame(1), ...allFour, { type: 'dismissCelebration' }, { type: 'openCelebration' })
    expect(s.celebrationOpen).toBe(true)
  })

  it('play again keeps level and remembered words, resets the round', () => {
    const s = run(
      newGame(2),
      { type: 'rememberWords', placeId: 'cafe', words: ['menu', 'to go', 'receipt'] },
      { type: 'earnCoins', amount: 30 },
      ...allFour,
      { type: 'playAgain' },
    )
    expect(s).toEqual({ ...newGame(2), lastWords: { cafe: ['menu', 'to go', 'receipt'] } })
  })

  it('levels up with a fresh passport', () => {
    const s = run(newGame(2), ...allFour, { type: 'levelUp' })
    expect(s.level).toBe(3)
    expect(s.stamps).toEqual([])
    expect(s.complete).toBe(false)
  })

  it('cannot level up past 3', () => {
    const s = run(newGame(3), ...allFour)
    expect(canLevelUp(s)).toBe(false)
    expect(gameReducer(s, { type: 'levelUp' })).toBe(s)
    expect(canLevelUp(newGame(2))).toBe(true)
  })

  it('remembers words per place', () => {
    const s = run(newGame(1), { type: 'rememberWords', placeId: 'taxi', words: ['fare', 'tip', 'trunk'] })
    expect(s.lastWords).toEqual({ taxi: ['fare', 'tip', 'trunk'] })
  })

  it('ignores unknown places', () => {
    const s = newGame(1)
    expect(gameReducer(s, finish('moon'))).toBe(s)
    expect(gameReducer(s, { type: 'rememberWords', placeId: 'moon', words: ['a', 'b', 'c'] })).toBe(s)
  })
})

describe('learned words', () => {
  const vocab = (...words: [string, string][]) =>
    words.map(([input, word]) => ({ input, word, meaning_vi: `nghĩa ${word}`, usage_vi: `cách dùng ${word}` }))
  const learn = (placeId: string, ...words: [string, string][]): GameAction => ({ type: 'learnWords', placeId, vocab: vocab(...words) })

  it('adds each word once, keeping where it was first learned', () => {
    const s = run(newGame(1), learn('cafe', ['menu', 'menu'], ['hóa đơn', 'receipt']), learn('supermarket', ['Receipt', 'receipt'], ['bag', 'bag']))
    expect(s.learnedWords.map((w) => [w.word, w.placeId])).toEqual([
      ['menu', 'cafe'],
      ['receipt', 'cafe'],
      ['bag', 'supermarket'],
    ])
    expect(s.learnedWords[1]).toMatchObject({ input: 'hóa đơn', meaning_vi: 'nghĩa receipt' })
  })

  it('matches by English word or the Vietnamese input, ignoring case and spacing', () => {
    const s = run(newGame(1), learn('cafe', ['hóa đơn', 'receipt']))
    expect(isLearned(s.learnedWords, ' Receipt ')).toBe(true)
    expect(isLearned(s.learnedWords, 'hóa đơn')).toBe(true)
    expect(isLearned(s.learnedWords, 'menu')).toBe(false)
  })

  it('keeps learned words through play again and level up', () => {
    const s = run(newGame(1), learn('cafe', ['menu', 'menu']), ...allFour)
    expect(run(s, { type: 'playAgain' }).learnedWords).toHaveLength(1)
    expect(run(s, { type: 'levelUp' }).learnedWords).toHaveLength(1)
  })
})

describe('shop', () => {
  const rich = (coins: number) => ({ ...newGame(1), coins })

  it('buys an item, takes the coins and puts it on', () => {
    const s = run(rich(50), { type: 'buyItem', itemId: 'cap' })
    expect(s.coins).toBe(30)
    expect(s.owned).toEqual(['cap'])
    expect(s.outfit).toEqual({ hat: 'cap' })
  })

  it('refuses when there are not enough coins, the item is owned or unknown', () => {
    expect(run(rich(10), { type: 'buyItem', itemId: 'cap' })).toEqual(rich(10))
    const owned = run(rich(50), { type: 'buyItem', itemId: 'cap' })
    expect(run(owned, { type: 'buyItem', itemId: 'cap' })).toBe(owned)
    expect(run(rich(500), { type: 'buyItem', itemId: 'jetpack' })).toEqual(rich(500))
  })

  it('wears one item per slot and takes it off again', () => {
    let s = run(rich(200), { type: 'buyItem', itemId: 'cap' }, { type: 'buyItem', itemId: 'tophat' }, { type: 'buyItem', itemId: 'beard' })
    expect(s.outfit).toEqual({ hat: 'tophat', look: 'beard' })
    s = run(s, { type: 'toggleItem', itemId: 'cap' })
    expect(s.outfit.hat).toBe('cap')
    s = run(s, { type: 'toggleItem', itemId: 'cap' })
    expect(s.outfit.hat).toBeUndefined()
    expect(run(s, { type: 'toggleItem', itemId: 'crown' })).toBe(s)
  })

  it('keeps items and gender through play again and level up', () => {
    const s = run(rich(100), { type: 'buyItem', itemId: 'dog' }, { type: 'setGender', gender: 'female' }, ...allFour)
    for (const next of [run(s, { type: 'playAgain' }), run(s, { type: 'levelUp' })]) {
      expect(next.owned).toEqual(['dog'])
      expect(next.outfit).toEqual({ pet: 'dog' })
      expect(next.gender).toBe('female')
    }
  })

  it('changes gender for free', () => {
    const s = run(rich(0), { type: 'setGender', gender: 'male' })
    expect(s).toMatchObject({ gender: 'male', coins: 0 })
  })
})

describe('stars', () => {
  it('stars and unstars a word, ignoring case and spacing', () => {
    const s = run(newGame(1), { type: 'toggleStar', word: ' Receipt ' })
    expect(s.starred).toEqual(['receipt'])
    expect(run(s, { type: 'toggleStar', word: 'receipt' }).starred).toEqual([])
    expect(run(newGame(1), { type: 'toggleStar', word: '  ' }).starred).toEqual([])
  })

  it('keeps stars through play again and level up', () => {
    const s = run(newGame(1), { type: 'toggleStar', word: 'menu' }, ...allFour)
    expect(run(s, { type: 'playAgain' }).starred).toEqual(['menu'])
    expect(run(s, { type: 'levelUp' }).starred).toEqual(['menu'])
  })
})
