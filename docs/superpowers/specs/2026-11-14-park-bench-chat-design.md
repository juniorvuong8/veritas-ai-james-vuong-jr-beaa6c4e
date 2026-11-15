# Park bench chats — design

Date: 2026-11-14
Status: draft for approval

## Intent

People sit on benches on the town's lawns. Walking up to one opens a free-form chat: the learner types whatever they
like and the person answers. While chatting, the person deliberately works in English words from the learner's
notebook (📒) to check that those words really stuck — after the shop lesson, in a new setting. Getting a word right
earns coins.

Why: the shop quiz checks words right after a lesson. Bench chats are a later, disguised test of whether the learner
can still **understand** and **use** those words, which is exactly the project's north star ("Learners can use new
vocabulary in everyday real-life conversations"). The coins give a reason to sit down.

## Goals

- Two benches, one on each lawn, each with its own character.
- A free-form, AI-driven conversation (the learner types; the person replies to whatever they say).
- The person tests 2–3 notebook words per chat, each in up to two ways:
  - **Understanding check** (🪙 5): the person uses the word; the learner's reply shows they understood it.
  - **Using check** (🪙 10): the person sets up a moment where the natural reply needs the word; the learner says it.
- Visible feedback the moment a check is passed (a small coin pop under the learner's message), and a summary at the end.
- Limits that stop coin farming and cap AI cost.

## Non-goals

- Changing the north-star metric or counting bench chats toward it.
- Voice input, accounts, or server-side tracking of limits.
- Characters that walk around, or that remember earlier chats.
- Showing test history in the notebook (possible later).
- Penalties: a missed word never costs coins.

## Anti-goals (failure even if it "works")

- Players farming coins by repeating chats or words they already got right.
- The bench person turning into a general chatbot (homework help, off-topic, anything unsuitable for children).
- The person giving the answer away: in a using check, they must not say the word first.
- Learners feeling tricked or punished; the tone stays warm and encouraging.

## Decisions made with the user

- **Purpose:** a test that words were learned correctly, plus a way to earn coins.
- **Both check types** (understanding and using) — option C from the brainstorm.
- **Approach A:** the AI handles every message (see Approaches).
- **Limits** (user said "3–5 times a day, you decide"; Claude's call):
  - Up to **4 paid bench chats per local calendar day**. A chat counts when its first AI call is made, even if the
    learner leaves early. After 4, the bench person says (without an AI call) to come back tomorrow, and no chat opens.
  - Each word pays at most **once per day for understanding and once per day for using**. Repeats that day still get
    the AI's encouraging reaction but no coins.
  - Counts live in the save file; clearing browser data resets them. Accepted: no accounts exist.

## Approaches considered

- **A. AI on every message (chosen).** Each learner message goes to the server, which asks Claude for the person's
  reply plus structured verdicts (which word, which check, passed or not). Truly free-form and can adapt and hint; costs
  one AI call per message (1–3 s each) and the AI's judgement will occasionally be wrong. Chosen because free-form talk
  is the point; the message and daily caps bound cost.
- **B. Pre-planned chat, AI only grades.** One call writes the person's lines up front, then small calls grade each
  reply. Cheaper, faster, more predictable, but not really free-form — rejected as working against the idea.
- **C. Keyword matching, no AI judge.** Free and instant, but cannot test understanding and "using" can be gamed —
  dropped.

## How it works

### Map

- The lawns are the grass strips either side of the fountain (row 4 of `CITY_ROWS`, x 0–3 and x 7–10). Put one bench on
  each, e.g. at x 1 and x 9 (builder may adjust for looks), as a new map letter and tile kind.
- A bench behaves like a door: you "enter" it by stepping onto it (keys) or tapping it (walks there). Path-finding only
  steps onto a bench when it is the target, as with doors. No fade to black — the chat opens directly.
- Each bench shows its character (an emoji) on the tile. Two characters with distinct, friendly personas — e.g. an
  older neighbour ("Bác Tư", 🧓) and a student (👩‍🎓). Names, emoji and personas live in `src/game/art.ts` with the
  other art.

### Starting a chat

1. Notebook empty → the person says (fixed text, no AI) to go learn some words in the shops first. Close button only.
2. 4 paid chats already used today → fixed "come back tomorrow" message. Close button only.
3. Otherwise pick 2–3 target words from the notebook, preferring words tested longest ago (never-tested first), and
   open the chat. The person speaks first (the first AI call, which counts the chat toward today's limit).

### The conversation

- Same speech-bubble look as the shop dialogue (`SpeechBubble`), with a text box and Send button.
- Language follows the level, like the shops: levels 1–2 the person speaks Vietnamese with the English target words
  mixed in; level 3 simple English. The learner may write in Vietnamese or English at any level; an understanding check
  can be passed in Vietnamese, a using check needs the English word.
- Max **10 learner messages** per chat. The person wraps up naturally when every target word has had its using check
  passed, when the AI decides the chat is done, or at message 10.
- If the learner misses a word, the person can rephrase or hint once and move on; never reveal the answer before the
  learner tries.
- Off-topic or unsuitable messages: the person gently steers back to small talk; never produces unsuitable content.
- **Leave** is always available. Leaving early keeps coins already earned.
- End summary: coins earned this chat, and each target word marked understood / used / not yet.

### Coins and state

- Coins go through the existing `earnCoins` action, so the top bar total includes them.
- New save-file fields (old saves must still load, defaulting to empty):
  - per learned word: when it was last tested (to choose target words);
  - today's bench usage: the date, chats used, and which words already paid for understanding / using today. Reset
    when the date changes.
- The game, not the server, applies the caps: it receives verdicts and pays only what today's limits allow.

### Server

- A new server function (pattern: `src/lib/word-fit.functions.ts`) taking: bench id, level, target words (English word
  + Vietnamese meaning), the conversation so far, and the debug flag.
- It returns the person's reply (plus English gloss in debug mode), the verdicts for the learner's latest message
  (`{ word, check: 'understand' | 'use', passed }[]`), and whether the chat is done. Errors reuse the existing error
  codes and Vietnamese messages.
- Server-side checks before calling the AI: target words valid (existing `wordProblem`), 1–3 of them, history no longer
  than the caps allow, each learner message ≤ 200 characters. After: drop any verdict for a word that is not a target or
  for an unknown check type; reject malformed output and retry once, as lesson generation does.
- The system prompt holds the persona, level language rules, both check types, "don't give the answer away",
  child-safety and steer-back rules, and the strict JSON output shape.
- `ChatMessage` today only has `system` and `user` roles, and `createGatewayAiCaller` drops everything but user turns.
  The chat needs the person's previous replies too: either add an `assistant` role through the caller, or send the
  transcript inside one user message. Builder's choice.

### Errors and offline

- On an AI failure, show the error under the last message with **Try again** (resends the same message); no coins.
- Without `LOVABLE_API_KEY` (local dev), the chat shows the error; the rest of the game is unaffected.

## Smaller calls (Claude's, from the builder review)

- **Limits survive new rounds.** "Play again", "level up" and "new game" rebuild the game state; today's bench usage
  and per-word last-tested dates carry over like the notebook does, so restarting can't reset the caps.
- **Small notebooks.** Target 2–3 words, but use whatever is there: a notebook with 1 word gives a 1-word chat.
- **"Last tested"** is recorded when a word is picked as a target at the start of a chat.
- **Each check pays only on its own verdict.** Passing a using check does not also pay the understanding check. A word
  counts as finished for wrap-up once its using check passes.
- **Already-paid words.** The request tells the AI which target words have already paid today (per check), so it can
  favour the others; the game shows no coin pop for them and still applies the caps itself.
- **Trusting the transcript.** The browser sends the whole conversation, so a player could fake earlier replies.
  Accepted: coins live in browser storage, which a player can already edit, and server-side tracking is a non-goal.

## Left to the builder

- Exact bench positions, tile art, and character names/emoji beyond the examples.
- Assistant-role vs transcript-in-one-message (above).
- Token limit for chat calls, and whether to show a "typing…" indicator (recommended).
- Test structure. Expect unit tests for the prompt, request validation, verdict filtering and the daily-limit reducer
  logic, plus component tests for the chat screen with the API mocked, following the existing patterns.
