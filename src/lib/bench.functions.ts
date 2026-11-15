import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'
import { createGatewayAiCaller } from '@/shared/ai'
import { BENCH_MAX_TOKENS, chatOnBench, type BenchResult } from '@/shared/bench'
import { ERRORS } from '@/shared/generate'
import { createRateLimiter } from './rate-limit'

/** A chat is 6 calls (the opening plus 5 replies); this leaves room for retries but stops scripted floods. */
const BENCH_REQUESTS_PER_MINUTE = 20
const allowBenchRequest = createRateLimiter(BENCH_REQUESTS_PER_MINUTE, 60_000)

/** Signs bench chats so they can't be forged. `BENCH_SECRET` if set, otherwise derived from the gateway key. */
function benchSecret(): string | undefined {
  if (process.env.BENCH_SECRET) return process.env.BENCH_SECRET
  return process.env.LOVABLE_API_KEY ? `bench-chat:${process.env.LOVABLE_API_KEY}` : undefined
}

function clientKey(): string {
  return getRequestHeader('cf-connecting-ip') ?? getRequestIP({ xForwardedFor: true }) ?? 'unknown'
}

/** Server-side: one park-bench chat turn. Unexpected failures become a 502 ai_failed result. */
export const benchChatFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<BenchResult> => {
    if (!allowBenchRequest(clientKey())) {
      return { status: 429, body: { code: 'rate_limited', message_vi: ERRORS.rate_limited.message_vi } }
    }
    try {
      return await chatOnBench(data, createGatewayAiCaller({ maxTokens: BENCH_MAX_TOKENS }), { secret: benchSecret() })
    } catch (err) {
      console.error('bench: unexpected error', err)
      return { status: 502, body: { code: 'ai_failed', message_vi: ERRORS.ai_failed.message_vi } }
    }
  })
