import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Shop } from './Shop'

const setup = (props: Partial<Parameters<typeof Shop>[0]> = {}) => {
  const handlers = { onBuy: vi.fn(), onToggle: vi.fn(), onClose: vi.fn() }
  render(<Shop coins={50} owned={[]} outfit={{}} {...handlers} {...props} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('Shop', () => {
  it('buys an affordable item', async () => {
    const { user, onBuy } = setup()
    await user.click(screen.getByRole('button', { name: 'Mua Mũ lưỡi trai giá 20 xu' }))
    expect(onBuy).toHaveBeenCalledWith('cap')
  })

  it('disables items the player cannot afford and says how many coins are missing', () => {
    setup({ coins: 50 })
    expect(screen.getByRole('button', { name: 'Mua Vương miện giá 120 xu' })).toBeDisabled()
    expect(screen.getByText('Cần thêm 70 xu')).toBeInTheDocument()
  })

  it('lets the player wear and take off owned items', async () => {
    const { user, onToggle } = setup({ owned: ['cap', 'beard'], outfit: { hat: 'cap' } })
    expect(screen.getByRole('button', { name: 'Bỏ Mũ lưỡi trai' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Đội/mặc Râu' }))
    expect(onToggle).toHaveBeenCalledWith('beard')
  })

  it('closes with Escape', async () => {
    const { user, onClose } = setup()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
