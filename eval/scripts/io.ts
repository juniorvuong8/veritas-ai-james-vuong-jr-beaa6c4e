import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const EVAL_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
export const ROOT = join(EVAL_DIR, '..')

export function readJson<T>(path: string, fallback?: T): T {
  if (fallback !== undefined && !existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

/** Write via a temp file and rename, so an interrupted run never leaves a half-written file. */
export function writeJsonAtomic(path: string, value: unknown): void {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  renameSync(tmp, path)
}

/** Where a case set's files live: the main 24 cases (default), or the separate 6 with `--set extra`. */
export function evalSetDir(argv: string[] = process.argv): { name: 'main' | 'extra'; dir: string } {
  const i = argv.indexOf('--set')
  const name = i !== -1 ? argv[i + 1] : 'main'
  if (name !== 'main' && name !== 'extra') throw new Error(`unknown --set ${name} (use main or extra)`)
  return { name, dir: name === 'extra' ? join(EVAL_DIR, 'extra') : EVAL_DIR }
}
