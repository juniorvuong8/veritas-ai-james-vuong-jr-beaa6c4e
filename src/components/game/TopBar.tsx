import { PLACE_ART } from '@/game/art'
import { PLACE_IDS, type GameState } from '@/game/state'
import { getScenario } from '@/shared/scenarios'

export function TopBar(props: { state: GameState; onOpenCelebration: () => void }) {
  const { state } = props
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-2 ring-1 ring-[#2B1D16]/10 sm:pl-3">
      <div className="flex items-center gap-1.5 text-sm font-bold sm:gap-2">
        <span className="rounded-full bg-[#2B1D16] px-2.5 py-1 text-white">{`Cấp ${state.level}`}</span>
        <span className="rounded-full bg-[#FFF3D6] px-2.5 py-1">{`🪙 ${state.coins}`}</span>
      </div>
      <div className="flex items-center gap-1" aria-label="Hộ chiếu">
        {PLACE_IDS.map((id) => {
          const done = state.stamps.includes(id)
          return (
            <span
              key={id}
              aria-label={`${getScenario(id)?.name_vi}: ${done ? 'đã xong' : 'chưa xong'}`}
              className={
                done
                  ? 'flex size-8 items-center justify-center rounded-full border-2 text-base'
                  : 'flex size-8 items-center justify-center rounded-full border-2 border-dashed border-[#2B1D16]/25 text-[#2B1D16]/30'
              }
              style={done ? { borderColor: PLACE_ART[id].color, background: `${PLACE_ART[id].color}22` } : undefined}
            >
              {done ? PLACE_ART[id].sign : '·'}
            </span>
          )
        })}
        {state.complete && (
          <button
            type="button"
            onClick={props.onOpenCelebration}
            aria-label="🏆 Xem thành tích"
            className="grid size-8 place-items-center rounded-full bg-[#FFD45C] text-base transition-transform hover:scale-110"
          >
            🏆
          </button>
        )}
      </div>
    </div>
  )
}
