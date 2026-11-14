import { useState } from 'react'
import { scoreQuiz } from '@/lib/quiz'
import { cn } from '@/lib/utils'
import { COINS_PER_CORRECT } from '@/game/state'
import type { QuizQuestion } from '@/shared/types'
import { SpeechBubble } from './SpeechBubble'
import { PrimaryButton } from './ui'

export function HostQuiz(props: {
  quiz: QuizQuestion[]
  hostAvatar: string
  onCorrect: () => void
  onFinish: (result: { correct: number; total: number }) => void
}) {
  const { quiz } = props
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const q = quiz[index]
  const chosen = answers[index]
  const answered = chosen !== undefined
  const right = answered && chosen === q.answer_index
  const isLast = index === quiz.length - 1

  function choose(i: number) {
    if (answered) return
    setAnswers((a) => Object.assign([...a], { [index]: i }))
    if (i === q.answer_index) props.onCorrect()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#2B1D16]/60">{`Câu ${index + 1} / ${quiz.length}`}</p>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#2B1D16]/10" aria-hidden>
          <div
            className="h-full rounded-full bg-[#2F7F7A] transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / quiz.length) * 100}%` }}
          />
        </div>
      </div>
      <SpeechBubble speaker="" side="host" avatar={props.hostAvatar}>
        <p className="font-medium">{q.question_vi}</p>
      </SpeechBubble>
      <div className="grid gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => choose(i)}
            className={cn(
              'rounded-2xl border-2 bg-white px-4 py-3 text-left text-lg font-bold transition-all disabled:cursor-default',
              !answered && 'border-[#2B1D16]/15 hover:-translate-y-0.5 hover:border-[#2B1D16] hover:shadow-[3px_3px_0_#2B1D16]',
              answered && i === q.answer_index && 'border-[#2F7F7A] bg-[#2F7F7A]/10',
              answered && i === chosen && i !== q.answer_index && 'border-[#E8553D] bg-[#E8553D]/10',
              answered && i !== q.answer_index && i !== chosen && 'border-[#2B1D16]/10 opacity-60',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <SpeechBubble speaker="" side="host" avatar={props.hostAvatar}>
          <p className={cn('font-extrabold', right ? 'text-[#2F7F7A]' : 'text-[#C2412C]')}>
            {right ? 'Đúng rồi!' : 'Chưa đúng.'}
            {right && (
              <span className="ml-2 inline-block animate-bounce rounded-full bg-[#FFD45C] px-2 text-[#2B1D16]">{`+${COINS_PER_CORRECT} 🪙`}</span>
            )}
          </p>
          <p className="text-sm">{q.explanation_vi}</p>
        </SpeechBubble>
      )}
      {answered && (
        <PrimaryButton
          size="lg"
          arrow
          className="w-full"
          onClick={() => (isLast ? props.onFinish(scoreQuiz(quiz, answers)) : setIndex(index + 1))}
        >
          {isLast ? 'Xem kết quả' : 'Câu tiếp theo'}
        </PrimaryButton>
      )}
    </div>
  )
}
