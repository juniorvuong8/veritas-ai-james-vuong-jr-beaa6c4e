// Plays the live app like a player and saves each AI lesson: node drive.mjs <fromIndex> <toIndex>
import { chromium } from '/private/tmp/claude-503/-Users-juniorvuong-Desktop-Coding-veritas-ai-james-vuong-jr/65acbf67-23a4-4e23-9391-3fd557b543bf/scratchpad/pw/node_modules/playwright/index.mjs'
import { fromJSON } from '/Users/juniorvuong/Desktop/Coding/veritas-ai-james-vuong-jr/node_modules/seroval/dist/index.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
const SITE = 'https://veritas-ai-james-vuong-jr.lovable.app/'
const LESSON_FN = 'f2fa5693f67131a1a1df5518a5a9e72ac420bcff940abe1bdf27f50e9de81275'
const PLACE = { cafe: 'Quán cà phê', supermarket: 'Siêu thị', taxi: 'Gọi taxi', clinic: 'Phòng khám' }
const dir = new URL(process.env.OUT ?? './lessons/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })
const cases = JSON.parse(readFileSync(new URL(process.env.CASES ?? './cases.json', import.meta.url), 'utf8'))
const [from, to] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? 1)]
const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell' })

async function runCase(c) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } })
  const p = await ctx.newPage()
  try {
    await p.goto(SITE + '?debug=0')
    await p.getByRole('button', { name: new RegExp(PLACE[c.scenarioId]) }).first().click()
    await p.getByRole('button', { name: new RegExp(`^Cấp ${c.level}:`) }).click()
    await p.getByRole('button', { name: 'Bắt đầu', exact: true }).click()
    for (const w of c.suggested) await p.getByRole('button', { name: w, exact: true }).click()
    for (const w of c.custom) {
      await p.getByPlaceholder(/Thêm từ của bạn/).fill(w)
      await p.getByRole('button', { name: 'Thêm', exact: true }).click()
      const ok = p.getByRole('button', { name: `Bỏ ${w}` })
      const err = p.getByRole('alert')
      await Promise.race([ok.waitFor({ timeout: 30000 }), err.waitFor({ timeout: 30000 })])
      if (await err.isVisible()) return { ok: false, code: 'custom_rejected', detail: await err.innerText() }
    }
    const resP = p.waitForResponse((r) => r.url().includes(LESSON_FN), { timeout: 120000 })
    await p.getByRole('button', { name: 'Bắt đầu hội thoại' }).click()
    const res = await resP
    const text = await res.text()
    let body
    try { const j = JSON.parse(text); body = j && typeof j === 'object' && 't' in j ? fromJSON({ t: j, f: 127, m: [] }) : j } catch { body = text }
    const r = body?.result ?? body
    if (r?.status === 200) return { ok: true, lesson: r.body }
    return { ok: false, code: r?.body?.code ?? `http_${res.status()}`, raw: text }
  } catch (e) {
    return { ok: false, code: 'driver_error', detail: String(e).slice(0, 300) }
  } finally {
    await ctx.close()
  }
}

for (const c of cases.slice(from, to)) {
  const out = `${dir}${c.id}.json`
  if (existsSync(out) && JSON.parse(readFileSync(out, 'utf8')).ok) continue
  const t = Date.now()
  const r = await runCase(c)
  writeFileSync(out, JSON.stringify({ case: c, ...r }, null, 1))
  console.log(`${c.id} ${r.ok ? 'ok' : 'FAIL ' + r.code + ' ' + (r.detail ?? r.raw ?? '')} ${((Date.now() - t) / 1000).toFixed(0)}s`)
}
await b.close()
