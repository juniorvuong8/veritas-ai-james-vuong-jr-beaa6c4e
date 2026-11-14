import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import type { Lesson } from '@/shared/types'
import type { EvalCase, Method, ResultsFile } from '../lib/types'
import { dialogueHash } from '../lib/hash'
import { DialogueScreen, RatingApp } from './RatingApp'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k) },
    setItem: (k, v) => { data.set(k, String(v)) },
  }
}

const caseA: EvalCase = { id: 'cafe-B-L1', set: 'B', scenarioId: 'cafe', level: 1, words: ['menu', 'to go', 'receipt', 'hóa đơn'] }
const llmLesson = validLesson()
const baselineLesson: Lesson = { ...validLesson(), title_vi: 'Tiêu đề bài từ điển' }
const results: Record<Method, ResultsFile> = {
  baseline: { [caseA.id]: { ok: true, lesson: baselineLesson } },
  llm: { [caseA.id]: { ok: true, lesson: llmLesson } },
}

describe('DialogueScreen', () => {
  it('never reveals the method, title or a sample badge', () => {
    for (const lesson of [baselineLesson, llmLesson]) {
      const { container, unmount } = render(<DialogueScreen c={caseA} lesson={lesson} />)
      const text = container.textContent ?? ''
      for (const banned of ['baseline', 'llm', 'LLM', 'Bài mẫu', lesson.title_vi]) expect(text).not.toContain(banned)
      unmount()
    }
  })

  it('shows the target words as the learner typed them', () => {
    render(<DialogueScreen c={caseA} lesson={llmLesson} />)
    expect(screen.getByText(/hóa đơn/)).toBeInTheDocument()
  })
})

describe('RatingApp', () => {
  it('moves on after answering and keeps answers after a reload', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    const { unmount } = render(<RatingApp cases={[caseA]} results={results} storage={storage} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Có' })[0])
    await user.click(screen.getAllByRole('button', { name: 'Có' })[1])
    await user.click(screen.getByRole('button', { name: 'Tiếp' }))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    unmount()

    render(<RatingApp cases={[caseA]} results={results} storage={storage} />)
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Trước' }))
    expect(screen.getAllByRole('button', { name: 'Có' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('stores a hash of the dialogue text with each answer', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    render(<RatingApp cases={[caseA]} results={results} storage={storage} />)
    await user.click(screen.getAllByRole('button', { name: 'Có' })[0])
    const saved = JSON.parse(storage.getItem('eval-ratings-v2')!) as Record<string, { h: string }>
    const [id] = Object.keys(saved)
    const [m] = id.split(':') as [Method, string]
    const lesson = m === 'llm' ? llmLesson : baselineLesson
    expect(saved[id].h).toBe(dialogueHash(lesson))
  })
})
