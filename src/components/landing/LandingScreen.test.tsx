import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingScreen } from './LandingScreen'

describe('LandingScreen', () => {
  beforeEach(() => localStorage.clear())

  it('starts the game from the main button', async () => {
    const onStart = vi.fn()
    render(<LandingScreen onStart={onStart} />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Bắt đầu' })[0])
    expect(onStart).toHaveBeenCalledWith()
  })

  it('starts at a place when its storefront is clicked', async () => {
    const onStart = vi.fn()
    render(<LandingScreen onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /Gọi taxi/ }))
    expect(onStart).toHaveBeenCalledWith('taxi')
  })

  it('shows the whole demo conversation and explains a tapped word', async () => {
    render(<LandingScreen onStart={() => {}} />)
    const toGo = screen.getAllByRole('button', { name: 'to go' })[0]
    await userEvent.click(toGo)
    expect(screen.getByText('mang đi')).toBeInTheDocument()
    expect(toGo).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to English and remembers the choice', async () => {
    const { unmount } = render(<LandingScreen onStart={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getAllByRole('button', { name: 'Start playing' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Will you drink here or to go?')).toBeInTheDocument()
    unmount()
    render(<LandingScreen onStart={() => {}} />)
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
  })
})
