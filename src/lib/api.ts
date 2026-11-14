import { generateLessonFn } from './lesson.functions'
import type { ErrorBody, ErrorCode, Lesson, LessonRequest } from '@/shared/types'

export type LessonResult =
  | { ok: true; lesson: Lesson }
  | { ok: false; code: ErrorCode | 'timeout' | 'network'; message_vi: string }

export const REQUEST_TIMEOUT_MS = 60_000
const TIMEOUT_MESSAGE = 'Mất quá nhiều thời gian. Vui lòng thử lại.'
const NETWORK_MESSAGE = 'Không kết nối được. Kiểm tra mạng và thử lại.'
const FALLBACK_ERROR = 'Không tạo được hội thoại. Vui lòng thử lại.'

function isErrorBody(v: unknown): v is ErrorBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as ErrorBody).code === 'string' &&
    typeof (v as ErrorBody).message_vi === 'string'
  )
}

export async function requestLesson(
  req: LessonRequest,
  opts: { fetchFn?: typeof fetch; timeoutMs?: number } = {},
): Promise<LessonResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REQUEST_TIMEOUT_MS)
  try {
    const call = opts.fetchFn
      ? opts.fetchFn('/generate-lesson', { method: 'POST', body: JSON.stringify(req), signal: controller.signal }).then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => null) }))
      : generateLessonFn({ data: req, signal: controller.signal }).then((r) => ({ ok: r.status === 200, body: r.body as unknown }))
    const res = await call
    const body: unknown = res.body
    if (res.ok && body) return { ok: true, lesson: body as Lesson }
    if (isErrorBody(body)) return { ok: false, code: body.code, message_vi: body.message_vi }
    return { ok: false, code: 'ai_failed', message_vi: FALLBACK_ERROR }
  } catch {
    if (controller.signal.aborted) return { ok: false, code: 'timeout', message_vi: TIMEOUT_MESSAGE }
    return { ok: false, code: 'network', message_vi: NETWORK_MESSAGE }
  } finally {
    clearTimeout(timer)
  }
}
