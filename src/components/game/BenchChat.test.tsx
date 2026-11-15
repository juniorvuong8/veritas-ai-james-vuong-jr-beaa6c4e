import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BenchRequest, BenchReply, BenchTarget } from '@/shared/bench'
import type { BenchChatResult } from '@/lib/bench-api'
import { DebugProvider } from '@/lib/debug'
import { BenchChat } from './BenchChat'

const targets: BenchTarget[] = [
  { word: 'iced', meaning_vi: 'có đá' },
  { word: 'receipt', meaning_vi: 'hóa đơn' },
]
const reply = (r: Partial<BenchReply> = {}): BenchChatResult => ({
  ok: true,
  reply: { text: 'Chào cháu!', verdicts: [], done: false, ...r },
})
const understood = (word: string, ok = true) => ({ word, understood: ok })

function setup(opts: { status?: 'no_words' | 'limit' | 'open'; replies?: BenchChatResult[] } = {}) {
  const queue = [...(opts.replies ?? [reply()])]
  const requestReply = vi.fn((req: BenchRequest) => {
    void req
    return Promise.resolve(queue.shift()!)
  })
  const onStart = vi.fn()
  const onReward = vi.fn()
  const onLeave = vi.fn()
  render(
    <BenchChat
      benchId="bac-tu"
      level={1}
      status={opts.status ?? 'open'}
      targets={targets}
      onStart={onStart}
      onReward={onReward}
      onLeave={onLeave}
      requestReply={requestReply}
    />,
  )
  return { requestReply, onStart, onReward, onLeave }
}

