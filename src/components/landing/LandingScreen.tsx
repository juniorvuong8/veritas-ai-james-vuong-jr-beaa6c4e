import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCENARIOS } from '@/shared/scenarios'
import { ChatDemo } from './ChatDemo'
import { COPY, STREET_BUBBLES, loadLang, saveLang, type Lang } from './copy'
import { StreetScene } from './StreetScene'

const PLACE_COLORS: Record<string, string> = {
  cafe: '#2F7F7A',
  supermarket: '#E8553D',
  taxi: '#F5B82E',
  clinic: '#3E6FB0',
}

/** Renders *starred* parts as highlighted English words. */
function Marked({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split('*').map((part, i) =>
        i % 2 ? (
          <span key={i} className={cn('marker', className)}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Ngôn ngữ / Language" className="flex rounded-full bg-[#2B1D16]/8 p-1 text-sm font-semibold">
      {(['vi', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={cn(
            'rounded-full px-3 py-1 transition-colors',
            lang === l ? 'bg-white text-[#2B1D16] shadow-sm' : 'text-[#2B1D16]/55 hover:text-[#2B1D16]',
          )}
        >
          {l === 'vi' ? 'VI' : 'EN'}
        </button>
      ))}
    </div>
  )
}

function StartButton({ children, onClick, big }: { children: string; onClick: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full bg-[#E8553D] font-bold text-white shadow-[0_6px_0_#B23A25] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_#B23A25] active:translate-y-1 active:shadow-[0_2px_0_#B23A25] focus-visible:ring-4 focus-visible:ring-[#E8553D]/40 focus-visible:outline-none',
        big ? 'px-8 py-4 text-lg' : 'px-4 py-2 text-sm shadow-[0_3px_0_#B23A25] hover:shadow-[0_4px_0_#B23A25]',
      )}
    >
      {children}
      <ArrowRight className={cn('transition-transform group-hover:translate-x-1', big ? 'size-5' : 'size-4')} aria-hidden />
    </button>
  )
}

export function LandingScreen({ onStart }: { onStart: (scenarioId?: string) => void }) {
  const [lang, setLang] = useState<Lang>(loadLang)
  const t = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function changeLang(l: Lang) {
    setLang(l)
    saveLang(l)
  }

  return (
    <div className="landing min-h-svh overflow-x-hidden bg-[#FFF8EE] text-[#2B1D16]">
      {/* ---------- hero ---------- */}
      <section className="relative bg-[linear-gradient(180deg,#FFE2B8_0%,#FFEFD6_45%,#FFF8EE_100%)]">
        <div className="sun pointer-events-none absolute top-24 right-[8%] size-48 rounded-full bg-[#FFC978] opacity-60 blur-2xl sm:size-72" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-base font-extrabold sm:text-lg">
            <span className="grid size-9 place-items-center rounded-xl bg-[#2B1D16] text-lg" aria-hidden>
              💬
            </span>
            <span>Học từ qua hội thoại</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitch lang={lang} onChange={changeLang} />
            <span className="hidden sm:block">
              <StartButton onClick={() => onStart()}>{t.navStart}</StartButton>
            </span>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-[#2F7F7A] ring-1 ring-[#2F7F7A]/20">
              🇺🇸 → 🇻🇳 {t.eyebrow}
            </p>
            <h1 className="text-[2.5rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl">
              <Marked text={t.headline} />
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#2B1D16]/75">{t.sub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <StartButton big onClick={() => onStart()}>
                {t.cta}
              </StartButton>
              <span className="text-sm font-medium text-[#2B1D16]/55">✓ {t.ctaNote}</span>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <ChatDemo lang={lang} />
          </div>
        </div>

        <div className="relative h-[200px] sm:h-[280px] lg:h-[340px]">
          <StreetScene />
          {STREET_BUBBLES.map((b, i) => (
            <span
              key={b.text}
              className={cn(
                'street-bubble absolute rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-xs font-bold whitespace-nowrap shadow-md sm:text-sm',
                i > 1 && 'hidden sm:block',
              )}
              style={{ left: b.left, top: b.top, animationDelay: b.delay }}
              aria-hidden
            >
              {b.text}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t.stepsTitle}</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {t.steps.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-white p-6 ring-1 ring-[#2B1D16]/8">
              <span className="absolute -top-4 left-6 grid size-8 place-items-center rounded-full bg-[#2B1D16] text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="text-4xl" aria-hidden>
                {s.emoji}
              </div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-1.5 leading-relaxed text-[#2B1D16]/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- places ---------- */}
      <section className="bg-[#F4EBDD] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.placesTitle}</h2>
          <p className="mt-2 text-lg text-[#2B1D16]/70">{t.placesSub}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map((s) => {
              const color = PLACE_COLORS[s.id] ?? '#2F7F7A'
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onStart(s.id)}
                  className="storefront group overflow-hidden rounded-3xl bg-white text-left ring-1 ring-[#2B1D16]/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(43,29,22,0.5)] focus-visible:ring-4 focus-visible:ring-[#E8553D]/40 focus-visible:outline-none"
                >
                  <div
                    className="h-7"
                    style={{ background: `repeating-linear-gradient(90deg, ${color} 0 22px, #FFF6E6 22px 44px)` }}
                    aria-hidden
                  />
                  <div className="p-5">
                    <div className="text-5xl transition-transform group-hover:scale-110 group-hover:-rotate-6" aria-hidden>
                      {s.emoji}
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{t.placeNames[s.id] ?? s.name_vi}</h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.suggestedWords.slice(0, 4).map((w) => (
                        <span key={w} className="rounded-full bg-[#FFF3D6] px-2.5 py-0.5 text-sm font-semibold">
                          {w}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 font-bold" style={{ color: color === '#F5B82E' ? '#B07F0E' : color }}>
                      {t.placeCta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- levels ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.levelsTitle}</h2>
          <p className="mt-2 text-lg text-[#2B1D16]/70">{t.levelsSub}</p>
        </div>
        <ol className="mt-12 grid items-end gap-5 md:grid-cols-3">
          {t.levels.map((l, i) => (
            <li
              key={l.name}
              className={cn(
                'rounded-3xl p-6 ring-1 ring-[#2B1D16]/8',
                ['bg-white md:mb-0', 'bg-[#FFF3D6] md:mb-8', 'bg-[#2B1D16] text-white md:mb-16'][i],
              )}
            >
              <div className="flex items-center gap-1" aria-hidden>
                {[0, 1, 2].map((d) => (
                  <span key={d} className={cn('h-2 w-6 rounded-full', d <= i ? 'bg-[#E8553D]' : 'bg-current opacity-15')} />
                ))}
              </div>
              <h3 className="mt-4 text-xl font-bold">{l.name}</h3>
              <p className={cn('text-sm', i === 2 ? 'text-white/65' : 'text-[#2B1D16]/60')}>{l.desc}</p>
              <p className={cn('mt-5 rounded-2xl px-4 py-3 text-[15px]', i === 2 ? 'bg-white/10' : 'bg-[#2B1D16]/5')}>
                “<Marked text={l.example} className={i === 2 ? 'marker-dark' : undefined} />”
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- final call ---------- */}
      <section className="night relative overflow-hidden bg-[#1F2A47] px-4 py-24 text-center text-white">
        <div className="string-lights pointer-events-none absolute inset-x-0 top-0 h-10" aria-hidden />
        <h2 className="mx-auto max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
          <Marked text={t.finalTitle} className="marker-dark" />
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">{t.finalSub}</p>
        <div className="mt-10">
          <StartButton big onClick={() => onStart()}>
            {t.cta}
          </StartButton>
        </div>
      </section>

      <footer className="bg-[#1F2A47] px-4 pb-8 text-center text-sm text-white/40">Veritas AI Hackathon</footer>
    </div>
  )
}
