import { outfitEmojis, type Outfit } from '@/game/shop'
import { cn } from '@/lib/utils'

/**
 * The player drawn with their outfit: the face (or a bought look), a hat on top and a pet at their feet.
 * Sized by font-size, so it scales with the city tiles or a shop preview.
 */
export function Avatar({ outfit, className }: { outfit: Outfit; className?: string }) {
  const { face, hat, pet } = outfitEmojis(outfit)
  return (
    <span className={cn('relative inline-flex items-center justify-center leading-none', className)}>
      <span data-part="face">{face}</span>
      {hat && (
        <span data-part="hat" className="absolute top-[-0.42em] left-1/2 -translate-x-1/2 text-[0.62em]">
          {hat}
        </span>
      )}
      {pet && (
        <span data-part="pet" className="absolute right-[-0.5em] bottom-[-0.08em] text-[0.5em]">
          {pet}
        </span>
      )}
    </span>
  )
}
