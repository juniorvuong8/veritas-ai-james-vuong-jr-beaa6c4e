import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CITY, doorOf, type Pos } from '@/game/map'
import { step } from '@/game/movement'
import { findPath } from '@/game/path'
import { newGame, type GameState } from '@/game/state'
import { CityScreen } from './CityScreen'
import { TopBar } from './TopBar'

const keyFor = (a: Pos, b: Pos) =>
  b.x > a.x ? 'ArrowRight' : b.x < a.x ? 'ArrowLeft' : b.y > a.y ? 'ArrowDown' : 'ArrowUp'

function renderCity(state: GameState = newGame(1)) {
  const props = { onEnterPlace: vi.fn(), onOpenCelebration: vi.fn(), onMoved: vi.fn() }
  const utils = render(<CityScreen state={state} startPos={CITY.start} showHint {...props} />)
  const player = () => utils.container.querySelector('[data-testid="player"]')!
  const pos = () => ({ x: Number(player().getAttribute('data-x')), y: Number(player().getAttribute('data-y')) })
  const tile = (p: Pos) => utils.container.querySelector(`[data-tile="${p.x},${p.y}"]`)!
  return { ...props, ...utils, pos, tile }
}

describe('TopBar', () => {
  it('shows level, coins, passport and the trophy only when complete', () => {
    const onOpen = vi.fn()
    const { rerender } = render(
      <TopBar state={{ ...newGame(2), coins: 30, stamps: ['cafe'] }} onOpenCelebration={onOpen} />,
    )
    expect(screen.getByText('Cấp 2')).toBeInTheDocument()
    expect(screen.getByText('🪙 30')).toBeInTheDocument()
    expect(screen.getByLabelText('Quán cà phê: đã xong')).toBeInTheDocument()
    expect(screen.getByLabelText('Siêu thị: chưa xong')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /🏆/ })).not.toBeInTheDocument()
    const complete = { ...newGame(1), stamps: ['cafe', 'supermarket', 'taxi', 'clinic'], complete: true }
    rerender(<TopBar state={complete} onOpenCelebration={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /🏆/ }))
    expect(onOpen).toHaveBeenCalled()
  })
})

describe('CityScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the hint and moves one tile per arrow key', () => {
    const c = renderCity()
    expect(screen.getByText('Đi đến một địa điểm để bắt đầu')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(c.pos()).toEqual(step(CITY, CITY.start, 'down').pos)
    expect(c.onMoved).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(c.onMoved).toHaveBeenCalledTimes(1)
  })

  it('does not walk into a building', () => {
    const c = renderCity()
    const besideWall = { x: 1, y: 6 } // grass with the café wall directly below
    expect(CITY.tiles[7][1]).toBe('building')
    const path = [CITY.start, ...findPath(CITY, CITY.start, besideWall)!]
    for (let i = 1; i < path.length; i++) fireEvent.keyDown(window, { key: keyFor(path[i - 1], path[i]) })
    expect(c.pos()).toEqual(besideWall)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(c.pos()).toEqual(besideWall)
    expect(c.onEnterPlace).not.toHaveBeenCalled()
  })

  it('enters the café exactly once when walking onto its door with keys', () => {
    const c = renderCity()
    const path = [CITY.start, ...findPath(CITY, CITY.start, doorOf(CITY, 'cafe').pos)!]
    for (let i = 1; i < path.length; i++) fireEvent.keyDown(window, { key: keyFor(path[i - 1], path[i]) })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(c.onEnterPlace).toHaveBeenCalledTimes(1)
    expect(c.onEnterPlace).toHaveBeenCalledWith('cafe')
  })

  it('walks to a tapped building and enters it', () => {
    const c = renderCity()
    const door = doorOf(CITY, 'supermarket')
    const building = { x: door.pos.x, y: door.pos.y - 1 }
    fireEvent.click(c.tile(building))
    const steps = findPath(CITY, CITY.start, door.pos)!.length
    act(() => { vi.advanceTimersByTime(120 * steps + 10) })
    expect(c.pos()).toEqual(door.pos)
    expect(c.onEnterPlace).toHaveBeenCalledWith('supermarket')
  })

  it('cancels a tap-walk when an arrow key is pressed', () => {
    const c = renderCity()
    const door = doorOf(CITY, 'supermarket')
    const path = findPath(CITY, CITY.start, door.pos)!
    fireEvent.click(c.tile(door.pos))
    act(() => { vi.advanceTimersByTime(125) })
    expect(c.pos()).toEqual(path[0])
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const expected = step(CITY, path[0], 'right').pos
    expect(c.pos()).toEqual(expected)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(c.pos()).toEqual(expected)
    expect(c.onEnterPlace).not.toHaveBeenCalled()
  })

  it('ignores arrow keys typed into an input', () => {
    const c = renderCity()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(c.pos()).toEqual(CITY.start)
    input.remove()
  })

  it('ignores keys and taps while paused', () => {
    const props = { onEnterPlace: vi.fn(), onOpenCelebration: vi.fn(), onMoved: vi.fn() }
    const { container } = render(<CityScreen state={newGame(1)} startPos={CITY.start} showHint={false} paused {...props} />)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    fireEvent.click(container.querySelector(`[data-tile="${doorOf(CITY, 'cafe').pos.x},${doorOf(CITY, 'cafe').pos.y}"]`)!)
    act(() => { vi.advanceTimersByTime(3000) })
    const p = container.querySelector('[data-testid="player"]')!
    expect({ x: Number(p.getAttribute('data-x')), y: Number(p.getAttribute('data-y')) }).toEqual(CITY.start)
    expect(props.onEnterPlace).not.toHaveBeenCalled()
  })

  it('labels each place with its Vietnamese name', () => {
    renderCity()
    for (const name of ['Quán cà phê', 'Siêu thị', 'Gọi taxi', 'Phòng khám']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })
})
