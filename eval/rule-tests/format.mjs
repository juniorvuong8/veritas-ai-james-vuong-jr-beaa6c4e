// Prints lessons as plain text for judging: node format.mjs t002 t003 ...
import { readFileSync } from 'node:fs'
for (const id of process.argv.slice(2)) {
  const r = JSON.parse(readFileSync(new URL(`${process.env.OUT ?? './lessons/'}${id}.json`, import.meta.url), 'utf8'))
  const c = r.case
  console.log(`=== ${id} | place: ${c.scenarioId} | level ${c.level} | target words (as the learner typed them): ${[...c.suggested, ...c.custom].join(', ')}`)
  if (!r.ok) { console.log(`(no lesson: ${r.code})\n`); continue }
  const L = r.lesson
  console.log(`Taught senses: ${L.vocab.map((v) => `${v.word}${v.input !== v.word ? ` (from "${v.input}")` : ''} = ${v.meaning_vi}`).join('; ')}`)
  L.lines.forEach((l, i) => console.log(`${i + 1}. ${l.speaker_vi}: ${l.text}${l.translation_vi ? `  [dịch: ${l.translation_vi}]` : ''}`))
  console.log('')
}
