import type { Lesson, LessonRequest } from '@/shared/types'

/** One test case: a lesson request plus an id and which word set it uses. */
export type EvalCase = LessonRequest & { id: string; set: 'A' | 'B' }
export type Method = 'baseline' | 'llm'
export type RunResult = { ok: true; lesson: Lesson } | { ok: false; code: string }
/** Keyed by case id. */
export type ResultsFile = Record<string, RunResult>
/** `h` is a fingerprint of the dialogue text that was rated (see hash.ts). */
export type Rating = { q1: boolean; q2: boolean; note: string; h?: string }
/** Keyed by dialogue id (see dialogueId). */
export type RatingsFile = Record<string, Rating>

export const METHODS: Method[] = ['baseline', 'llm']
export const dialogueId = (m: Method, caseId: string) => `${m}:${caseId}`
