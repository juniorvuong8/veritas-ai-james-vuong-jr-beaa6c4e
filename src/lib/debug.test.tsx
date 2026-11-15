import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { FALLBACK_LESSONS } from '@/data/fallback-lessons'
import { WordNotes } from '@/components/game/WordNotes'
import { Bi, DebugProvider, isDebugShortcut, readDebugFlag } from './debug'

describe('readDebugFlag', () => {
  beforeEach(() => localStorage.clear())

  it('is off by default', () => {
    expect(readDebugFlag('')).toBe(false)
  })

  it('turns on with ?debug=1 and remembers it', () => {
    expect(readDebugFlag('?debug=1')).toBe(true)
    expect(readDebugFlag('')).toBe(true)
  })

  it('turns off with ?debug=0', () => {
    readDebugFlag('?debug')
    expect(readDebugFlag('?debug=0')).toBe(false)
    expect(readDebugFlag('')).toBe(false)
  })
})

describe('isDebugShortcut', () => {
  const key = (mods: Partial<KeyboardEvent>) =>
    ({ altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, code: 'KeyD', ...mods }) as KeyboardEvent

  it('matches Alt+Shift+D only', () => {
    expect(isDebugShortcut(key({ altKey: true, shiftKey: true }))).toBe(true)
    expect(isDebugShortcut(key({ shiftKey: true }))).toBe(false)
    expect(isDebugShortcut(key({ altKey: true, shiftKey: true, metaKey: true }))).toBe(false)
    expect(isDebugShortcut(key({ altKey: true, shiftKey: true, code: 'KeyS' }))).toBe(false)
  })
})

describe('Bi', () => {
  it('shows only Vietnamese outside debug mode', () => {
    render(<Bi vi="Tiếp" en="Next" />)
    expect(screen.getByText('Tiếp')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('adds the English gloss in debug mode', () => {
    render(
      <DebugProvider value>
        <Bi vi="Tiếp" en="Next" />
      </DebugProvider>,
    )
    expect(screen.getByText('Next')).toHaveAttribute('lang', 'en')
  })

  it('shows English lesson fields in the word notes', () => {
    render(
      <DebugProvider value>
        <WordNotes lesson={FALLBACK_LESSONS[1]} onStartQuiz={() => {}} />
      </DebugProvider>,
    )
    expect(screen.getByText('Word notes')).toBeInTheDocument()
    expect(screen.getByText('Meaning: the list of food and drinks')).toBeInTheDocument()
    expect(screen.getByText('Take the quiz')).toBeInTheDocument()
  })
})
