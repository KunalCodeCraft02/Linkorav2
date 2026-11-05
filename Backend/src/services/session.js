const config = require('../config/env')

/**
 * The session cookie's attributes.
 *
 * The rule this file exists to enforce: a signed-in user must stay signed in
 * for the whole session, and the only thing that may end it early is the
 * user logging out or the token genuinely expiring.
 *
 * The previous behaviour broke that in a way that was easy to miss. In
 * production the cookie was marked `Secure` and `SameSite=Strict` purely
 * because `NODE_ENV` was `production`. Over plain HTTP - a LAN address, a
 * self-hosted box, a reverse proxy that terminates TLS upstream - the
 * browser refuses to *send* a `Secure` cookie back. Every request then went
 * out unauthenticated, the API answered 401, and the app sent the user to
 * the login page even though they had just signed in.
 *
 * So the attributes are now derived from the request that is actually being
 * answered rather than from the environment:
 *
 *   - `Secure` is set when the request itself arrived over HTTPS. A request
 *     that arrived over plain HTTP gets a cookie the browser will actually
 *     send back. Behind a TLS-terminating proxy this is read from
 *     `X-Forwarded-Proto`, which `app.set('trust proxy', 1)` makes trusted.
 *   - `SameSite` is `None` only when the cookie is `Secure` *and* the
 *     frontend is on a different site than the API (a subdomain, say).
 *     Otherwise it is `Lax`, which is what a normal same-site deployment
 *     wants and what keeps the cookie working for top-level navigation.
 *
 * Both can still be pinned with `SESSION_COOKIE_SECURE` and
 * `SESSION_COOKIE_SAMESITE` for a deployment that knows better.
 */

/** Whether the request that produced this response arrived over HTTPS. */
function requestIsSecure(req) {
  if (!req) return false
  if (req.secure) return true
  const forwarded = req.headers?.['x-forwarded-proto']
  if (!forwarded) return false
  // A proxy may send a comma-separated list; the first entry is the
  // original client-facing protocol.
  const first = String(forwarded).split(',')[0].trim().toLowerCase()
  return first === 'https'
}

/**
 * Whether the browser app and the API count as different *sites*. Only the
 * registrable domain matters, so `app.linkora.com` and `api.linkora.com`
 * are the same site, but `linkora.com` and `linkora.app` are not.
 */
function isCrossSite(frontendOrigin) {
  if (!frontendOrigin) return false
  try {
    const frontend = new URL(frontendOrigin)
    const backend = new URL(config.backendPublicUrl)
    const registrable = (hostname) => hostname.split('.').slice(-2).join('.')
    return registrable(frontend.hostname) !== registrable(backend.hostname)
  } catch {
    return false
  }
}

/** The cookie attributes for this request. */
function sessionCookieOptions(req) {
  const secure = config.sessionCookieSecure ?? requestIsSecure(req)
  const crossSite = isCrossSite(config.frontendOrigin)

  let sameSite = config.sessionCookieSameSite
  if (sameSite === 'auto') {
    // `SameSite=None` is only honoured on a `Secure` cookie, so it is the
    // only case where it makes sense. Everywhere else `Lax` is the safe
    // choice: it is sent on top-level navigation and on same-site requests.
    sameSite = secure && crossSite ? 'none' : 'lax'
  }
  // A `SameSite=None` cookie without `Secure` is rejected outright by every
  // modern browser, so `Secure` is not optional in that case.
  if (sameSite === 'none') {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: config.sessionTtlMs,
      path: '/',
    }
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: config.sessionTtlMs,
    path: '/',
  }
}

/**
 * Warn about a deployment that cannot possibly keep the session alive.
 *
 * When the frontend and the API are on different sites the cookie has to be
 * `SameSite=None`, which browsers only accept alongside `Secure`, which in
 * turn needs HTTPS. If the request is arriving over plain HTTP the browser
 * will silently refuse the cookie and the user will be asked to log in
 * again on every page.
 */
function warnAboutUnusableSessionCookie() {
  if (config.sessionCookieSameSite !== 'auto') return
  if (!isCrossSite(config.frontendOrigin)) return
  if (config.sessionCookieSecure) return
  if (requestIsSecure({ headers: { 'x-forwarded-proto': 'https' } })) return
  console.warn(
    '[session] FRONTEND_ORIGIN and BACKEND_PUBLIC_URL are on different sites, ' +
      'so the session cookie needs SameSite=None and Secure, which require HTTPS. ' +
      'Serve the API over HTTPS (or terminate TLS in front of it and forward ' +
      'X-Forwarded-Proto), otherwise the browser will drop the cookie and the ' +
      'user will be asked to log in again on every page.',
  )
}

/**
 * The attributes used to clear the cookie.
 *
 * They must match the ones the cookie was set with, or the browser keeps
 * the original cookie and the user stays signed in after logging out.
 */
function clearSessionCookieOptions(req) {
  const { maxAge, ...options } = sessionCookieOptions(req)
  return options
}

module.exports = {
  sessionCookieOptions,
  clearSessionCookieOptions,
  requestIsSecure,
  isCrossSite,
  warnAboutUnusableSessionCookie,
}
