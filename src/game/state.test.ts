import { describe, expect, it } from 'vitest'
import { canLevelUp, gameReducer, newGame, type GameAction, type GameState } from './state'

const run = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s)
const finish = (placeId: string): GameAction => ({ type: 'finishPlace', placeId })
const allFour = [finish('cafe'), finish('supermarket'), finish('taxi'), finish('clinic')]

describe('gameReducer', () => {
  it('starts empty at the chosen level', () => {
    expect(newGame(2)).toEqual({
      level: 2, stamps: [], coins: 0, complete: false, celebrationOpen: false, lastWords: {},
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
