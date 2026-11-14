import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Chat bubble styled like the homepage demo: host in sand, the learner in coral. */
export function SpeechBubble(props: {
  speaker: string
  side: 'host' | 'player'
  avatar: string
  children: ReactNode
}) {
  const isHost = props.side === 'host'
  return (
    <div data-side={props.side} className={cn('bubble-in flex items-end gap-2', !isHost && 'flex-row-reverse')}>
      <span className="mb-1 text-2xl leading-none sm:text-3xl" aria-hidden>
        {props.avatar}
      </span>
      <div className={cn('max-w-[82%] sm:max-w-[75%]', !isHost && 'text-right')}>
        {props.speaker && <p className="mb-0.5 px-1 text-[11px] font-medium text-[#2B1D16]/50">{props.speaker}</p>}
        <div
          className={cn(
            'inline-block rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed sm:text-base',
            isHost ? 'rounded-bl-md bg-[#F4EBDD] text-[#2B1D16]' : 'rounded-br-md bg-[#E8553D] text-white',
          )}
        >
          {props.children}
        </div>
      </div>
    </div>
  )
}
