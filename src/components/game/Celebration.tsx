import type { Level } from '@/shared/types'
import { GhostButton, PrimaryButton, SecondaryButton } from './ui'

export function Celebration(props: {
  level: Level
  coins: number
  onPlayAgain: () => void
  onLevelUp?: () => void
  onKeepExploring: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2B1D16]/50 p-4 sm:items-center"
    >
      <div className="bubble-in w-full max-w-sm space-y-4 rounded-[28px] border-2 border-[#2B1D16] bg-[#FFF8EE] p-6 text-center text-[#2B1D16] shadow-[6px_6px_0_#2B1D16]">
        <p className="text-6xl" aria-hidden>
          🎉
        </p>
        <h2 id="celebration-title" className="text-2xl font-extrabold tracking-tight">{`Bạn đã hoàn thành cấp ${props.level}!`}</h2>
        <p className="inline-block rounded-full bg-[#FFF3D6] px-4 py-1.5 text-lg font-bold">{`Tổng cộng: 🪙 ${props.coins}`}</p>
        <div className="grid gap-3 pt-2">
          {props.onLevelUp && (
            <PrimaryButton size="lg" arrow onClick={props.onLevelUp}>{`Lên cấp ${props.level + 1}`}</PrimaryButton>
          )}
          <SecondaryButton onClick={props.onPlayAgain}>{`Chơi lại cấp ${props.level}`}</SecondaryButton>
          <GhostButton onClick={props.onKeepExploring}>Tiếp tục dạo phố</GhostButton>
        </div>
      </div>
    </div>
  )
}
