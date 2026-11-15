import type { BenchReply, BenchRequest } from '@/shared/bench'
import { ERRORS } from '@/shared/generate'
import type { ErrorCode } from '@/shared/types'
import { isErrorBody, NETWORK_MESSAGE, TIMEOUT_MESSAGE } from './api'
import { benchChatFn } from './bench.functions'

export type BenchChatResult =
  | { ok: true; reply: BenchReply }
  | { ok: false; code: ErrorCode | 'timeout' | 'network'; message_vi: string }

/** Same as lessons: the server may retry the AI once, so a turn can take well over 30 seconds. */
export const BENCH_TIMEOUT_MS = 60_000

export async function requestBenchReply(
  req: BenchRequest,
  opts: { call?: typeof benchChatFn; timeoutMs?: number } = {},
): Promise<BenchChatResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? BENCH_TIMEOUT_MS)
  try {
    // Race the abort so a caller that ignores the signal still times out.
    const aborted = new Promise<never>((_, reject) =>
      controller.signal.addEventListener('abort', () => reject(new Error('aborted'))),
    )
    const res = await Promise.race([(opts.call ?? benchChatFn)({ data: req, signal: controller.signal }), aborted])
    const body: unknown = res.body
    if (isErrorBody(body)) return { ok: false, code: body.code, message_vi: body.message_vi }
    if (res.status === 200 && body) return { ok: true, reply: body as BenchReply }
    return { ok: false, code: 'ai_failed', message_vi: ERRORS.ai_failed.message_vi }
  } catch {
    if (controller.signal.aborted) return { ok: false, code: 'timeout', message_vi: TIMEOUT_MESSAGE }
    return { ok: false, code: 'network', message_vi: NETWORK_MESSAGE }
  } finally {
    clearTimeout(timer)
  }
}
