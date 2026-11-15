// Round 2: 50 fixed cases aimed at rules 3, 5, 7, 11 and 13. Words come from all 36 words per place;
// words outside the first 12 are typed in (they go through the live site's word check).
import { writeFileSync } from 'node:fs'
import { SCENARIOS } from '/Users/juniorvuong/Desktop/Coding/veritas-ai-james-vuong-jr/src/shared/scenarios.ts'
const PAY = { cafe: ['change', 'receipt', 'cash', 'card', 'tip jar'], supermarket: ['cash', 'change', 'receipt', 'coupon', 'checkout'], taxi: ['fare', 'tip', 'meter', 'receipt', 'change'], clinic: ['insurance', 'prescription', 'pharmacy', 'form', 'reception'] }
let seed = 20261115
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (arr, n) => { const a = [...arr]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out }
const cases = []
for (let i = 0; i < 50; i++) {
  const s = SCENARIOS[i % 4]
  const level = (Math.floor(i / 4) % 3) + 1
  const n = rand() < 0.6 ? 5 : 4 // mostly 5 words: more words to fit in means more forcing and jumping
  const words = rand() < 0.5 ? [pick(PAY[s.id], 1)[0]] : []
  // At most one word from the new batches (typed in, so it costs a word check), the rest from the first 12.
  const typed = words.some((w) => !s.suggestedWords.includes(w))
  if (!typed && rand() < 0.5) words.push(pick(s.moreWords.flat().filter((w) => !words.includes(w)), 1)[0])
  words.push(...pick(s.suggestedWords.filter((w) => !words.includes(w)), n - words.length))
  const suggested = words.filter((w) => s.suggestedWords.includes(w))
  const custom = words.filter((w) => !s.suggestedWords.includes(w))
  cases.push({ id: `u${String(i + 1).padStart(3, '0')}`, scenarioId: s.id, level, suggested, custom })
}
writeFileSync(new URL('./cases2.json', import.meta.url), JSON.stringify(cases, null, 1))
console.log(cases.slice(0, 6).map((c) => `${c.id} ${c.scenarioId} L${c.level} ${[...c.suggested, ...c.custom].join(', ')}`).join('\n'))
console.log('custom words total', cases.reduce((n, c) => n + c.custom.length, 0))
