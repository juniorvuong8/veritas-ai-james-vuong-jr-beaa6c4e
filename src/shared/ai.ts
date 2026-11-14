import type { ChatMessage } from './prompt'

export const DEFAULT_MODEL = 'anthropic/claude-opus-5-5'
/** Output cap (usage guard). Generous, because thinking tokens count toward it. */
export const MAX_OUTPUT_TOKENS = 8000

export type AiCaller = (messages: ChatMessage[]) => Promise<string>

/** An AI call failed. `status` follows HTTP: 429 rate limited, 402 out of credits, 504 too slow. */
export class AiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiError'
    this.status = status
  }
}

/** Server-only: calls Claude through the Lovable AI Gateway. */
export function createGatewayAiCaller(): AiCaller {
  return async (messages) => {
    const { generateMessage, RateLimitError, PaymentRequiredError, GatewayError } = await import('@lovable.dev/ai-gateway')
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
    const turns = messages.filter((m) => m.role === 'user').map((m) => ({ role: 'user' as const, content: m.content }))
    let res
    try {
      res = await generateMessage({ model: DEFAULT_MODEL, max_tokens: MAX_OUTPUT_TOKENS, system, messages: turns })
    } catch (err) {
      if (err instanceof RateLimitError) throw new AiError(429, err.message)
      if (err instanceof PaymentRequiredError) throw new AiError(402, err.message)
      if (err instanceof GatewayError) throw new AiError(err.httpStatus ?? 502, err.message)
      throw err
    }
    if (res.stop_reason === 'refusal') throw new AiError(502, 'Claude declined the request')
    if (res.stop_reason === 'max_tokens') throw new AiError(502, 'Claude hit the output limit')
    const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    if (text.trim() === '') throw new AiError(502, 'Claude returned no text')
    return text
  }
}

function asObject(v: unknown): Record<string, unknown> | undefined {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Parse a JSON object from model text, tolerating code fences or prose around it. */
export function parseJsonObject(text: string): unknown | undefined {
  const direct = tryParse(text)
  if (direct !== undefined) return asObject(direct)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return undefined
  return asObject(tryParse(text.slice(start, end + 1)))
}
