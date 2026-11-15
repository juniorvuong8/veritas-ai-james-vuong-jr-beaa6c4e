// Builds 100 fixed test cases (seeded), before any lesson is generated.
import { writeFileSync } from 'node:fs'
const SUGGESTED = {
  cafe: ['menu','to go','receipt','medium','large','refill','straw','iced','napkin','order','change','for here'],
  supermarket: ['cart','basket','aisle','checkout','cashier','bag','on sale','price','cash','card','fresh','frozen'],
  taxi: ['address','airport','turn left','turn right','straight','stop here','traffic','fare','seatbelt','trunk','how long','tip'],
  clinic: ['appointment','doctor','fever','headache','cough','sore throat','medicine','pharmacy','allergy','insurance','pain','prescription'],
}
// Custom words a player might type (English or Vietnamese), chosen to fit each place.
const CUSTOM = {
  cafe: ['hóa đơn','ống hút','đá','sugar','tiền thừa','wifi'],
  supermarket: ['túi','giảm giá','receipt','coupon','tính tiền','discount'],
  taxi: ['tiền boa','kẹt xe','luggage','hotel','chậm lại','shortcut'],
  clinic: ['đau bụng','thuốc','nurse','dị ứng','blood pressure','sốt'],
}
let seed = 20261114
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (arr, n) => { const a = [...arr]; const out = []; while (out.length < n) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out }
const places = Object.keys(SUGGESTED)
const cases = []
for (let i = 0; i < 100; i++) {
  const place = places[i % 4]
  const level = (Math.floor(i / 4) % 3) + 1
  const n = 3 + Math.floor(rand() * 3) // 3-5 words
  const nCustom = rand() < 0.3 ? 1 : 0
  const suggested = pick(SUGGESTED[place], n - nCustom)
  const custom = nCustom ? pick(CUSTOM[place], 1) : []
  cases.push({ id: `t${String(i + 1).padStart(3, '0')}`, scenarioId: place, level, suggested, custom })
}
writeFileSync(new URL('./cases.json', import.meta.url), JSON.stringify(cases, null, 1))
console.log(cases.slice(0, 8).map((c) => `${c.id} ${c.scenarioId} L${c.level} ${[...c.suggested, ...c.custom].join(', ')}`).join('\n'))
