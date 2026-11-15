import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import cases from '@/eval/cases.json'
import baseline from '@/eval/results/baseline.json'
import llm from '@/eval/results/llm.json'
import extraCases from '@/eval/extra/cases.json'
import extraBaseline from '@/eval/extra/results/baseline.json'
import extraLlm from '@/eval/extra/results/llm.json'
import type { EvalCase, ResultsFile } from '@/eval/lib/types'
import { RatingApp } from '@/eval/ui/RatingApp'

export const Route = createFileRoute('/eval')({
  head: () => ({
    meta: [
      { title: 'Chấm điểm hội thoại — Vocab Conversations' },
      { name: 'description', content: 'Blind rating page for comparing baseline and AI-written vocabulary dialogues.' },
      { property: 'og:title', content: 'Chấm điểm hội thoại — Vocab Conversations' },
      { property: 'og:description', content: 'Rate shuffled dialogues for word use and natural Vietnamese.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: EvalPage,
})

/** /eval rates the main 24 cases; /eval?set=extra rates the separate 6 (eval/extra/). */
function EvalPage() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      {new URLSearchParams(window.location.search).get('set') === 'extra' ? (
        <RatingApp
          key="extra"
          cases={extraCases as EvalCase[]}
          results={{ baseline: extraBaseline as unknown as ResultsFile, llm: extraLlm as unknown as ResultsFile }}
          storageKey="eval-ratings-extra-v1"
          fileName="ratings-extra.json"
          heading="Đánh giá hội thoại (bộ phụ)"
        />
      ) : (
        <RatingApp
          key="main"
          cases={cases as EvalCase[]}
          results={{ baseline: baseline as unknown as ResultsFile, llm: llm as unknown as ResultsFile }}
        />
      )}
    </ClientOnly>
  )
}
