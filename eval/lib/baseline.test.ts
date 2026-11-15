import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '@/shared/scenarios'
import { checkLesson } from '@/shared/validate-lesson'
import casesJson from '../cases.json'
import dictJson from '../baseline/dictionary.json'
import templatesJson from '../baseline/templates.json'
import { buildBaselineLesson, type Dictionary, type Templates } from './baseline'
import type { EvalCase } from './types'

const cases = casesJson as EvalCase[]
const dict = dictJson as Dictionary
const templates = templatesJson as Templates

describe('baseline', () => {
  it('produces a lesson that passes the app checks for every case', () => {
    for (const c of cases) {
      const r = checkLesson(buildBaselineLesson(c, dict, templates), c)
      expect(r.ok ? [] : r.errors, c.id).toEqual([])
    }
  })

  it('has a dictionary entry and a line at every level for every suggested word', () => {
    for (const s of SCENARIOS) {
      for (const w of s.suggestedWords) {
        expect(dict.words[w], w).toBeDefined()
        for (const level of ['1', '2', '3'] as const) {
          expect(templates[s.id].levels[level].words[w], `${s.id} L${level} ${w}`).toBeDefined()
        }
      }
    }
  })

  it('maps every Vietnamese case word to English', () => {
    for (const c of cases.filter((x) => x.set === 'B')) {
      const vi = c.words.at(-1)!
      expect(dict.vi_to_en[vi], vi).toBeTruthy()
    }
  })

  it('teaches the English word for a Vietnamese input', () => {
    const c = cases.find((x) => x.id === 'cafe-B-L1')!
    const lesson = buildBaselineLesson(c, dict, templates)
    const v = lesson.vocab.find((x) => x.input === 'hóa đơn')!
    expect(v.word).toBe('receipt')
    expect(lesson.lines.some((l) => l.text.includes('receipt'))).toBe(true)
  })

  it('is deterministic', () => {
    const c = cases[5]
    expect(buildBaselineLesson(c, dict, templates)).toEqual(buildBaselineLesson(c, dict, templates))
  })

  it('uses the same guest label as the LLM and ends on the guest, with at least 6 lines', () => {
    for (const c of cases) {
      const lesson = buildBaselineLesson(c, dict, templates)
      expect(lesson.lines.some((l) => l.speaker_vi === 'Hành khách'), c.id).toBe(false)
      expect(lesson.lines.at(-1)!.speaker_vi, c.id).toBe(templates[c.scenarioId].roles.guest)
      expect(lesson.lines.length, c.id).toBeGreaterThanOrEqual(6)
    }
  })

  it('never glues a Vietnamese subject onto an English verb', () => {
    const bad = /\b(Tôi|Chị|Anh) (have|see)\b|\bcó (a|pain)\b|\btrả by\b|nay very \{w\}|đến the \{w\}/
    for (const place of Object.values(templates))
      for (const lv of Object.values(place.levels))
        for (const line of [...lv.opening, ...lv.closing, lv.fallback, ...Object.values(lv.words)])
          expect(bad.test(line.text), line.text).toBe(false)
  })
})
