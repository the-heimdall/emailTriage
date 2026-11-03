import { normalise } from './normalise.js';
import { SIGNALS, MIN_SCORE, MIN_MARGIN } from './signals.js';

// Lead sentence per category. Deliberately hedged: this is a first pass, not a finding.
const LEADS = {
  debt: 'Possible money trouble.',
  billing: 'Billing query.',
  payment: 'Payment admin.',
  unknown: 'Not confident enough to route this one automatically.',
};

// A phrase only counts on whole-word boundaries, so "debt" does not fire inside
// "indebted". The normalised text is space separated, which makes this a cheap check.
function findPhrase(text, phrase) {
  let from = 0;
  while (from <= text.length) {
    const start = text.indexOf(phrase, from);
    if (start === -1) return null;
    const end = start + phrase.length;
    const beforeOk = start === 0 || text[start - 1] === ' ';
    const afterOk = end === text.length || text[end] === ' ';
    if (beforeOk && afterOk) return { start, end };
    from = start + 1;
  }
  return null;
}

function findMatches(text, map, original) {
  const matches = [];

  for (const signal of SIGNALS) {
    // Longest phrase first, so "credit left on my prepayment" wins over "top up"
    // when both appear inside the same signal.
    const found = signal.phrases
      .map((phrase) => ({ phrase, at: findPhrase(text, phrase) }))
      .filter((hit) => hit.at)
      .sort((a, b) => b.phrase.length - a.phrase.length)[0];

    if (!found) continue;

    matches.push({
      id: signal.id,
      category: signal.category,
      weight: signal.weight,
      review: Boolean(signal.review),
      cancels: Boolean(signal.cancelsReview),
      says: signal.says,
      start: found.at.start,
      end: found.at.end,
      // The evidence shown to an agent is sliced out of the ORIGINAL email, so it keeps
      // the customer's own spelling, capitals and apostrophes.
      // Trim trailing punctuation so the evidence reads as the customer's phrase,
      // not "struggling to pay." with the full stop dragged along.
      text: original
        .slice(map[found.at.start], map[found.at.end])
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''),
    });
  }

  return matches;
}

export function classifyEmail(email) {
  const original = String(email.body ?? '');
  const { text, map } = normalise(original);
  const all = findMatches(text, map, original);

  const cancelling = all.filter((m) => m.cancels);

  // A cancelling phrase kills any positive match sitting inside it. That is how
  // "I do not need medical equipment" stops the words "medical equipment" from firing,
  // without needing a general purpose negation parser.
  const overlaps = (a, b) => a.start < b.end && b.start < a.end;
  const matches = all.filter(
    (m) => m.cancels || !cancelling.some((c) => overlaps(c, m)),
  );

  // Add up the votes. A signal with a null category (medical equipment) votes for no
  // bucket at all: depending on a medical device says nothing about whether the email
  // is a billing question.
  const scores = {};
  for (const m of matches) {
    if (!m.category) continue;
    scores[m.category] = (scores[m.category] ?? 0) + m.weight;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = ranked[0] ?? [null, 0];
  const secondScore = ranked[1]?.[1] ?? 0;

  // Two ways to end up unknown: nothing scored high enough, or the top two are so close
  // that picking one would be a coin toss. Both are better answered by a human.
  const confident = topScore >= MIN_SCORE && topScore - secondScore >= MIN_MARGIN;
  const category = confident ? topCategory : 'unknown';

  const positiveTotal = ranked.reduce((n, [, s]) => n + Math.max(s, 0), 0);
  const confidence = positiveTotal > 0 ? Math.round((topScore / positiveTotal) * 100) / 100 : 0;

  // Review flag. Any cancelling phrase in the email switches it off, and we say so in
  // the description rather than hiding it, because a suppressed flag is exactly the kind
  // of decision a human needs to be able to disagree with.
  const reviewSignals = matches.filter((m) => m.review);
  const suppressedBy = cancelling.length ? cancelling.map((c) => c.text) : null;
  const needsReview = reviewSignals.length > 0 && !suppressedBy;

  const evidence = matches.filter((m) => !m.cancels);

  return {
    emailId: email.emailId,
    category,
    // The brief pins this key name, so we return it exactly. True means "this email
    // contains language worth a human look", NOT "this customer is vulnerable".
    vulnerability: needsReview,
    vulnerabilityStatus: needsReview ? 'possible, needs human review' : 'no signals detected',
    description: describe(category, confident, evidence, needsReview, suppressedBy),
    keywords: [...new Set(evidence.map((m) => m.text))],
    confidence: confident ? confidence : 0,
    // Full working, for an agent who wants to check the machine rather than trust it.
    signals: evidence.map((m) => ({ id: m.id, matched: m.text, says: m.says, weight: m.weight })),
    scores,
  };
}

function describe(category, confident, evidence, needsReview, suppressedBy) {
  const parts = [LEADS[category] ?? LEADS.unknown];

  if (evidence.length === 0) {
    parts.push('No known signals were found in this email.');
  } else {
    parts.push(`Email ${joinWords(evidence.map((m) => m.says))}.`);
  }

  if (!confident && evidence.length > 0) {
    parts.push('Signals were too weak or too evenly split to route it, so it needs a human.');
  }

  if (needsReview) {
    parts.push('Flag for agent review: possible vulnerability, not confirmed.');
  } else if (suppressedBy) {
    parts.push(`No review flag: the email also says "${suppressedBy[0]}".`);
  }

  return parts.join(' ');
}

function joinWords(items) {
  const unique = [...new Set(items)];
  if (unique.length === 1) return unique[0];
  return `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`;
}

// Built by reducing over whatever actually came back, never from a hardcoded list of
// four. That is what makes "add a category, change no other file" true.
export function summarise(results) {
  const summary = {};
  for (const r of results) {
    summary[r.category] = (summary[r.category] ?? 0) + 1;
  }
  return {
    summary,
    flaggedForReview: results.filter((r) => r.vulnerability).length,
    total: results.length,
  };
}
