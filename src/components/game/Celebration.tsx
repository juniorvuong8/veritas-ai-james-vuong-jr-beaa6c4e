import { Bi } from '@/lib/debug'
import type { Level } from '@/shared/types'
import { GhostButton, PrimaryButton, SecondaryButton } from './ui'

export function Celebration(props: {
  level: Level
  coins: number
  onPlayAgain: () => void
  onLevelUp?: () => void
  /** Only offered when there is no next level, so finishing a level leads on to the next one. */
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
        <h2 id="celebration-title" className="text-2xl font-extrabold tracking-tight">
          <Bi vi={`Bạn đã hoàn thành cấp ${props.level}!`} en={`You finished level ${props.level}!`} />
        </h2>
        <p className="inline-block rounded-full bg-[#FFF3D6] px-4 py-1.5 text-lg font-bold">
          <Bi vi={`Tổng cộng: 🪙 ${props.coins}`} en={`Total: 🪙 ${props.coins}`} />
        </p>
        <div className="grid gap-3 pt-2">
          {props.onLevelUp && (
            <PrimaryButton size="lg" arrow onClick={props.onLevelUp}>
              <Bi vi={`Lên cấp ${props.level + 1}`} en={`Go to level ${props.level + 1}`} />
            </PrimaryButton>
          )}
          <SecondaryButton onClick={props.onPlayAgain}>
            <Bi vi={`Chơi lại cấp ${props.level}`} en={`Replay level ${props.level}`} />
          </SecondaryButton>
          {!props.onLevelUp && (
            <GhostButton onClick={props.onKeepExploring}>
              <Bi vi="Tiếp tục dạo phố" en="Keep exploring" />
            </GhostButton>
          )}
        </div>
      </div>
    </div>
  )
}
