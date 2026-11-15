# Conversation rule tests

100 fixed test cases (`cases.json`, seeded, written before any lesson was generated) were run through the **live app** (veritas-ai-james-vuong-jr.lovable.app). `drive.mjs` plays it in a headless browser like a player would: it picks the place, level and words (including custom words, which go through the app's word check), starts the conversation, and saves the lesson the server returns (`lessons/tNNN.json`). Cases cover all 4 places, all 3 levels, and 3 to 5 words; about 30% include a custom word typed in English or Vietnamese.

Each lesson was checked against every rule that had not failed yet, in case order. A rule stopped being tested at its first failing case, so "Tests" is the number of cases checked against that rule.

| Rule | Result | Tests | First failing case |
|---|---|---|---|
| 1. A reply ignores or misunderstands what the other person just said | **No failure found** | 100 | none |
| 2. Several different questions before the other person can answer | Fails (mild) | 17 | t017 |
| 3. A turn combines unrelated thoughts or jumps topic without a transition | Fails | 6 | t006 |
| 4. A reply addresses part of a request and silently drops the rest | Fails | 60 | t060 |
| 5. A question or request stays unresolved | Fails | 20 | t020 |
| 6. A social cue (tip, apology, thanks) is not acknowledged | Fails | 15 | t015 |
| 7. A later turn forgets or contradicts an earlier detail | Fails | 74 | t074 |
| 8. A speaker acts on information not shared yet | Fails | 1 | t001 |
| 9. Something doesn't fit the speaker's role or relationship | Fails | 43 | t043 |
| 10. A target word is omitted, misused or used in another sense | Fails | 28 | t028 |
| 11. A target word is forced in with no natural reason | Fails | 6 | t006 |
| 12. Sounds like a vocabulary exercise (overexplaining, repeating) | Fails | 1 | t001 |
| 13. Skips a step, jumps ahead or ends before the goal | Fails | 5 | t005 |

## The failing cases

Each case has a screenshot in `screenshots/tNNN.png`: the saved lesson shown in the app's own conversation screen, with the lines that break the rule outlined in red.

**Rule 2, t017 (café, level 2).** The staff member asks two different questions in one turn: "Chị muốn uống gì ạ? Chị ngồi uống ở đây hay to go ạ?" ("What would you like to drink? Will you drink here or to go?"). The customer answers both, so this is the mild form. t085 line 3 is the same pattern. No case had three or more questions piling up the way the baseline's did.

**Rule 3, t006 (supermarket, level 2).** In line 3 the cashier jumps from unrequested advice to the total with no transition: "Hôm nào chị mua ít thì dùng a basket xách tay cho nhẹ nhé. Của chị tổng cộng 45 đô ạ." ("On days you buy less, use a basket so it's lighter. Your total is $45.")

**Rule 4, t060 (clinic, level 3).** The patient says "I have a sore throat and a fever." The doctor prescribes "medicine for your throat" and never mentions the fever. (In t068 the doctor treats both, so the model can do it.)

**Rule 5, t020 (clinic, level 2).** The patient's last line is a question that never gets an answer: "Nếu ba ngày nữa em vẫn còn fever thì em đặt another appointment để gặp lại bác sĩ được không ạ?" ("If I still have a fever in three days, can I book another appointment?") t095 also ends on an unanswered question about the fare.

**Rule 6, t015 (taxi, level 1).** The passenger gives a $5 tip and thanks the driver in the last line: "Em gửi anh 35 đô, 5 đô dư là tip…" ("Here's $35, the extra $5 is a tip"). The driver never responds. t019, t043, t051, t059 and t087 also end on an unacknowledged tip. In t031, t039 and t099 the driver does say thank you.

**Rule 7, t074 (supermarket, level 1).** Line 5 tells the customer to pay at the checkout. Line 7, from the same floor staff member, hands her a receipt "ghi các món chị mua và số tiền chị đã trả" ("listing what you bought and the amount you paid"), though she hasn't paid.

**Rule 8, t001 (café, level 1).** The staff member gives the price and says the customer already handed over $5 in the same breath: "Dạ, của chị 4 đô. Chị đưa em 5 đô, vậy em gửi lại chị 1 đô change ạ." ("That's $4. You gave me $5, so here's $1 change.") The customer paid before hearing the price and never says so. Common: the same thing happens in t025, t057 and t069.

**Rule 9, t043 (taxi, level 2).** The driver's pronouns contradict each other: "Chị cho anh the address nhé" ("You, older sister, give me, older brother, the address"). That claims both that the passenger is older and that the driver is older. A native speaker notices this. Similar mixed pronouns appear in t065, t067, t075 and t089.

**Rule 10, t028 (clinic, level 1).** "pain" is taught as a noun (cơn đau, "a pain"). The patient uses it as a verb: "tai bên phải cũng pain" ("my right ear also pain"). The same misuse appears in t052: "Chỗ đó pain lắm."

**Rule 11, t006 (supermarket, level 2).** "basket" is forced in. The customer has a full cart and is paying, yet the cashier adds: "Hôm nào chị mua ít thì dùng a basket…" ("On days you buy less, use a basket…"). Others: "wifi" (t033), "for here" (t053) and "frozen" (t022).

**Rule 12, t001 (café, level 1).** "Cho chị xin thêm một tờ napkin để lau tay với lau miệng nhé." ("Can I have a napkin to wipe my hands and mouth?") Nobody explains what a napkin is for. This was the most common problem in the test set:
- "Here is the paper that shows what you paid." (t009)
- "What is the price? How much are they?" (t010, t034)
- "frozen fish… is very cold and hard like ice" (t022)
- "Please turn left. Go left, not right." (t011)

It comes from the prompt's context-clue rule; the clues are often spelled out instead of hinted.

**Rule 13, t005 (café, level 2).** The customer orders, and in the very next turn her cup is already empty and she asks for a refill. Paying, getting the drink and drinking it are all skipped. Common: in many cases the customer is handed the drink, or the ride ends, without paying (t013, t017, t029, t046, t055 and others).

## Limits
- One judge: Claude, reading each conversation. Not a native Vietnamese speaker. The two borderline calls are rule 2 (two questions in one turn, both answered) and rule 8 (paying before the price is said).
- Every case ran once, so a rule with no failure (rule 1) may still fail on other inputs.
- t001 was generated three times because of a decoding bug in the driver; only the third lesson is saved.
- `drive.mjs` imports Playwright from a temporary scratchpad folder; point that import at any Playwright install to rerun it.
