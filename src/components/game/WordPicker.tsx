import { useState, type FormEvent, type ReactNode } from 'react'
import { Bi, useBiText } from '@/lib/debug'
import { addWord, canSubmit, toggleWord } from '@/lib/selection'
import { cn } from '@/lib/utils'
import { getScenario, normalizeWord } from '@/shared/scenarios'
import { MAX_WORDS, MIN_WORDS, wordProblem, type WordProblem } from '@/shared/validate-request'
import type { WordFitResult } from '@/shared/word-fit'
import { requestWordFit } from '@/lib/word-fit-api'
import { PrimaryButton, SecondaryButton } from './ui'

const key = (w: string) => normalizeWord(w).toLowerCase()
const PROBLEM_MESSAGES: Record<WordProblem, { vi: string; en: string }> = {
  chars: {
    vi: 'Từ chỉ được dùng chữ cái, khoảng trắng, dấu gạch ngang hoặc dấu nháy (tối đa 30 ký tự).',
    en: 'Words can only use letters, spaces, hyphens or apostrophes (up to 30 characters).',
  },
  too_long: {
    vi: 'Hãy nhập một hoặc hai từ thôi, không phải cả câu.',
    en: 'Please enter just one or two words, not a whole sentence.',
  },
}

type CustomError = { vi: string; en: string }

export function WordPicker(props: {
  scenarioId: string
  initialWords?: string[]
  submitLabel: ReactNode
  onSubmit: (words: string[]) => void
  /** Asks whether a custom word fits this place. Defaults to the AI check on the server. */
  checkWord?: (word: string) => Promise<WordFitResult>
}) {
  const [words, setWords] = useState<string[]>(props.initialWords ?? [])
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState<CustomError | undefined>()
  const [checking, setChecking] = useState(false)
  const biText = useBiText()

  const suggested = getScenario(props.scenarioId)?.suggestedWords ?? []
  const customWords = words.filter((w) => !suggested.some((s) => key(s) === key(w)))
  const isSelected = (w: string) => words.some((s) => key(s) === key(w))

  async function addCustom(e: FormEvent) {
    e.preventDefault()
    if (checking) return
    const word = normalizeWord(custom)
    const problem = wordProblem(word)
    if (problem) {
      setCustomError(PROBLEM_MESSAGES[problem])
      return
    }
    setCustomError(undefined)
    // Suggested and already-chosen words are known to fit; only new words go to the AI.
    if (!isSelected(word) && !suggested.some((s) => key(s) === key(word))) {
      setChecking(true)
      const check = props.checkWord ?? ((w: string) => requestWordFit(props.scenarioId, w))
      const verdict = await check(word)
      setChecking(false)
      if (!verdict.fits) {
        setCustomError({ vi: verdict.reason_vi, en: verdict.reason_en })
        return
      }
    }
    setWords((ws) => addWord(ws, word))
    setCustom('')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#2B1D16]/60">
        <Bi
          vi={`Đã chọn ${words.length}/${MAX_WORDS} từ (cần ít nhất ${MIN_WORDS})`}
          en={`Chosen ${words.length}/${MAX_WORDS} words (need at least ${MIN_WORDS})`}
        />
      </p>
      <div className="flex flex-wrap gap-2">
        {suggested.map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={isSelected(w)}
            onClick={() => setWords((ws) => toggleWord(ws, w))}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-bold transition-all sm:text-base',
              isSelected(w)
                ? 'bg-[#2B1D16] text-white shadow-[0_3px_0_#000]'
                : 'bg-[#FFF3D6] text-[#2B1D16] hover:-translate-y-0.5 hover:bg-[#FFE8B0]',
            )}
          >
            {w}
          </button>
        ))}
        {customWords.map((w) => (
          <span
            key={w}
            className="flex items-center gap-1 rounded-full bg-[#2B1D16] px-3.5 py-1.5 text-sm font-bold text-white shadow-[0_3px_0_#000] sm:text-base"
          >
            <span>{w}</span>
            <button
              type="button"
              aria-label={biText(`Bỏ ${w}`, `Remove ${w}`)}
              onClick={() => setWords((ws) => ws.filter((x) => x !== w))}
              className="ml-1 opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={addCustom} className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-full border-2 border-[#2B1D16]/15 bg-white px-4 py-2 text-base outline-none placeholder:text-[#2B1D16]/40 focus:border-[#2B1D16] aria-invalid:border-[#E8553D]"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            setCustomError(undefined)
          }}
          aria-invalid={customError ? true : undefined}
          readOnly={checking}
          placeholder={biText('Thêm từ của bạn (tiếng Anh hoặc tiếng Việt)', 'Add your own word (English or Vietnamese)')}
          maxLength={30}
        />
        <SecondaryButton type="submit" disabled={checking || !custom.trim() || words.length >= MAX_WORDS}>
          {checking ? <Bi vi="Đang kiểm tra…" en="Checking…" /> : <Bi vi="Thêm" en="Add" />}
        </SecondaryButton>
      </form>
      {customError && (
        <p role="alert" className="text-sm font-semibold text-[#C2412C]">
          <Bi vi={customError.vi} en={customError.en} />
        </p>
      )}
      <PrimaryButton size="lg" arrow className="w-full" disabled={!canSubmit(words)} onClick={() => props.onSubmit(words)}>
        {props.submitLabel}
      </PrimaryButton>
    </div>
  )
}
