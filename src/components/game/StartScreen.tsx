import { useEffect, useState } from 'react'
import { Bi, Gloss } from '@/lib/debug'
import { cn } from '@/lib/utils'
import type { Level } from '@/shared/types'
import { GhostButton, PrimaryButton, SecondaryButton } from './ui'

const LEVELS: { level: Level; label: string; label_en: string; example: string; example_en?: string }[] = [
  {
    level: 1,
    label: 'Cấp 1: chỉ từ mới bằng tiếng Anh',
    label_en: 'Level 1: only the new words in English',
    example: 'Chị uống ở đây hay *to go* ạ?',
    example_en: 'Will you drink here or to go?',
  },
  {
    level: 2,
    label: 'Cấp 2: thêm cụm từ tiếng Anh ngắn',
    label_en: 'Level 2: plus short English phrases',
    example: 'Dạ, em muốn *a coffee to go*.',
    example_en: 'Yes, I want a coffee to go.',
  },
  {
    level: 3,
    label: 'Cấp 3: cả câu tiếng Anh, có dịch',
    label_en: 'Level 3: whole English sentences, translated',
    example: '*Can I get it to go?*',
  },
]

function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) =>
        i % 2 ? (
          <span key={i} className="marker font-bold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export function StartScreen(props: { hasSave: boolean; onContinue: () => void; onNewGame: (level: Level) => void }) {
  const [level, setLevel] = useState<Level>(1)
  const [confirming, setConfirming] = useState(false)
  useEffect(() => {
    if (!confirming) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfirming(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming])
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
          Dạo phố và học <span className="marker">tiếng Anh</span>
          <Gloss text="Walk the city and learn English" />
        </h1>
        <p className="text-base leading-relaxed text-[#2B1D16]/70 sm:text-lg">
          Đi dạo quanh thành phố, ghé quán cà phê, siêu thị, taxi và phòng khám để học tiếng Anh qua những cuộc trò
          chuyện hằng ngày.
          <Gloss text="Stroll around the city, stop by the café, supermarket, taxi and clinic to learn English through everyday conversations." />
        </p>
      </div>

      {props.hasSave && (
        <PrimaryButton size="lg" arrow className="w-full sm:w-auto" onClick={props.onContinue}>
          <Bi vi="Chơi tiếp" en="Continue" />
        </PrimaryButton>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">
          <Bi vi="Chọn cấp độ" en="Choose a level" />
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((l) => {
            const selected = l.level === level
            return (
              <button
                key={l.level}
                type="button"
                aria-pressed={selected}
                onClick={() => setLevel(l.level)}
                className={cn(
                  'flex flex-col gap-2 rounded-3xl bg-white p-4 text-left transition-all',
                  selected
                    ? 'border-2 border-[#2B1D16] shadow-[4px_4px_0_#2B1D16]'
                    : 'border-2 border-transparent ring-1 ring-[#2B1D16]/10 hover:-translate-y-0.5',
                )}
              >
                <span className="font-bold">
                  <Bi vi={l.label} en={l.label_en} />
                </span>
                <span className="text-sm text-[#2B1D16]/60">
                  <Marked text={l.example} />
                  <Gloss text={l.example_en} />
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-sm text-[#2B1D16]/55">
          <Bi
            vi="Cấp độ sẽ giữ nguyên cho đến khi bạn hoàn thành cả 4 địa điểm."
            en="Your level stays the same until you finish all 4 places."
          />
        </p>
      </section>

      {props.hasSave ? (
        <SecondaryButton size="lg" className="w-full sm:w-auto" onClick={() => setConfirming(true)}>
          <Bi vi="Chơi mới" en="New game" />
        </SecondaryButton>
      ) : (
        <PrimaryButton size="lg" arrow className="w-full sm:w-auto" onClick={() => props.onNewGame(level)}>
          <Bi vi="Bắt đầu" en="Start" />
        </PrimaryButton>
      )}

      {confirming && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#2B1D16]/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-game-title"
            className="bubble-in w-full max-w-sm space-y-4 rounded-[28px] border-2 border-[#2B1D16] bg-[#FFF8EE] p-6 text-center shadow-[6px_6px_0_#2B1D16]"
          >
            <div className="text-5xl" aria-hidden>
              🔄
            </div>
            <h2 id="new-game-title" className="text-xl font-extrabold tracking-tight">
              <Bi vi="Bạn có chắc không?" en="Are you sure?" />
            </h2>
            <p className="text-sm text-[#2B1D16]/70">
              <Bi
                vi="Trò chơi mới sẽ xóa con dấu, xu và sổ từ vựng của bạn. Đồ đã mua trong cửa hàng vẫn được giữ."
                en="A new game clears your stamps, coins and word notebook. Items you bought in the shop are kept."
              />
            </p>
            <div className="grid gap-2">
              <PrimaryButton
                onClick={() => {
                  setConfirming(false)
                  props.onNewGame(level)
                }}
              >
                <Bi vi="Có, chơi mới" en="Yes, start a new game" />
              </PrimaryButton>
              <GhostButton autoFocus onClick={() => setConfirming(false)}>
                <Bi vi="Không, quay lại" en="No, go back" />
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
