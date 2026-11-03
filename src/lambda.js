// The same function the laptop server uses.
import { handleRequest } from './api.js';

// AWS calls this for every request. "event" is the request, as a plain object.
export async function handler(event) {
  // API Gateway may base64-encode the body. Turn it back into plain text.
  const rawBody = event.body
    ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body)
    : '';

  // HTTP APIs send "payload format 2.0": the method and path live here.
  const method = event.requestContext?.http?.method ?? 'GET';
  const path = event.rawPath ?? '/';
  const { status, body, cause } = handleRequest({ method, path, rawBody });

  // A 500 means our bug. Lambda sends console.error to CloudWatch Logs.
  if (cause) console.error(cause);

  // The shape API Gateway expects back.
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  };
}
