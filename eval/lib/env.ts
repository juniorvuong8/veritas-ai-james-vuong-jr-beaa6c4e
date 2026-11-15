/** Read one KEY=value from .env-style text, ignoring comments and surrounding quotes. */
export function readEnvKey(text: string, name: string): string | undefined {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1 || line.slice(0, eq).trim() !== name) continue
    return line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return undefined
}
