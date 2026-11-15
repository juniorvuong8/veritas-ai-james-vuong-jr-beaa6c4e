import type { LessonResult } from './api'

type ResultErrorCode = Extract<LessonResult, { ok: false }>['code']

/** English versions of every error message, shown in debug mode. */
export const ERROR_MESSAGES_EN: Record<ResultErrorCode, string> = {
  bad_request: 'Invalid request. Please choose your words again.',
  inappropriate: 'One of the words is not appropriate. Please choose your words again.',
  rate_limited: 'The system is busy. Please try again in a few minutes.',
  out_of_credits: "The system can't make conversations right now. You can view the sample lesson.",
  ai_failed: "Couldn't create the conversation. Please try again.",
  timeout: 'This took too long. Please try again.',
  network: "Couldn't connect. Check your network and try again.",
}
