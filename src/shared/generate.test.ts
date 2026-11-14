import { describe, expect, it, vi } from 'vitest'
import { AiError, type AiCaller } from './ai'
import { generateLesson } from './generate'
import { validLesson, validRequest } from './test-fixtures'

function queue(...answers: (string | Error)[]) {
  return vi.fn<AiCaller>(async () => {
    const next = answers.shift()
    if (next === undefined) throw new Error('no more answers')
    if (next instanceof Error) throw next
    return next
  })
}

const good = JSON.stringify(validLesson())
const badLesson = JSON.stringify({ ...validLesson(), quiz: [] })

describe('generateLesson', () => {
  it('returns 200 and the lesson on a good first answer', async () => {
    const ai = queue(good)
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(200)
    expect(res.body).toEqual(validLesson())
    expect(ai).toHaveBeenCalledTimes(1)
  })

  it('retries once when the first answer fails checks', async () => {
    const ai = queue(badLesson, good)
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(200)
    expect(ai).toHaveBeenCalledTimes(2)
  })

  it('retries once when the first answer is not JSON', async () => {
    const ai = queue('sorry, I cannot', good)
    expect((await generateLesson(validRequest, ai)).status).toBe(200)
  })

  it('returns 502 ai_failed after two bad answers', async () => {
    const ai = queue(badLesson, 'nope', good)
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(502)
    expect(res.body).toMatchObject({ code: 'ai_failed' })
    expect(ai).toHaveBeenCalledTimes(2)
  })

  it('returns 400 bad_request without calling the AI', async () => {
    const ai = queue(good)
    const res = await generateLesson({ words: [] }, ai)
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ code: 'bad_request' })
    expect(ai).not.toHaveBeenCalled()
  })

  it('maps gateway 429 to rate_limited without retrying', async () => {
    const ai = queue(new AiError(429, 'busy'), good)
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ code: 'rate_limited' })
    expect(ai).toHaveBeenCalledTimes(1)
  })

  it('maps gateway 402 to out_of_credits (503) without retrying', async () => {
    const ai = queue(new AiError(402, 'pay'), good)
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(503)
    expect(res.body).toMatchObject({ code: 'out_of_credits' })
    expect(ai).toHaveBeenCalledTimes(1)
  })

  it('retries after another gateway error, then fails with ai_failed', async () => {
    const ai = queue(new AiError(500, 'x'), new Error('network'))
    const res = await generateLesson(validRequest, ai)
    expect(res.status).toBe(502)
    expect(ai).toHaveBeenCalledTimes(2)
  })
})
