import { describe, expect, it } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { scoreQuiz } from './quiz'

const quiz = validLesson().quiz // answers: 0, 1, 2

describe('scoreQuiz', () => {
  it('counts all right', () => expect(scoreQuiz(quiz, [0, 1, 2])).toEqual({ correct: 3, total: 3 }))
  it('counts none right', () => expect(scoreQuiz(quiz, [1, 2, 0])).toEqual({ correct: 0, total: 3 }))
  it('counts mixed and unanswered', () => expect(scoreQuiz(quiz, [0, 0])).toEqual({ correct: 1, total: 3 }))
})
