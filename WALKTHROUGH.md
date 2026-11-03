# Feature walkthrough

Three layers. Layer 1 is a 30 second skim. Layer 2 is what to click. Layer 3 is the part
that teaches: what each output actually means in the UK energy market.

Every number below was read off the running service, not from memory.

---

## Layer 1: feature table

| Feature | What it does | Why it matters to the business | Where to see it |
|---|---|---|---|
| Show seed samples | Displays the 14 raw emails exactly as sent to the API, with the verdict beside each one | Lets anyone check the input against the output without reading code | Grey button, top right |
| Seed sample emails | Pulls 14 raw, unlabelled emails and sends them to the classifier | Shows the whole job in one click: unsorted pile in, triaged board out | Blue button, top right |
| Category classification | Sorts each email into billing, payment, debt or unknown | An agent opens the right queue instead of reading everything | The four columns |
| Review flag | Marks emails whose wording suggests the customer may be struggling | These are the customers a supplier has a duty of care towards. Missing one is the expensive mistake | Amber POSSIBLE - REVIEW badge |
| Plain-English description | One sentence explaining the verdict | An agent can agree or disagree in two seconds without reading code | Grey line on every card |
| Evidence chips | The customer's own words that drove the decision | Makes the machine auditable. Nothing is invented | Blue chips at the bottom of each card |
| Honest unknown | Refuses to guess when signals are weak or tied | A wrong confident answer is worse than an admitted gap | The unknown column |
| Click to expand | Shows the raw email and the score for each signal | Lets an agent check the machine rather than trust it | Click any card |
| Derived columns | Columns and counts come from whatever the API returns | Adding a category later needs no UI or API change | Proven by adding one signal |

**What this pill deliberately does not do:** no database, no login, no mailbox
integration, no automated contact with any customer, and no machine learning. It reorders
a queue and stops.

---

## Layer 2: visual check list

| Do this | You should see |
|---|---|
| Open http://localhost:5173 | Empty board, a grey and a blue button |
| Click **Show seed samples** | A table of 14 rows: email id and subject, the exact body sent to the API, and the verdict. Before seeding the right column reads "not classified yet" |
| Click **Seed sample emails** | Five tiles then four columns of cards, populated in under a second |
| Read the tiles | Debt 4, Billing 4, Payment 3, Unknown 3, Flagged for review 4 |
| Look at the debt column | Every card carries an amber POSSIBLE - REVIEW badge |
| Find email-004, "Struggling" | Chips read `lost my job`, `struggling to keep up`, `don't know what to do` |
| Click email-004 | The raw email drops down, plus each signal with its score |
| Find email-013, "Copy of bill" | Sits in **billing**, no badge, description explains it also says "no problem paying" |
| Find email-014, "Asking for a friend" | Sits in **unknown**, no badge, mentions "My neighbour" |
| Look at email-011 and email-012 | In unknown, chip reads "no signals found" |
| Read the footer | The assistive-only scope line |

---

## Layer 3: what the outputs actually mean

### Output 1: the four debt cards, each with an amber badge

**What you see.** Four cards in the debt column, every one badged POSSIBLE - REVIEW:
email-004 "Struggling", email-005 "Medical equipment", email-006 "Meter", email-008
"Hours cut". The tile on the right reads 4 flagged for review.

**What it means.** In UK energy, *debt* here means the customer may not be able to pay for
the energy they are using. Not one of those four emails contains the word "debt", "arrears"
or "behind on payments" as an opening complaint. They describe situations: a job lost,
hours cut, a prepayment meter running dry, a medical device that has to stay powered.
The system read the situation, not the vocabulary.

**Why it matters.** Energy debt is not like other debt, because the product keeps being
delivered whether or not the customer can pay, and disconnection or self-disconnection has
physical consequences: a cold home, spoiled medication, a device that stops. Suppliers are
expected to identify customers in vulnerable situations and support them. An email that
sits unread for four days is the failure mode this screen exists to prevent.

