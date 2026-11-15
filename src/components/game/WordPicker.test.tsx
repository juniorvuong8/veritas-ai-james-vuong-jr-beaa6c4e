import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WordPicker } from './WordPicker'

const fits = async () => ({ fits: true as const, checked: true })

const setup = (props: Partial<Parameters<typeof WordPicker>[0]> = {}) => {
  const onSubmit = vi.fn()
  const checkWord = vi.fn<NonNullable<Parameters<typeof WordPicker>[0]['checkWord']>>(fits)
  render(
    <WordPicker scenarioId="cafe" submitLabel="Bắt đầu hội thoại" onSubmit={onSubmit} checkWord={checkWord} {...props} />,
  )
  return { user: userEvent.setup(), onSubmit, checkWord }
}

const addCustom = async (user: ReturnType<typeof userEvent.setup>, word: string) => {
  await user.type(screen.getByPlaceholderText(/Thêm từ của bạn/), word)
  await user.click(screen.getByRole('button', { name: 'Thêm' }))
}

describe('WordPicker', () => {
  it('submits 3 chosen chips', async () => {
    const { user, onSubmit } = setup()
    const submit = screen.getByRole('button', { name: 'Bắt đầu hội thoại' })
    expect(submit).toBeDisabled()
    for (const w of ['menu', 'to go', 'receipt']) await user.click(screen.getByRole('button', { name: w }))
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith(['menu', 'to go', 'receipt'])
  })

  it('pre-selects initial words', () => {
    setup({ initialWords: ['menu', 'hóa đơn'] })
    expect(screen.getByRole('button', { name: 'menu' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('hóa đơn')).toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 2\/5 từ/)).toBeInTheDocument()
  })

  it('adds a Vietnamese custom word after checking it fits', async () => {
    const { user, checkWord } = setup()
    await addCustom(user, 'hóa đơn')
    expect(checkWord).toHaveBeenCalledWith('hóa đơn')
    expect(await screen.findByText('hóa đơn')).toBeInTheDocument()
  })

  it('refuses a whole sentence without asking the AI', async () => {
    const { user, checkWord } = setup()
    await addCustom(user, 'can I have a coffee')
    expect(screen.getByText(/một hoặc hai từ/)).toBeInTheDocument()
    expect(checkWord).not.toHaveBeenCalled()
    expect(screen.getByText(/Đã chọn 0\/5 từ/)).toBeInTheDocument()
  })

  it("refuses a word that doesn't fit the place and says why", async () => {
    const { user } = setup({
      checkWord: async () => ({
        fits: false,
        checked: true,
        reason_vi: 'Từ này không hợp với quán cà phê. Thử "cup" nhé.',
        reason_en: 'This word does not fit a café. Try "cup".',
      }),
    })
    await addCustom(user, 'volcano')
    expect(await screen.findByText(/không hợp với quán cà phê/)).toBeInTheDocument()
    expect(screen.queryByText('volcano')).not.toBeInTheDocument()
    expect(screen.getByText(/Đã chọn 0\/5 từ/)).toBeInTheDocument()
  })

  it('does not ask the AI about a suggested word typed in by hand', async () => {
    const { user, checkWord } = setup()
    await addCustom(user, 'Napkin')
    expect(checkWord).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'napkin' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('refuses a word with digits and explains why', async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText(/Thêm từ của bạn/), 'coffee2')
    await user.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.queryByText('coffee2')).not.toBeInTheDocument()
    expect(screen.getByText(/chỉ được dùng chữ cái/)).toBeInTheDocument()
  })

  it('does not duplicate a selected chip', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'menu' }))
    await user.type(screen.getByPlaceholderText(/Thêm từ của bạn/), 'Menu ')
    await user.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.getByText(/Đã chọn 1\/5 từ/)).toBeInTheDocument()
  })
})
