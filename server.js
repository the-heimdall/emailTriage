import { createServer } from 'node:http';

import { classifyEmail, summarise } from './src/classify.js';
import { SAMPLE_EMAILS } from './src/data/sample-emails.js';

const PORT = 3005;

// Dev only. The dashboard runs on a different port so the browser needs this header.
// Before any real deployment this must be removed or narrowed to a real origin.
// There is deliberately no wildcard here.
const DEV_ORIGIN = 'http://localhost:5173';

// Guard rails, so one oversized or malformed request cannot take the service down.
const MAX_BODY_CHARS = 10_000;
const MAX_BATCH = 100;
const MAX_REQUEST_BYTES = 2_000_000;

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': DEV_ORIGIN,
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error('Request body too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) throw new Error('Request body is empty');
  try {
    return JSON.parse(raw);
  } catch {
    // Never leak a parser stack trace to a caller.
    throw new Error('Request body is not valid JSON');
  }
}

/** @returns {string|null} the reason this email is unusable, or null if it is fine */
function validateEmail(email) {
  if (!email || typeof email !== 'object') return 'email must be an object';
  if (typeof email.emailId !== 'string' || !email.emailId.trim()) return 'emailId is required';
  if (typeof email.body !== 'string' || !email.body.trim()) return 'body is required';
  // Rejected, not silently truncated: a half-read email could hide the very sentence
  // that mattered.
  if (email.body.length > MAX_BODY_CHARS) return `body must be ${MAX_BODY_CHARS} characters or fewer`;
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': DEV_ORIGIN,
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  try {
    // The raw pile, exactly as it would arrive. The dashboard fetches this, then posts
    // it straight back to the classifier.
    if (req.method === 'GET' && url.pathname === '/api/samples') {
      return sendJson(res, 200, { emails: SAMPLE_EMAILS, count: SAMPLE_EMAILS.length });
    }

    if (req.method === 'POST' && url.pathname === '/api/classify') {
      const email = await readJson(req);
      const problem = validateEmail(email);
      if (problem) return sendJson(res, 400, { error: problem });
      return sendJson(res, 200, classifyEmail(email));
    }

    if (req.method === 'POST' && url.pathname === '/api/classify/batch') {
      const payload = await readJson(req);
      const emails = Array.isArray(payload) ? payload : payload?.emails;
      if (!Array.isArray(emails)) return sendJson(res, 400, { error: 'emails must be an array' });
      if (emails.length === 0) return sendJson(res, 400, { error: 'emails array is empty' });
      if (emails.length > MAX_BATCH) {
        return sendJson(res, 400, { error: `batch must contain ${MAX_BATCH} emails or fewer` });
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

      return sendJson(res, 200, { results, rejected, ...summarise(results) });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Email triage API listening on http://localhost:${PORT}`);
  console.log('Assistive first pass only. It reorders a human queue, it never acts on a customer.');
});
