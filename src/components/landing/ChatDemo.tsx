import { useEffect, useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { SpeakButton } from '@/components/SpeakButton'
import { FALLBACK_LESSONS } from '@/data/fallback-lessons'
import { splitHighlights } from '@/lib/highlight'
import { cn } from '@/lib/utils'
import { COPY, DEMO_TRANSLATIONS_EN, DEMO_VOCAB_EN, type Lang } from './copy'

// The demo plays the real level-1 sample lesson, so it shows exactly what the game makes.
const LESSON = FALLBACK_LESSONS[1]
const WORDS = LESSON.vocab.map((v) => v.word)
const HOST = LESSON.lines[0].speaker_vi
const STEP_MS = 1500

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ChatDemo({ lang }: { lang: Lang }) {
  const t = COPY[lang]
  const [reduced] = useState(prefersReducedMotion)
  const [shown, setShown] = useState(() => (reduced ? LESSON.lines.length : 0))
  const [selected, setSelected] = useState<string | undefined>()
  const done = shown >= LESSON.lines.length

  useEffect(() => {
    if (done) return
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 700 : STEP_MS)
    return () => clearTimeout(id)
  }, [shown, done])

  function replay() {
    setSelected(undefined)
    setShown(reduced ? LESSON.lines.length : 0)
  }

  const vocab = LESSON.vocab.find((v) => v.word === selected)
  const nextIsHost = !done && LESSON.lines[shown].speaker_vi === HOST

  return (
    <div className="chat-card relative w-full max-w-md rounded-[28px] bg-white/95 p-4 shadow-[0_30px_60px_-20px_rgba(43,29,22,0.45)] ring-1 ring-[#2B1D16]/10 backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-[#2B1D16]/10 pb-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-full bg-[#2F7F7A]/15 text-lg" aria-hidden>
            ☕
          </span>
          {t.demoTitle}
        </div>
        <button
          type="button"
          onClick={replay}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[#2B1D16]/60 hover:bg-[#2B1D16]/5 hover:text-[#2B1D16]"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {t.demoReplay}
        </button>
      </div>

      <ol className="flex min-h-[300px] flex-col gap-2.5" aria-live="polite">
        {LESSON.lines.slice(0, shown).map((line, i) => {
          const host = line.speaker_vi === HOST
          return (
            <li key={i} className={cn('bubble-in flex items-end gap-2', host ? 'justify-start' : 'flex-row-reverse')}>
              <span className="mb-1 text-xl" aria-hidden>
                {host ? '🧑‍🍳' : '🙋‍♀️'}
              </span>
              <div className={cn('max-w-[78%]', host ? '' : 'text-right')}>
                <div className="mb-0.5 px-1 text-[11px] font-medium text-[#2B1D16]/50">
                  {lang === 'en' ? (host ? 'Barista' : 'Customer') : line.speaker_vi}
                </div>
                <p
                  className={cn(
                    'inline-block rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed',
                    host ? 'rounded-bl-md bg-[#F4EBDD] text-[#2B1D16]' : 'rounded-br-md bg-[#E8553D] text-white',
                  )}
                >
                  {splitHighlights(line.text, WORDS).map((seg, j) =>
                    seg.word ? (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setSelected(seg.word)}
                        aria-pressed={selected === seg.word}
                        className={cn(
                          'word-chip rounded-md px-1 font-bold text-[#2B1D16] transition-transform hover:-translate-y-0.5',
                          selected === seg.word ? 'bg-[#FFD45C] ring-2 ring-[#2B1D16]' : 'bg-[#FFD45C]',
                        )}
                      >
                        {seg.text}
                      </button>
                    ) : (
                      <span key={j}>{seg.text}</span>
                    ),
                  )}
                </p>
                {lang === 'en' && (
                  <div className="mt-0.5 px-1 text-left text-xs text-[#2B1D16]/50 italic">{DEMO_TRANSLATIONS_EN[i]}</div>
                )}
              </div>
            </li>
          )
        })}
        {!done && shown > 0 && (
          <li className={cn('flex items-end gap-2', nextIsHost ? '' : 'flex-row-reverse')} aria-hidden>
            <span className="mb-1 text-xl opacity-60">{nextIsHost ? '🧑‍🍳' : '🙋‍♀️'}</span>
            <span className="typing inline-flex gap-1 rounded-2xl bg-[#F4EBDD] px-3.5 py-3">
              <i />
              <i />
              <i />
            </span>
          </li>
        )}
      </ol>

      <div className="mt-3 min-h-[92px]">
        {vocab ? (
          <div className="bubble-in rounded-2xl border-2 border-[#2B1D16] bg-[#FFF6E0] p-3.5 shadow-[4px_4px_0_#2B1D16]">
            <div className="flex items-center gap-1 text-lg font-extrabold">
              {vocab.word}
              <SpeakButton text={vocab.word} />
            </div>
            <dl className="mt-1 space-y-0.5 text-sm">
              <div>
                <dt className="inline font-semibold">{t.meaning}: </dt>
                <dd className="inline">{lang === 'en' ? DEMO_VOCAB_EN[vocab.word].meaning : vocab.meaning_vi}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">{t.whenToUse}: </dt>
                <dd className="inline">{lang === 'en' ? DEMO_VOCAB_EN[vocab.word].usage : vocab.usage_vi}</dd>
              </div>
            </dl>
          </div>
        ) : (
          shown > 0 && (
            <p className="flex items-center justify-center gap-1.5 pt-6 text-sm font-medium text-[#2B1D16]/60">
              <Sparkles className="size-4 text-[#E8A21C]" aria-hidden />
              {t.demoTapHint}
            </p>
          )
        )}
      </div>
    </div>
  )
}
