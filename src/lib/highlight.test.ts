import { describe, expect, it } from 'vitest'
import { splitHighlights } from './highlight'

describe('splitHighlights', () => {
  it('highlights a phrase inside Vietnamese text', () => {
    expect(splitHighlights('Chị uống ở đây hay to go ạ?', ['to go'])).toEqual([
      { text: 'Chị uống ở đây hay ' },
      { text: 'to go', word: 'to go' },
      { text: ' ạ?' },
    ])
  })
  it('does not highlight a word inside another word', () => {
    expect(splitHighlights('Is it good?', ['go'])).toEqual([{ text: 'Is it good?' }])
  })
  it('highlights every occurrence and keeps original casing', () => {
    expect(splitHighlights('Menu, please. The MENU!', ['menu'])).toEqual([
      { text: 'Menu', word: 'menu' },
      { text: ', please. The ' },
      { text: 'MENU', word: 'menu' },
      { text: '!' },
    ])
  })
  it('prefers the longer overlapping word', () => {
    expect(splitHighlights('to go', ['go', 'to go'])).toEqual([{ text: 'to go', word: 'to go' }])
  })
  it('returns the whole text when there are no words', () => {
    expect(splitHighlights('Xin chào', [])).toEqual([{ text: 'Xin chào' }])
  })
})
