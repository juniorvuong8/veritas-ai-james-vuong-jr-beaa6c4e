import { useEffect, useRef, useState } from 'react'
import { BENCH_ART } from '@/game/art'
import { BENCH_REWARD, type BenchStatus, wordKey } from '@/game/state'
import { requestBenchReply, type BenchChatResult } from '@/lib/bench-api'
import { Bi, Gloss, useBiText, useDebug } from '@/lib/debug'
import {
  BENCH_PERSONAS,
  MAX_LEARNER_MESSAGES,
  MAX_MESSAGE_CHARS,
  normalizeTurnText,
  type BenchId,
  type BenchRequest,
  type BenchTarget,
  type BenchTurn,
} from '@/shared/bench'
import type { Level } from '@/shared/types'
import { HighlightedText, toMeanings } from './Conversation'
import { SpeechBubble } from './SpeechBubble'
import { Awning, GhostButton, PrimaryButton } from './ui'

type Line = BenchTurn & { en?: string }
type ErrorCode = Extract<BenchChatResult, { ok: false }>['code']

const LEARNER_EMOJI = '🧑'
const BENCH_COLOR = '#7BAE7F'

/** Bench wording for each failure (the lesson messages mention a sample lesson the bench doesn't have). */
const BENCH_ERRORS: Record<ErrorCode, { vi: string; en: string }> = {
  bad_request: {
    vi: 'Bác chưa đọc được tin nhắn đó. Cháu viết lại theo cách khác nhé!',
    en: "I couldn't read that message. Try writing it another way!",
  },
  inappropriate: {
    vi: 'Mình nói chuyện về chuyện khác nhé!',
    en: "Let's talk about something else!",
  },
  rate_limited: {
    vi: 'Bác đang hơi bận, cháu đợi một chút rồi thử lại nhé.',
    en: "I'm a bit busy right now. Wait a moment and try again.",
  },
  out_of_credits: {
    vi: 'Hôm nay bác không trò chuyện được nữa. Cháu quay lại sau nhé!',
    en: "I can't chat any more right now. Come back later!",
  },
  ai_failed: {
    vi: 'Bác chưa nghĩ ra câu trả lời. Cháu thử lại nhé!',
    en: "I couldn't think of a reply. Please try again!",
  },
  timeout: {
    vi: 'Bác nghĩ lâu quá. Cháu thử lại nhé!',
    en: 'That took too long. Please try again!',
  },
  network: {
    vi: 'Không kết nối được. Cháu kiểm tra mạng rồi thử lại nhé.',
    en: "Couldn't connect. Check your connection and try again.",
  },
}

