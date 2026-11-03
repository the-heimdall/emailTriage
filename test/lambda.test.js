import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handler } from '../src/lambda.js';

// A cut-down copy of what API Gateway really sends (payload format 2.0).
const event = (method, path, body) => ({
  rawPath: path,
  requestContext: { http: { method } },
  body: body === undefined ? undefined : JSON.stringify(body),
  isBase64Encoded: false,
});

test('the Lambda adapter turns an API Gateway event into a response', async () => {
  const res = await handler(event('GET', '/api/samples'), { awsRequestId: 'test' });
  assert.equal(res.statusCode, 200);
  // The body comes back as text, so parse it before checking.
  assert.equal(JSON.parse(res.body).count, 14);
});

test('the adapter decodes a base64 body', async () => {
  const body = Buffer.from(JSON.stringify({ emailId: 'b-1', body: 'My bill is too high' })).toString('base64');
  const res = await handler(
    { rawPath: '/api/classify', requestContext: { http: { method: 'POST' } }, body, isBase64Encoded: true },
    { awsRequestId: 'test' },
  );
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).emailId, 'b-1');
});
