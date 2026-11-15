import { useEffect } from 'react'
import { SHOP_ITEMS, SLOTS, SLOT_NAMES, type Outfit } from '@/game/shop'
import { Bi, useBiText } from '@/lib/debug'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'

/** The coin shop: buy hats, looks and pets, and choose what to wear. */
export function Shop(props: {
  coins: number
  owned: string[]
  outfit: Outfit
  onBuy: (itemId: string) => void
  onToggle: (itemId: string) => void
  onClose: () => void
}) {
  const biText = useBiText()
  const { onClose } = props

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2B1D16]/50 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bubble-in flex max-h-[85svh] w-full max-w-lg flex-col rounded-[28px] border-2 border-[#2B1D16] bg-[#FFF8EE] text-[#2B1D16] shadow-[6px_6px_0_#2B1D16]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#2B1D16]/10 px-5 py-4">
          <h2 id="shop-title" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span aria-hidden>🛍️</span>
            <Bi vi="Cửa hàng" en="Shop" />
          </h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFF3D6] px-3 py-1 text-sm font-bold" data-testid="shop-coins">
              {`🪙 ${props.coins}`}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={biText('Đóng cửa hàng', 'Close the shop')}
              className="grid size-9 shrink-0 place-items-center rounded-full text-xl hover:bg-[#2B1D16]/10"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex justify-center py-3" aria-hidden>
            <span className="grid size-24 place-items-center rounded-full bg-white ring-1 ring-[#2B1D16]/10">
              <Avatar outfit={props.outfit} className="text-5xl" />
            </span>
          </div>

          {SLOTS.map((slot) => (
            <section key={slot} aria-label={biText(SLOT_NAMES[slot].vi, SLOT_NAMES[slot].en)}>
              <h3 className="mb-2 text-sm font-extrabold tracking-wide uppercase">
                <Bi vi={SLOT_NAMES[slot].vi} en={SLOT_NAMES[slot].en} />
              </h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SHOP_ITEMS.filter((i) => i.slot === slot).map((item) => {
                  const owned = props.owned.includes(item.id)
                  const wearing = props.outfit[item.slot] === item.id
                  const short = item.price - props.coins
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center ring-1 ring-[#2B1D16]/10',
                        wearing && 'ring-2 ring-[#22A04B]',
                      )}
                    >
                      <span className="text-3xl" aria-hidden>
                        {item.emoji}
                      </span>
                      <span className="text-sm font-bold">
                        <Bi vi={item.name_vi} en={item.name_en} />
                      </span>
                      {owned ? (
                        <button
                          type="button"
                          aria-pressed={wearing}
                          aria-label={biText(
                            `${wearing ? 'Bỏ' : 'Đội/mặc'} ${item.name_vi}`,
                            `${wearing ? 'Take off' : 'Wear'} ${item.name_en}`,
                          )}
                          onClick={() => props.onToggle(item.id)}
                          className={cn(
                            'mt-1 w-full rounded-full px-3 py-1 text-sm font-bold transition-colors',
                            wearing
                              ? 'bg-[#22A04B] text-white hover:bg-[#1B8A40]'
                              : 'bg-[#2B1D16]/8 hover:bg-[#2B1D16]/15',
                          )}
                        >
                          {wearing ? <Bi vi="✓ Đang dùng" en="✓ Wearing" /> : <Bi vi="Dùng" en="Wear" />}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={short > 0}
                          aria-label={biText(
                            `Mua ${item.name_vi} giá ${item.price} xu`,
                            `Buy ${item.name_en} for ${item.price} coins`,
                          )}
                          onClick={() => props.onBuy(item.id)}
                          className="mt-1 w-full rounded-full bg-[#E8553D] px-3 py-1 text-sm font-bold text-white shadow-[0_3px_0_#B23A25] transition-all hover:-translate-y-0.5 disabled:bg-[#2B1D16]/15 disabled:text-[#2B1D16]/50 disabled:shadow-none disabled:hover:translate-y-0"
                        >
                          {`🪙 ${item.price}`}
                        </button>
                      )}
                      {!owned && short > 0 && (
                        <span className="text-[11px] font-semibold text-[#2B1D16]/50">
                          <Bi vi={`Cần thêm ${short} xu`} en={`${short} more coins`} />
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <p className="pb-1 text-center text-xs text-[#2B1D16]/55">
            <Bi
              vi="Trả lời đúng câu hỏi để kiếm thêm xu. Đồ đã mua sẽ giữ mãi."
              en="Answer quiz questions correctly to earn more coins. What you buy is yours to keep."
            />
          </p>
        </div>
      </div>
    </div>
  )
}
