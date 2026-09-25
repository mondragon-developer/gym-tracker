// Pure request checks for the rest-timer-push function, kept apart from
// index.ts so vitest can run them without Deno.

// The Free plan stops a function 150 s after it starts; the wait plus the
// send must fit inside that. The longest rest preset is 120 s.
export const MAX_DELAY_MS = 140 * 1000;
const MAX_TITLE = 60;
const MAX_BODY = 120;

// The function POSTs to the endpoint it is given, so only the browsers'
// push services are allowed; anything else would let a caller make the
// server call an arbitrary URL.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^[a-z0-9-]+\.push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^push\.services\.mozilla\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export const isAllowedEndpoint = (endpoint) => {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && PUSH_HOSTS.some(pattern => pattern.test(url.hostname));
  } catch {
    return false;
  }
};

const clip = (value, max) => String(value ?? '').trim().slice(0, max);

/**
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export const parseSchedule = (body, now = Date.now()) => {
  const endsAt = Number(body?.endsAt);
  if (!Number.isFinite(endsAt)) return { ok: false, error: 'endsAt must be a timestamp' };
  const delay = endsAt - now;
  if (delay <= 0 || delay > MAX_DELAY_MS) return { ok: false, error: 'endsAt out of range' };

  const sub = body?.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!isAllowedEndpoint(endpoint)) return { ok: false, error: 'Unsupported push endpoint' };
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !p256dh || !auth) {
    return { ok: false, error: 'Subscription keys missing' };
  }

  const title = clip(body?.title, MAX_TITLE) || "Let's go!";
  const text = clip(body?.body, MAX_BODY);
  return {
    ok: true,
    value: { endsAt, delay, subscription: { endpoint, keys: { p256dh, auth } }, title, body: text },
  };
};
