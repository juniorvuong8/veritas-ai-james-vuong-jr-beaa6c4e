import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { getScenario } from '@/shared/scenarios'
import type { Lesson } from '@/shared/types'
import { dialogueHash } from '../lib/hash'
import { buildOrder } from '../lib/order'
import type { EvalCase, Method, Rating, RatingsFile, ResultsFile } from '../lib/types'

const STORAGE_KEY = 'eval-ratings-v2'
const Q1 = 'Mỗi từ tiếng Anh có được dùng đúng nghĩa và đúng tình huống không?'
const Q2 = 'Phần tiếng Việt có tự nhiên, như người thật nói không?'

function load(storage: Storage | undefined, key: string): RatingsFile {
  try {
    return JSON.parse(storage?.getItem(key) ?? '{}') as RatingsFile
  } catch {
    return {}
  }
}

/** One dialogue, rendered identically whichever method made it. No method, title or badge is shown. */
export function DialogueScreen({ c, lesson }: { c: EvalCase; lesson: Lesson }) {
  const hostSpeaker = lesson.lines[0]?.speaker_vi
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <span className="rounded-full bg-[#2B1D16] px-3 py-1 text-white">{getScenario(c.scenarioId)?.name_vi}</span>
        <span className="rounded-full bg-[#FFF3D6] px-3 py-1">{`Cấp ${c.level}`}</span>
        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#2B1D16]/10">{`Từ: ${c.words.join(' · ')}`}</span>
      </div>
      <ol className="space-y-2.5">
        {lesson.lines.map((line, i) => {
          const host = line.speaker_vi === hostSpeaker
          return (
            <li key={i} className={cn('flex', host ? 'justify-start' : 'justify-end')}>
              <div className={cn('max-w-[85%]', !host && 'text-right')}>
                <p className="px-1 text-[11px] font-medium text-[#2B1D16]/50">{line.speaker_vi}</p>
                <p
                  className={cn(
                    'inline-block rounded-2xl px-3.5 py-2 text-left leading-relaxed',
                    host ? 'rounded-bl-md bg-[#F4EBDD]' : 'rounded-br-md bg-[#E8553D] text-white',
                  )}
                >
                  {line.text}
                </p>
                {line.translation_vi && <p className="mt-0.5 px-1 text-left text-sm text-[#2B1D16]/60 italic">{line.translation_vi}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold">{label}</legend>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={cn(
              'rounded-full border-2 px-5 py-1.5 font-bold transition-colors',
              value === v ? 'border-[#2B1D16] bg-[#2B1D16] text-white' : 'border-[#2B1D16]/20 bg-white hover:border-[#2B1D16]',
            )}
          >
            {v ? 'Có' : 'Không'}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function RatingApp(props: {
  cases: EvalCase[]
  results: Record<Method, ResultsFile>
  storage?: Storage
  /** Separate case sets keep separate saved answers. */
  storageKey?: string
  /** Name of the downloaded file, e.g. ratings.json. */
  fileName?: string
  heading?: string
}) {
  const storage = props.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
  const storageKey = props.storageKey ?? STORAGE_KEY
  const order = useMemo(() => buildOrder(props.cases, props.results), [props.cases, props.results])
  const [ratings, setRatings] = useState<RatingsFile>(() => load(storage, storageKey))
  const isDone = (id: string) => ratings[id]?.q1 !== undefined && ratings[id]?.q2 !== undefined
  const [index, setIndex] = useState(() => {
    const first = order.findIndex((id) => !isDone(id))
    return first === -1 ? Math.max(order.length - 1, 0) : first
  })

  if (order.length === 0) {
    return (
      <div className="landing min-h-svh bg-[#FFF8EE] p-6 text-[#2B1D16]">
        <p className="font-semibold">Chưa có hội thoại nào để đánh giá.</p>
      </div>
    )
  }

  const id = order[index]
  const [method, caseId] = id.split(':') as [Method, string]
  const c = props.cases.find((x) => x.id === caseId)!
  const result = props.results[method][caseId]
  const current: Partial<Rating> = ratings[id] ?? {}
  const doneCount = order.filter(isDone).length

  function update(patch: Partial<Rating>) {
    const prev: Partial<Rating> = ratings[id] ?? { note: '' }
    const h = result?.ok ? dialogueHash(result.lesson) : undefined
    const next = { ...ratings, [id]: { ...prev, ...patch, h } as Rating }
    setRatings(next)
    try {
      storage?.setItem(storageKey, JSON.stringify(next))
    } catch {
      // storage unavailable: answers stay in memory until downloaded
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(ratings, null, 2) + '\n'], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = props.fileName ?? 'ratings.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="landing min-h-svh bg-[#FFF8EE] text-[#2B1D16]">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-extrabold">{props.heading ?? 'Đánh giá hội thoại'}</h1>
          <span className="text-sm font-bold">{`${index + 1} / ${order.length}`}</span>
        </header>
        <p className="text-xs text-[#2B1D16]/60">{`Đã đánh giá ${doneCount} / ${order.length}`}</p>

        {result?.ok && <DialogueScreen c={c} lesson={result.lesson} />}

        <div className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-[#2B1D16]/10">
          <YesNo label={Q1} value={current.q1} onChange={(v) => update({ q1: v })} />
          <YesNo label={Q2} value={current.q2} onChange={(v) => update({ q2: v })} />
          <label className="block space-y-1">
            <span className="font-semibold">Lỗi (nếu có)</span>
            <textarea
              className="w-full rounded-2xl border-2 border-[#2B1D16]/15 p-3 outline-none focus:border-[#2B1D16]"
              rows={2}
              value={current.note ?? ''}
              onChange={(e) => update({ note: e.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className="rounded-full px-4 py-2 font-semibold disabled:opacity-30"
          >
            Trước
          </button>
          <button type="button" onClick={download} className="rounded-full border-2 border-[#2B1D16] bg-white px-4 py-2 font-bold">
            Lưu kết quả
          </button>
          <button
            type="button"
            disabled={index === order.length - 1}
            onClick={() => setIndex(index + 1)}
            className="rounded-full bg-[#E8553D] px-5 py-2 font-bold text-white disabled:opacity-30"
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  )
}
