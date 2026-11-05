const jwt = require('jsonwebtoken')
const config = require('../config/env')
const { sessionCookieOptions } = require('../services/session')

/**
 * Authenticate the request from the session cookie.
 *
 * A valid session is also *renewed*. Once a token has used up more than half
 * of its lifetime a fresh one is issued, so the seven-day session is
 * measured from the last time the user was actually there rather than from
 * the moment they first signed in. An active user is therefore never asked
 * to log in again, while a session that is genuinely left alone still
 * expires after seven days.
 */
function requireAuth(req, res, next) {
  const token = req.cookies[config.cookieName]
  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    return res.status(401).json({ message: 'Invalid authentication session.' })
  }

  req.auth = { userId: payload.sub }

  // Renew the session once it is past the halfway mark. The new token
  // carries the same subject, so the identity does not change - only the
  // clock moves.
  const now = Math.floor(Date.now() / 1000)
  const lifetime = config.sessionTtlSeconds
  const age = now - (payload.iat || now)
  if (age > lifetime / 2) {
    try {
      const renewed = jwt.sign({ sub: payload.sub }, config.jwtSecret, {
        expiresIn: config.sessionTtlSeconds,
      })
      res.cookie(config.cookieName, renewed, sessionCookieOptions(req))
    } catch {
      // A failed renewal must never fail the request. The existing token
      // is still valid, so the user carries on as they are.
    }
  }

  return next()
}

module.exports = requireAuth
