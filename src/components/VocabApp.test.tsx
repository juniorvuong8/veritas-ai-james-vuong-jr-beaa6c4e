import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { CITY, benchOf, doorOf, type Pos } from '@/game/map'
import { findPath } from '@/game/path'
import { newGame, today } from '@/game/state'
import { SAVE_KEY } from '@/game/storage'
import { requestLesson } from '@/lib/api'
import { requestBenchReply } from '@/lib/bench-api'
import { VocabApp as App } from './VocabApp'

vi.mock('@/lib/api', () => ({ requestLesson: vi.fn() }))
vi.mock('@/lib/bench-api', () => ({ requestBenchReply: vi.fn() }))
const mocked = vi.mocked(requestLesson)
const benchMocked = vi.mocked(requestBenchReply)

const keyFor = (a: Pos, b: Pos) =>
  b.x > a.x ? 'ArrowRight' : b.x < a.x ? 'ArrowLeft' : b.y > a.y ? 'ArrowDown' : 'ArrowUp'

function walkTo(target: Pos, from: Pos = CITY.start) {
  const path = [from, ...findPath(CITY, from, target)!]
  for (let i = 1; i < path.length; i++) fireEvent.keyDown(window, { key: keyFor(path[i - 1], path[i]) })
}

const playerPos = (container: HTMLElement) => {
  const p = container.querySelector('[data-testid="player"]')!
  return { x: Number(p.getAttribute('data-x')), y: Number(p.getAttribute('data-y')) }
}

const allStamps = ['cafe', 'supermarket', 'taxi', 'clinic']

/** Leave the homepage for the level choice. */
async function openStart(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: 'Bắt đầu' })[0])
}