**What logic it proves.** That classification is driven by signals, not keywords. Each
signal is a situation with many phrasings, so "made redundant", "hours have been cut" and
"been let go" all vote for the same conclusion. Signals add up: email-004 scores debt 6
from two independent signals, which is what makes the verdict confident rather than lucky.

**How to explain it in the demo.** "None of these four emails uses the word debt. They
describe a situation, and the classifier scores situations, which is why it catches the
customer who would never call themselves in debt."

---

### Output 2: email-005, medical equipment plus money worry

**What you see.** Card email-005. Chips read `won't have enough money` and
`medical equipment`. Description: "Possible money trouble. Email mentions being unable to
afford energy and mentions relying on electricity for medical equipment."

**What it means.** The customer depends on mains electricity for a medical device and is
worried they cannot afford to run it. In UK energy this is the highest-priority
combination there is. Suppliers keep a **Priority Services Register**, a free list of
customers who need extra support, and medical dependency on electricity is a standard
reason to be on it.

**Why it matters.** For every other customer, running out of energy is expensive and
miserable. For this one it is a health event. This is exactly the email that must not be
forty-eighth in a queue sorted by arrival time.

**What logic it proves.** That vulnerability is modelled as a **separate flag, not a
category**. The medical signal votes for no category at all, because depending on a
device says nothing about whether the email is a billing question. If vulnerability were
a fifth category we would have to choose between "this is about money" and "this person
has a medical dependency", and would lose the more important half.

**How to explain it in the demo.** "Category and vulnerability are two different
questions, so I answer them separately. A customer can have a routine billing query and
still depend on a medical device."

---

### Output 3: email-006, the prepayment meter card

**What you see.** Card email-006 "Meter". Chips read `don't get paid until` and
`credit left on my prepayment`. It lands in **debt**, badged for review.

**What it means.** A **prepayment meter** is pay-before-you-use: the customer tops up a
meter, and when the credit reaches zero the supply stops. This customer has almost no
credit and no money coming in until Friday. Read literally the email is about a meter.
Read for meaning it is a household about to lose power.

**Why it matters.** When a prepayment customer runs out of credit, nobody gets a warning
letter. The lights just go off, and it does not show up in arrears reporting because there
is no unpaid bill: the customer simply stops buying energy. The industry calls this
**self-disconnection**, and it is invisible unless somebody notices an email like this one.

**What logic it proves.** That two moderate signals combine into one confident verdict:
prepayment credit low scores 3, the cashflow gap scores 2, total 5 with nothing competing.
It also shows why the word "meter" alone is not enough. Email-002 also says meter and
correctly lands in billing, because its signals are about readings, not credit.

**How to explain it in the demo.** "Both of these emails mention a meter. One is a
prepayment customer hours from losing supply, the other wants to send a reading, and the
classifier separates them on meaning rather than on the word."

---

### Output 4: email-013, the trap that stays in billing

**What you see.** Card email-013 "Copy of bill" sits in **billing** with **no** badge.
The email reads: "I have no problem paying, I just want a copy of my bill for my records."
The description ends: `No review flag: the email also says "no problem paying"`.

**What it means.** The customer explicitly said they can pay. Naive keyword matching sees
"paying" and "bill" and drags this into a hardship queue.

**Why it matters.** False alarms are how a triage tool dies. If agents open ten flagged
emails and eight are fine, they stop trusting the flag, and then a real one gets missed
too. Precision on the flag protects the value of the flag.

**What logic it proves.** That cancelling phrases are modelled as signals with a
**negative weight**, rather than by writing a general negation parser. "No problem paying"
scores debt minus 4, which cancels the hardship reading. And crucially the suppression is
**stated on the card**, so an agent can disagree with it. A silently suppressed flag would
be the worst outcome in the whole system.

