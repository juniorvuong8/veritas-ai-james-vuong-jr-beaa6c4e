import { describe, expect, it, vi } from 'vitest'
import { AiError, type AiCaller } from './ai'
import { getScenario } from './scenarios'
import { buildWordFitMessages, checkWordFit, checkWordFitRequest, parseWordFit } from './word-fit'

const ai = (text: string) => vi.fn<AiCaller>(async () => text)

describe('parseWordFit', () => {
  it('reads a yes', () => {
    expect(parseWordFit('{"fits": true, "reason_vi": "Hợp.", "reason_en": "Fits."}')).toEqual({ fits: true, checked: true })
  })

  it('reads a no with reasons', () => {
    expect(parseWordFit('{"fits": false, "reason_vi": "Không hợp.", "reason_en": "Does not fit."}')).toEqual({
      fits: false,
      checked: true,
      reason_vi: 'Không hợp.',
      reason_en: 'Does not fit.',
    })
  })

  it('rejects a no without a reason, and junk', () => {
    expect(parseWordFit('{"fits": false}')).toBeUndefined()
    expect(parseWordFit('maybe')).toBeUndefined()
  })
})

describe('checkWordFitRequest', () => {
  it('normalizes a good request', () => {
    expect(checkWordFitRequest({ scenarioId: 'cafe', word: '  wifi ' })).toEqual({ scenarioId: 'cafe', word: 'wifi' })
  })

  it('rejects unknown places, bad words and sentences', () => {
    expect(checkWordFitRequest({ scenarioId: 'moon', word: 'wifi' })).toBeUndefined()
    expect(checkWordFitRequest({ scenarioId: 'cafe', word: '<b>' })).toBeUndefined()
    expect(checkWordFitRequest({ scenarioId: 'cafe', word: 'i want a big coffee' })).toBeUndefined()
  })
})

describe('checkWordFit', () => {
  it('passes the situation and the word to the AI', async () => {
    const call = ai('{"fits": true, "reason_vi": "Hợp.", "reason_en": "Fits."}')
    await checkWordFit({ scenarioId: 'taxi', word: 'umbrella' }, call)
    const [, user] = call.mock.calls[0][0]
    expect(user.content).toContain(getScenario('taxi')!.promptContext)
    expect(user.content).toContain('"umbrella"')
  })

  it('returns the AI verdict', async () => {
    const verdict = await checkWordFit(
      { scenarioId: 'cafe', word: 'volcano' },
      ai('{"fits": false, "reason_vi": "Không hợp.", "reason_en": "Does not fit."}'),
    )
    expect(verdict).toMatchObject({ fits: false, reason_en: 'Does not fit.' })
  })

  it('allows the word when the AI fails or answers badly', async () => {
    const failing = vi.fn<AiCaller>(async () => {
      throw new AiError(429, 'busy')
    })
    expect(await checkWordFit({ scenarioId: 'cafe', word: 'wifi' }, failing)).toEqual({ fits: true, checked: false })
    expect(await checkWordFit({ scenarioId: 'cafe', word: 'wifi' }, ai('hmm'))).toEqual({ fits: true, checked: false })
  })

  it('returns undefined for a malformed request without calling the AI', async () => {
    const call = ai('{}')
    expect(await checkWordFit({ scenarioId: 'cafe' }, call)).toBeUndefined()
    expect(call).not.toHaveBeenCalled()
  })
})

describe('buildWordFitMessages', () => {
  it('tells the model to be generous', () => {
    const [system] = buildWordFitMessages(getScenario('cafe')!, 'wifi')
    expect(system.content).toContain('Be generous')
  })
})
