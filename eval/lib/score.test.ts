import { describe, expect, it } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { dialogueHash } from './hash'
import { renderResults, score } from './score'
import type { EvalCase, Method, RatingsFile, ResultsFile } from './types'

const words = ['menu', 'to go', 'receipt']
const cases: EvalCase[] = [
  { id: 'cafe-A-L1', set: 'A', scenarioId: 'cafe', level: 1, words },
  { id: 'cafe-A-L2', set: 'A', scenarioId: 'cafe', level: 2, words },
]
const ok = (level: 1 | 2) => ({ ok: true as const, lesson: { ...validLesson(), level } })
const results: Record<Method, ResultsFile> = {
  baseline: { 'cafe-A-L1': ok(1), 'cafe-A-L2': ok(2) },
  llm: { 'cafe-A-L1': ok(1), 'cafe-A-L2': { ok: false, code: 'ai_failed' } },
}
const ratings: RatingsFile = {
  'baseline:cafe-A-L1': { q1: true, q2: false, note: '' },
  'baseline:cafe-A-L2': { q1: true, q2: true, note: '' },
  'llm:cafe-A-L1': { q1: true, q2: true, note: '' },
}

describe('score', () => {
  it('counts a case only when both answers are yes, and a failed run as a fail', () => {
    const r = score(cases, results, ratings)
    expect(r.baseline.headline).toBe(50)
    expect(r.llm.headline).toBe(50)
    expect(r.llm.failedRuns).toEqual(['cafe-A-L2'])
    expect(r.baseline.q1Rate).toBe(100)
    expect(r.baseline.q2Rate).toBe(50)
  })

  it('splits by level', () => {
    const r = score(cases, results, ratings)
    expect(r.baseline.byLevel).toEqual({ 1: 0, 2: 100 })
    expect(r.llm.byLevel).toEqual({ 1: 100, 2: 0 })
  })

  it('collects notes from failed LLM dialogues', () => {
    const r = score(cases, results, { ...ratings, 'llm:cafe-A-L1': { q1: false, q2: true, note: 'dùng sai "receipt"' } })
    expect(r.llm.notes).toEqual([{ caseId: 'cafe-A-L1', note: 'dùng sai "receipt"' }])
  })

  it('stops when a dialogue is unrated', () => {
    const { ['llm:cafe-A-L1']: _, ...missing } = ratings
    expect(() => score(cases, results, missing)).toThrow(/llm:cafe-A-L1/)
  })

  it('stops when a rating matches no dialogue', () => {
    expect(() => score(cases, results, { ...ratings, 'llm:cafe-A-L9': { q1: true, q2: true, note: '' } })).toThrow(/llm:cafe-A-L9/)
  })

  it('renders the filled-in sentence', () => {
    const md = renderResults(score(cases, results, ratings))
    expect(md).toContain('On the same 2 test cases, the baseline achieved 50% and the LLM achieved 50%.')
  })

  it('stops when a results file is missing a case', () => {
    const partial = { ...results, llm: { 'cafe-A-L1': ok(1) } }
    const { ['llm:cafe-A-L1']: _, ...rest } = ratings
    expect(() => score(cases, partial, { ...rest, 'llm:cafe-A-L1': ratings['llm:cafe-A-L1'] })).toThrow(/missing from llm results: cafe-A-L2/)
  })

  it('stops when a rating was given for different dialogue text', () => {
    const withHashes = Object.fromEntries(
      Object.entries(ratings).map(([id, r]) => {
        const [m, c] = id.split(':') as [Method, string]
        const res = results[m][c]
        return [id, { ...r, h: res.ok ? dialogueHash(res.lesson) : '' }]
      }),
    )
    expect(() => score(cases, results, withHashes)).not.toThrow()
    withHashes['baseline:cafe-A-L1'].h = 'stale'
    expect(() => score(cases, results, withHashes)).toThrow(/baseline:cafe-A-L1/)
  })

  it('states plainly that the methods can be told apart', () => {
    expect(renderResults(score(cases, results, ratings))).toContain('not fully blind')
    expect(renderResults(score(cases, results, ratings))).toContain('length and turn-taking')
  })
})
