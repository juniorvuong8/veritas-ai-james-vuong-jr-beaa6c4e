import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { VocabApp } from '@/components/VocabApp'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Xin Chào City — Học từ qua hội thoại' },
      { name: 'description', content: 'Walk a 2D city and learn English words through AI-written everyday conversations, made for Vietnamese speakers.' },
      { property: 'og:title', content: 'Xin Chào City — Học từ qua hội thoại' },
      { property: 'og:description', content: 'A small city game that teaches beginner English vocabulary to Vietnamese speakers.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
      <VocabApp />
    </ClientOnly>
  ),
})
