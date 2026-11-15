import { Star } from 'lucide-react'
import { useBiText } from '@/lib/debug'
import { cn } from '@/lib/utils'

/** Stars or unstars a word; starred words are listed under Starred in the notebook. */
export function StarButton(props: { word: string; starred: boolean; onToggle: () => void; className?: string }) {
  const biText = useBiText()
  return (
    <button
      type="button"
      aria-pressed={props.starred}
      aria-label={biText(`Gắn sao "${props.word}"`, `Star "${props.word}"`)}
      title={props.starred ? biText('Bỏ sao', 'Remove star') : biText('Gắn sao', 'Star')}
      onClick={props.onToggle}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 hover:bg-[#2B1D16]/5',
        props.className,
      )}
    >
      <Star
        className={cn('size-5', props.starred ? 'fill-[#FFC21A] text-[#C98A00]' : 'text-[#2B1D16]/35')}
        aria-hidden
      />
    </button>
  )
}
