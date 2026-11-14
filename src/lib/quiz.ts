import type { QuizQuestion } from '@/shared/types'

export function scoreQuiz(questions: QuizQuestion[], answers: number[]): { correct: number; total: number } {
  const correct = questions.filter((q, i) => answers[i] === q.answer_index).length
  return { correct, total: questions.length }
}