async function send(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole('textbox'), text)
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('BenchChat', () => {
  it.each([
    ['no_words', /học vài từ/],
    ['limit', /ngày mai/],
  ] as const)('shows fixed text for %s without calling anything', async (status, text) => {
    const { requestReply, onStart, onLeave } = setup({ status })
    expect(screen.getByText(text)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Rời đi' }))
    expect(onLeave).toHaveBeenCalled()
    expect(requestReply).not.toHaveBeenCalled()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('starts once and shows the opening reply', async () => {
    const { onStart, requestReply } = setup()
    expect(await screen.findByText('Chào cháu!')).toBeInTheDocument()
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(requestReply).toHaveBeenCalledTimes(1)
    expect(requestReply.mock.calls[0][0].history).toEqual([])
    expect(requestReply.mock.calls[0][0].targets).toEqual(targets)
  })

  it('sends the conversation so far with each message', async () => {
    const { requestReply } = setup({ replies: [reply(), reply({ text: 'Vậy à!' })] })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'Cháu uống đá ạ')
    await screen.findByText('Vậy à!')
    expect(requestReply.mock.calls[1][0].history).toEqual([
      { from: 'person', text: 'Chào cháu!' },
      { from: 'learner', text: 'Cháu uống đá ạ' },
    ])
  })

  it('disables Send when blank and limits length', async () => {
    setup()
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '200')
    await user.type(screen.getByRole('textbox'), '   ')
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
  })

  it('shows an error and retries the same message', async () => {
    const { requestReply } = setup({
      replies: [reply(), { ok: false, code: 'network', message_vi: 'Mất mạng rồi' }, reply({ text: 'Ổn rồi' })],
    })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'xin chào')
    expect(await screen.findByText(/Không kết nối được/)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'again{Enter}')
    expect(requestReply).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Ổn rồi')).toBeInTheDocument()
    expect(screen.getAllByText('xin chào')).toHaveLength(1)
    expect(requestReply.mock.calls[2][0].history).toEqual(requestReply.mock.calls[1][0].history)
  })

  it('takes a rejected message back into the box so the chat never gets stuck', async () => {
    const { requestReply } = setup({
      replies: [reply(), { ok: false, code: 'bad_request', message_vi: 'Yêu cầu không hợp lệ' }, reply({ text: 'Ừ, hay đấy!' })],
    })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'xin chào')
    expect(await screen.findByText(/viết lại theo cách khác/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
    expect(screen.queryByText('xin chào')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('xin chào')
    await user.clear(screen.getByRole('textbox'))
    await send(user, 'chào bác ạ')
    expect(await screen.findByText('Ừ, hay đấy!')).toBeInTheDocument()
    expect(requestReply.mock.calls[2][0].history).toEqual([
      { from: 'person', text: 'Chào cháu!' },
      { from: 'learner', text: 'chào bác ạ' },
    ])
  })

  it('never sends a message that is only transcript tags or spaces', async () => {
    const { requestReply } = setup()
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await user.type(screen.getByRole('textbox'), '<transcript>  </transcript>')
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(requestReply).toHaveBeenCalledTimes(1)
  })

  it('sends back the signature from the last reply', async () => {
    const { requestReply } = setup({ replies: [reply({ sig: 'abc' }), reply({ text: 'B', sig: 'def' }), reply({ text: 'C' })] })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    expect(requestReply.mock.calls[0][0].sig).toBeUndefined()
    await send(user, 'one')
    await screen.findByText('B')
    await send(user, 'two')
    await screen.findByText('C')
    expect(requestReply.mock.calls[1][0].sig).toBe('abc')
    expect(requestReply.mock.calls[2][0].sig).toBe('def')
  })

  it('uses bench wording for errors, never the sample-lesson message', async () => {
    setup({ replies: [{ ok: false, code: 'out_of_credits', message_vi: 'Bạn có thể xem bài mẫu.' }] })
    expect(await screen.findByText(/không trò chuyện được nữa/)).toBeInTheDocument()
    expect(screen.queryByText(/bài mẫu/)).not.toBeInTheDocument()
  })

  it('shows the English error and aria-label in debug mode', async () => {
    const requestReply = vi.fn()
      .mockResolvedValueOnce(reply())
      .mockResolvedValueOnce({ ok: false, code: 'network', message_vi: 'Mất mạng rồi' })
    const user = userEvent.setup()
    render(
      <DebugProvider value>
        <BenchChat benchId="bac-tu" level={1} status="open" targets={targets} onStart={vi.fn()} onReward={vi.fn()} onLeave={vi.fn()} requestReply={requestReply} />
      </DebugProvider>,
    )
    await screen.findByText('Chào cháu!')
    expect(screen.getByLabelText('Tin nhắn · Message')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'hi{Enter}')
    expect(await screen.findByText(/Couldn't connect/)).toBeInTheDocument()
  })

  it('rewards once when every word was understood, then says goodbye', async () => {
    const { onReward } = setup({
      replies: [
        reply(),
        reply({ text: 'A', verdicts: [understood('iced')] }),
        reply({ text: 'Tạm biệt cháu!', verdicts: [understood('RECEIPT')], done: true }),
      ],
    })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'Cháu thích uống đá')
    await screen.findByText('A')
    await send(user, 'Hóa đơn ạ')
    expect(await screen.findByText('Tạm biệt cháu!')).toBeInTheDocument()
    expect(screen.getByText('+10 🪙')).toBeInTheDocument()
    expect(screen.getAllByText('✓ đã hiểu')).toHaveLength(2)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(onReward).toHaveBeenCalledTimes(1)
  })

  it('gives no reward when a word was not understood', async () => {
    const { onReward } = setup({
      replies: [reply(), reply({ text: 'Tạm biệt!', verdicts: [understood('iced'), understood('receipt', false)], done: true })],
    })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'ừm')
    await screen.findByText('Tạm biệt!')
    expect(screen.getByText(/Lần sau/)).toBeInTheDocument()
    expect(screen.queryByText(/🪙/)).not.toBeInTheDocument()
    expect(screen.getByText('chưa')).toBeInTheDocument()
    expect(onReward).not.toHaveBeenCalled()
  })

  it('counts a word as understood once, even if a later reply misjudges it', async () => {
    const { onReward } = setup({
      replies: [
        reply(),
        reply({ text: 'A', verdicts: [understood('iced'), understood('receipt')] }),
        reply({ text: 'Bye', verdicts: [understood('iced', false)], done: true }),
      ],
    })
    const user = userEvent.setup()
    await screen.findByText('Chào cháu!')
    await send(user, 'one')
    await screen.findByText('A')
    await send(user, 'two')
    await screen.findByText('Bye')
    expect(onReward).toHaveBeenCalledTimes(1)
  })

  it('ends after the 5th learner message even if the reply is not marked done', async () => {
    setup({ replies: Array.from({ length: 6 }, (_, i) => reply({ text: `r${i}` })) })
    const user = userEvent.setup()
    await screen.findByText('r0')
    for (let i = 0; i < 5; i++) {
      await send(user, `m${i}`)
      await screen.findByText(`r${i + 1}`)
    }
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument())
    expect(screen.getAllByText('chưa')).toHaveLength(2)
  })

  it('keeps the results up until the player clicks to go back to the city', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { onLeave } = setup({ replies: [reply(), reply({ text: 'Tạm biệt!', done: true })] })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await screen.findByText('Chào cháu!')
    await send(user, 'chào bác')
    await screen.findByText('Tạm biệt!')
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(onLeave).not.toHaveBeenCalled()
    expect(screen.getByText(/Lần sau/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Về thành phố' }))
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('ignores a reply that arrives after leaving', async () => {
    let resolve!: (r: BenchChatResult) => void
    const onReward = vi.fn()
    const onLeave = vi.fn()
    const requestReply = vi.fn(() => new Promise<BenchChatResult>((r) => (resolve = r)))
    const user = userEvent.setup()
    render(
      <BenchChat
        benchId="bac-tu"
        level={1}
        status="open"
        targets={targets}
        onStart={vi.fn()}
        onReward={onReward}
        onLeave={onLeave}
        requestReply={requestReply}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Rời đi' }))
    await act(async () => {
      resolve(reply({ verdicts: [understood('iced'), understood('receipt')], done: true }))
    })
    expect(onReward).not.toHaveBeenCalled()
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
