import { describe, expect, it } from 'vitest'
import { DEBUG_INSTRUCTION, buildMessages } from './prompt'
import { getScenario } from './scenarios'
import { validRequest } from './test-fixtures'

const cafe = getScenario('cafe')!

describe('buildMessages', () => {
  it('returns a system and a user message', () => {
    const msgs = buildMessages(cafe, validRequest)
    expect(msgs.map((m) => m.role)).toEqual(['system', 'user'])
  })

  it('system message defines all three levels and the JSON fields', () => {
    const [system] = buildMessages(cafe, validRequest)
    expect(system.content).toContain('Level 1')
    expect(system.content).toContain('Level 2')
    expect(system.content).toContain('Level 3')
    expect(system.content).toContain('"input"')
    expect(system.content).toContain('"answer_index"')
  })

  it('tells the model not to change the form of chosen words', () => {
    const [system] = buildMessages(cafe, validRequest)
    expect(system.content).toContain('Do not pluralize, conjugate or otherwise change')
  })

  it('user message names the words and the level', () => {
    const [, user] = buildMessages(cafe, { ...validRequest, level: 2 })
    expect(user.content).toContain(JSON.stringify(validRequest.words))
    expect(user.content).toContain('Level: 2')
    expect(user.content).toContain(cafe.promptContext)
  })

  it('asks for a context clue for every chosen word, without direct translation', () => {
    const [system] = buildMessages(cafe, validRequest)
    expect(system.content).toContain('guess what each chosen word means from the conversation alone')
    expect(system.content).toContain('Do not translate the word directly next to it')
  })

  it('states the two-speaker, host-first rule', () => {
    const [system] = buildMessages(cafe, validRequest)
    expect(system.content).toContain('exactly two speakers')
    expect(system.content).toContain('The first line is spoken by the person who works there')
  })

  it('asks for English fields only in debug mode, leaving the system prompt unchanged', () => {
    const [system, user] = buildMessages(cafe, validRequest)
    const [debugSystem, debugUser] = buildMessages(cafe, { ...validRequest, debug: true })
    expect(user.content).not.toContain(DEBUG_INSTRUCTION)
    expect(debugUser.content).toContain(DEBUG_INSTRUCTION)
    expect(debugSystem.content).toBe(system.content)
  })
})
