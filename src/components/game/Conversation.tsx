import { useEffect, useRef, useState } from 'react'
import { SpeakButton } from '@/components/SpeakButton'
import { splitHighlights } from '@/lib/highlight'
import type { Lesson } from '@/shared/types'
import { SpeechBubble } from './SpeechBubble'
import { PrimaryButton } from './ui'

const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'BUTTON'].includes(t.tagName) || t.isContentEditable)

export function HighlightedText({ text, words }: { text: string; words: string[] }) {
  return (
    <>
      {splitHighlights(text, words).map((seg, j) =>
        seg.word ? (
          <span key={j} className="whitespace-nowrap">
            <mark className="rounded-md bg-[#FFD45C] px-1 font-bold text-[#2B1D16]">
              {seg.text}
            </mark>
            <SpeakButton text={seg.word} />
          </span>
        ) : (
          <span key={j}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export function Conversation(props: { lesson: Lesson; hostAvatar: string; playerAvatar: string; onDone: () => void }) {
  const { lesson } = props
  const [shown, setShown] = useState(1)
  const allShown = shown >= lesson.lines.length
  const words = lesson.vocab.map((v) => v.word)
  const hostSpeaker = lesson.lines[0]?.speaker_vi
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
            side={isHost ? 'host' : 'player'}
            avatar={isHost ? props.hostAvatar : props.playerAvatar}
          >
            <p>
              <HighlightedText text={line.text} words={words} />
            </p>
            {line.translation_vi && <p className="mt-0.5 text-sm italic opacity-75">{line.translation_vi}</p>}
          </SpeechBubble>
        )
      })}
      {allShown && (
        <SpeechBubble speaker={hostSpeaker ?? ''} side="host" avatar={props.hostAvatar}>
          <p>Cùng xem lại các từ nhé!</p>
        </SpeechBubble>
      )}
      <PrimaryButton ref={nextRef} size="lg" className="sticky bottom-4 w-full" onClick={() => advanceRef.current()}>
        Tiếp ▸
      </PrimaryButton>
    </div>
  )
}
