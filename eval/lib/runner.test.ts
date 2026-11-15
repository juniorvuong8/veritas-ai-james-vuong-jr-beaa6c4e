import { describe, expect, it, vi } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { readEnvKey } from './env'
import { runCases } from './runner'
import type { EvalCase, ResultsFile, RunResult } from './types'

const mk = (id: string): EvalCase => ({ id, set: 'A', scenarioId: 'cafe', level: 1, words: ['menu', 'to go', 'receipt'] })
const ok: RunResult = { ok: true, lesson: validLesson() }

describe('readEnvKey', () => {
  const text = '# comment\nA=1\nB="two"\n  C = three \n'
  it('reads plain, quoted and spaced values', () => {
    expect(readEnvKey(text, 'A')).toBe('1')
    expect(readEnvKey(text, 'B')).toBe('two')
    expect(readEnvKey(text, 'C')).toBe('three')
  })
  it('returns undefined for a missing key or a comment', () => {
    expect(readEnvKey(text, 'D')).toBeUndefined()
    expect(readEnvKey('# A=1', 'A')).toBeUndefined()
  })
})

describe('runCases', () => {
  it('skips finished cases, retries failed ones, and saves after each case', async () => {
    const existing: ResultsFile = { c1: ok, c2: ok, c3: { ok: false, code: 'ai_failed' } }
    const generate = vi.fn(async () => ok)
    const saves: ResultsFile[] = []
    const out = await runCases([mk('c1'), mk('c2'), mk('c3'), mk('c4')], existing, generate, (r) => saves.push({ ...r }))
    expect(generate.mock.calls.map((c) => (c as unknown as [EvalCase])[0].id)).toEqual(['c3', 'c4'])
    expect(saves).toHaveLength(2)
    expect(Object.keys(saves[0]).sort()).toEqual(['c1', 'c2', 'c3'])
    expect(out.c4).toEqual(ok)
  })

  it('records a thrown error and keeps going', async () => {
    const generate = vi
      .fn<(c: EvalCase) => Promise<RunResult>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(ok)
    const out = await runCases([mk('a'), mk('b')], {}, generate, () => {})
    expect(out.a).toEqual({ ok: false, code: 'exception' })
    expect(out.b).toEqual(ok)
  })
})
