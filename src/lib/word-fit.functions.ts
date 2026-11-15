import { createServerFn } from '@tanstack/react-start'
import { createGatewayAiCaller } from '@/shared/ai'
import { WORD_FIT_MAX_TOKENS, checkWordFit, type WordFitResult } from '@/shared/word-fit'

/** Server-side: asks the AI whether a custom word fits the place. Null for a malformed request. */
export const checkWordFitFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<WordFitResult | null> => {
    try {
      return (await checkWordFit(data, createGatewayAiCaller({ maxTokens: WORD_FIT_MAX_TOKENS }))) ?? null
    } catch (err) {
      console.error('word-fit: unexpected error', err)
      return { fits: true, checked: false }
    }
  })
