// The classifier and the sample data, unchanged from before.
import { classifyEmail, summarise } from './classify.js';
import { SAMPLE_EMAILS } from './data/sample-emails.js';

// Guard rails, moved here from server.js so every adapter shares them. One oversized or
// malformed request must not be able to take the service down.
export const MAX_BODY_CHARS = 10_000;
export const MAX_BATCH = 100;
export const MAX_REQUEST_BYTES = 2_000_000;

// A mistake in the request. The caller can fix it, so it becomes a 400.
// Anything else that goes wrong is our bug, so it becomes a 500.
class ClientError extends Error {}

function parseJson(rawBody) {
  const raw = rawBody ?? '';
  // Measure bytes, not characters: an emoji is one character but four bytes.
  if (Buffer.byteLength(raw, 'utf8') > MAX_REQUEST_BYTES) throw new ClientError('Request body too large');
  if (!raw.trim()) throw new ClientError('Request body is empty');
  try {
    return JSON.parse(raw);
  } catch {
    // Never leak a parser stack trace to a caller.
    throw new ClientError('Request body is not valid JSON');
  }
}

/** @returns {string|null} the reason this email is unusable, or null if it is fine */
export function validateEmail(email) {
  if (!email || typeof email !== 'object') return 'email must be an object';
  if (typeof email.emailId !== 'string' || !email.emailId.trim()) return 'emailId is required';
  if (typeof email.body !== 'string' || !email.body.trim()) return 'body is required';
  // Rejected, not cut short: a half-read email could hide the sentence that mattered.
  if (email.body.length > MAX_BODY_CHARS) return `body must be ${MAX_BODY_CHARS} characters or fewer`;
  return null;
}

/**
 * The whole API as one plain function. No sockets, no AWS, no ports.
 * @param {{ method: string, path: string, rawBody?: string }} request
 * @returns {{ status: number, body: object, cause?: Error }}
 */
export function handleRequest({ method, path, rawBody }) {
  try {
    // GET /api/samples: the raw pile of 14 unclassified emails, exactly as they would
    // arrive. The dashboard fetches this, then posts it straight back to the classifier.
    if (method === 'GET' && path === '/api/samples') {
      return { status: 200, body: { emails: SAMPLE_EMAILS, count: SAMPLE_EMAILS.length } };
    }

    // POST /api/classify: one email in, one classification out.
    if (method === 'POST' && path === '/api/classify') {
      const email = parseJson(rawBody);
      const problem = validateEmail(email);
      if (problem) return { status: 400, body: { error: problem } };
      return { status: 200, body: classifyEmail(email) };
    }

    // POST /api/classify/batch: up to 100 emails.
    if (method === 'POST' && path === '/api/classify/batch') {
      const payload = parseJson(rawBody);
      const emails = Array.isArray(payload) ? payload : payload?.emails;
      if (!Array.isArray(emails)) return { status: 400, body: { error: 'emails must be an array' } };
      if (emails.length === 0) return { status: 400, body: { error: 'emails array is empty' } };
      if (emails.length > MAX_BATCH) {
        return { status: 400, body: { error: `batch must contain ${MAX_BATCH} emails or fewer` } };
      }

      // One bad row fails on its own. It must not cost us the other ninety nine.
      const results = [];
      const rejected = [];
      for (const email of emails) {
        const problem = validateEmail(email);
        if (problem) {
          rejected.push({ emailId: email?.emailId ?? null, error: problem });
          continue;
        }
        results.push(classifyEmail(email));
      }
      return { status: 200, body: { results, rejected, ...summarise(results) } };
    }

    return { status: 404, body: { error: 'Not found' } };
  } catch (error) {
    // The caller's mistake: tell them what to fix.
    if (error instanceof ClientError) return { status: 400, body: { error: error.message } };
    // Our bug: say nothing about the cause to the caller, but hand it back for logging.
    return { status: 500, body: { error: 'Internal error' }, cause: error };
  }
}
