import { describe, expect, it } from 'vitest'
import { checkLesson } from '@/shared/validate-lesson'
import { checkLessonRequest } from '@/shared/validate-request'
import { FALLBACK_LESSONS, FALLBACK_REQUESTS } from './fallback-lessons'

describe('fallback lessons', () => {
  for (const level of [1, 2, 3] as const) {
    it(`level ${level} passes the same checks as AI lessons`, () => {
      expect(checkLessonRequest(FALLBACK_REQUESTS[level]).ok).toBe(true)
      const r = checkLesson(FALLBACK_LESSONS[level], FALLBACK_REQUESTS[level])
      expect(r.ok ? [] : r.errors).toEqual([])
    })
  }
})
