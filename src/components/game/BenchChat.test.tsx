import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BenchRequest, BenchReply, BenchTarget } from '@/shared/bench'
import type { BenchPayout } from '@/game/state'
import type { BenchChatResult } from '@/lib/bench-api'
import { DebugProvider } from '@/lib/debug'
import { BenchChat } from './BenchChat'

const targets: BenchTarget[] = [
  { word: 'iced', meaning_vi: 'có đá', paid: [] },
  { word: 'receipt', meaning_vi: 'hóa đơn', paid: [] },
]
const reply = (r: Partial<BenchReply> = {}): BenchChatResult => ({
  ok: true,
  reply: { text: 'Chào cháu!', verdicts: [], done: false, ...r },
})

function setup(
  opts: {
    status?: 'no_words' | 'limit' | 'open'
    replies?: BenchChatResult[]
    onVerdicts?: (v: unknown[]) => BenchPayout[]
  } = {},
) {
  const queue = [...(opts.replies ?? [reply()])]
  const requestReply = vi.fn((req: BenchRequest) => {
    void req
    return Promise.resolve(queue.shift()!)
  })
  const onStart = vi.fn()
  const onLeave = vi.fn()
  const onVerdicts = vi.fn(opts.onVerdicts ?? (() => []))
  render(
    <BenchChat
      benchId="bac-tu"
      level={1}
      status={opts.status ?? 'open'}
      targets={targets}
      onStart={onStart}
      onVerdicts={onVerdicts}
      onLeave={onLeave}
      requestReply={requestReply}
    />,
  )
  return { requestReply, onStart, onLeave, onVerdicts, user: userEvent.setup() }
}

async function send(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole('textbox'), text)
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
}

