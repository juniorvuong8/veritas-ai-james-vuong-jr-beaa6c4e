import { AiError, parseJsonObject, type AiCaller } from './ai'
import { buildMessages } from './prompt'
import { getScenario } from './scenarios'
import type { ErrorBody, ErrorCode, Lesson } from './types'
import { INAPPROPRIATE_SIGNAL } from './prompt'
import { checkLesson } from './validate-lesson'
import { checkLessonRequest } from './validate-request'

export const MAX_ATTEMPTS = 2

export const ERRORS: Record<ErrorCode, { status: number; message_vi: string }> = {
  bad_request: { status: 400, message_vi: 'Yêu cầu không hợp lệ. Vui lòng chọn lại từ vựng.' },
  inappropriate: { status: 400, message_vi: 'Có từ không phù hợp. Vui lòng chọn lại từ vựng.' },
  rate_limited: { status: 429, message_vi: 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.' },
  out_of_credits: {
    status: 503,
    message_vi: 'Hệ thống tạm thời không tạo được hội thoại. Bạn có thể xem bài mẫu.',
  },
  ai_failed: { status: 502, message_vi: 'Không tạo được hội thoại. Vui lòng thử lại.' },
}

export type GenerateResult = { status: number; body: Lesson | ErrorBody }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function fail(code: ErrorCode): GenerateResult {
  return { status: ERRORS[code].status, body: { code, message_vi: ERRORS[code].message_vi } }
}

export async function generateLesson(body: unknown, callAi: AiCaller): Promise<GenerateResult> {
  const checked = checkLessonRequest(body)
  if (!checked.ok) return fail('bad_request')
  const req = checked.value
  const messages = buildMessages(getScenario(req.scenarioId)!, req)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let text: string
    try {
      text = await callAi(messages)
    } catch (err) {
      if (err instanceof AiError && err.status === 429) return fail('rate_limited')
      if (err instanceof AiError && err.status === 402) return fail('out_of_credits')
      console.error(`generate-lesson attempt ${attempt}: AI call failed`, err)
      continue
    }
    const parsed = parseJsonObject(text)
    if (isRecord(parsed) && parsed.error === INAPPROPRIATE_SIGNAL) return fail('inappropriate')
    const lesson = checkLesson(parsed, req)
    if (lesson.ok) return { status: 200, body: lesson.value }
    console.error(`generate-lesson attempt ${attempt}: output failed checks`, lesson.errors)
  }
  return fail('ai_failed')
}
