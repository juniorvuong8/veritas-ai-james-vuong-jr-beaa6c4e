import { describe, expect, it } from 'vitest'
import { signChat, verifyChat, type SignedChat } from './bench-sign'

const chat: SignedChat = {
  benchId: 'bac-tu',
  level: 1,
  targets: [{ word: 'menu', meaning_vi: 'thực đơn' }],
  history: [{ from: 'person', text: 'Chào cháu!' }],
}

describe('signChat / verifyChat', () => {
  it('verifies its own signature', async () => {
    const sig = await signChat('s3cret', chat)
    expect(sig).toMatch(/^[0-9a-f]{64}$/)
    expect(await verifyChat('s3cret', chat, sig)).toBe(true)
  })

  it('rejects a changed line, changed words, another secret or a malformed signature', async () => {
    const sig = await signChat('s3cret', chat)
    expect(await verifyChat('s3cret', { ...chat, history: [{ from: 'person', text: 'Chào!' }] }, sig)).toBe(false)
    expect(await verifyChat('s3cret', { ...chat, targets: [{ word: 'tip', meaning_vi: 'tiền boa' }] }, sig)).toBe(false)
    expect(await verifyChat('other', chat, sig)).toBe(false)
    expect(await verifyChat('s3cret', chat, 'nope')).toBe(false)
    expect(await verifyChat('s3cret', chat, undefined)).toBe(false)
  })
})
