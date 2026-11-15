import { useState } from 'react'
import { Bi, Gloss } from '@/lib/debug'
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
  /** False on a retake: no coins, so no coin badge. */
  rewards?: boolean
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
        <p className="text-sm font-bold text-[#2B1D16]/60">
          <Bi vi={`Câu ${index + 1} / ${quiz.length}`} en={`Question ${index + 1} / ${quiz.length}`} />
        </p>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#2B1D16]/10" aria-hidden>
          <div
            className="h-full rounded-full bg-[#2F7F7A] transition-all"
            style={{ width: `${((index + (answered ? 1 : 0)) / quiz.length) * 100}%` }}
          />
        </div>
      </div>
      <SpeechBubble speaker="" side="host" avatar={props.hostAvatar}>
        <p className="font-medium">
          <Bi vi={q.question_vi} en={q.question_en} />
        </p>
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
        <SpeechBubble
          speaker=""
          side="host"
          avatar={props.hostAvatar}
          badge={
            right && props.rewards !== false && (
              <span className="inline-block animate-bounce rounded-full bg-[#FFD45C] px-2 py-0.5 text-sm font-extrabold whitespace-nowrap text-[#2B1D16] shadow-[0_2px_0_rgba(43,29,22,0.25)] ring-2 ring-white">{`+${COINS_PER_CORRECT} 🪙`}</span>
            )
          }
        >
          <p className={cn('font-extrabold', right ? 'text-[#2F7F7A]' : 'text-[#C2412C]')}>
            {right ? 'Đúng rồi!' : 'Chưa đúng.'}
            <Gloss text={right ? 'Correct!' : 'Not quite.'} />
          </p>
          <p className="text-sm">
            <Bi vi={q.explanation_vi} en={q.explanation_en} />
          </p>
        </SpeechBubble>
      )}
      {answered && (
        <PrimaryButton
          size="lg"
          arrow
          className="w-full"
          onClick={() => (isLast ? props.onFinish(scoreQuiz(quiz, answers)) : setIndex(index + 1))}
        >
          {isLast ? <Bi vi="Xem kết quả" en="See results" /> : <Bi vi="Câu tiếp theo" en="Next question" />}
        </PrimaryButton>
      )}
    </div>
  )
}
