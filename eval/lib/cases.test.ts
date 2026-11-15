import { describe, expect, it } from 'vitest'
import { getScenario } from '@/shared/scenarios'
import { checkLessonRequest } from '@/shared/validate-request'
import casesJson from '../cases.json'
import type { EvalCase } from './types'

const cases = casesJson as EvalCase[]
const hasDiacritic = (w: string) => /[^\u0000-\u007f]/.test(w.normalize('NFC'))

describe('eval cases', () => {
  it('has 24 cases with unique ids', () => {
    expect(cases).toHaveLength(24)
    expect(new Set(cases.map((c) => c.id)).size).toBe(24)
  })

  it('reuses each place and word set at levels 1, 2 and 3', () => {
    for (const scenarioId of ['cafe', 'supermarket', 'taxi', 'clinic']) {
      for (const set of ['A', 'B'] as const) {
        const group = cases.filter((c) => c.scenarioId === scenarioId && c.set === set)
        expect(group.map((c) => c.level).sort()).toEqual([1, 2, 3])
        expect(new Set(group.map((c) => JSON.stringify(c.words))).size).toBe(1)
        expect(group.every((c) => c.id === `${scenarioId}-${set}-L${c.level}`)).toBe(true)
      }
    }
  })

  it('every case is a valid lesson request', () => {
    for (const c of cases) expect(checkLessonRequest(c).ok, c.id).toBe(true)
  })

  it('set A uses 3 suggested words; set B adds one Vietnamese word to 3 suggested', () => {
    for (const c of cases) {
      const suggested = getScenario(c.scenarioId)!.suggestedWords
      const inList = c.words.filter((w) => suggested.includes(w))
      if (c.set === 'A') {
        expect(c.words, c.id).toHaveLength(3)
        expect(inList, c.id).toHaveLength(3)
      } else {
        expect(c.words, c.id).toHaveLength(4)
        expect(inList, c.id).toHaveLength(3)
        const other = c.words.filter((w) => !suggested.includes(w))
        expect(other.every(hasDiacritic), c.id).toBe(true)
      }
    }
  })
})
