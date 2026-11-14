import type { Lesson, LessonRequest } from './types'

export const validRequest: LessonRequest = {
  scenarioId: 'cafe',
  words: ['menu', 'to go', 'receipt'],
  level: 1,
}

export function validLesson(): Lesson {
  return {
    title_vi: 'Gọi đồ uống ở quán cà phê',
    level: 1,
    lines: [
      { speaker_vi: 'Nhân viên', text: 'Chào chị! Đây là menu của quán ạ.', translation_vi: null },
      { speaker_vi: 'Khách', text: 'Cho em một ly cà phê sữa đá nhé.', translation_vi: null },
      { speaker_vi: 'Nhân viên', text: 'Chị uống ở đây hay to go ạ?', translation_vi: null },
      { speaker_vi: 'Khách', text: 'To go nhé. Cho em xin receipt luôn.', translation_vi: null },
    ],
    vocab: [
      { input: 'menu', word: 'menu', meaning_vi: 'thực đơn', usage_vi: 'Dùng khi hỏi xem quán có món gì.' },
      { input: 'to go', word: 'to go', meaning_vi: 'mang đi', usage_vi: 'Trả lời khi được hỏi uống tại chỗ hay không.' },
      { input: 'receipt', word: 'receipt', meaning_vi: 'hóa đơn', usage_vi: 'Xin sau khi trả tiền.' },
    ],
    quiz: [
      {
        question_vi: 'Bạn vào nhà hàng và muốn xem có món gì. Bạn xin cái gì?',
        options: ['menu', 'receipt', 'to go'],
        answer_index: 0,
        explanation_vi: '"Menu" là thực đơn.',
      },
      {
        question_vi: 'Bạn muốn mang cà phê về văn phòng. Bạn nói gì?',
        options: ['menu', 'to go', 'receipt'],
        answer_index: 1,
        explanation_vi: '"To go" là mang đi.',
      },
      {
        question_vi: 'Bạn vừa trả tiền và cần giấy tờ để báo cáo chi phí. Bạn xin gì?',
        options: ['to go', 'menu', 'receipt'],
        answer_index: 2,
        explanation_vi: '"Receipt" là hóa đơn.',
      },
    ],
  }
}