**How to explain it in the demo.** "I did not write a negation parser, I made the
cancelling phrases signals with a negative score, and I show on the card whenever a flag
was suppressed so a human can overrule it."

---

### Output 5: the unknown column, three cards

**What you see.** Three cards under UNKNOWN: email-011 "Call me", email-012 "Moving",
email-014 "Asking for a friend". Chips read "no signals found".

**What it means.** The system does not know. "Please give me a call back" carries no
routable content. "We are moving house" is a real request but not one of our four
categories. The neighbour email is about somebody who is not the account holder.

**Why it matters.** In a triage system, a wrong confident answer costs more than an
admitted gap. An email misfiled into billing gets handled as a billing query by an agent
who never sees the real problem. An email in unknown gets read by a human, which is the
correct outcome when the machine has nothing useful to say.

**What logic it proves.** Two independent routes to unknown: a top score below the bar of
2, or the top two categories within 1 point of each other. It also shows the deliberate
gap: "moving house" is a genuine energy category, **change of tenancy**, that we simply
have not built. It goes to unknown rather than being forced into the nearest bucket, which
is precisely the behaviour the brief asked for.

**How to explain it in the demo.** "Unknown is a real answer, not a failure. Moving house
is a category I have not built yet, so it goes to a human instead of being forced into
billing."

---

### Output 6: the evidence chips on every card

**What you see.** Blue chips under each description. For email-005 they read
`won't have enough money` and `medical equipment`, with the apostrophe intact.

**What it means.** These are the exact characters from the customer's own email, sliced
out of the original text. They are not paraphrases and not reconstructions.

**Why it matters.** An agent reviewing a flagged email has seconds. Seeing the three words
that caused the flag lets them agree or overrule instantly. It also means a decision can be
explained afterwards to a complaints team or a regulator, in the customer's own words.

**What logic it proves.** Matching happens on a tidied copy of the text, where "I've" has
become "i have" and punctuation is stripped, so one stored phrase catches many phrasings.
But the tidier also keeps an index map back to the original, so the evidence quoted is the
raw email. That is why the chip says `won't have enough money` and not
`will not have enough money`. The check script asserts this on every case: every keyword
must appear character for character in the original body.

**How to explain it in the demo.** "I match against a normalised copy so one phrase catches
many spellings, but I quote back from the original, so the evidence is literally what the
customer typed."

---

### Output 7: the tiles, and why they are not hardcoded

**What you see.** Five tiles: Debt 4, Billing 4, Payment 3, Unknown 3, and Flagged for
review 4. Fourteen emails, and 4 plus 4 plus 3 plus 3 is 14.

**What it means.** A first-pass view of the morning's mailbox: roughly a third of it needs
a money conversation, and four emails need somebody to look sooner.

**Why it matters.** This is the number a team leader actually uses. It sizes the day and
tells them how many people to put on hardship calls before lunch.

**What logic it proves.** The summary is built by counting whatever categories came back,
not from a hardcoded list of four. Verified: changing the prepayment signal's category
from `debt` to `prepayment` produced
`{"billing":4,"payment":3,"debt":3,"prepayment":1,"unknown":3}` from a one-word edit, and
the dashboard renders one column per key it receives. That was tested at the API level and
then reverted.

**How to explain it in the demo.** "Adding a category is one object in one file, because
nothing downstream has a hardcoded list of categories."

---

## Mechanical UI, one line each

- **Show seed samples button.** Toggles a table of the raw input beside its verdict. Fetches once, then toggles.
- **Seed sample emails button.** Fetches the raw pile, posts it to the batch route, renders the response. Disabled while in flight.
- **Clicking a card.** Expands the raw email and the per-signal scores. Click again to close.
- **Empty state.** Before seeding, one line telling you what the button will do.
- **Error state.** If the API is not running on 3005, the page says so and names the port.
- **Footer.** The assistive-only scope, on screen at all times.
