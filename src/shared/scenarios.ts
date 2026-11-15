export interface Scenario {
  id: string
  emoji: string
  name_vi: string
  name_en: string
  /** English description of the situation, used in the AI prompt. */
  promptContext: string
  suggestedWords: string[]
  /** More words for this place, one batch at a time, offered once every suggested word has been learned. */
  moreWords: string[][]
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    emoji: '☕',
    name_vi: 'Quán cà phê',
    name_en: 'Café',
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
    moreWords: [
      ['cup', 'lid', 'sugar', 'milk', 'small', 'hot', 'decaf', 'pastry', 'sandwich', 'tea', 'water', 'counter'],
      ['barista', 'table', 'seat', 'wifi', 'cash', 'card', 'line', 'ready', 'name', 'spoon', 'ice', 'tip jar'],
    ],
  },
  {
    id: 'supermarket',
    emoji: '🛒',
    name_vi: 'Siêu thị',
    name_en: 'Supermarket',
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
    moreWords: [
      ['milk', 'bread', 'eggs', 'fruit', 'vegetables', 'meat', 'shelf', 'receipt', 'discount', 'coupon', 'scale', 'organic'],
      ['brand', 'expired', 'snacks', 'drinks', 'rice', 'cheap', 'expensive', 'self-checkout', 'line', 'change', 'bakery', 'dairy'],
    ],
  },
  {
    id: 'taxi',
    emoji: '🚕',
    name_vi: 'Gọi taxi',
    name_en: 'Taxi',
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
    moreWords: [
      ['driver', 'meter', 'hotel', 'station', 'downtown', 'corner', 'map', 'receipt', 'luggage', 'slow down', 'hurry', 'parking'],
      ['pick up', 'drop off', 'highway', 'bridge', 'traffic light', 'block', 'change', 'card', 'cash', 'window', 'door', 'ride'],
    ],
  },
  {
    id: 'clinic',
    emoji: '🏥',
    name_vi: 'Phòng khám',
    name_en: 'Clinic',
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
    moreWords: [
      ['nurse', 'stomachache', 'cold', 'flu', 'temperature', 'blood pressure', 'rash', 'dizzy', 'pill', 'waiting room', 'checkup', 'symptom'],
      ['x-ray', 'bandage', 'sneeze', 'tired', 'tablet', 'dose', 'side effect', 'emergency', 'form', 'reception', 'runny nose', 'cut'],
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
