import { describe, expect, it } from 'vitest'
import { validLesson, validRequest } from './test-fixtures'
import type { Lesson } from './types'
import { checkLesson, containsWord } from './validate-lesson'

function mutate(fn: (l: Lesson) => void): Lesson {
  const l = validLesson()
  fn(l)
  return l
}

describe('checkLesson', () => {
  it('accepts a valid lesson', () => {
    expect(checkLesson(validLesson(), validRequest).ok).toBe(true)
  })

  const failing: [string, (l: Lesson) => void][] = [
    ['missing title_vi', (l) => delete (l as Partial<Lesson>).title_vi],
    ['only 3 lines', (l) => l.lines.splice(1, 1)],
    ['9 lines', (l) => { while (l.lines.length < 9) l.lines.push({ ...l.lines[1] }) }],
    ['a word missing from all lines', (l) => { l.lines[3].text = 'Cảm ơn nhé.' }],
    ['vocab in the wrong order', (l) => l.vocab.reverse()],
    ['vocab length 2', (l) => l.vocab.pop()],
    ['quiz length 2', (l) => l.quiz.pop()],
    ['a question with 4 options', (l) => l.quiz[0].options.push('straw')],
    ['answer_index 3', (l) => { l.quiz[0].answer_index = 3 }],
    ['answer_index 1.5', (l) => { l.quiz[0].answer_index = 1.5 }],
    ['answers not covering receipt', (l) => { l.quiz[2].answer_index = 1 }],
    ['level mismatch', (l) => { l.level = 2 }],
  ]
  for (const [name, fn] of failing) {
    it(`rejects ${name}`, () => {
      expect(checkLesson(mutate(fn), validRequest).ok).toBe(false)
    })
  }

  it('rejects a level-3 lesson with a null translation', () => {
    const l = mutate((x) => {
      x.level = 3
      x.lines.forEach((line) => { line.translation_vi = 'Bản dịch.' })
      x.lines[2].translation_vi = null
    })
    expect(checkLesson(l, { ...validRequest, level: 3 }).ok).toBe(false)
  })

  it('accepts a level-3 lesson with all translations', () => {
    const l = mutate((x) => {
      x.level = 3
      x.lines.forEach((line) => { line.translation_vi = 'Bản dịch.' })
    })
    expect(checkLesson(l, { ...validRequest, level: 3 }).ok).toBe(true)
  })

  it('rejects non-object data', () => {
    expect(checkLesson(null, validRequest).ok).toBe(false)
    expect(checkLesson('lesson', validRequest).ok).toBe(false)
  })

  it('maps a Vietnamese vocab.input to an English word', () => {
    const req = { ...validRequest, words: ['hóa đơn', 'menu', 'to go'] }
    const l = mutate((x) => {
      x.vocab = [
        { input: 'hóa đơn', word: 'receipt', meaning_vi: 'hóa đơn', usage_vi: 'Xin sau khi trả tiền.' },
        x.vocab[0],
        x.vocab[1],
      ]
      x.quiz = [x.quiz[2], x.quiz[0], x.quiz[1]]
    })
    expect(checkLesson(l, req).ok).toBe(true)
  })

  it('matches NFD input against NFC vocab.input', () => {
    const req = { ...validRequest, words: ['hóa đơn'.normalize('NFD'), 'menu', 'to go'] }
    const l = mutate((x) => {
      x.vocab = [
        { input: 'hóa đơn'.normalize('NFC'), word: 'receipt', meaning_vi: 'hóa đơn', usage_vi: 'Xin sau khi trả tiền.' },
        x.vocab[0],
        x.vocab[1],
      ]
      x.quiz = [x.quiz[2], x.quiz[0], x.quiz[1]]
    })
    expect(checkLesson(l, req).ok).toBe(true)
  })
})

describe('containsWord', () => {
  it('does not match a word inside another word', () => {
    expect(containsWord('Is it good?', 'go')).toBe(false)
    expect(containsWord('menus', 'menu')).toBe(false)
  })
  it('matches next to punctuation', () => {
    expect(containsWord('Can I see the menu?', 'menu')).toBe(true)
  })
  it('matches multi-word phrases case-insensitively', () => {
    expect(containsWord('TO GO please', 'to go')).toBe(true)
  })
})
