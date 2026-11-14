import { normalizeWord } from '@/shared/scenarios'
import { MAX_WORDS, MIN_WORDS } from '@/shared/validate-request'

const key = (w: string) => normalizeWord(w).toLowerCase()

export function addWord(selected: string[], word: string): string[] {
  const w = normalizeWord(word)
  if (!w || selected.length >= MAX_WORDS) return selected
  if (selected.some((s) => key(s) === key(w))) return selected
  return [...selected, w]
}

export function toggleWord(selected: string[], word: string): string[] {
  return selected.some((s) => key(s) === key(word))
    ? selected.filter((s) => key(s) !== key(word))
    : addWord(selected, word)
}

export function canSubmit(selected: string[]): boolean {
  return selected.length >= MIN_WORDS && selected.length <= MAX_WORDS
}
