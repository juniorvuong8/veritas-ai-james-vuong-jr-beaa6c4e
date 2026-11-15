import { describe, expect, it } from 'vitest'
import { parseJsonObject } from './ai'

const lesson = { title_vi: 'x', n: 1 }

describe('parseJsonObject', () => {
  it('parses plain JSON', () => {
    expect(parseJsonObject(JSON.stringify(lesson))).toEqual(lesson)
  })
  it('parses JSON inside a ```json fence', () => {
    expect(parseJsonObject('```json\n' + JSON.stringify(lesson) + '\n```')).toEqual(lesson)
  })
  it('parses JSON surrounded by prose', () => {
    expect(parseJsonObject('Here you go: ' + JSON.stringify(lesson) + ' Enjoy!')).toEqual(lesson)
  })
  it('returns undefined for non-JSON', () => {
    expect(parseJsonObject('not json')).toBeUndefined()
  })
  it('returns undefined for a top-level array', () => {
    expect(parseJsonObject('[1,2]')).toBeUndefined()
  })
})
