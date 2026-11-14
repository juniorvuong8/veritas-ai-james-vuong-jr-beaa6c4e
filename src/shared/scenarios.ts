export interface Scenario {
  id: string
  emoji: string
  name_vi: string
  /** English description of the situation, used in the AI prompt. */
  promptContext: string
  suggestedWords: string[]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    emoji: '☕',
    name_vi: 'Quán cà phê',
    promptContext: 'ordering drinks at a café in an English-speaking city',
    suggestedWords: [
      'menu',
      'to go',
      'receipt',
      'medium',
      'large',
      'refill',
      'straw',
      'iced',
      'napkin',
      'order',
      'change',
      'for here',
    ],
  },
  {
    id: 'supermarket',
    emoji: '🛒',
    name_vi: 'Siêu thị',
    promptContext: 'shopping for groceries at a supermarket in an English-speaking city',
    suggestedWords: [
      'cart',
      'basket',
      'aisle',
      'checkout',
      'cashier',
      'bag',
      'on sale',
      'price',
      'cash',
      'card',
      'fresh',
      'frozen',
    ],
  },
  {
    id: 'taxi',
    emoji: '🚕',
    name_vi: 'Gọi taxi',
    promptContext: 'taking a taxi or ride-share in an English-speaking city',
    suggestedWords: [
      'address',
      'airport',
      'turn left',
      'turn right',
      'straight',
      'stop here',
      'traffic',
      'fare',
      'seatbelt',
      'trunk',
      'how long',
      'tip',
    ],
  },
  {
    id: 'clinic',
    emoji: '🏥',
    name_vi: 'Phòng khám',
    promptContext: 'visiting a doctor at a clinic in an English-speaking city',
    suggestedWords: [
      'appointment',
      'doctor',
      'fever',
      'headache',
      'cough',
      'sore throat',
      'medicine',
      'pharmacy',
      'allergy',
      'insurance',
      'pain',
      'prescription',
    ],
  },
]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

/** NFC-normalize, straighten curly apostrophes, trim and collapse inner whitespace. Keeps the learner's casing. */
export function normalizeWord(w: string): string {
  return w.normalize('NFC').replace(/[\u2018\u2019]/g, "'").trim().replace(/\s+/g, ' ')
}