export function BenchChat(props: {
  benchId: BenchId
  level: Level
  status: BenchStatus
  targets: BenchTarget[]
  /** Called once, just before the first AI call. */
  onStart: () => void
  /** Called once, when the chat ends with every word understood. */
  onReward: () => void
  onLeave: () => void
  requestReply?: (req: BenchRequest) => Promise<BenchChatResult>
}) {
  const persona = BENCH_PERSONAS[props.benchId]
  /** Highlighted wherever they appear in the chat, like the chosen words in a shop conversation. */
  const targetWords = props.targets.map((t) => t.word)
  const meanings = toMeanings(props.targets)
  const art = BENCH_ART[props.benchId]
  const debug = useDebug()
  const biText = useBiText()
  const [lines, setLines] = useState<Line[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  /** A failed turn: `history` is resent by Try again. */
  const [error, setError] = useState<{ code: ErrorCode; history: BenchTurn[] } | null>(null)
  /** A message the server couldn't accept: it was taken back into the text box to rephrase. */
  const [rejected, setRejected] = useState(false)
  /** Signature of the chat so far, from the last reply; sent with the next message. */
  const sig = useRef<string | undefined>(undefined)
  /** Set when the chat has ended: whether every word was understood. */
  const [result, setResult] = useState<{ allUnderstood: boolean } | null>(null)
  /** wordKey → understood at least once in this chat. */
  const understood = useRef<Record<string, boolean>>({})

  const alive = useRef(true)
  const started = useRef(false)
  const rewarded = useRef(false)
  const send = props.requestReply ?? requestBenchReply
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: 'end' })
  }, [lines, pending, error, rejected, result])

  function leave() {
    alive.current = false
    props.onLeave()
  }

  async function ask(history: BenchTurn[]) {
    setError(null)
    setRejected(false)
    setPending(true)
    const res = await send({
      benchId: props.benchId,
      level: props.level,
      targets: props.targets,
      history,
      ...(sig.current ? { sig: sig.current } : {}),
      ...(debug ? { debug } : {}),
    })
    if (!alive.current) return
    setPending(false)
    if (!res.ok) {
      const last = history[history.length - 1]
      if (res.code === 'bad_request' && last?.from === 'learner') {
        // Don't get stuck: take the message back so the learner can say it another way.
        setLines((prev) => prev.slice(0, -1))
        setDraft(last.text)
        setRejected(true)
        return
      }
      setError({ code: res.code, history })
      return
    }
    const { reply } = res
    sig.current = reply.sig
    for (const v of reply.verdicts) if (v.understood) understood.current[wordKey(v.word)] = true
    setLines((prev) => [...prev, { from: 'person', text: reply.text, en: reply.text_en }])
    const learnerCount = history.filter((t) => t.from === 'learner').length
    if (reply.done || learnerCount >= MAX_LEARNER_MESSAGES) {
      const allUnderstood = props.targets.every((t) => understood.current[wordKey(t.word)])
      if (allUnderstood && !rewarded.current) {
        rewarded.current = true
        props.onReward()
      }
      setResult({ allUnderstood })
    }
  }

  useEffect(() => {
    if (props.status !== 'open' || started.current) return
    started.current = true
    props.onStart()
    void ask([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toTurns = (ls: Line[]): BenchTurn[] => ls.map(({ from, text }) => ({ from, text }))

  function submit() {
    // Cleaned the way the server will clean it, so a message that would come out empty is never sent.
    const text = normalizeTurnText(draft)
    if (!text || pending || result || error) return
    const next = [...lines, { from: 'learner' as const, text }]
    setLines(next)
    setDraft('')
    void ask(toTurns(next))
  }

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#2B1D16]/10">
        <Awning color={BENCH_COLOR} />
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <h2 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-extrabold sm:text-2xl">
            <span className="text-3xl sm:text-4xl" aria-hidden>
              {art.person}
            </span>
            <span>
              <Bi vi={persona.name_vi} en={persona.name_en} />
            </span>
            <span className="rounded-full bg-[#7BAE7F]/20 px-2.5 py-0.5 text-xs font-bold text-[#2F5F33]">
              1-1 conversation
              <Gloss text="Trò chuyện 1-1" lang="vi" />
            </span>
          </h2>
          <GhostButton onClick={leave}>
            <Bi vi="Rời đi" en="Leave" />
          </GhostButton>
        </div>
      </header>

      {props.status === 'no_words' && (
        <SpeechBubble speaker="" side="host" avatar={art.person}>
          <p>
            <Bi
              vi="Cháu học vài từ ở các cửa hàng rồi quay lại nói chuyện với bác nhé!"
              en="Learn a few words at the shops, then come back and chat with me!"
            />
          </p>
        </SpeechBubble>
      )}
      {props.status === 'limit' && (
        <SpeechBubble speaker="" side="host" avatar={art.person}>
          <p>
            <Bi
              vi="Hôm nay mình trò chuyện đủ rồi, ngày mai cháu quay lại nhé!"
              en="We've chatted enough for today. Come back tomorrow!"
            />
          </p>
        </SpeechBubble>
      )}

      {props.status === 'open' && (
        <>
          <div className="space-y-3">
            {lines.map((l, i) =>
              l.from === 'person' ? (
                <SpeechBubble key={i} speaker="" side="host" avatar={art.person}>
                  <p>
                    <Bi vi={<HighlightedText text={l.text} words={targetWords} meanings={meanings} />} en={l.en} />
                  </p>
                </SpeechBubble>
              ) : (
                <SpeechBubble key={i} speaker="" side="player" avatar={LEARNER_EMOJI}>
                  <p>
                    <HighlightedText text={l.text} words={targetWords} meanings={meanings} />
                  </p>
                </SpeechBubble>
              ),
            )}
            {pending && (
              <div role="status">
                <SpeechBubble speaker="" side="host" avatar={art.person}>
                  <p className="flex items-center gap-2">
                    <span className="typing inline-flex gap-1" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      <Bi vi="đang gõ…" en="typing…" />
                    </span>
                  </p>
                </SpeechBubble>
              </div>
            )}
            {rejected && (
              <p role="alert" className="text-sm font-semibold text-[#B23A25]">
                <Bi vi={BENCH_ERRORS.bad_request.vi} en={BENCH_ERRORS.bad_request.en} />
              </p>
            )}
            {error && (
              <div className="space-y-2" role="alert">
                <p className="text-sm font-semibold text-[#B23A25]">
                  <Bi vi={BENCH_ERRORS[error.code].vi} en={BENCH_ERRORS[error.code].en} />
                </p>
                {error.code !== 'bad_request' && (
                  <PrimaryButton onClick={() => void ask(error.history)}>
                    <Bi vi="Thử lại" en="Try again" />
                  </PrimaryButton>
                )}
              </div>
            )}
            <div ref={bottom} />
          </div>

          {result ? (
            <div role="status" className="space-y-4 rounded-3xl bg-white p-6 text-center ring-1 ring-[#2B1D16]/10">
              {result.allUnderstood ? (
                <>
                  <p className="text-xl font-extrabold tracking-tight">
                    <Bi vi="Cháu hiểu hết các từ rồi!" en="You understood every word!" />
                  </p>
                  <p className="inline-block animate-bounce rounded-full bg-[#FFD45C] px-4 py-1 text-lg font-bold">{`+${BENCH_REWARD} 🪙`}</p>
                </>
              ) : (
                <p className="text-xl font-extrabold tracking-tight">
                  <Bi vi="Lần sau cháu sẽ hiểu hết thôi!" en="You'll get them all next time!" />
                </p>
              )}
              <ul className="space-y-1 text-left">
                {props.targets.map((t) => (
                  <li key={t.word} className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF8EE] px-3 py-2">
                    <span className="font-bold">{t.word}</span>
                    <span className="text-sm font-semibold">
                      {understood.current[wordKey(t.word)] ? <Bi vi="✓ đã hiểu" en="✓ understood" /> : <Bi vi="chưa" en="not yet" />}
                    </span>
                  </li>
                ))}
              </ul>
              <PrimaryButton size="lg" className="w-full" onClick={leave}>
                <Bi vi="Về thành phố" en="Back to the city" />
              </PrimaryButton>
            </div>
          ) : (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <input
                type="text"
                value={draft}
                maxLength={MAX_MESSAGE_CHARS}
                disabled={pending || lines.length === 0}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={biText('Tin nhắn', 'Message')}
                className="min-w-0 flex-1 rounded-full border-2 border-[#2B1D16]/20 bg-white px-4 py-2 text-base focus:border-[#E8553D] focus:outline-none"
              />
              <PrimaryButton type="submit" disabled={pending || error !== null || normalizeTurnText(draft) === ''}>
                <Bi vi="Gửi" en="Send" />
              </PrimaryButton>
            </form>
          )}
        </>
      )}
    </div>
  )
}
