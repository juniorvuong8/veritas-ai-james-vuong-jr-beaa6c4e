import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LearnedWord } from '@/game/state'
import { getScenario } from '@/shared/scenarios'
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

  const learn = (words: string[]): LearnedWord[] =>
    words.map((w) => ({ word: w, input: w, meaning_vi: 'nghĩa', usage_vi: '…', placeId: 'cafe' }))
  const cafe = getScenario('cafe')!

  it('offers new words only once every word shown is learned', async () => {
    const { rerender } = render(<WordPicker scenarioId="cafe" learnedWords={learn(cafe.suggestedWords.slice(1))} submitLabel="Go" onSubmit={() => {}} />)
    expect(screen.queryByRole('button', { name: '🔄 Lấy từ mới' })).not.toBeInTheDocument()

    rerender(<WordPicker scenarioId="cafe" learnedWords={learn(cafe.suggestedWords)} submitLabel="Go" onSubmit={() => {}} />)
    expect(screen.getByText('Bạn đã học hết các từ này rồi!')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: '🔄 Lấy từ mới' }))
    expect(screen.getByRole('button', { name: cafe.moreWords[0][0] })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'menu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '🔄 Lấy từ mới' })).not.toBeInTheDocument()
  })

  it('skips batches already learned, and says when every suggested word is learned', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <WordPicker scenarioId="cafe" learnedWords={learn([...cafe.suggestedWords, ...cafe.moreWords[0]])} submitLabel="Go" onSubmit={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: '🔄 Lấy từ mới' }))
    expect(screen.getByRole('button', { name: cafe.moreWords[1][0] })).toBeInTheDocument()

    rerender(<WordPicker scenarioId="cafe" learnedWords={learn([cafe.suggestedWords, ...cafe.moreWords].flat())} submitLabel="Go" onSubmit={() => {}} />)
    expect(screen.getByText(/Bạn đã học hết các từ gợi ý ở đây/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '🔄 Lấy từ mới' })).not.toBeInTheDocument()
  })

  it('keeps words picked from an earlier batch, and lets a later-batch word skip the AI check', async () => {
    const user = userEvent.setup()
    const checkWord = vi.fn()
    render(<WordPicker scenarioId="cafe" learnedWords={learn(cafe.suggestedWords)} submitLabel="Go" onSubmit={() => {}} checkWord={checkWord} />)
    await user.click(screen.getByRole('button', { name: 'menu' }))
    await user.click(screen.getByRole('button', { name: '🔄 Lấy từ mới' }))
    expect(screen.getByRole('button', { name: 'Bỏ menu' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/Thêm từ của bạn/), cafe.moreWords[1][0])
    await user.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(checkWord).not.toHaveBeenCalled()
  })
})
