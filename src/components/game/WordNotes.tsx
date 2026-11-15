import { SpeakButton } from '@/components/SpeakButton'
import { Bi, Gloss } from '@/lib/debug'
import { isStarred } from '@/game/state'
import type { Lesson } from '@/shared/types'
import { StarButton } from './StarButton'
import { PrimaryButton } from './ui'

export function WordNotes(props: {
  lesson: Lesson
  onStartQuiz: () => void
  /** Starred words (as word keys). */
  starred?: string[]
  onToggleStar?: (word: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold">
        <Bi vi="Giải thích từ" en="Word notes" />
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {props.lesson.vocab.map((v) => (
          <div
            key={`${v.input}-${v.word}`}
            className="bubble-in rounded-2xl border-2 border-[#2B1D16] bg-[#FFF6E0] p-4 shadow-[4px_4px_0_#2B1D16]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1 text-lg font-extrabold">
                {v.word} <SpeakButton text={v.word} />
              </p>
              {props.onToggleStar && (
                <StarButton
                  word={v.word}
                  starred={isStarred(props.starred ?? [], v.word)}
                  onToggle={() => props.onToggleStar?.(v.word)}
                  className="-mt-1 -mr-1"
                />
              )}
            </div>
            <dl className="mt-1 space-y-0.5 text-sm">
              <div>
                <dt className="inline font-semibold">Nghĩa: </dt>
                <dd className="inline">{v.meaning_vi}</dd>
                <Gloss text={v.meaning_en && `Meaning: ${v.meaning_en}`} />
              </div>
              <div>
                <dt className="inline font-semibold">Khi nào dùng: </dt>
                <dd className="inline">{v.usage_vi}</dd>
                <Gloss text={v.usage_en && `When to use: ${v.usage_en}`} />
              </div>
            </dl>
          </div>
        ))}
      </div>
      <PrimaryButton size="lg" arrow className="w-full" onClick={props.onStartQuiz}>
        <Bi vi="Làm bài kiểm tra" en="Take the quiz" />
      </PrimaryButton>
    </div>
  )
}
