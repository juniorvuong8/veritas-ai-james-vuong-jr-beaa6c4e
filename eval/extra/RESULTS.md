# Extra test set: results

A separate set of 6 cases, scored on its own and not mixed into the main result in `eval/RESULTS.md`. 2 of them (⚠️) were picked because the LLM had already failed that way several times in the rule tests (`eval/rule-tests/RESULTS.md`).

**Headline (both questions yes):** baseline 0%, LLM 83%. The LLM passed 2 of the 2 cases expected to make it fail.

| Case | Words | Baseline | LLM |
|---|---|---|---|
| `x-cafe-L2` | iced, large, change | fail (Q1 yes, Q2 no) | **pass** (Q1 yes, Q2 yes) |
| `x-supermarket-L3` | aisle, frozen, fresh, card | fail (Q1 yes, Q2 no) | **pass** (Q1 yes, Q2 yes) |
| `x-taxi-L1` | turn right, straight, stop here | fail (Q1 yes, Q2 no) | **pass** (Q1 yes, Q2 yes) |
| `x-clinic-L3` | allergy, insurance, prescription | fail (Q1 yes, Q2 no) | fail (Q1 yes, Q2 no) |
| `x-clinic-pain-L1` ⚠️ | pain, headache, sore throat | fail (Q1 yes, Q2 no) | **pass** (Q1 yes, Q2 yes) |
| `x-taxi-tip-L2` ⚠️ | address, traffic, tip | fail (Q1 yes, Q2 no) | **pass** (Q1 yes, Q2 yes) |

## Why the ⚠️ cases were expected to fail

- `x-clinic-pain-L1`: "pain" is a noun, but at level 1 the AI has three times dropped it into a Vietnamese sentence as a verb or adjective ("tai bên phải cũng pain", "Chỗ đó pain lắm", "đầu em cũng hơi bị pain": rule tests t028, t052, u028).
- `x-taxi-tip-L2`: The driver mixed up who is older ("Chị cho anh...") in five taxi lessons (t043, t065, t067, t075, t089), and a tip went without a thank-you in three (u023, u027, u035).

## Rater notes on dialogues that failed

- **LLM** `x-clinic-L3`: Doctor should respond to what the patient said about having a sore throat and fever before jumping straight to a prescription and then asking if she's allergic to any medicine.
- Baseline `x-cafe-L2`: employee saying two unrelated thing with no response from customer.
- Baseline `x-supermarket-L3`: What each person said is not related to what the other person said.
- Baseline `x-taxi-L1`: What each person said is not related to what the other person said.
- Baseline `x-clinic-L3`: Doctor asking multiple questions, and then made a couple of statement, and then ending. No churn from the patient.
- Baseline `x-clinic-pain-L1`: Doctor just ignore what the patient said and ask him to rest.
- Baseline `x-taxi-tip-L2`: What each person said is not related to what the other person said.

Same rating page, questions and limits as the main set. With 6 cases, one dialogue moves the headline by about 17 points.
