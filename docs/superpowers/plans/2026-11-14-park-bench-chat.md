# Park Bench Chats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two bench characters on the city lawns hold free-form AI chats that test notebook words (understand 🪙 5, use 🪙 10) within daily limits.

**Architecture:** A pure shared module validates requests, builds the prompt and filters the model's verdicts; a TanStack server function wraps it like the word-fit check. Game state gains a per-day bench record and per-word "last tested" dates; pure helpers decide what pays. The map gains a `bench` tile that behaves like a door, and a new `BenchChat` screen drives the conversation.

**Tech Stack:** React 19, TanStack Start server functions, TypeScript, Vitest + Testing Library, Tailwind. AI via `createGatewayAiCaller` (Lovable AI Gateway → Claude).

**Spec:** `docs/superpowers/specs/2026-11-14-park-bench-chat-design.md`

## Prerequisite

The notebook (`learnedWords`, `isLearned`, `wordKey`, `LearnedWord` in `src/game/state.ts`, `Notebook.tsx`) is uncommitted in the working tree, mixed with another session's profanity-filter work. Before Task 1: run `bun run test` and `bun run build`; both must pass; get that work committed (ask the user how to split it). Every task below assumes it is on `main`.

## Global Constraints

- Coins: understanding check **5**, using check **10**, via existing `earnCoins` total.
- Up to **4 paid bench chats per local calendar day**; a chat counts when its first AI call is made.
- Each word pays at most **once per day for understanding and once per day for using**.
- Max **10 learner messages** per chat; each learner message **≤ 200 characters**; **1–3 target words** (pick up to 3, fewer if the notebook is smaller).
- Levels 1–2: the person speaks Vietnamese with English target words; level 3: simple English. Learner may write either language; a using check needs the English word.
- The person never says the word first in a using check; stays warm; steers off-topic or unsuitable messages back; all-ages content.
- Limits and last-tested dates survive "play again", "level up" and "new game". Old saves load with no bench record.
- Do not modify `src/shared/ai.ts` or `ChatMessage` (another session is changing them): send the transcript inside one user message.
- All learner-visible strings use `Bi` / `useBiText` (Vietnamese, with English shown in debug mode), like every other screen.
- Commits end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commit locally; do not push.

## Review Focus

1. **Model names a word that isn't a target, in different case, or repeats a verdict** → only targets count, matched case-insensitively, one verdict per (word, check). Test in Task 1.
2. **Day rolls over between two awards** (chat spans midnight) → the second award uses the new date, so its caps are fresh. Test in Task 3.
3. **Blank or over-long learner message** → Send is disabled for blank input, the input stops at 200 characters, the server rejects either. Tests in Tasks 1 and 6.
4. **AI fails mid-chat, learner presses Try again** → the same message is resent; no duplicate learner bubble; no coins for the failed turn. Test in Task 6.
5. **Learner leaves while a reply is loading** → the late reply is ignored: no coins, no state update after unmount. Test in Task 6.

---

### Task 1: Bench chat core (shared, pure)

**Files:**
- Create: `src/shared/bench.ts`
- Test: `src/shared/bench.test.ts`

**Interfaces:**
- Consumes: `AiCaller`, `AiError`, `parseJsonObject` (`src/shared/ai.ts`); `ChatMessage` (`src/shared/prompt.ts`); `ERRORS` (`src/shared/generate.ts`); `isValidWord` (`src/shared/validate-request.ts`); `normalizeWord` (`src/shared/scenarios.ts`); `ErrorBody`, `Level` (`src/shared/types.ts`).
- Produces:
  ```ts
  export type BenchId = 'bac-tu' | 'sinh-vien'
  export type BenchCheck = 'understand' | 'use'
  export interface BenchTarget { word: string; meaning_vi: string; paid: BenchCheck[] }   // paid = already paid today
  export interface BenchTurn { from: 'person' | 'learner'; text: string }
  export interface BenchRequest { benchId: BenchId; level: Level; targets: BenchTarget[]; history: BenchTurn[]; debug?: boolean }
  export interface BenchVerdict { word: string; check: BenchCheck; passed: boolean }
  export interface BenchReply { text: string; text_en?: string; verdicts: BenchVerdict[]; done: boolean }
  export type BenchResult = { status: number; body: BenchReply | ErrorBody }
  export const BENCH_IDS: BenchId[]                       // ['bac-tu', 'sinh-vien']
  export const MAX_LEARNER_MESSAGES = 10
  export const MAX_MESSAGE_CHARS = 200
  export const MAX_TARGETS = 3
  export const BENCH_MAX_TOKENS = 3000
  export const BENCH_PERSONAS: Record<BenchId, { name_vi: string; name_en: string; persona: string }>
  export function checkBenchRequest(body: unknown): BenchRequest | undefined
  export function buildBenchMessages(req: BenchRequest): ChatMessage[]
  export function parseBenchReply(text: string, req: BenchRequest): BenchReply | undefined
  export async function chatOnBench(body: unknown, callAi: AiCaller): Promise<BenchResult>
  ```

