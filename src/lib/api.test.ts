import { describe, expect, it, vi } from 'vitest'
import { validLesson, validRequest } from '@/shared/test-fixtures'
import { requestLesson } from './api'

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('requestLesson', () => {
  it('returns the lesson on 200', async () => {
    const r = await requestLesson(validRequest, { fetchFn: respond(200, validLesson()) })
    expect(r).toEqual({ ok: true, lesson: validLesson() })
  })

  it('returns the server error code and message', async () => {
    const body = { code: 'ai_failed', message_vi: 'Không tạo được hội thoại. Vui lòng thử lại.' }
    const r = await requestLesson(validRequest, { fetchFn: respond(502, body) })
    expect(r).toEqual({ ok: false, ...body })
  })

  it('returns network when fetch rejects', async () => {
    const f = vi.fn(async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch
    const r = await requestLesson(validRequest, { fetchFn: f })
    expect(r).toMatchObject({ ok: false, code: 'network' })
  })

  it('returns timeout when the request takes too long', async () => {
    const f = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    ) as unknown as typeof fetch
    const r = await requestLesson(validRequest, { fetchFn: f, timeoutMs: 10 })
    expect(r).toMatchObject({ ok: false, code: 'timeout' })
  })
})
