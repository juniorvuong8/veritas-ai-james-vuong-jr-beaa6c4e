import { normalizeWord } from '@/shared/scenarios'

export type Segment = { text: string; word?: string }

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Split text into plain and highlighted segments. Whole-word, case-insensitive, longest word first. */
export function splitHighlights(text: string, words: string[]): Segment[] {
  const source = text.normalize('NFC')
  const canon = words.map(normalizeWord).filter(Boolean).sort((a, b) => b.length - a.length)
  if (canon.length === 0) return [{ text: source }]

  const re = new RegExp(
    `(?<![\\p{L}\\p{M}])(${canon.map(escapeRegExp).join('|')})(?![\\p{L}\\p{M}])`,
    'giu',
  )
  const segments: Segment[] = []
  let last = 0
  for (const m of source.matchAll(re)) {
    const start = m.index ?? 0
    if (start > last) segments.push({ text: source.slice(last, start) })
    const word = canon.find((w) => w.toLowerCase() === m[0].toLowerCase()) ?? m[0]
    segments.push({ text: m[0], word })
    last = start + m[0].length
  }
  if (last < source.length) segments.push({ text: source.slice(last) })
  return segments
}
