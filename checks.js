// Demo checks, not a test suite and not a measure of classifier quality.
// These are emails we wrote ourselves, so they prove the wiring and the rules we already
// know about. Real quality needs a few hundred anonymised emails labelled by actual
// agents, then precision and recall per category.

import { classifyEmail } from './src/classify.js';

const CASES = [
  // The three examples given in the brief.
  { body: "I've recently lost my job and I'm struggling to keep up with my electricity costs.",
    category: 'debt', review: true, note: 'indirect: never says debt' },
  { body: "I need to keep my medical equipment running but I'm worried I won't have enough money for electricity.",
    category: 'debt', review: true, note: 'medical dependency' },
  { body: "There isn't enough credit left on my prepayment meter and I don't get paid until Friday.",
    category: 'debt', review: true, note: 'prepay credit risk' },
  // Ordinary admin must NOT be dragged into debt.
  { body: 'Could you change my payment date to the 28th please?',
    category: 'payment', review: false, note: 'routine Direct Debit' },
  { body: 'My bill is nearly double what I paid last month, can you explain?',
    category: 'billing', review: false, note: 'routine billing' },
  // Honest unknown.
  { body: 'Hi, please give me a call back when you get a chance.',
    category: 'unknown', review: false, note: 'no signals, do not guess' },
  // Traps.
  { body: 'I have no problem paying, I just want a copy of my bill for my records.',
    category: 'billing', review: false, note: 'trap: cancelling phrase' },
  { body: 'My neighbour lost his job, can you help him?',
    category: 'unknown', review: false, note: 'trap: third party' },
  { body: 'I do not need medical equipment, please remove that from my account.',
    category: 'unknown', review: false, note: 'trap: negated need' },
];

let passed = 0;
const rows = [];

CASES.forEach((c, i) => {
  const r = classifyEmail({ emailId: `check-${String(i + 1).padStart(3, '0')}`, body: c.body });
  const catOk = r.category === c.category;
  const revOk = r.vulnerability === c.review;

  // Every quoted keyword must appear character for character in the original email.
  const verbatim = r.keywords.every((k) => c.body.includes(k));
  const ok = catOk && revOk && verbatim;
  if (ok) passed += 1;

  rows.push({
    '': ok ? 'PASS' : 'FAIL',
    case: c.note,
    category: `${r.category}${catOk ? '' : ` (want ${c.category})`}`,
    review: `${r.vulnerability}${revOk ? '' : ` (want ${c.review})`}`,
    verbatim: verbatim ? 'yes' : 'NO',
    keywords: r.keywords.join(' | ') || '-',
  });
});

console.table(rows);
console.log(`${passed}/${CASES.length} passed`);
process.exit(passed === CASES.length ? 0 : 1);
