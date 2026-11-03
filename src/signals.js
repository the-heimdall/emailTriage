// THE WHOLE BRAIN LIVES IN THIS FILE.
//
// A "signal" is one real-life situation plus the many ways a customer might phrase it.
// We do not look for category words. A customer in debt almost never writes "debt";
// they write "I lost my job". So we detect the situation and infer the category.
//
// To add a category later, add objects with a new `category` string. Nothing else in the
// codebase needs to change: the API summary and the dashboard columns are both derived
// from whatever categories actually come back.
//
// Fields:
//   category - which bucket this situation votes for
//   weight   - how strongly. Negative weight = a phrase that CANCELS a wrong reading.
//   review   - does this situation mean a human should look sooner?
//   says     - observational wording for the description. "mentions X", never "has X",
//              because a phrase in an email is evidence, not a proven fact about a person.

export const SIGNALS = [
  // ---------------------------------------------------------------- debt / hardship
  {
    id: 'income_loss',
    category: 'debt',
    weight: 3,
    review: true,
    says: 'mentions job or income loss',
    phrases: [
      'lost my job', 'losing my job', 'made redundant', 'been laid off', 'laid off',
      'redundancy', 'hours have been cut', 'hours were cut', 'no longer working',
      'out of work', 'been let go', 'lost my income', 'my income has stopped',
    ],
  },
  {
    id: 'cannot_afford',
    category: 'debt',
    weight: 3,
    review: true,
    says: 'mentions being unable to afford energy',
    phrases: [
      'can not afford', 'cannot afford', 'struggling to pay', 'struggling to keep up',
      'struggle to pay', 'struggling with', 'can not keep up', 'unable to pay',
      'do not have enough money', 'not have enough money', 'no money for',
      'choosing between', 'heat or eat', 'can not manage the cost',
    ],
  },
  {
    id: 'cashflow_gap',
    category: 'debt',
    weight: 2,
    review: true,
    says: 'mentions having no money until a future pay date',
    phrases: [
      'until i get paid', 'do not get paid until', 'not get paid until',
      'until payday', 'until my wages', 'until my benefits', 'waiting for universal credit',
      'nothing until friday', 'nothing until monday',
    ],
  },
  {
    id: 'arrears',
    category: 'debt',
    weight: 3,
    review: true,
    says: 'mentions arrears or missed payments',
    phrases: [
      'in arrears', 'behind on my', 'fallen behind', 'missed payments', 'missed a payment',
      'outstanding balance i can not', 'debt', 'owe you', 'repayment plan', 'payment plan',
    ],
  },
  {
    id: 'hardship_distress',
    category: 'debt',
    weight: 2,
    review: true,
    says: 'mentions financial hardship or distress',
    phrases: [
      'financial hardship', 'financial difficulty', 'financial difficulties',
      'really worried about', 'desperate', 'at my wits end', 'do not know what to do',
      'terrified', 'scared i will', 'cutting back on',
    ],
  },

  // ---------------------------------------------------------------- prepayment meter
  // Prepayment meter: the customer pays before using energy by topping up a meter.
  // When the credit runs out the supply stops, so low credit is urgent, not admin.
  {
    id: 'prepay_credit_low',
    category: 'debt',
    weight: 3,
    review: true,
    says: 'mentions low or exhausted prepayment meter credit',
    phrases: [
      'not enough credit', 'no credit left', 'run out of credit', 'ran out of credit',
      'credit left on my prepayment', 'credit left on my meter', 'top up', 'topping up',
      'emergency credit', 'meter has gone off', 'supply has gone off',
    ],
  },

  // ---------------------------------------------------------------- vulnerability only
  // This one carries no category vote. Depending on a medical device says nothing about
  // whether the email is a billing question. It only says a human should look sooner.
  {
    id: 'medical_equipment',
    category: null,
    weight: 0,
    review: true,
    says: 'mentions relying on electricity for medical equipment',
    phrases: [
      'medical equipment', 'oxygen concentrator', 'oxygen machine', 'dialysis',
      'stairlift', 'nebuliser', 'ventilator', 'life support', 'medication in the fridge',
      'medicine in the fridge', 'my equipment running', 'powered wheelchair',
    ],
  },

  // ---------------------------------------------------------------- billing
  {
    id: 'bill_query',
    category: 'billing',
    weight: 3,
    review: false,
    says: 'queries the bill amount or a statement',
    phrases: [
      'my bill is', 'this bill', 'the bill i received', 'bill seems', 'bill looks',
      'overcharged', 'charged twice', 'estimated bill', 'copy of my bill', 'my statement',
      'higher than usual', 'double what', 'why is my bill',
    ],
  },
  {
    id: 'meter_reading',
    category: 'billing',
    weight: 2,
    review: false,
    says: 'is about meter readings',
    phrases: [
      'meter reading', 'meter readings', 'submit a reading', 'give you a reading',
      'smart meter is not sending', 'smart meter has stopped', 'actual reading',
    ],
  },
  {
    id: 'tariff',
    category: 'billing',
    weight: 2,
    review: false,
    says: 'asks about the tariff or unit rates',
    phrases: [
      'my tariff', 'fixed tariff', 'standing charge', 'unit rate', 'price per kwh',
      'switch tariff', 'tariff ends',
    ],
  },

  // ---------------------------------------------------------------- payment
  {
    id: 'direct_debit',
    category: 'payment',
    weight: 3,
    review: false,
    says: 'is about a Direct Debit arrangement',
    phrases: [
      'direct debit', 'monthly payment date', 'change the date', 'change my payment date',
      'cancel my direct debit', 'set up a direct debit', 'increase my payments',
      'reduce my monthly payment',
    ],
  },
  {
    id: 'payment_mechanics',
    category: 'payment',
    weight: 2,
    review: false,
    says: 'is about making or receiving a payment',
    phrases: [
      'payment failed', 'card was declined', 'pay by card', 'make a payment',
      'refund', 'credit on my account', 'overpaid', 'payment did not go through',
    ],
  },

  // ---------------------------------------------------------------- cancelling phrases
  // Rather than writing a general negation parser (which is where small classifiers
  // usually break), we treat the handful of phrases that reverse a reading as signals
  // with a negative weight. Small, readable, and easy to extend when a real false
  // positive turns up.
  {
    id: 'no_payment_problem',
    category: 'debt',
    weight: -4,
    review: false,
    cancelsReview: true,
    says: 'states they are able to pay',
    phrases: [
      'no problem paying', 'not struggling', 'happy to pay', 'able to pay',
      'no trouble paying', 'i can afford',
    ],
  },
  {
    id: 'no_medical_need',
    category: null,
    weight: 0,
    review: false,
    cancelsReview: true,
    says: 'states no reliance on medical equipment',
    phrases: [
      'do not need medical equipment', 'not need medical equipment',
      'no medical equipment', 'remove the medical',
    ],
  },
  {
    id: 'third_party',
    category: 'debt',
    weight: -3,
    review: false,
    cancelsReview: true,
    says: 'appears to describe someone other than the account holder',
    phrases: [
      'my neighbour', 'my neighbor', 'a friend of mine', 'my colleague',
      'someone i know', 'my mate',
    ],
  },
];

// Scoring rules, kept next to the data they govern so they are easy to tune.
export const MIN_SCORE = 2;   // below this we are guessing, so we return unknown
export const MIN_MARGIN = 1;  // top two too close together, also unknown
