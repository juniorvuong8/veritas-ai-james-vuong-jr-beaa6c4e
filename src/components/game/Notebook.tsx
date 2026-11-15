import { useEffect, useState } from 'react'
import { SpeakButton } from '@/components/SpeakButton'
import { PLACE_ART } from '@/game/art'
import { PLACE_IDS, isStarred, type LearnedWord } from '@/game/state'
import { Bi, Gloss, useBiText } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { getScenario } from '@/shared/scenarios'
import { StarButton } from './StarButton'

/** The learner's word notebook: every word learned so far, grouped by the place it was learned in. */
export function Notebook(props: {
  words: LearnedWord[]
  /** Starred words (as word keys). */
  starred?: string[]
  onToggleStar?: (word: string) => void
  onClose: () => void
}) {
  const biText = useBiText()
  const { onClose } = props
  const starred = props.starred ?? []
  const [onlyStarred, setOnlyStarred] = useState(false)
  const starredWords = props.words.filter((w) => isStarred(starred, w.word))
  const shown = onlyStarred ? starredWords : props.words

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const groups = PLACE_IDS.map((id) => ({ id, words: shown.filter((w) => w.placeId === id) })).filter(
    (g) => g.words.length > 0,
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notebook-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2B1D16]/50 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bubble-in flex max-h-[85svh] w-full max-w-lg flex-col rounded-[28px] border-2 border-[#2B1D16] bg-[#FFF8EE] text-[#2B1D16] shadow-[6px_6px_0_#2B1D16]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#2B1D16]/10 px-5 py-4">
          <h2 id="notebook-title" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span aria-hidden>📒</span>
            <Bi vi="Sổ từ của bạn" en="Your word notebook" />
            <span className="rounded-full bg-[#2B1D16] px-2.5 py-0.5 text-sm text-white">{props.words.length}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={biText('Đóng sổ từ', 'Close the notebook')}
            className="grid size-9 shrink-0 place-items-center rounded-full text-xl hover:bg-[#2B1D16]/10"
          >
            ×
          </button>
        </div>

        <div role="group" aria-label={biText('Hiển thị', 'Show')} className="flex gap-2 px-5 pt-3">
          {[
            { only: false, vi: 'Tất cả', en: 'All', count: props.words.length },
            { only: true, vi: '⭐ Đã gắn sao', en: '⭐ Starred', count: starredWords.length },
          ].map((tab) => (
            <button
              key={String(tab.only)}
              type="button"
              aria-pressed={onlyStarred === tab.only}
              onClick={() => setOnlyStarred(tab.only)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-bold transition-colors',
                onlyStarred === tab.only ? 'bg-[#2B1D16] text-white' : 'bg-[#2B1D16]/8 text-[#2B1D16]/70 hover:bg-[#2B1D16]/15',
              )}
            >
              {`${biText(tab.vi, tab.en)} (${tab.count})`}
            </button>
          ))}
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          {onlyStarred && groups.length === 0 && (
            <p className="py-6 text-center text-sm font-semibold text-[#2B1D16]/60">
              <Bi
                vi="Chưa có từ nào được gắn sao. Bấm ☆ bên cạnh một từ để gắn sao."
                en="No starred words yet. Tap ☆ next to a word to star it."
              />
            </p>
          )}
          {!onlyStarred && groups.length === 0 && (
            <p className="py-6 text-center text-sm font-semibold text-[#2B1D16]/60">
              <Bi
                vi="Chưa có từ nào. Hoàn thành một bài ở một địa điểm để ghi từ vào sổ nhé!"
                en="No words yet. Finish a lesson at a place to add its words here!"
              />
            </p>
          )}
          {groups.map((g) => {
            const art = PLACE_ART[g.id]
            const scenario = getScenario(g.id)
            return (
              <section key={g.id} aria-label={biText(scenario?.name_vi ?? g.id, scenario?.name_en)}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold tracking-wide uppercase">
                  <span aria-hidden>{art.sign}</span>
                  <span style={{ color: art.color }}>
                    <Bi vi={scenario?.name_vi ?? g.id} en={scenario?.name_en} />
                  </span>
                </h3>
                <ul className="grid gap-2">
                  {g.words.map((w) => (
                    <li key={w.word} className="rounded-2xl bg-white p-3 ring-1 ring-[#2B1D16]/10">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex flex-wrap items-center gap-1 font-extrabold">
                          <span className="text-lg">{w.word}</span>
                          <SpeakButton text={w.word} />
                          {w.input.toLowerCase() !== w.word.toLowerCase() && (
                            <span className="text-sm font-semibold text-[#2B1D16]/50">{`(${w.input})`}</span>
                          )}
                        </p>
                        {props.onToggleStar && (
                          <StarButton
                            word={w.word}
                            starred={isStarred(starred, w.word)}
                            onToggle={() => props.onToggleStar?.(w.word)}
                            className="-mt-1 -mr-1"
                          />
                        )}
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold">{w.meaning_vi}</span>
                        <Gloss text={w.meaning_en} />
                      </p>
                      <p className="mt-0.5 text-sm text-[#2B1D16]/70">
                        {w.usage_vi}
                        <Gloss text={w.usage_en} />
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
