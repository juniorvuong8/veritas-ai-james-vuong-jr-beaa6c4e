import { useState, type FormEvent } from 'react'
import { addWord, canSubmit, toggleWord } from '@/lib/selection'
import { cn } from '@/lib/utils'
import { getScenario, normalizeWord } from '@/shared/scenarios'
import { MAX_WORDS, MIN_WORDS, isValidWord } from '@/shared/validate-request'
import { PrimaryButton, SecondaryButton } from './ui'

const key = (w: string) => normalizeWord(w).toLowerCase()
const INVALID_WORD = 'Từ chỉ được dùng chữ cái, khoảng trắng, dấu gạch ngang hoặc dấu nháy (tối đa 30 ký tự).'

export function WordPicker(props: {
  scenarioId: string
  initialWords?: string[]
  submitLabel: string
  onSubmit: (words: string[]) => void
}) {
  const [words, setWords] = useState<string[]>(props.initialWords ?? [])
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState<string | undefined>()

  const suggested = getScenario(props.scenarioId)?.suggestedWords ?? []
  const customWords = words.filter((w) => !suggested.some((s) => key(s) === key(w)))
  const isSelected = (w: string) => words.some((s) => key(s) === key(w))

  function addCustom(e: FormEvent) {
    e.preventDefault()
    if (!isValidWord(normalizeWord(custom))) {
      setCustomError(INVALID_WORD)
      return
    }
    setCustomError(undefined)
    setWords((ws) => addWord(ws, custom))
    setCustom('')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#2B1D16]/60">
        Đã chọn {words.length}/{MAX_WORDS} từ (cần ít nhất {MIN_WORDS})
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
              aria-label={`Bỏ ${w}`}
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
          placeholder="Thêm từ của bạn (tiếng Anh hoặc tiếng Việt)"
          maxLength={30}
        />
        <SecondaryButton type="submit" disabled={!custom.trim() || words.length >= MAX_WORDS}>
          Thêm
        </SecondaryButton>
      </form>
      {customError && (
        <p role="alert" className="text-sm font-semibold text-[#C2412C]">
          {customError}
        </p>
      )}
      <PrimaryButton size="lg" arrow className="w-full" disabled={!canSubmit(words)} onClick={() => props.onSubmit(words)}>
        {props.submitLabel}
      </PrimaryButton>
    </div>
  )
}