describe('BenchChat', () => {
  it.each([
    ['no_words', /học vài từ/],
    ['limit', /ngày mai/],
  ] as const)('shows fixed text for %s without calling anything', async (status, text) => {
    const { requestReply, onStart, onLeave, user } = setup({ status })
    expect(screen.getByText(text)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rời đi' }))
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
  })

  it('shows the coin pop only for what was paid', async () => {
    const verdict = { word: 'iced', check: 'understand' as const, passed: true }
    const { requestReply, onVerdicts, user } = setup({
      replies: [reply(), reply({ text: 'Giỏi!', verdicts: [verdict] })],
      onVerdicts: () => [{ word: 'iced', check: 'understand', coins: 5 }],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'Cháu uống đá ạ')
    expect(await screen.findByText('+5 🪙')).toBeInTheDocument()
    expect(requestReply.mock.calls[1][0].history).toEqual([
      { from: 'person', text: 'Chào cháu!' },
      { from: 'learner', text: 'Cháu uống đá ạ' },
    ])
    expect(onVerdicts).toHaveBeenCalledWith([verdict])
  })

  it('shows no pop when nothing paid, then sends updated paid after a payout', async () => {
    const verdict = { word: 'iced', check: 'understand' as const, passed: true }
    const payouts: BenchPayout[][] = [[], [{ word: 'iced', check: 'understand', coins: 5 }]]
    const { requestReply, user } = setup({
      replies: [
        reply(),
        reply({ verdicts: [verdict], text: 'A' }),
        reply({ verdicts: [verdict], text: 'B' }),
        reply({ text: 'C' }),
      ],
      onVerdicts: () => payouts.shift() ?? [],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'one')
    await screen.findByText('A')
    expect(screen.queryByText(/🪙/)).not.toBeInTheDocument()
    await send(user, 'two')
    await screen.findByText('B')
    await send(user, 'three')
    await screen.findByText('C')
    expect(requestReply.mock.calls[2][0].targets[0].paid).toEqual([])
    expect(requestReply.mock.calls[3][0].targets[0].paid).toEqual(['understand'])
  })

  it('disables Send when blank and limits length', async () => {
    const { user } = setup()
    await screen.findByText('Chào cháu!')
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '200')
    await user.type(screen.getByRole('textbox'), '   ')
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
  })

  it('shows an error and retries the same message', async () => {
    const { requestReply, onVerdicts, user } = setup({
      replies: [reply(), { ok: false, code: 'network', message_vi: 'Mất mạng rồi' }, reply({ text: 'Ổn rồi' })],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'xin chào')
    expect(await screen.findByText('Mất mạng rồi')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Ổn rồi')).toBeInTheDocument()
    expect(screen.getAllByText('xin chào')).toHaveLength(1)
    expect(requestReply.mock.calls[2][0].history).toEqual(requestReply.mock.calls[1][0].history)
    expect(onVerdicts).not.toHaveBeenCalled()
  })

  it('hides Try again on bad_request and blocks sending while an error shows', async () => {
    const { requestReply, user } = setup({
      replies: [reply(), { ok: false, code: 'bad_request', message_vi: 'Yêu cầu không hợp lệ' }],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'xin chào')
    expect(await screen.findByText('Yêu cầu không hợp lệ')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'again{Enter}')
    expect(requestReply).toHaveBeenCalledTimes(2)
  })

  it('shows the English error and aria-label in debug mode', async () => {
    const requestReply = vi.fn()
      .mockResolvedValueOnce(reply())
      .mockResolvedValueOnce({ ok: false, code: 'network', message_vi: 'Mất mạng rồi' })
    const user = userEvent.setup()
    render(
      <DebugProvider value>
        <BenchChat benchId="bac-tu" level={1} status="open" targets={targets} onStart={vi.fn()} onVerdicts={() => []} onLeave={vi.fn()} requestReply={requestReply} />
      </DebugProvider>,
    )
    await screen.findByText('Chào cháu!')
    expect(screen.getByLabelText('Tin nhắn · Message')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'hi{Enter}')
    expect(await screen.findByText(/Couldn't connect/)).toBeInTheDocument()
  })

  it('shows the summary status for a word the server spelled differently', async () => {
    const { user } = setup({
      replies: [reply(), reply({ done: true, verdicts: [{ word: 'ICED', check: 'use', passed: true }] })],
      onVerdicts: () => [{ word: 'iced', check: 'use', coins: 10 }],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'iced')
    expect(await screen.findByText('đã dùng')).toBeInTheDocument()
  })

  it('shows a summary when done', async () => {
    const v = [
      { word: 'iced', check: 'use' as const, passed: true },
      { word: 'receipt', check: 'understand' as const, passed: true },
    ]
    const { user } = setup({
      replies: [reply(), reply({ verdicts: v, done: true, text: 'Tạm biệt' })],
      onVerdicts: () => [
        { word: 'iced', check: 'use', coins: 10 },
        { word: 'receipt', check: 'understand', coins: 5 },
      ],
    })
    await screen.findByText('Chào cháu!')
    await send(user, 'iced coffee')
    await screen.findByText('Tạm biệt')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getAllByText('+15 🪙')).toHaveLength(2)
    expect(screen.getByText('đã dùng')).toBeInTheDocument()
    expect(screen.getByText('đã hiểu')).toBeInTheDocument()
  })

  it('ends after the 10th learner message', async () => {
    const { user } = setup({ replies: Array.from({ length: 11 }, () => reply()) })
    await screen.findByText('Chào cháu!')
    for (let i = 0; i < 10; i++) {
      if (i > 0) await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
      await send(user, `m${i}`)
    }
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument())
    expect(screen.getAllByText('chưa')).toHaveLength(2)
  })

  it('ignores a reply that arrives after leaving', async () => {
    let resolve!: (r: BenchChatResult) => void
    const onVerdicts = vi.fn(() => [])
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
        onVerdicts={onVerdicts}
        onLeave={onLeave}
        requestReply={requestReply}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Rời đi' }))
    resolve(reply({ verdicts: [{ word: 'iced', check: 'use', passed: true }] }))
    await Promise.resolve()
    expect(onVerdicts).not.toHaveBeenCalled()
    expect(onLeave).toHaveBeenCalled()
  })
})
