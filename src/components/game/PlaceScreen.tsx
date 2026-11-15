import { useState } from 'react'
import { FALLBACK_LESSONS } from '@/data/fallback-lessons'
import { PLACE_ART, PLAYER_EMOJI } from '@/game/art'
import { COINS_PER_CORRECT, type LearnedWord } from '@/game/state'
import { requestLesson, type LessonResult } from '@/lib/api'
import { ERROR_MESSAGES_EN } from '@/lib/error-messages-en'
import { Bi, useDebug } from '@/lib/debug'
import { getScenario } from '@/shared/scenarios'
import type { Lesson, LessonRequest, Level } from '@/shared/types'
import { Conversation } from './Conversation'
import { HostQuiz } from './HostQuiz'
import { SpeechBubble } from './SpeechBubble'
import { WordNotes } from './WordNotes'
import { WordPicker } from './WordPicker'
import { Awning, GhostButton, PrimaryButton, SecondaryButton } from './ui'

type ErrorCode = Extract<LessonResult, { ok: false }>['code']
type Phase =
  | { name: 'pick' }
  | { name: 'loading' }
  | { name: 'error'; code: ErrorCode; message_vi: string }
  | { name: 'talk' | 'notes' | 'quiz'; lesson: Lesson; isSample: boolean }
  | { name: 'done'; correct: number; total: number }

export function PlaceScreen(props: {
  placeId: string
  level: Level
  initialWords: string[]
  /** Words learned before; shown greyed out in the word picker. */
  learnedWords?: LearnedWord[]
  onWordsChosen: (words: string[]) => void
  /** Called with the lesson's words once the quiz is finished. */
  onLearned?: (vocab: Lesson['vocab']) => void
  onCorrect: () => void
  onFinish: () => void
  onLeave: () => void
}) {
  const scenario = getScenario(props.placeId)!
  const art = PLACE_ART[props.placeId]
  const [phase, setPhase] = useState<Phase>({ name: 'pick' })
  const [words, setWords] = useState<string[]>(props.initialWords)
  const [earned, setEarned] = useState(0)
  const debug = useDebug()

  async function generate(chosen: string[]) {
    const req: LessonRequest = { scenarioId: props.placeId, words: chosen, level: props.level, ...(debug ? { debug } : {}) }
    setPhase({ name: 'loading' })
    const result = await requestLesson(req)
    setPhase(
      result.ok
        ? { name: 'talk', lesson: result.lesson, isSample: false }
        : { name: 'error', code: result.code, message_vi: result.message_vi },
    )
  }

  const host = (text: string, en?: string) => (
    <SpeechBubble speaker="" side="host" avatar={art.host}>
      <p>
        <Bi vi={text} en={en} />
      </p>
    </SpeechBubble>
  )

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#2B1D16]/10">
        <Awning color={art.color} />
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <h2 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-extrabold sm:text-2xl">
            <span className="text-3xl sm:text-4xl" aria-hidden>
              {art.sign}
            </span>
            <span>
              <Bi vi={scenario.name_vi} en={scenario.name_en} />
            </span>
            {'lesson' in phase && phase.isSample && (
              <span className="rounded-full bg-[#FFD45C] px-2.5 py-0.5 text-xs font-bold">
                <Bi vi="Bài mẫu" en="Sample lesson" />
              </span>
            )}
          </h2>
          {phase.name !== 'done' && <GhostButton onClick={props.onLeave}>
              <Bi vi="Rời đi" en="Leave" />
            </GhostButton>}
        </div>
      </header>

      {phase.name === 'pick' && (
        <div className="space-y-4">
          {host(art.greeting_vi, art.greeting_en)}
          <WordPicker
            scenarioId={props.placeId}
            initialWords={words}
            learnedWords={props.learnedWords}
            submitLabel={<Bi vi="Bắt đầu hội thoại" en="Start the conversation" />}
            onSubmit={(chosen) => {
              setWords(chosen)
              props.onWordsChosen(chosen)
              void generate(chosen)
            }}
          />
        </div>
      )}

      {phase.name === 'loading' && (
        <div role="status">
          <SpeechBubble speaker="" side="host" avatar={art.host}>
            <p className="flex items-center gap-2">
              <span className="typing inline-flex gap-1" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span>
                <Bi vi="Đang chuẩn bị…" en="Getting ready…" />
              </span>
            </p>
          </SpeechBubble>
        </div>
      )}

      {phase.name === 'error' && (
        <div className="space-y-4" role="alert">
          {host(phase.message_vi, ERROR_MESSAGES_EN[phase.code])}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {phase.code !== 'bad_request' && phase.code !== 'inappropriate' && <PrimaryButton onClick={() => generate(words)}>
                <Bi vi="Thử lại" en="Try again" />
              </PrimaryButton>}
            <SecondaryButton
              onClick={() => setPhase({ name: 'talk', lesson: FALLBACK_LESSONS[props.level], isSample: true })}
            >
              <Bi vi="Xem bài mẫu" en="View sample lesson" />
            </SecondaryButton>
            <GhostButton onClick={() => setPhase({ name: 'pick' })}>
              <Bi vi="Chọn lại từ" en="Choose words again" />
            </GhostButton>
          </div>
        </div>
      )}

      {phase.name === 'talk' && (
        <Conversation
          lesson={phase.lesson}
          hostAvatar={art.host}
          playerAvatar={PLAYER_EMOJI}
          onDone={() => setPhase({ ...phase, name: 'notes' })}
        />
      )}

      {phase.name === 'notes' && (
        <WordNotes lesson={phase.lesson} onStartQuiz={() => setPhase({ ...phase, name: 'quiz' })} />
      )}

      {phase.name === 'quiz' && (
        <HostQuiz
          quiz={phase.lesson.quiz}
          hostAvatar={art.host}
          onCorrect={() => {
            setEarned((n) => n + COINS_PER_CORRECT)
            props.onCorrect()
          }}
          onFinish={(r) => {
            props.onLearned?.(phase.lesson.vocab)
            setPhase({ name: 'done', ...r })
          }}
        />
      )}

      {phase.name === 'done' && (
        <div className="space-y-4 rounded-3xl bg-white p-6 text-center ring-1 ring-[#2B1D16]/10">
          <p className="text-2xl font-extrabold tracking-tight">
            <Bi
              vi={`Bạn trả lời đúng ${phase.correct}/${phase.total} câu`}
              en={`You got ${phase.correct}/${phase.total} right`}
            />
          </p>
          <p className="inline-block rounded-full bg-[#FFF3D6] px-4 py-1 text-lg font-bold">{`+${earned} 🪙`}</p>
          <div
            className="mx-auto flex size-28 animate-[stamp_400ms_ease-out] items-center justify-center rounded-full border-4 border-dashed text-6xl"
            style={{ borderColor: art.color, background: `${art.color}18` }}
          >
            {art.sign}
          </div>
          <p className="text-sm font-semibold text-[#2B1D16]/60">
            <Bi vi="Bạn đã nhận được con dấu!" en="You earned a stamp!" />
          </p>
          <PrimaryButton size="lg" arrow className="w-full" onClick={props.onFinish}>
            <Bi vi="Về thành phố" en="Back to the city" />
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
