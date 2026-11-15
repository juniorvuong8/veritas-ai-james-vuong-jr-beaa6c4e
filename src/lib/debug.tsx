// Debug mode: every piece of Vietnamese text also shows its English version.
// Toggle with Alt+Shift+D (Option+Shift+D on Mac), or ?debug=1 / ?debug=0 in the URL.
// The choice is remembered in localStorage; the badge turns it off.
import { createContext, useContext, useEffect, type ReactNode } from 'react'

const DEBUG_KEY = 'vocab-debug'

/** Reads ?debug=1 / ?debug=0 from the URL (and remembers it), else the saved choice. */
export function readDebugFlag(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  const param = new URLSearchParams(search).get('debug')
  if (param !== null) {
    const on = param === '' || param === '1' || param === 'true'
    saveDebugFlag(on)
    return on
  }
  try {
    return localStorage.getItem(DEBUG_KEY) === '1'
  } catch {
    return false
  }
}

export function saveDebugFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(DEBUG_KEY, '1')
    else localStorage.removeItem(DEBUG_KEY)
  } catch {
    // Storage blocked: debug mode lasts for this visit only.
  }
}

/** Alt+Shift+D. Matches on the physical key, since Option changes the typed character on a Mac. */
export function isDebugShortcut(e: Pick<KeyboardEvent, 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'code'>) {
  return e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD'
}

/** Calls `onToggle` whenever the debug shortcut is pressed. */
export function useDebugShortcut(onToggle: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isDebugShortcut(e)) return
      e.preventDefault()
      onToggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onToggle])
}

const DebugContext = createContext(false)

export function DebugProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
}

export const useDebug = () => useContext(DebugContext)

const hasText = (s: string | null | undefined): s is string => typeof s === 'string' && s.trim() !== ''

/** The gloss line shown under a string in debug mode. */
export function Gloss({ text, lang = 'en' }: { text: string | null | undefined; lang?: 'en' | 'vi' }) {
  const debug = useDebug()
  if (!debug || !hasText(text)) return null
  return (
    <span className="debug-gloss" lang={lang} data-debug-gloss>
      {text}
    </span>
  )
}

/** Vietnamese text, plus its English gloss in debug mode. */
export function Bi({ vi, en }: { vi: ReactNode; en: string | null | undefined }) {
  return (
    <>
      {vi}
      <Gloss text={en} />
    </>
  )
}

/** For plain-string spots (aria-label, placeholder): "vi · en" in debug mode. */
export function useBiText() {
  const debug = useDebug()
  return (vi: string, en: string | null | undefined) => (debug && hasText(en) ? `${vi} · ${en}` : vi)
}

export function DebugBadge({ onTurnOff }: { onTurnOff: () => void }) {
  return (
    <button
      type="button"
      onClick={onTurnOff}
      title="Turn off debug mode (Alt+Shift+D)"
      className="fixed right-3 bottom-3 z-[60] rounded-full bg-[#5B3FD1] px-3 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-[#4A31B5]"
    >
      DEBUG · VI + EN ✕
    </button>
  )
}