- [ ] **Step 1: Write the failing tests** in `src/shared/bench.test.ts`. Use a `valid: BenchRequest` with `benchId: 'bac-tu'`, `level: 1`, targets `menu` (paid `[]`) and `napkin` (paid `['understand']`), history `[{from:'person',text:'Chào cháu!'},{from:'learner',text:'Cháu chào bác ạ'}]`. Cases:
  - `checkBenchRequest` accepts `valid`, and accepts `history: []`.
  - Rejects (returns `undefined`): unknown benchId; level 4; 0 targets; 4 targets; a target word failing `isValidWord` (e.g. `'shit'`, `'a!b'`); history ending with a `person` turn; two `learner` turns in a row; 11 learner turns; a learner text of 201 chars; a blank learner text `'   '`.
  - `buildBenchMessages(valid)` returns `[system, user]`; system contains `'never say the word first'`, `'{"text"'` and the persona name `'Bác Tư'`; user contains `'menu'`, `'napkin'`, `'already paid today: understand'` and the transcript line `'Learner: Cháu chào bác ạ'`.
  - `parseBenchReply`: given `{"text":"Ừ","verdicts":[{"word":"MENU","check":"use","passed":true},{"word":"menu","check":"use","passed":false},{"word":"coffee","check":"use","passed":true},{"word":"napkin","check":"guess","passed":true}],"done":false}` returns verdicts `[{word:'menu',check:'use',passed:true}]` (target spelling, first verdict per pair wins, non-targets and unknown checks dropped).
  - `parseBenchReply` returns `undefined` for missing/blank `text`, non-boolean `done`; and drops all verdicts when `req.history` is empty (opening turn).
  - `chatOnBench`: malformed body → status 400 `bad_request` with no AI call; first output unusable then good → 200 after 2 calls; `AiError(429)` → `rate_limited`; `AiError(402)` → `out_of_credits`; two unusable outputs → `ai_failed`.

- [ ] **Step 2: Run** `bunx vitest run src/shared/bench.test.ts` — expect FAIL (module not found).

- [ ] **Step 3: Implement `src/shared/bench.ts`.**
  - Request rules exactly as tested; normalize target words with `normalizeWord`; history must alternate, start with `person`, and (when non-empty) end with `learner`; person texts ≤ 1000 chars.
  - Personas: `bac-tu` = "Bác Tư", a cheerful retired neighbour who loves coffee and gossip; `sinh-vien` = "Chị Mai", a friendly university student studying English. `persona` is one English paragraph for the prompt.
  - System prompt covers: persona; language by level (as Global Constraints); the two checks and how to judge them (understanding may be shown in Vietnamese; using needs the English word, any reasonable form); "never say the word first" in a using check; hint once then move on; prefer targets not yet paid today; steer back from off-topic/unsuitable, all ages; wrap up (`done: true`) once every target's using check has passed or the learner has sent 10 messages; strict JSON `{"text": string, "verdicts": [{"word", "check", "passed"}], "done": boolean}` plus `"text_en"` only when debug.
  - User message: targets with meanings and paid checks, learner messages used so far, then the transcript as `Person: …` / `Learner: …` lines (or "Start the conversation." when empty).
  - `chatOnBench` mirrors `generateLesson`'s loop (`MAX_ATTEMPTS` 2, same error mapping, `ERRORS[code]` bodies).

- [ ] **Step 4: Run** `bunx vitest run src/shared/bench.test.ts` — expect PASS.

- [ ] **Step 5: Commit** `git add src/shared/bench.ts src/shared/bench.test.ts && git commit -m "Add bench chat request checks, prompt and reply parsing"`.

### Task 2: Server function and client call

**Files:**
- Create: `src/lib/bench.functions.ts`, `src/lib/bench-api.ts`
- Test: `src/lib/bench-api.test.ts`

