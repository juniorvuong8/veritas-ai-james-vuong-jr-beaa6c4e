import { describe, expect, it } from 'vitest'
import type { BenchReply, BenchRequest } from '@/shared/bench'
import { requestBenchReply } from './bench-api'
import type { benchChatFn } from './bench.functions'

const req: BenchRequest = {
  benchId: 'bac-tu',
  level: 2,
  targets: [{ word: 'bench', meaning_vi: 'ghế dài' }],
  history: [],
}
const reply: BenchReply = { text: 'Hello!', verdicts: [], done: false }

const fake = (fn: () => Promise<unknown>) => fn as unknown as typeof benchChatFn

describe('requestBenchReply', () => {
  it('returns the reply on status 200', async () => {
    const res = await requestBenchReply(req, { call: fake(async () => ({ status: 200, body: reply })) })
    expect(res).toEqual({ ok: true, reply })
  })

  it('maps an error body to a failure', async () => {
    const body = { code: 'ai_failed', message_vi: 'Lỗi' }
    const res = await requestBenchReply(req, { call: fake(async () => ({ status: 502, body })) })
    expect(res).toEqual({ ok: false, code: 'ai_failed', message_vi: 'Lỗi' })
  })

  it('falls back to ai_failed on a non-200 response without an error body', async () => {
    const res = await requestBenchReply(req, { call: fake(async () => ({ status: 500, body: null })) })
    expect(res).toMatchObject({ ok: false, code: 'ai_failed' })
  })

  it('times out when the call never resolves', async () => {
    const res = await requestBenchReply(req, { call: fake(() => new Promise(() => {})), timeoutMs: 10 })
    expect(res).toMatchObject({ ok: false, code: 'timeout' })
  })

  it('reports a network error when the call rejects', async () => {
    const res = await requestBenchReply(req, { call: fake(async () => { throw new Error('boom') }) })
    expect(res).toMatchObject({ ok: false, code: 'network' })
  })
})
