import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validLesson } from '@/shared/test-fixtures'
import { requestLesson } from '@/lib/api'
import { PlaceScreen } from './PlaceScreen'

vi.mock('@/lib/api', () => ({ requestLesson: vi.fn() }))
const mocked = vi.mocked(requestLesson)

function renderPlace() {
  const props = {
    onWordsChosen: vi.fn(),
    onCorrect: vi.fn(),
    onFinish: vi.fn(),
    onLeave: vi.fn(),
  }
  render(<PlaceScreen placeId="cafe" level={1} initialWords={[]} {...props} />)
  return { ...props, user: userEvent.setup() }
}

async function pickWords(user: ReturnType<typeof userEvent.setup>) {
  for (const w of ['menu', 'to go', 'receipt']) await user.click(screen.getByRole('button', { name: w }))
  await user.click(screen.getByRole('button', { name: 'Bắt đầu hội thoại' }))
}

describe('PlaceScreen', () => {
  beforeEach(() => mocked.mockReset())

  it('plays a visit from greeting to stamp', async () => {
    let resolve!: (v: Awaited<ReturnType<typeof requestLesson>>) => void
    mocked.mockReturnValue(new Promise((r) => (resolve = r)))
    const p = renderPlace()
    expect(screen.getByText(/Hôm nay bạn muốn học từ nào/)).toBeInTheDocument()
    await pickWords(p.user)
    expect(p.onWordsChosen).toHaveBeenCalledWith(['menu', 'to go', 'receipt'])
    expect(screen.getByText('Đang chuẩn bị…')).toBeInTheDocument()
    resolve({ ok: true, lesson: validLesson() })
    expect(await screen.findByText(/Chào chị! Đây là/)).toBeInTheDocument()
    for (let i = 0; i < 4; i++) await p.user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    await p.user.click(screen.getByRole('button', { name: 'Làm bài kiểm tra' }))
    for (const answer of ['menu', 'to go', 'receipt']) {
      await p.user.click(screen.getByRole('button', { name: answer }))
      await p.user.click(screen.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }))
    }
    expect(p.onCorrect).toHaveBeenCalledTimes(3)
    expect(screen.getByText(/3\/3/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rời đi' })).not.toBeInTheDocument()
    await p.user.click(screen.getByRole('button', { name: 'Về thành phố' }))
    expect(p.onFinish).toHaveBeenCalledTimes(1)
  })

  it('redoes the quiz from the word review, without paying coins again', async () => {
    mocked.mockResolvedValue({ ok: true, lesson: validLesson() })
    const p = renderPlace()
    await pickWords(p.user)
    await screen.findByText(/Chào chị! Đây là/)
    const takeQuiz = async () => {
      await p.user.click(screen.getByRole('button', { name: 'Làm bài kiểm tra' }))
      for (const answer of ['menu', 'to go', 'receipt']) {
        await p.user.click(screen.getByRole('button', { name: answer }))
        await p.user.click(screen.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }))
      }
    }
    for (let i = 0; i < 4; i++) await p.user.click(screen.getByRole('button', { name: 'Tiếp ▸' }))
    await takeQuiz()
    expect(screen.getByText('+30 🪙')).toBeInTheDocument()
    await p.user.click(screen.getByRole('button', { name: 'Làm lại quiz' }))
    expect(screen.getByRole('button', { name: 'Làm bài kiểm tra' })).toBeInTheDocument()
    await takeQuiz()
    expect(p.onCorrect).toHaveBeenCalledTimes(3)
    expect(screen.getByText(/3\/3/)).toBeInTheDocument()
    expect(screen.queryByText(/🪙/)).not.toBeInTheDocument()
  })

  it('offers the sample lesson when the AI fails, and can retry', async () => {
    mocked.mockResolvedValue({
      ok: false,
      code: 'out_of_credits',
      message_vi: 'Hệ thống tạm thời không tạo được hội thoại. Bạn có thể xem bài mẫu.',
    })
    const p = renderPlace()
    await pickWords(p.user)
    expect(await screen.findByText(/Hệ thống tạm thời/)).toBeInTheDocument()
    await p.user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked.mock.calls[1][0]).toEqual(mocked.mock.calls[0][0])
    await screen.findByText(/Hệ thống tạm thời/)
    await p.user.click(screen.getByRole('button', { name: 'Xem bài mẫu' }))
    expect(screen.getByText('Bài mẫu')).toBeInTheDocument()
    expect(screen.getByText(/Chào chị! Đây là/)).toBeInTheDocument()
  })

  it('hides retry for a bad request and lets you pick words again', async () => {
    mocked.mockResolvedValue({ ok: false, code: 'bad_request', message_vi: 'Yêu cầu không hợp lệ. Vui lòng chọn lại từ vựng.' })
    const p = renderPlace()
    await pickWords(p.user)
    await screen.findByText(/Yêu cầu không hợp lệ/)
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
    await p.user.click(screen.getByRole('button', { name: 'Chọn lại từ' }))
    expect(screen.getByRole('button', { name: 'Bắt đầu hội thoại' })).toBeInTheDocument()
  })

  it('leaves from the word picking', async () => {
    const p = renderPlace()
    await p.user.click(screen.getByRole('button', { name: 'Rời đi' }))
    expect(p.onLeave).toHaveBeenCalled()
  })
})
