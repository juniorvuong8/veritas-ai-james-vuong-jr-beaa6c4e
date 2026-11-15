// Signs a bench chat so far, so the browser can't invent the person's lines or swap the words mid-chat.
// The server signs every reply it sends; the next request must carry that signature for the history it sent back.
import type { BenchId, BenchTarget, BenchTurn } from './bench'
import type { Level } from './types'

export interface SignedChat {
  benchId: BenchId
  level: Level
  targets: BenchTarget[]
  history: BenchTurn[]
}

const encoder = new TextEncoder()

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

const canonical = (c: SignedChat) =>
  JSON.stringify([c.benchId, c.level, c.targets.map((t) => [t.word, t.meaning_vi]), c.history.map((t) => [t.from, t.text])])

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function signChat(secret: string, chat: SignedChat): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(canonical(chat)))
  return toHex(sig)
}

export async function verifyChat(secret: string, chat: SignedChat, sig: unknown): Promise<boolean> {
  if (typeof sig !== 'string' || !/^[0-9a-f]{64}$/.test(sig)) return false
  const bytes = new Uint8Array(sig.match(/../g)!.map((h) => parseInt(h, 16)))
  return crypto.subtle.verify('HMAC', await hmacKey(secret), bytes, encoder.encode(canonical(chat)))
}
