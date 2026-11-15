// A small, fast blocklist for custom words: profanity, slurs and sexual terms in English and Vietnamese.
// It runs in the browser and on the server with no AI call, so it still works when the AI is down.
// The AI word check (word-fit.ts) catches what a list can't: misspellings, context, other languages.

/** Blocked when a word in the input starts with one of these (catches "fucking", "shitty"). */
const ENGLISH_STEMS = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'slut', 'whore', 'nigger', 'nigga', 'faggot',
  'retard', 'motherfuck', 'bullshit', 'jackass', 'dickhead', 'porn', 'wank', 'twat', 'blowjob',
]

/** Blocked only as whole words (too short or ambiguous as prefixes: "dick" vs "dickens"). */
const ENGLISH_WORDS = [
  'ass', 'arse', 'dick', 'dicks', 'cock', 'cocks', 'pussy', 'tits', 'boobs', 'fag', 'fags', 'chink', 'spic',
  'kike', 'tranny', 'dyke', 'coon', 'gook', 'wetback', 'raghead', 'damn', 'goddamn', 'crap', 'piss', 'horny',
  'nude', 'nudes', 'rape', 'rapist', 'nazi', 'cum', 'jizz', 'milf', 'thot', 'hoe', 'hoes', 'stfu', 'wtf', 'kys',
]

/** Vietnamese, matched with diacritics so innocent unaccented words ("du lịch", "lon nước") stay allowed. */
const VIETNAMESE_WORDS = [
  'đụ', 'địt', 'đéo', 'lồn', 'cặc', 'buồi', 'đĩ', 'cứt', 'đái', 'dái', 'đm', 'đmm', 'đcm', 'đkm', 'vãi lồn',
  'con đĩ', 'đồ chó', 'óc chó', 'mặt lồn', 'thằng chó', 'ngu như chó',
]

/** Unaccented Vietnamese and abbreviations that are unambiguous even without diacritics. */
const VIETNAMESE_PLAIN = ['dit me', 'du ma', 'dm', 'dmm', 'dcm', 'dkm', 'vcl', 'vkl', 'vl', 'clgt', 'cmm', 'cl', 'occho']

const lower = (s: string) => s.normalize('NFC').toLowerCase()
/** Squeezes letters repeated 3+ times ("fuuuck" -> "fuck"). */
const squeeze = (s: string) => s.replace(/(\p{L})\1{2,}/gu, '$1')
const words = (s: string) => s.split(/[\s'-]+/).filter(Boolean)

function containsPhrase(text: string, phrase: string): boolean {
  const t = ` ${words(text).join(' ')} `
  return t.includes(` ${phrase} `)
}

/** True if the input contains a blocked word. Expects one short custom word or phrase. */
export function isInappropriate(input: string): boolean {
  const text = squeeze(lower(input))
  const tokens = words(text)
  const joined = tokens.join('')

  if (tokens.some((t) => ENGLISH_STEMS.some((stem) => t.startsWith(stem)))) return true
  // Spaced-out spelling: "f u c k", "mother fucker".
  if (ENGLISH_STEMS.some((stem) => stem.length >= 4 && joined.startsWith(stem))) return true
  if (tokens.some((t) => ENGLISH_WORDS.includes(t))) return true
  if (VIETNAMESE_WORDS.some((w) => containsPhrase(text, w))) return true
  if (VIETNAMESE_PLAIN.some((w) => containsPhrase(text, w) || joined === w.replace(/ /g, ''))) return true
  return false
}
