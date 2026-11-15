import { createServerFn } from '@tanstack/react-start'
import { createGatewayAiCaller } from '@/shared/ai'
import { BENCH_MAX_TOKENS, chatOnBench, type BenchResult } from '@/shared/bench'
import { ERRORS } from '@/shared/generate'

/** Server-side: one park-bench chat turn. Unexpected failures become a 502 ai_failed result. */
export const benchChatFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<BenchResult> => {
    try {
      return await chatOnBench(data, createGatewayAiCaller({ maxTokens: BENCH_MAX_TOKENS }))
    } catch (err) {
      console.error('bench: unexpected error', err)
      return { status: 502, body: { code: 'ai_failed', message_vi: ERRORS.ai_failed.message_vi } }
    }
  })
