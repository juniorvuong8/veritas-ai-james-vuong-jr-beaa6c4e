import { Volume2 } from 'lucide-react'
import { canSpeak, speak } from '@/lib/speech'

export function SpeakButton({ text }: { text: string }) {
  if (!canSpeak()) return null
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={`Nghe "${text}"`}
      className="ml-0.5 inline-flex items-center align-middle text-primary hover:opacity-70"
    >
      <Volume2 className="size-4" aria-hidden />
    </button>
  )
}
