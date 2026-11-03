// Security headers, shared by the Worker (API and admin page, see index.ts) and the build (vite.config.ts writes them
// into dist/_headers for the static files, which never reach the Worker). Plain data: no Worker or Node types.

/** Sent on every response. */
export const baseHeaders: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'cross-origin-opener-policy': 'same-origin',
}

/**
 * The app's page. Its three inline scripts (index.html and the loader painting-first adds) are allowed by hash, so
 * `script-src` has no 'unsafe-inline'. Styles keep 'unsafe-inline': React and the animations set style attributes.
 * Google sign-in leaves the page and comes back, so it needs nothing here.
 */
export const appCsp = (scriptHashes: string[]) =>
  [
    "default-src 'none'",
    `script-src 'self' ${scriptHashes.map((h) => `'sha256-${h}'`).join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ')

/** Answers from the Worker that are not a page (JSON): nothing in them should ever be rendered, framed or embedded. */
export const apiCsp = "default-src 'none'; frame-ancestors 'none'"

/** Adds the base headers (and the API's CSP unless the response brings its own) to a Worker response. */
export function withSecurityHeaders(res: Response): Response {
  // Responses from env.ASSETS.fetch() have immutable headers, hence the copy.
  const out = new Response(res.body, res)
  for (const [k, v] of Object.entries(baseHeaders)) out.headers.set(k, v)
  if (!out.headers.has('content-security-policy')) out.headers.set('content-security-policy', apiCsp)
  return out
}
