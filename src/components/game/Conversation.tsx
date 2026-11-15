import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen } from 'lucide-react'
import { SpeakButton } from '@/components/SpeakButton'
import { Bi, Gloss } from '@/lib/debug'
import { splitHighlights } from '@/lib/highlight'
import { normalizeWord } from '@/shared/scenarios'
import type { Lesson } from '@/shared/types'
import { SpeechBubble } from './SpeechBubble'
import { PrimaryButton } from './ui'

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'BUTTON'].includes(t.tagName) || t.isContentEditable)

/** A word's meaning, looked up by the word as highlighted. */
export type Meanings = Record<string, { vi: string; en?: string }>

const meaningKey = (w: string) => normalizeWord(w).toLowerCase()

/** Builds the lookup from a list of words and their Vietnamese meanings. */
export function toMeanings(items: { word: string; meaning_vi: string; meaning_en?: string }[]): Meanings {
  return Object.fromEntries(items.map((v) => [meaningKey(v.word), { vi: v.meaning_vi, en: v.meaning_en }]))
}

const DROPDOWN_WIDTH = 208

/**
 * A book icon after an English word that opens its Vietnamese meaning in a small dropdown.
 * The dropdown is drawn on the page itself (a portal), so a bubble's animation or the sticky Next button can't cover it.
 */
function DefinitionButton({ word, meaning }: { word: string; meaning: { vi: string; en?: string } }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const dropdown = useRef<HTMLSpanElement>(null)
  const open = pos !== null

  function toggle() {
    if (open) return setPos(null)
    const r = button.current!.getBoundingClientRect()
    const left = Math.min(Math.max(8, r.left + r.width / 2 - DROPDOWN_WIDTH / 2), window.innerWidth - DROPDOWN_WIDTH - 8)
    setPos({ top: r.bottom + 6, left })
  }

  useEffect(() => {
    if (!open) return
    const close = () => setPos(null)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!button.current?.contains(t) && !dropdown.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Nghĩa của "${word}"`}
        onClick={toggle}
        className="ml-0.5 inline-flex items-center align-middle text-[#2F7F7A] hover:opacity-70"
      >
        <BookOpen className="size-4" aria-hidden />
      </button>
      {pos &&
        createPortal(
          <span
            ref={dropdown}
            id={id}
            role="note"
            // Clicks inside the dropdown don't advance the conversation (React events bubble through portals).
            onClick={(e) => e.stopPropagation()}
            style={{ top: pos.top, left: pos.left, width: DROPDOWN_WIDTH }}
            className="bubble-in fixed z-50 block rounded-2xl border-2 border-[#2B1D16] bg-white px-3 py-2 text-left text-sm whitespace-normal text-[#2B1D16] shadow-[3px_3px_0_#2B1D16]"
          >
            <span className="block font-extrabold">{word}</span>
            <span className="block">{meaning.vi}</span>
            <Gloss text={meaning.en} />
          </span>,
          document.body,
        )}
    </>
  )
}

export function HighlightedText({ text, words, meanings }: { text: string; words: string[]; meanings?: Meanings }) {
  return (
    <>
      {splitHighlights(text, words).map((seg, j) => {
        if (!seg.word) return <span key={j}>{seg.text}</span>
        const meaning = meanings?.[meaningKey(seg.word)]
        return (
          <span key={j} className="whitespace-nowrap">
            <mark className="rounded-md bg-[#FFD45C] px-1 font-bold text-[#2B1D16]">
              {seg.text}
            </mark>
            <SpeakButton text={seg.word} />
            {meaning && <DefinitionButton word={seg.word} meaning={meaning} />}
          </span>
        )
      })}
    </>
  )
}

export function Conversation(props: { lesson: Lesson; hostAvatar: string; playerAvatar: string; onDone: () => void }) {
  const { lesson } = props
  const [shown, setShown] = useState(1)
  const allShown = shown >= lesson.lines.length
  const words = lesson.vocab.map((v) => v.word)
  const meanings = toMeanings(lesson.vocab)
  const hostSpeaker = lesson.lines[0]?.speaker_vi
  const hostSpeakerEn = lesson.lines[0]?.speaker_en
  const mapped = lesson.vocab.filter((v) => v.input.toLowerCase() !== v.word.toLowerCase())
  const nextRef = useRef<HTMLButtonElement>(null)

  const advanceRef = useRef(() => {})
  advanceRef.current = () => (allShown ? props.onDone() : setShown((n) => n + 1))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'Enter' || e.key === ' ') && !isTypingTarget(e.target)) {
        e.preventDefault()
        advanceRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    nextRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [shown])

  return (
    <div
      className="space-y-3"
      onClick={(e) => {
        // Tapping the conversation advances it; buttons (🔊, Tiếp) handle their own clicks.
        if (!(e.target as HTMLElement).closest('button')) advanceRef.current()
      }}
    >
      {mapped.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-sm font-semibold">
          {mapped.map((v) => (
            <li key={v.input} className="rounded-full bg-[#FFF3D6] px-3 py-1">{`${v.input} → ${v.word}`}</li>
          ))}
        </ul>
      )}
      {lesson.lines.slice(0, shown).map((line, i) => {
        const isHost = line.speaker_vi === hostSpeaker
        return (
          <SpeechBubble
            key={i}
            speaker={line.speaker_vi}
            speakerEn={line.speaker_en}
            side={isHost ? 'host' : 'player'}
            avatar={isHost ? props.hostAvatar : props.playerAvatar}
          >
            <p>
              <HighlightedText text={line.text} words={words} meanings={meanings} />
              {line.text_en !== line.text && <Gloss text={line.text_en} />}
            </p>
            {line.translation_vi && <p className="mt-0.5 text-sm italic opacity-75">{line.translation_vi}</p>}
          </SpeechBubble>
        )
      })}
      {allShown && (
        <SpeechBubble speaker={hostSpeaker ?? ''} speakerEn={hostSpeakerEn} side="host" avatar={props.hostAvatar}>
          <p>
            <Bi vi="Cùng xem lại các từ nhé!" en="Let's review the words!" />
          </p>
        </SpeechBubble>
      )}
      <PrimaryButton ref={nextRef} size="lg" className="sticky bottom-4 w-full" onClick={() => advanceRef.current()}>
        <Bi vi="Tiếp ▸" en="Next" />
      </PrimaryButton>
    </div>
  )
}
