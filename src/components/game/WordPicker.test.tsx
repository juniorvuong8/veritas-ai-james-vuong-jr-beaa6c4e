import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WordPicker } from './WordPicker'

const setup = (props: Partial<Parameters<typeof WordPicker>[0]> = {}) => {
  const onSubmit = vi.fn()
  render(<WordPicker scenarioId="cafe" submitLabel="Bắt đầu hội thoại" onSubmit={onSubmit} {...props} />)
  return { user: userEvent.setup(), onSubmit }
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

  it('adds a Vietnamese custom word', async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText(/Thêm từ của bạn/), 'hóa đơn')
    await user.click(screen.getByRole('button', { name: 'Thêm' }))
    expect(screen.getByText('hóa đơn')).toBeInTheDocument()
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
