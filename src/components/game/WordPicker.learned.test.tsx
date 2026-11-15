import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LearnedWord } from '@/game/state'
import { WordPicker } from './WordPicker'

const learned: LearnedWord[] = [
  { word: 'menu', input: 'menu', meaning_vi: 'thực đơn', usage_vi: '…', placeId: 'cafe' },
  { word: 'receipt', input: 'hóa đơn', meaning_vi: 'hóa đơn', usage_vi: '…', placeId: 'cafe' },
]

describe('WordPicker with learned words', () => {
  it('shows learned words grey instead of yellow, and they can still be picked', async () => {
    const onSubmit = vi.fn()
    render(<WordPicker scenarioId="cafe" learnedWords={learned} submitLabel="Go" onSubmit={onSubmit} />)
    const menu = screen.getByRole('button', { name: 'menu' })
    const toGo = screen.getByRole('button', { name: 'to go' })
    expect(menu).toHaveAttribute('data-learned', 'true')
    expect(menu.className).toContain('bg-[#E6E2DD]')
    expect(toGo).not.toHaveAttribute('data-learned')
    expect(toGo.className).toContain('bg-[#FFF3D6]')
    // "receipt" was learned from the Vietnamese "hóa đơn"
    expect(screen.getByRole('button', { name: 'receipt' })).toHaveAttribute('data-learned', 'true')

    await userEvent.setup().click(menu)
    expect(menu).toHaveAttribute('aria-pressed', 'true')
    expect(menu.className).toContain('bg-[#2B1D16]')
  })
})
