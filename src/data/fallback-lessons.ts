import type { Lesson, LessonRequest, Level, QuizQuestion, VocabItem } from '@/shared/types'

// Hand-written café lessons, shown (labeled "Bài mẫu") when the AI is unavailable.

const WORDS = ['menu', 'to go', 'receipt']

export const FALLBACK_REQUESTS: Record<Level, LessonRequest> = {
  1: { scenarioId: 'cafe', words: WORDS, level: 1 },
  2: { scenarioId: 'cafe', words: WORDS, level: 2 },
  3: { scenarioId: 'cafe', words: WORDS, level: 3 },
}

const VOCAB: VocabItem[] = [
  {
    input: 'menu',
    word: 'menu',
    meaning_vi: 'thực đơn',
    usage_vi: 'Dùng khi muốn xem quán có món gì và giá bao nhiêu. Bạn có thể nói "Can I see the menu?".',
  },
  {
    input: 'to go',
    word: 'to go',
    meaning_vi: 'mang đi',
    usage_vi: 'Dùng khi nhân viên hỏi bạn uống tại chỗ hay mang đi. Nếu muốn mang đi, bạn nói "To go, please".',
  },
  {
    input: 'receipt',
    word: 'receipt',
    meaning_vi: 'hóa đơn, biên lai',
    usage_vi: 'Dùng sau khi trả tiền, khi bạn cần giấy ghi số tiền đã trả. Bạn nói "Can I have the receipt?".',
  },
]

const QUIZ: QuizQuestion[] = [
  {
    question_vi: 'Bạn vào một nhà hàng mới và muốn biết ở đây có món gì. Bạn xin cái gì?',
    options: ['receipt', 'menu', 'to go'],
    answer_index: 1,
    explanation_vi: '"Menu" là thực đơn, giúp bạn xem các món và giá.',
  },
  {
    question_vi: 'Bạn mua bánh mì nhưng muốn ăn ở công viên, không ăn ở tiệm. Bạn nói gì với nhân viên?',
    options: ['to go', 'receipt', 'menu'],
    answer_index: 0,
    explanation_vi: '"To go" nghĩa là mang đi, không dùng tại chỗ.',
  },
  {
    question_vi: 'Bạn vừa trả tiền mua áo và cần giấy chứng nhận để đổi hàng sau này. Bạn xin gì?',
    options: ['menu', 'to go', 'receipt'],
    answer_index: 2,
    explanation_vi: '"Receipt" là hóa đơn, ghi lại món bạn đã mua và số tiền đã trả.',
  },
]

export const FALLBACK_LESSONS: Record<Level, Lesson> = {
  1: {
    title_vi: 'Gọi cà phê mang đi',
    level: 1,
    lines: [
      { speaker_vi: 'Nhân viên', text: 'Chào chị! Đây là menu của quán ạ.', translation_vi: null },
      { speaker_vi: 'Khách', text: 'Cảm ơn em. Cho chị một ly cà phê sữa đá nhé.', translation_vi: null },
      { speaker_vi: 'Nhân viên', text: 'Dạ, chị uống ở đây hay to go ạ?', translation_vi: null },
      { speaker_vi: 'Khách', text: 'To go nhé em. Cho chị xin receipt luôn.', translation_vi: null },
      { speaker_vi: 'Nhân viên', text: 'Dạ, receipt của chị đây. Chúc chị một ngày vui!', translation_vi: null },
    ],
    vocab: VOCAB,
    quiz: QUIZ,
  },
  2: {
    title_vi: 'Gọi cà phê mang đi',
    level: 2,
    lines: [
      { speaker_vi: 'Nhân viên', text: 'Chào chị! Here is the menu ạ.', translation_vi: null },
      { speaker_vi: 'Khách', text: 'Cảm ơn em. Chị muốn one iced coffee nhé.', translation_vi: null },
      { speaker_vi: 'Nhân viên', text: 'Dạ, chị uống ở đây hay a coffee to go ạ?', translation_vi: null },
      { speaker_vi: 'Khách', text: 'To go, please. Và can I have the receipt?', translation_vi: null },
      { speaker_vi: 'Nhân viên', text: 'Dạ, here is your receipt. Chúc chị một ngày vui!', translation_vi: null },
    ],
    vocab: VOCAB,
    quiz: QUIZ,
  },
  3: {
    title_vi: 'Gọi cà phê mang đi',
    level: 3,
    lines: [
      { speaker_vi: 'Nhân viên', text: 'Hi! Here is our menu.', translation_vi: 'Chào chị! Đây là thực đơn của quán.' },
      { speaker_vi: 'Khách', text: 'Thanks. One iced coffee, please.', translation_vi: 'Cảm ơn em. Cho chị một ly cà phê đá.' },
      { speaker_vi: 'Nhân viên', text: 'For here or to go?', translation_vi: 'Chị uống ở đây hay mang đi ạ?' },
      { speaker_vi: 'Khách', text: 'To go, please. Can I have the receipt?', translation_vi: 'Mang đi nhé. Cho chị xin hóa đơn được không?' },
      { speaker_vi: 'Nhân viên', text: 'Sure, here is your receipt. Have a nice day!', translation_vi: 'Dạ, hóa đơn của chị đây. Chúc chị một ngày vui!' },
    ],
    vocab: VOCAB,
    quiz: QUIZ,
  },
}
