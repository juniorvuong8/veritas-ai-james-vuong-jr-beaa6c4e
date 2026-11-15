import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LearnedWord } from '@/game/state'
import { Notebook } from './Notebook'

const word = (w: string, placeId: string, input = w): LearnedWord => ({
  word: w,
  input,
  meaning_vi: `nghĩa của ${w}`,
  usage_vi: `cách dùng ${w}`,
  placeId,
})

describe('Notebook', () => {
  it('lists learned words grouped by place, in place order', () => {
    render(
      <Notebook
        words={[word('fever', 'clinic'), word('menu', 'cafe'), word('receipt', 'cafe', 'hóa đơn')]}
        onClose={() => {}}
      />,
    )
    const sections = screen.getAllByRole('region')
    expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual(['Quán cà phê', 'Phòng khám'])
    const cafe = within(sections[0])
    expect(cafe.getByText('menu')).toBeInTheDocument()
    expect(cafe.getByText('nghĩa của menu')).toBeInTheDocument()
    expect(cafe.getByText('(hóa đơn)')).toBeInTheDocument()
    expect(within(sections[1]).getByText('fever')).toBeInTheDocument()
  })

  it('explains how to fill an empty notebook', () => {
    render(<Notebook words={[]} onClose={() => {}} />)
    expect(screen.getByText(/Chưa có từ nào/)).toBeInTheDocument()
  })

  it('closes with the button, Escape, or a click outside', () => {
    const onClose = vi.fn()
    render(<Notebook words={[]} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng sổ từ' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