**Interfaces:**
- Consumes: `chatOnBench`, `BENCH_MAX_TOKENS`, `BenchRequest`, `BenchReply` (Task 1); `createGatewayAiCaller` (`src/shared/ai.ts`).
- Produces:
  ```ts
  export const benchChatFn            // createServerFn POST, handler → BenchResult; unexpected throw → 502 ai_failed
  export type BenchChatResult = { ok: true; reply: BenchReply } | { ok: false; code: ErrorCode | 'timeout' | 'network'; message_vi: string }
  export const BENCH_TIMEOUT_MS = 30_000
  export async function requestBenchReply(req: BenchRequest, opts?: { call?: typeof benchChatFn; timeoutMs?: number }): Promise<BenchChatResult>
  ```

- [ ] **Step 1: Write failing tests** for `requestBenchReply` with an injected `call`: status 200 → `{ok:true, reply}`; error body → `{ok:false, code, message_vi}`; a call that never resolves with `timeoutMs: 10` → `code: 'timeout'`; a call that rejects → `code: 'network'`.
- [ ] **Step 2: Run** `bunx vitest run src/lib/bench-api.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** both files following `src/lib/word-fit.functions.ts` and `src/lib/api.ts` (AbortController timeout, same Vietnamese timeout/network messages as `api.ts`).
- [ ] **Step 4: Run** the test — expect PASS; then `npx tsc --noEmit -p .` — no errors.
- [ ] **Step 5: Commit** "Add bench chat server function and client call".

### Task 3: Daily bench record, target picking and payouts (game state + save)

**Files:**
- Modify: `src/game/state.ts`, `src/game/storage.ts`, `src/components/VocabApp.tsx` (only the `newGame` call in `appReducer`)
- Test: `src/game/bench-state.test.ts`, `src/game/storage.test.ts`

**Interfaces:**
- Consumes: `BenchCheck`, `BenchTarget`, `BenchVerdict`, `MAX_TARGETS` (Task 1); existing `LearnedWord`, `wordKey`.
- Produces (in `src/game/state.ts`):
  ```ts
  export const BENCH_CHATS_PER_DAY = 4
  export const BENCH_COINS: Record<BenchCheck, number>     // { understand: 5, use: 10 }
  export interface BenchDay { date: string; chats: number; paid: Record<string, BenchCheck[]> }  // keyed by wordKey
  // GameState gains: benchDay: BenchDay | null
  // LearnedWord gains: lastTested?: string   (YYYY-MM-DD)
  export const today = (d = new Date()) => d.toLocaleDateString('en-CA')
  export type BenchStatus = 'no_words' | 'limit' | 'open'
  export function benchStatus(state: GameState, date: string): BenchStatus
  export function pickBenchTargets(state: GameState, date: string): BenchTarget[]
  export type BenchPayout = { word: string; check: BenchCheck; coins: number }
  export function benchPayouts(state: GameState, date: string, verdicts: BenchVerdict[]): BenchPayout[]
  // GameAction gains:
  //   { type: 'startBenchChat'; date: string; words: string[] }
  //   { type: 'awardBench'; date: string; verdicts: BenchVerdict[] }
  // newGame(level, lastWords = {}, learnedWords = [], benchDay: BenchDay | null = null)
  ```

- [ ] **Step 1: Write failing tests** in `src/game/bench-state.test.ts`:
  - `benchStatus`: no learned words → `'no_words'`; 4 chats today → `'limit'`; 4 chats on yesterday's date → `'open'`.
  - `pickBenchTargets`: with 5 learned words where two have `lastTested` (`'2026-11-10'`, `'2026-11-12'`) and three have none → returns the three untested first in notebook order, length 3; with 1 learned word → length 1; `paid` reflects today's `benchDay.paid`.
  - `startBenchChat` on date D: `chats` 0→1, resets `paid` and `chats` when `benchDay.date !== D`, sets `lastTested = D` on the named words only.
  - `benchPayouts` + `awardBench`: passed `use` for `menu` → 10 coins; passing it again same day → no payout, coins unchanged; `understand` for `menu` still pays 5; failed verdicts never pay; a word not in the notebook never pays.
  - **Review Focus 2:** award `use` for `menu` on D, then the same verdict on D+1 → pays 10 again and `benchDay.date === D+1`.
  - `playAgain`, `levelUp` keep `benchDay` and `lastTested`.
- [ ] **Step 2:** Add to `src/game/storage.test.ts`: round-trip with a `benchDay`; a save without `benchDay` loads `benchDay: null`; a malformed `benchDay` (`{date: 5}`) loads as `null` without rejecting the save; a learned word with non-string `lastTested` is dropped (existing broken-entry rule).
- [ ] **Step 3: Run** `bunx vitest run src/game` — expect FAIL.
- [ ] **Step 4: Implement.** `awardBench` uses `benchPayouts` so the UI and reducer agree; it resets the day record first if the date changed. Update `appReducer`'s `newGame` call to pass `state?.benchDay ?? null`. Update the existing "starts empty" test to include `benchDay: null`.
- [ ] **Step 5: Run** `bun run test` — expect all PASS.
- [ ] **Step 6: Commit** "Track daily bench chats, pick target words and pay bench checks".

### Task 4: Benches on the map

**Files:**
- Modify: `src/game/map.ts`, `src/game/movement.ts`, `src/game/path.ts`, `src/game/art.ts`
- Test: `src/game/map.test.ts`, `src/game/movement.test.ts`, `src/game/path.test.ts`

**Interfaces:**
- Consumes: `BenchId`, `BENCH_IDS` (Task 1).
- Produces:
  ```ts
  // map.ts
  export type Tile = … | 'bench'
  export interface Bench { benchId: BenchId; pos: Pos; outside: Pos }
  // CityMap gains: benches: Bench[]
  export function benchAt(map: CityMap, p: Pos): Bench | undefined
  export function benchOf(map: CityMap, benchId: BenchId): Bench
  // parseMap gains an optional 3rd arg benchLetters: Record<string, BenchId>
  // CITY row 4 becomes ',1,,.*.,,2,' with { '1': 'bac-tu', '2': 'sinh-vien' }
  // movement.ts: step(...) → { pos; enteredPlace?: string; enteredBench?: BenchId }
  // path.ts: findPath only steps onto a bench when it is the target; resolveTapTarget returns a tapped bench's pos
  // art.ts: BENCH_ART: Record<BenchId, { person: string }>   // { 'bac-tu': '🧓', 'sinh-vien': '👩‍🎓' }
  ```
- [ ] **Step 1: Write failing tests:** CITY has two benches at `{x:1,y:4}` and `{x:9,y:4}` with walkable `outside` tiles that are not benches; `isWalkable` is true for a bench; `step` onto `(1,4)` from `(1,3)` returns `enteredBench: 'bac-tu'`; `findPath` from start to `(0,4)` never passes through a bench; `resolveTapTarget(CITY, {x:9,y:4})` returns `{x:9,y:4}`; existing "every door within 12 steps" still holds and each bench is reachable within 12 steps.
- [ ] **Step 2: Run** `bunx vitest run src/game` — expect FAIL.
- [ ] **Step 3: Implement** (bench `outside` found like a door's; a bench needs exactly one occurrence per id).
- [ ] **Step 4: Run** `bun run test` — expect PASS.
- [ ] **Step 5: Commit** "Add park benches to the city map".

### Task 5: Sitting down on a bench (city screen)

**Files:**
- Modify: `src/components/game/CityScreen.tsx`
- Test: `src/components/game/CityScreen.test.tsx`

**Interfaces:**
- Consumes: `CITY.benches`, `benchAt`, `step(...).enteredBench` (Task 4); `BENCH_ART`, `BENCH_PERSONAS`.
- Produces: new prop `onEnterBench?: (benchId: BenchId) => void`, called **without** the door pause or fade (after the `STEP_MS` walk so the player visibly arrives).
- [ ] **Step 1: Write failing tests:** walking with keys onto `(1,4)` calls `onEnterBench('bac-tu')` once after `STEP_MS` and never calls `onEnterPlace`; the door-fade overlay stays `opacity-0`; tapping the right bench walks there and calls `onEnterBench('sinh-vien')`; the bench tile has `aria-label` "Nói chuyện với Bác Tư".
- [ ] **Step 2: Run** `bunx vitest run src/components/game/CityScreen.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement:** grass-coloured bench tile showing a 🪑-style bench (builder's art call, emoji or CSS) with the person emoji on it; entering a bench locks input like a door (`entered` ref) and calls `onEnterBench` after `STEP_MS`.
- [ ] **Step 4: Run** the test file — expect PASS.
- [ ] **Step 5: Commit** "Let the player sit down on a park bench".

### Task 6: Bench chat screen

**Files:**
- Create: `src/components/game/BenchChat.tsx`
- Test: `src/components/game/BenchChat.test.tsx`

**Interfaces:**
- Consumes: `requestBenchReply`, `BenchChatResult` (Task 2); `BenchTarget`, `BenchVerdict`, `BenchTurn`, `MAX_LEARNER_MESSAGES`, `MAX_MESSAGE_CHARS`, `BENCH_PERSONAS` (Task 1); `BenchStatus`, `BenchPayout` (Task 3); `BENCH_ART` (Task 4); `SpeechBubble`, `PrimaryButton`, `SecondaryButton`, `GhostButton` (`ui.tsx`).
- Produces:
  ```ts
  export function BenchChat(props: {
    benchId: BenchId
    level: Level
    status: BenchStatus
    targets: BenchTarget[]
    onStart: () => void                                   // called once, just before the first AI call
    onVerdicts: (verdicts: BenchVerdict[]) => BenchPayout[] // parent dispatches awardBench, returns what paid
    onLeave: () => void
    requestReply?: (req: BenchRequest) => Promise<BenchChatResult>  // defaults to requestBenchReply
  }): JSX.Element
  ```
- [ ] **Step 1: Write failing tests** with a mocked `requestReply`:
  - `status: 'no_words'` → shows "Cháu học vài từ ở các cửa hàng rồi quay lại nói chuyện với bác nhé!"-style fixed text (exact copy: builder's, Vietnamese + English via `Bi`), a leave button, and `requestReply`/`onStart` are never called. Same for `'limit'` ("come back tomorrow").
  - `'open'` → `onStart` called once, then the opening reply appears as a person bubble.
  - Sending "Cháu uống đá ạ" posts a learner bubble, calls `requestReply` with history ending in that learner turn; a reply with a passed verdict shows "+5 🪙" under that learner message when `onVerdicts` returns a 5-coin payout, and shows no pop when it returns `[]`.
  - **Review Focus 3:** Send is disabled for blank input; the input has `maxLength={200}`.
  - **Review Focus 4:** a failed reply shows the error and "Thử lại"; clicking it resends the same history; exactly one learner bubble for that text; `onVerdicts` not called for the failure.
  - After a reply with `done: true` (or the 10th learner message's reply), the input is gone and a summary lists each target as "đã dùng" / "đã hiểu" / "chưa" plus total coins earned this chat.
  - **Review Focus 5:** clicking Leave while a reply is pending, then resolving it → `onVerdicts` never called and no React state-update warning.
- [ ] **Step 2: Run** `bunx vitest run src/components/game/BenchChat.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement.** Header like `PlaceScreen` (person emoji, name via `Bi`, Leave). Person bubbles render `text` with `reply.text_en` as its `Bi` English (send `debug: useDebug()` in each request). A "typing…" bubble while waiting (reuse the `typing` markup from `PlaceScreen`). Track targets' paid checks locally after each payout so later requests send updated `paid`. Ignore late replies with an `alive` ref cleared on unmount/leave.
- [ ] **Step 4: Run** the test file — expect PASS.
- [ ] **Step 5: Commit** "Add the bench chat screen".

### Task 7: Wire benches into the game

**Files:**
- Modify: `src/components/VocabApp.tsx`
- Test: `src/components/VocabApp.test.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces: `Screen` gains `{ name: 'bench'; benchId: BenchId; targets: BenchTarget[]; status: BenchStatus }`. On `onEnterBench`, compute `status = benchStatus(game, today())` and `targets = pickBenchTargets(game, today())`, then switch screens. `onStart` dispatches `startBenchChat` with the target words; `onVerdicts` computes `benchPayouts(game, today(), v)`, dispatches `awardBench`, returns the payouts. Leaving returns to the city at `benchOf(CITY, benchId).outside`.
- [ ] **Step 1: Write a failing app test** (mock `@/lib/bench-api` like `@/lib/api` is mocked): with a save holding two learned words, walk onto the left bench, receive an opening reply, send a message, receive a passed `use` verdict for one word → coin total rises by 10; leave → player stands on the bench's outside tile; the saved game has `benchDay.chats === 1`. A second test: a save with `benchDay: { date: today(), chats: 4, paid: {} }` → the "come back tomorrow" text and no API call.
- [ ] **Step 2: Run** `bunx vitest run src/components/VocabApp.test.tsx` — expect FAIL.
- [ ] **Step 3: Implement** the wiring; `paused` for the city is unaffected (the bench is a separate screen).
- [ ] **Step 4: Run** `bun run test`, `npx tsc --noEmit -p .`, `bun run build` — all pass.
- [ ] **Step 5: Manual check** on `bun run dev` (http://localhost:8080): benches render on both lawns; walking onto one opens the chat without a fade; empty-notebook and limit messages show. Without `LOVABLE_API_KEY` the open chat shows the AI error and Leave still works.
- [ ] **Step 6: Commit** "Wire park bench chats into the game".
