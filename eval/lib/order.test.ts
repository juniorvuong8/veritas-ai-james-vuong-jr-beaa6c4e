import { describe, expect, it } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { buildOrder } from './order'
import type { EvalCase, Method, ResultsFile } from './types'

const cases = ['a', 'b', 'c'].map((id): EvalCase => ({ id, set: 'A', scenarioId: 'cafe', level: 1, words: ['menu', 'to go', 'receipt'] }))
const ok = { ok: true as const, lesson: validLesson() }
const results: Record<Method, ResultsFile> = {
  baseline: { a: ok, b: ok, c: ok },
  llm: { a: ok, b: { ok: false, code: 'ai_failed' }, c: ok },
}

describe('buildOrder', () => {
  it('is the same for the same seed', () => {
    expect(buildOrder(cases, results, 7)).toEqual(buildOrder(cases, results, 7))
  })
  it('leaves out failed runs and includes every other dialogue once', () => {
    const order = buildOrder(cases, results, 7)
    expect(order).not.toContain('llm:b')
    expect([...order].sort()).toEqual(['baseline:a', 'baseline:b', 'baseline:c', 'llm:a', 'llm:c'])
  })
  it('actually shuffles', () => {
    const many = Array.from({ length: 20 }, (_, i): EvalCase => ({ ...cases[0], id: `x${i}` }))
    const r = { baseline: Object.fromEntries(many.map((c) => [c.id, ok])), llm: {} }
    const order = buildOrder(many, r, 7)
    expect(order).not.toEqual(many.map((c) => `baseline:${c.id}`))
  })
})
