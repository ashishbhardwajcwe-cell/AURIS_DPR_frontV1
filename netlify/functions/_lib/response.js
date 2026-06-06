// Tiny Response helpers for v2 Netlify Functions.

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

export function errorResponse(err) {
  const status = err?.statusCode || 500;
  const message = err?.message || 'Internal server error';
  if (status >= 500) {
    console.error('[function] internal error:', err);
  }
  return json({ error: message }, status);
}

export function httpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  return err;
}
