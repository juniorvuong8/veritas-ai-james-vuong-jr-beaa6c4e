import { SpeakButton } from '@/components/SpeakButton'
import type { Lesson } from '@/shared/types'
import { PrimaryButton } from './ui'

export function WordNotes(props: { lesson: Lesson; onStartQuiz: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold">Giải thích từ</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {props.lesson.vocab.map((v) => (
          <div
            key={`${v.input}-${v.word}`}
            className="bubble-in rounded-2xl border-2 border-[#2B1D16] bg-[#FFF6E0] p-4 shadow-[4px_4px_0_#2B1D16]"
          >
            <p className="flex items-center gap-1 text-lg font-extrabold">
              {v.word} <SpeakButton text={v.word} />
            </p>
            <dl className="mt-1 space-y-0.5 text-sm">
              <div>
                <dt className="inline font-semibold">Nghĩa: </dt>
                <dd className="inline">{v.meaning_vi}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Khi nào dùng: </dt>
                <dd className="inline">{v.usage_vi}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      <PrimaryButton size="lg" arrow className="w-full" onClick={props.onStartQuiz}>
        Làm bài kiểm tra
      </PrimaryButton>
    </div>
  )
}
