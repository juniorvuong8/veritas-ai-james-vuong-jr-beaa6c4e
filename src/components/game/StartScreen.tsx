import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Level } from '@/shared/types'
import { PrimaryButton, SecondaryButton } from './ui'

const LEVELS: { level: Level; label: string; example: string }[] = [
  { level: 1, label: 'Cấp 1: chỉ từ mới bằng tiếng Anh', example: 'Chị uống ở đây hay *to go* ạ?' },
  { level: 2, label: 'Cấp 2: thêm cụm từ tiếng Anh ngắn', example: 'Dạ, em muốn *a coffee to go*.' },
  { level: 3, label: 'Cấp 3: cả câu tiếng Anh, có dịch', example: '*Can I get it to go?*' },
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
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl">
          Dạo phố và học <span className="marker">tiếng Anh</span>
        </h1>
        <p className="text-base leading-relaxed text-[#2B1D16]/70 sm:text-lg">
          Đi dạo quanh thành phố, ghé quán cà phê, siêu thị, taxi và phòng khám để học tiếng Anh qua những cuộc trò
          chuyện hằng ngày.
        </p>
      </div>

      {props.hasSave && (
        <PrimaryButton size="lg" arrow className="w-full sm:w-auto" onClick={props.onContinue}>
          Chơi tiếp
        </PrimaryButton>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Chọn cấp độ</h2>
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
                <span className="font-bold">{l.label}</span>
                <span className="text-sm text-[#2B1D16]/60">
                  <Marked text={l.example} />
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-sm text-[#2B1D16]/55">Cấp độ sẽ giữ nguyên cho đến khi bạn hoàn thành cả 4 địa điểm.</p>
      </section>

      {props.hasSave ? (
        <SecondaryButton size="lg" className="w-full sm:w-auto" onClick={() => props.onNewGame(level)}>
          Chơi mới
        </SecondaryButton>
      ) : (
        <PrimaryButton size="lg" arrow className="w-full sm:w-auto" onClick={() => props.onNewGame(level)}>
          Bắt đầu
        </PrimaryButton>
      )}
    </div>
  )
}
