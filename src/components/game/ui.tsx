// Shared building blocks so the game looks like the homepage (src/components/landing).
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const INK = '#2B1D16'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'md' | 'lg'; arrow?: boolean }

/** Coral "pressable" button, as on the homepage. */
export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(function PrimaryButton(
  { className, size = 'md', arrow, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full bg-[#E8553D] font-bold text-white transition-all focus-visible:ring-4 focus-visible:ring-[#E8553D]/40 focus-visible:outline-none',
        'shadow-[0_5px_0_#B23A25] hover:-translate-y-0.5 hover:shadow-[0_7px_0_#B23A25] active:translate-y-1 active:shadow-[0_1px_0_#B23A25]',
        'disabled:pointer-events-none disabled:bg-[#2B1D16]/20 disabled:text-white/90 disabled:shadow-none',
        size === 'lg' ? 'px-7 py-3.5 text-lg' : 'px-5 py-2.5 text-base',
        className,
      )}
      {...props}
    >
      {children}
      {arrow && <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />}
    </button>
  )
})

/** White outlined button with a soft "pressable" edge. */
export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonProps>(function SecondaryButton(
  { className, size = 'md', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#2B1D16] bg-white font-bold text-[#2B1D16] transition-all',
        'shadow-[0_4px_0_#2B1D16] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#2B1D16] active:translate-y-1 active:shadow-[0_1px_0_#2B1D16]',
        'focus-visible:ring-4 focus-visible:ring-[#2B1D16]/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
        size === 'lg' ? 'px-7 py-3 text-lg' : 'px-5 py-2 text-base',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

/** Quiet text button (leave, choose again). */
export function GhostButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-[#2B1D16]/60 transition-colors hover:bg-[#2B1D16]/5 hover:text-[#2B1D16]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** White rounded card. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl bg-white p-5 ring-1 ring-[#2B1D16]/8 sm:p-6', className)}>{children}</div>
}

/** Storefront awning stripe in a place's colour. */
export function Awning({ color, className }: { color: string; className?: string }) {
  return (
    <div
      className={cn('h-5', className)}
      style={{ background: `repeating-linear-gradient(90deg, ${color} 0 22px, #FFF6E6 22px 44px)` }}
      aria-hidden
    />
  )
}

/**
 * Page frame shared by every game screen: the homepage's cream background, brand bar and gutters.
 * `wide` lets the city use the whole screen; reading screens keep a comfortable line length.
 */
export function GameShell({ wide, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className="landing min-h-svh bg-[linear-gradient(180deg,#FFE9C9_0%,#FFF8EE_220px)] text-[#2B1D16]">
      <div className={cn('mx-auto px-4 pt-3 pb-8 sm:px-6', wide ? 'max-w-6xl' : 'max-w-2xl')}>
        <div className="mb-4 flex items-center gap-2 text-base font-extrabold">
          <span className="grid size-8 place-items-center rounded-xl bg-[#2B1D16] text-base" aria-hidden>
            💬
          </span>
          <span>Học từ qua hội thoại</span>
        </div>
        {children}
      </div>
    </div>
  )
}
