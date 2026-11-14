import { METHODS, dialogueId, type EvalCase, type Method, type ResultsFile } from './types'

export const RATING_SEED = 20261114

/** Small seeded PRNG (mulberry32), so the shuffled order is reproducible and auditable. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Every successfully generated dialogue, shuffled with a fixed seed. Failed runs are left out (scored as fails). */
export function buildOrder(cases: EvalCase[], results: Record<Method, ResultsFile>, seed = RATING_SEED): string[] {
  const ids = cases.flatMap((c) => METHODS.filter((m) => results[m][c.id]?.ok).map((m) => dialogueId(m, c.id)))
  const rand = mulberry32(seed)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids
}
