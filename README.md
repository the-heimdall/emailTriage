# Customer email triage pill

Assistive first-pass triage for inbound customer emails. Classifies intent, flags emails
containing language that suggests financial distress, and returns the customer's own words
as evidence.

## Scope and limits, read this first

- **This is an assistive tool. It reorders a human queue.** It never closes a case, never
  writes to an account, never sends a letter or a text, and never triggers any action
  against a customer.
- **`vulnerability: true` is not a finding.** It means this email contains language worth
  a human look. The customer has not been assessed. The payload carries
  `vulnerabilityStatus` and the dashboard badge reads POSSIBLE - REVIEW for that reason.
- **Not a regulatory or compliance decision engine.** Ofgem expects suppliers to have
  governance, training, recording and quality assurance around identifying customers in
  vulnerable situations. This feeds that process, it does not replace any part of it.
- **The bundled tests prove wiring, not quality.** They are emails we wrote ourselves.
  Real accuracy needs a few hundred anonymised, agent-labelled emails and per-category
  precision and recall.
- **CORS is dev-scoped** to `http://localhost:5173` and must be narrowed or removed before
  any deployment. There is no wildcard.

## Run it

```bash
npm --prefix customer-email-triage-pill start        # API on 3005
npm --prefix customer-email-triage-pill/web run dev  # dashboard on 5173
npm --prefix customer-email-triage-pill test         # 12 unit tests
```

## Routes

| Route | Takes | Gives back |
|---|---|---|
| `GET /api/samples` | nothing | 14 raw, unclassified emails |
| `POST /api/classify` | `{ emailId, body }` | one classification |
| `POST /api/classify/batch` | `{ emails: [...] }`, max 100 | results, derived summary, review count |

Validation: `emailId` and `body` are required, `body` is capped at 10,000 characters and
rejected rather than truncated, batches are capped at 100, and malformed JSON returns a
clean 400 with no stack trace. Inside a batch, a bad row fails on its own.

## Where to change things

`src/signals.js` is the whole brain. A signal is one real-life situation plus the ways a
customer might phrase it. Adding a category means adding objects with a new `category`
string: the API summary and the dashboard columns are both derived from what actually
comes back, so no other file changes.
