import { describe, expect, it } from 'vitest'
import { newGame, type GameState } from './state'
import { SAVE_KEY, clearGame, loadGame, saveGame } from './storage'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k) },
    setItem: (k, v) => { data.set(k, String(v)) },
  }
}

const saved = (value: unknown) => () => memoryStorage({ [SAVE_KEY]: JSON.stringify(value) })
const game: GameState = {
  ...newGame(2),
  stamps: ['cafe', 'taxi'],
  coins: 40,
  lastWords: { cafe: ['menu', 'to go', 'receipt'] },
  learnedWords: [{ word: 'receipt', input: 'hóa đơn', meaning_vi: 'hóa đơn', usage_vi: 'Xin sau khi trả tiền.', placeId: 'cafe' }],
}

describe('storage', () => {
  it('round-trips a game, restoring the celebration closed', () => {
    const store = memoryStorage()
    const complete = { ...game, stamps: ['cafe', 'supermarket', 'taxi', 'clinic'], complete: true, celebrationOpen: true }
    saveGame(complete, () => store)
    expect(loadGame(() => store)).toEqual({ ...complete, celebrationOpen: false })
  })

  it('loads shop items, dropping unknown ones and outfits for items not owned', () => {
    const loaded = loadGame(
      saved({ ...game, owned: ['cap', 'jetpack', 'dog'], outfit: { hat: 'cap', pet: 'cat', look: 'dog' } }),
    )
    expect(loaded?.owned).toEqual(['cap', 'dog'])
    expect(loaded?.outfit).toEqual({ hat: 'cap' })
  })

  it('loads a save from before the shop with nothing bought', () => {
    const { owned: _o, outfit: _f, ...old } = game
    expect(loadGame(saved(old))).toMatchObject({ owned: [], outfit: {} })
  })

  it('loads a save from before the notebook with no learned words', () => {
    const { learnedWords: _, ...old } = game
    expect(loadGame(saved(old))?.learnedWords).toEqual([])
  })

  it('drops broken learned words but keeps the rest of the save', () => {
    const loaded = loadGame(saved({ ...game, learnedWords: [...game.learnedWords, { word: 7 }, 'menu'] }))
    expect(loaded?.learnedWords).toEqual(game.learnedWords)
    expect(loaded?.coins).toBe(40)
  })

  it('returns null when nothing is saved', () => {
    expect(loadGame(() => memoryStorage())).toBeNull()
  })

  const broken: [string, () => Storage][] = [
    ['non-JSON', () => memoryStorage({ [SAVE_KEY]: '{oops' })],
    ['level 7', saved({ ...game, level: 7 })],
    ['an unknown stamp', saved({ ...game, stamps: ['cafe', 'moon'] })],
    ['duplicate stamps', saved({ ...game, stamps: ['cafe', 'cafe'] })],
    ['NaN coins', saved({ ...game, coins: NaN })],
    ['negative coins', saved({ ...game, coins: -5 })],
    ['complete with 2 stamps', saved({ ...game, complete: true })],
    ['lastWords not string arrays', saved({ ...game, lastWords: { cafe: [1, 2] } })],
  ]
  for (const [name, getStorage] of broken) {
    it(`returns null for ${name}`, () => {
      expect(loadGame(getStorage)).toBeNull()
    })
  }

  it('survives storage that throws', () => {
    const throwing = () => { throw new Error('SecurityError') }
    expect(loadGame(throwing)).toBeNull()
    expect(() => saveGame(game, throwing)).not.toThrow()
    expect(() => clearGame(throwing)).not.toThrow()
  })

  it('clears the save', () => {
    const store = memoryStorage()
    saveGame(game, () => store)
    clearGame(() => store)
    expect(store.getItem(SAVE_KEY)).toBeNull()
  })
})
