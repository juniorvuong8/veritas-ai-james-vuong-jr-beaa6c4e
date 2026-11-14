export type Lang = 'vi' | 'en'

const LANG_KEY = 'vocab-lang'

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi'
  } catch {
    return 'vi'
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // Storage blocked: the switch still works for this visit.
  }
}

/** A string with *starred* parts rendered as highlighted English words. */
type Marked = string

export interface Copy {
  navStart: string
  eyebrow: string
  headline: Marked
  sub: string
  cta: string
  ctaNote: string
  demoTitle: string
  demoTapHint: string
  demoReplay: string
  meaning: string
  whenToUse: string
  stepsTitle: string
  steps: { emoji: string; title: string; body: string }[]
  placesTitle: string
  placesSub: string
  placeCta: string
  placeNames: Record<string, string>
  levelsTitle: string
  levelsSub: string
  levels: { name: string; desc: string; example: Marked }[]
  finalTitle: Marked
  finalSub: string
}

export const COPY: Record<Lang, Copy> = {
  vi: {
    navStart: 'Bắt đầu',
    eyebrow: 'Tiếng Anh cho người mới bắt đầu',
    headline: 'Học tiếng Anh như đang *order* cà phê trên phố.',
    sub: 'Chọn một tình huống, chọn từ bạn muốn học. AI viết ngay một đoạn hội thoại tiếng Việt có chèn đúng những từ tiếng Anh đó, kèm giải thích nghĩa và lúc nào nên dùng.',
    cta: 'Bắt đầu',
    ctaNote: 'Không cần đăng ký',
    demoTitle: 'Quán cà phê · Cấp 1',
    demoTapHint: 'Chạm vào từ được tô vàng để xem nghĩa',
    demoReplay: 'Xem lại',
    meaning: 'Nghĩa',
    whenToUse: 'Dùng khi nào',
    stepsTitle: 'Ba bước, một cuộc trò chuyện',
    steps: [
      { emoji: '📍', title: 'Chọn tình huống', body: 'Quán cà phê, siêu thị, taxi hay phòng khám: những nơi bạn sẽ thật sự đến.' },
      { emoji: '🏷️', title: 'Chọn 3–5 từ', body: 'Lấy từ gợi ý, hoặc tự gõ bằng tiếng Anh hay tiếng Việt.' },
      { emoji: '💬', title: 'Đọc và làm quiz', body: 'Xem từ trong một đoạn hội thoại thật, nghe phát âm, rồi thử sức với câu hỏi ngắn.' },
    ],
    placesTitle: 'Dạo một vòng quanh phố',
    placesSub: 'Mỗi nơi có những từ riêng. Chọn một nơi để bắt đầu ngay.',
    placeCta: 'Vào',
    placeNames: { cafe: 'Quán cà phê', supermarket: 'Siêu thị', taxi: 'Gọi taxi', clinic: 'Phòng khám' },
    levelsTitle: 'Tiếng Anh tăng dần theo bạn',
    levelsSub: 'Bắt đầu với vài từ. Khi đã quen, lên cấp để gặp cả câu tiếng Anh.',
    levels: [
      { name: 'Cấp 1', desc: 'Chỉ từ mới bằng tiếng Anh', example: 'Chị uống ở đây hay *to go* ạ?' },
      { name: 'Cấp 2', desc: 'Thêm cụm từ tiếng Anh ngắn', example: 'Dạ, em muốn *a coffee to go*, cảm ơn.' },
      { name: 'Cấp 3', desc: 'Cả câu tiếng Anh, có dịch', example: '*For here or to go?*' },
    ],
    finalTitle: 'Sẵn sàng cho ly cà phê *to go* đầu tiên?',
    finalSub: 'Một cuộc hội thoại ngắn. Vài từ mới. Bạn sẽ nhớ chúng lâu hơn bạn nghĩ.',
  },
  en: {
    navStart: 'Start',
    eyebrow: 'Beginner English for Vietnamese speakers',
    headline: 'Learn English like you’re ordering coffee *to go*.',
    sub: 'Pick a situation and the words you want to learn. An AI writes a short Vietnamese conversation with those English words placed right into it, and explains what each one means and when to use it.',
    cta: 'Start playing',
    ctaNote: 'No sign-up needed',
    demoTitle: 'Café · Level 1',
    demoTapHint: 'Tap a highlighted word to see its meaning',
    demoReplay: 'Replay',
    meaning: 'Meaning',
    whenToUse: 'When to use it',
    stepsTitle: 'Three steps, one conversation',
    steps: [
      { emoji: '📍', title: 'Pick a situation', body: 'A café, a supermarket, a taxi or a clinic: places you will actually go.' },
      { emoji: '🏷️', title: 'Choose 3–5 words', body: 'Take the suggestions, or type your own in English or Vietnamese.' },
      { emoji: '💬', title: 'Read, then quiz', body: 'See each word in a real conversation, hear it spoken, then test yourself with a short quiz.' },
    ],
    placesTitle: 'Take a walk down the street',
    placesSub: 'Every place has its own words. Pick one to jump straight in.',
    placeCta: 'Go in',
    placeNames: { cafe: 'Café', supermarket: 'Supermarket', taxi: 'Taxi', clinic: 'Clinic' },
    levelsTitle: 'English that grows with you',
    levelsSub: 'Start with a few words. When they feel easy, level up to whole English sentences.',
    levels: [
      { name: 'Level 1', desc: 'Only the new English words', example: 'Chị uống ở đây hay *to go* ạ?' },
      { name: 'Level 2', desc: 'Short English phrases', example: 'Dạ, em muốn *a coffee to go*, cảm ơn.' },
      { name: 'Level 3', desc: 'Whole English lines, translated', example: '*For here or to go?*' },
    ],
    finalTitle: 'Ready for your first coffee *to go*?',
    finalSub: 'One short conversation. A few new words. They’ll stick longer than you think.',
  },
}

/** English glosses of the demo, shown under each line in English mode. */
export const DEMO_TRANSLATIONS_EN = [
  'Hi! Here is our menu.',
  'Thanks. One iced milk coffee, please.',
  'Will you drink here or to go?',
  'To go, please. And the receipt too.',
  'Here is your receipt. Have a nice day!',
]

/** English versions of the demo vocab explanations, keyed by word. */
export const DEMO_VOCAB_EN: Record<string, { meaning: string; usage: string }> = {
  menu: { meaning: 'the list of food and drinks', usage: 'When you want to see what a place sells and the prices. Say "Can I see the menu?"' },
  'to go': { meaning: 'to take away', usage: 'When staff ask if you will drink there or leave. Say "To go, please."' },
  receipt: { meaning: 'the paper showing what you paid', usage: 'After paying, when you need proof of the amount. Say "Can I have the receipt?"' },
}

/** English phrases that float over the street like overheard speech. */
export const STREET_BUBBLES: { text: string; left: string; top: string; delay: string }[] = [
  { text: 'Hi there!', left: '6%', top: '8%', delay: '0s' },
  { text: 'For here or to go?', left: '17%', top: '22%', delay: '1.2s' },
  { text: 'Aisle 5', left: '37%', top: '18%', delay: '2.1s' },
  { text: 'Turn left, please', left: '58%', top: '10%', delay: '0.6s' },
  { text: 'I have a fever', left: '77%', top: '20%', delay: '1.7s' },
]
