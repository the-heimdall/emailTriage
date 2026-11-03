import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handleRequest } from '../src/api.js';

// A small helper: send a POST with a JSON body (or a raw string, to test bad input).
const post = (path, body) =>
  handleRequest({ method: 'POST', path, rawBody: typeof body === 'string' ? body : JSON.stringify(body) });

test('GET /api/samples returns the 14 raw emails', () => {
  const res = handleRequest({ method: 'GET', path: '/api/samples' });
  assert.equal(res.status, 200);
  assert.equal(res.body.count, 14);
});

test('POST /api/classify returns one classification', () => {
  const res = post('/api/classify', { emailId: 'a-1', body: 'Could you change my payment date?' });
  assert.equal(res.status, 200);
  assert.equal(res.body.emailId, 'a-1');
  assert.equal(typeof res.body.category, 'string');
});

test('broken JSON is a clean 400 with no stack trace', () => {
  const res = post('/api/classify', '{not json');
  assert.equal(res.status, 400);
  // deepEqual compares the whole object, so any extra field (like a stack) fails.
  assert.deepEqual(res.body, { error: 'Request body is not valid JSON' });
});

test('a body over 10,000 characters is rejected, not cut short', () => {
  const res = post('/api/classify', { emailId: 'a-2', body: 'x'.repeat(10_001) });
  assert.equal(res.status, 400);
});

test('one bad row in a batch fails on its own', () => {
  const res = post('/api/classify/batch', {
    emails: [{ emailId: 'ok', body: 'My bill is too high' }, { emailId: 'bad' }],
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.results.length, 1);
  assert.deepEqual(res.body.rejected, [{ emailId: 'bad', error: 'body is required' }]);
});

test('an unknown route is a 404', () => {
  assert.equal(handleRequest({ method: 'GET', path: '/nope' }).status, 404);
});
