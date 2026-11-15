import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import type { Lesson } from '@/shared/types'
import { Conversation } from './Conversation'

const renderConv = (lesson: Lesson = validLesson(), onDone = vi.fn()) => {
  render(<Conversation lesson={lesson} hostAvatar="🧑‍🍳" playerAvatar="🧑" onDone={onDone} />)
  return { onDone, user: userEvent.setup() }
}

describe('Conversation', () => {
  it('reveals lines one at a time by button and by Enter', async () => {
    const { user } = renderConv()
    expect(screen.getByText(/Chào chị! Đây là/)).toBeInTheDocument()
    expect(screen.queryByText(/cà phê sữa đá/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    expect(screen.getByText(/cà phê sữa đá/)).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.getByText(/Chị uống ở đây hay/)).toBeInTheDocument()
  })

  it('asks to review the words after the last line, then finishes', async () => {
    const { user, onDone } = renderConv()
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    expect(screen.getByText('Cùng xem lại các từ nhé!')).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('opens the Vietnamese meaning of a word from its book icon without advancing', async () => {
    const { user } = renderConv()
    const icon = screen.getByRole('button', { name: 'Nghĩa của "menu"' })
    expect(icon).toHaveAttribute('aria-expanded', 'false')
    await user.click(icon)
    expect(icon).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('note')).toHaveTextContent('thực đơn')
    await user.click(screen.getByRole('note'))
    expect(screen.queryByText(/cà phê sữa đá/)).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('shows level-3 translations under lines', () => {
    const lesson = validLesson()
    lesson.level = 3
    lesson.lines.forEach((l, i) => { l.translation_vi = `Dịch ${i}` })
    renderConv(lesson)
    expect(screen.getByText('Dịch 0')).toBeInTheDocument()
  })

  it('shows Vietnamese → English mappings before the first line', () => {
    const lesson = validLesson()
    lesson.vocab[2] = { ...lesson.vocab[2], input: 'hóa đơn' }
    renderConv(lesson)
    expect(screen.getByText('hóa đơn → receipt')).toBeInTheDocument()
  })

  it('puts the first speaker on the host side and everyone else on the player side', async () => {
    const lesson = validLesson()
    lesson.lines[1] = { ...lesson.lines[1], speaker_vi: 'Bạn của khách' }
    const { user } = renderConv(lesson)
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    const sides = [...document.querySelectorAll('[data-side]')]
      .slice(0, 4)
      .map((el) => el.getAttribute('data-side'))
    expect(sides).toEqual(['host', 'player', 'host', 'player'])
  })

  it('advances when the conversation itself is tapped', async () => {
    const { user } = renderConv()
    await user.click(screen.getByText(/Chào chị! Đây là/))
    expect(screen.getByText(/cà phê sữa đá/)).toBeInTheDocument()
  })

  it('scrolls the next button into view after each line', async () => {
    const calls: Element[] = []
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (this: Element) { calls.push(this) }
    try {
      const { user } = renderConv()
      await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
      expect(calls.at(-1)).toBe(screen.getByRole('button', { name: 'Tiếp ▸' }))
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })
})