describe('App', () => {
  beforeEach(() => {
    mocked.mockReset()
    benchMocked.mockReset()
    localStorage.clear()
  })

  it('starts a new game at the chosen level', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: /Cấp 2/ }))
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(screen.getByText('Cấp 2')).toBeInTheDocument()
    expect(screen.getByText('Đi đến một địa điểm để bắt đầu')).toBeInTheDocument()
  })

  it('plays the café and comes back to the city with a stamp and coins', async () => {
    const user = userEvent.setup()
    mocked.mockResolvedValue({ ok: true, lesson: validLesson() })
    const { container } = render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    walkTo(doorOf(CITY, 'cafe').pos)
    expect(await screen.findByText(/Hôm nay bạn muốn học từ nào/)).toBeInTheDocument()
    for (const w of ['menu', 'to go', 'receipt']) await user.click(screen.getByRole('button', { name: w }))
    await user.click(screen.getByRole('button', { name: 'Bắt đầu hội thoại' }))
    await screen.findByText(/Chào chị! Đây là/)
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    await user.click(screen.getByRole('button', { name: 'Làm bài kiểm tra' }))
    for (const answer of ['menu', 'receipt', 'receipt']) {
      await user.click(screen.getByRole('button', { name: answer }))
      await user.click(screen.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }))
    }
    await user.click(screen.getByRole('button', { name: 'Về thành phố' }))
    expect(screen.getByLabelText('Quán cà phê: đã xong')).toBeInTheDocument()
    expect(screen.getByText('🪙 20')).toBeInTheDocument()
    expect(playerPos(container)).toEqual(doorOf(CITY, 'cafe').outside)

    // The lesson's words are now in the notebook…
    await user.click(screen.getByRole('button', { name: /Sổ từ: 3 từ/ }))
    const notebook = screen.getByRole('dialog', { name: /Sổ từ của bạn/ })
    for (const w of ['menu', 'to go', 'receipt']) expect(within(notebook).getByText(w)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đóng sổ từ' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // …and show grey in the café's word picker next time.
    walkTo(doorOf(CITY, 'cafe').pos, doorOf(CITY, 'cafe').outside)
    await user.click(screen.getByRole('button', { name: 'Vào lại' }))
    await screen.findByText(/Hôm nay bạn muốn học từ nào/)
    for (const w of ['menu', 'to go', 'receipt']) await user.click(screen.getByRole('button', { name: w }))
    expect(screen.getByRole('button', { name: 'menu' })).toHaveAttribute('data-learned', 'true')
    expect(screen.getByRole('button', { name: 'napkin' })).not.toHaveAttribute('data-learned')
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).learnedWords).toHaveLength(3)
  })

  it('continues a saved round', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(1), stamps: ['taxi'], coins: 10 }))
    const user = userEvent.setup()
    render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    expect(screen.getByLabelText('Gọi taxi: đã xong')).toBeInTheDocument()
    expect(screen.getByText('🪙 10')).toBeInTheDocument()
  })

  it('reopens the celebration of a saved complete round from the trophy', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(1), stamps: allStamps, complete: true, coins: 90 }))
    const user = userEvent.setup()
    render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    expect(screen.queryByText('Bạn đã hoàn thành cấp 1!')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /🏆/ }))
    expect(screen.getByText('Bạn đã hoàn thành cấp 1!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tiếp tục dạo phố' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lên cấp 2' }))
    expect(screen.getByText('Cấp 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Quán cà phê: chưa xong')).toBeInTheDocument()
  })

  it('has no level-up at level 3, and keep exploring closes the celebration', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(3), stamps: allStamps, complete: true }))
    const user = userEvent.setup()
    render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    await user.click(screen.getByRole('button', { name: /🏆/ }))
    expect(screen.queryByRole('button', { name: /Lên cấp/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiếp tục dạo phố' }))
    expect(screen.queryByText('Bạn đã hoàn thành cấp 3!')).not.toBeInTheDocument()
  })

  it('does not walk behind the open celebration', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(1), stamps: allStamps, complete: true }))
    const user = userEvent.setup()
    const { container } = render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    await user.click(screen.getByRole('button', { name: /🏆/ }))
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(playerPos(container)).toEqual(CITY.start)
  })

  it('shows the homepage first', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cấp 2/ })).not.toBeInTheDocument()
  })

  it('opens a place chosen on the homepage right after the level choice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Gọi taxi/ }))
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(screen.getByText(/lên xe nào/)).toBeInTheDocument()
  })

  it('toggles debug mode with Alt+Shift+D, showing English under the Vietnamese', () => {
    render(<App />)
    expect(screen.queryByText(/DEBUG/)).not.toBeInTheDocument()
    fireEvent.keyDown(window, { code: 'KeyD', altKey: true, shiftKey: true })
    expect(screen.getByText(/DEBUG/)).toBeInTheDocument()
    expect(screen.getByText('Learn words through conversation')).toBeInTheDocument()
    expect(localStorage.getItem('vocab-debug')).toBe('1')
    fireEvent.keyDown(window, { code: 'KeyD', altKey: true, shiftKey: true })
    expect(screen.queryByText(/DEBUG/)).not.toBeInTheDocument()
    expect(localStorage.getItem('vocab-debug')).toBeNull()
  })

  it('asks before starting a new game, then clears the notebook but keeps shop items', async () => {
    const user = userEvent.setup()
    const word = { word: 'menu', input: 'menu', meaning_vi: 'thực đơn', usage_vi: 'cách dùng', placeId: 'cafe' }
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...newGame(1), stamps: ['cafe'], coins: 40, learnedWords: [word], starred: ['menu'], owned: ['cap'], outfit: { hat: 'cap' } }),
    )
    render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi mới' }))
    expect(screen.getByRole('dialog', { name: 'Bạn có chắc không?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Không, quay lại' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).learnedWords).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Chơi mới' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Chơi mới' }))
    await user.click(screen.getByRole('button', { name: 'Có, chơi mới' }))
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!)).toMatchObject({
      stamps: [], coins: 0, learnedWords: [], starred: [], owned: ['cap'], outfit: { hat: 'cap' },
    })
  })

  it('opens the shop from the coins, buys a hat and wears it in the city', async () => {
    const user = userEvent.setup()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(1), coins: 50 }))
    const { container } = render(<App />)
    await openStart(user)
    await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    await user.click(screen.getByRole('button', { name: /50 xu: mở cửa hàng/ }))
    await user.click(screen.getByRole('button', { name: 'Mua Mũ lưỡi trai giá 20 xu' }))
    expect(screen.getByTestId('shop-coins')).toHaveTextContent('🪙 30')
    await user.click(screen.getByRole('button', { name: 'Đóng cửa hàng' }))
    const player = container.querySelector('[data-testid="player"]')!
    expect(player.querySelector('[data-part="hat"]')).toHaveTextContent('🧢')
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!)).toMatchObject({ coins: 30, owned: ['cap'], outfit: { hat: 'cap' } })
  })

  describe('park benches', () => {
    const learned = (word: string) => ({ word, input: word, meaning_vi: 'nghĩa', usage_vi: 'cách dùng', placeId: 'cafe' })
    const save = (extra: object) =>
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newGame(1), learnedWords: [learned('menu'), learned('receipt')], ...extra }))
    const resume = async (user: ReturnType<typeof userEvent.setup>) => {
      await openStart(user)
      await user.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
    }

    it('chats on a bench, earns 10 coins for understanding every word, and goes back beside it', async () => {
      save({ coins: 0 })
      benchMocked
        .mockResolvedValueOnce({ ok: true, reply: { text: 'Xin chào cháu!', verdicts: [], done: false } })
        .mockResolvedValueOnce({
          ok: true,
          reply: {
            text: 'Giỏi lắm, tạm biệt cháu!',
            verdicts: [
              { word: 'menu', understood: true },
              { word: 'receipt', understood: true },
            ],
            done: true,
          },
        })
      const user = userEvent.setup()
      const { container } = render(<App />)
      await resume(user)
      const bench = benchOf(CITY, 'bac-tu')
      walkTo(bench.pos)
      expect(await screen.findByText('Xin chào cháu!')).toBeInTheDocument()
      await user.type(screen.getByLabelText('Tin nhắn'), 'Cháu xem thực đơn và xin hóa đơn ạ')
      await user.click(screen.getByRole('button', { name: 'Gửi' }))
      expect(await screen.findByText('Giỏi lắm, tạm biệt cháu!')).toBeInTheDocument()
      expect(screen.getByText('+10 🪙')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Về thành phố' }))
      expect(screen.getByText('🪙 10')).toBeInTheDocument()
      expect(playerPos(container)).toEqual(bench.outside)
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)
      expect(saved.benchDay).toEqual({ date: today(), chats: 1, rewarded: 1 })
      expect(saved.coins).toBe(10)
    })

    it('says to come back tomorrow after four chats, without calling the AI', async () => {
      save({ benchDay: { date: today(), chats: 4, rewarded: 0 } })
      const user = userEvent.setup()
      render(<App />)
      await resume(user)
      walkTo(benchOf(CITY, 'bac-tu').pos)
      expect(await screen.findByText(/ngày mai cháu quay lại/)).toBeInTheDocument()
      expect(benchMocked).not.toHaveBeenCalled()
    })
  })
})
