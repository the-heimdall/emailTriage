import { test } from 'node:test';
import assert from 'node:assert/strict';

import { classifyEmail } from '../src/classify.js';

// The same nine cases as the old checks.js. Each one now says what goes wrong for a
// customer if it ever fails, so a red test explains its own importance.
const CASES = [
  { body: "I've recently lost my job and I'm struggling to keep up with my electricity costs.", category: 'debt', review: true, risk: 'indirect hardship is missed' },
  { body: "I need to keep my medical equipment running but I'm worried I won't have enough money for electricity.", category: 'debt', review: true, risk: 'medical dependency is missed' },
  { body: "There isn't enough credit left on my prepayment meter and I don't get paid until Friday.", category: 'debt', review: true, risk: 'customer self-disconnects' },
  { body: 'Could you change my payment date to the 28th please?', category: 'payment', review: false, risk: 'routine admin is treated as debt' },
  { body: 'My bill is nearly double what I paid last month, can you explain?', category: 'billing', review: false, risk: 'billing query lands in the wrong queue' },
  { body: 'Hi, please give me a call back when you get a chance.', category: 'unknown', review: false, risk: 'the tool guesses instead of asking a human' },
  { body: 'I have no problem paying, I just want a copy of my bill for my records.', category: 'billing', review: false, risk: 'cancelling phrase is ignored' },
  { body: 'My neighbour lost his job, can you help him?', category: 'unknown', review: false, risk: 'third party is flagged as the customer' },
  { body: 'I do not need medical equipment, please remove that from my account.', category: 'unknown', review: false, risk: 'negated need is flagged' },
];

// One test per case, so a failure names exactly which case broke.
for (const c of CASES) {
  test(`${c.category}, review ${c.review}: guards against "${c.risk}"`, () => {
    const result = classifyEmail({ emailId: 't-1', body: c.body });
    assert.equal(result.category, c.category);
    assert.equal(result.vulnerability, c.review);
  });
}

// Evidence shown to an agent must be the customer's own words, never invented.
test('every keyword is quoted word for word from the original email', () => {
  for (const c of CASES) {
    const result = classifyEmail({ emailId: 't-2', body: c.body });
    for (const k of result.keywords) assert.ok(c.body.includes(k), `"${k}" is not in the email`);
  }
});
