// Raw, unlabelled sample emails. This is the pile that lands in a customer service
// mailbox on any given morning. Nothing here tells the classifier the answer: the
// dashboard sends these exact strings to the API and shows whatever comes back.
//
// The set is deliberately mixed: straightforward admin, indirect distress that never
// uses the word "debt", two that should honestly come back as unknown, and three traps
// designed to catch the classifier out.

export const SAMPLE_EMAILS = [
  {
    emailId: 'email-001',
    subject: 'Bill much higher than usual',
    body: "My bill is nearly double what I paid last month and nothing has changed in the house. Can you explain why is my bill so high?",
  },
  {
    emailId: 'email-002',
    subject: 'Meter reading',
    body: "My smart meter has stopped sending readings. I'd like to submit a reading myself so my next bill is accurate.",
  },
  {
    emailId: 'email-003',
    subject: 'Direct Debit date',
    body: "Could you change my payment date to the 28th? My salary lands on the 25th so the current date is awkward.",
  },
  {
    emailId: 'email-004',
    subject: 'Struggling',
    body: "I've recently lost my job and I'm struggling to keep up with my electricity costs. I don't know what to do.",
  },
  {
    emailId: 'email-005',
    subject: 'Medical equipment',
    body: "I need to keep my medical equipment running but I'm worried I won't have enough money for electricity this winter.",
  },
  {
    emailId: 'email-006',
    subject: 'Meter',
    body: "There isn't enough credit left on my prepayment meter and I don't get paid until Friday.",
  },
  {
    emailId: 'email-007',
    subject: 'Refund please',
    body: "I've overpaid for months and there is a lot of credit on my account. Can I get a refund back to my card?",
  },
  {
    emailId: 'email-008',
    subject: 'Hours cut',
    body: "My hours have been cut at work and I've fallen behind on my energy payments. Is there a payment plan you can offer?",
  },
  {
    emailId: 'email-009',
    subject: 'Tariff',
    body: "My fixed tariff ends next month. What will my new unit rate and standing charge be?",
  },
  {
    emailId: 'email-010',
    subject: 'Payment',
    body: "My payment failed this morning, I think my card was declined. How do I make a payment over the phone?",
  },
  {
    emailId: 'email-011',
    subject: 'Call me',
    body: "Hi, please give me a call back when you get a chance. Thanks.",
  },
  {
    emailId: 'email-012',
    subject: 'Moving',
    body: "We are moving house on the 14th. What do you need from me?",
  },
  // ---- Traps. These exist to prove the classifier is not just keyword spotting. ----
  {
    emailId: 'email-013',
    subject: 'Copy of bill',
    body: "I have no problem paying, I just want a copy of my bill for my records.",
  },
  {
    emailId: 'email-014',
    subject: 'Asking for a friend',
    body: "My neighbour lost his job, can you help him? He is not a customer of yours yet.",
  },
];
