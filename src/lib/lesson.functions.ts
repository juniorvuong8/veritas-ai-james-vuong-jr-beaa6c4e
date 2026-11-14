import { createServerFn } from '@tanstack/react-start'
import { createGatewayAiCaller } from '@/shared/ai'
import { ERRORS, generateLesson } from '@/shared/generate'
import type { ErrorBody, Lesson } from '@/shared/types'

export const generateLessonFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => data)
  .handler(async ({ data }): Promise<{ status: number; body: Lesson | ErrorBody }> => {
    try {
      return await generateLesson(data, createGatewayAiCaller())
    } catch (err) {
      console.error('generate-lesson: unexpected error', err)
      return { status: 502, body: { code: 'ai_failed', message_vi: ERRORS.ai_failed.message_vi } }
    }
  })
