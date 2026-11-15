import type { Lesson } from '../../src/shared/types'

/** Short fingerprint (FNV-1a) of what the rater saw, so a rating can't silently carry over to changed text. */
export function dialogueHash(lesson: Lesson): string {
  const text = JSON.stringify(lesson.lines)
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
