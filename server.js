import { createServer } from 'node:http';

// All the rules now live in src/api.js. This file only speaks HTTP.
import { handleRequest, MAX_REQUEST_BYTES } from './src/api.js';

const PORT = 3005;

// Dev only. The dashboard runs on a different port, so the browser needs this header.
// On AWS, API Gateway adds CORS headers instead, so this never leaves your laptop.
// There is deliberately no wildcard here.
const DEV_ORIGIN = 'http://localhost:5173';

// Read the request body from the socket, stopping early if it is too big.
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer(async (req, res) => {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': DEV_ORIGIN,
  };

  // The browser's CORS pre-check. Answer it here, before any rules run.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...headers,
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  // Turn the HTTP request into the three plain values handleRequest needs.
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const rawBody = req.method === 'POST' ? await readBody(req) : '';
  const { status, body, cause } = rawBody === null
    ? { status: 400, body: { error: 'Request body too large' } }
    : handleRequest({ method: req.method, path: url.pathname, rawBody });

  // A 500 means our bug. The caller only sees "Internal error", so log the real cause here.
  if (cause) console.error(cause);

  // Turn the plain answer back into an HTTP response.
  res.writeHead(status, headers);
  res.end(JSON.stringify(body, null, 2));
});

server.listen(PORT, () => {
  console.log(`Email triage API listening on http://localhost:${PORT}`);
  console.log('Assistive first pass only. It reorders a human queue, it never acts on a customer.');
});
