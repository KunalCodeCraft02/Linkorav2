const path = require('path')

// The env file lives next to the backend, not in the current working
// directory. A script run from the repository root would otherwise load no
// configuration at all and fail on the JWT secret check.
require('dotenv').config({ quiet: true, path: path.resolve(__dirname, '../../.env') })

/**
 * How long a session lasts. The same number drives the token's expiry and
 * the cookie's lifetime, so the two can never drift apart and log a user out
 * earlier than they were told.
 */
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7)

/**
 * `auto` means the cookie's attributes follow the request it is issued for.
 * The other values pin the attribute regardless of the request.
 */
function parseTriState(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'true' || raw === '1' || raw === 'yes') return true
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  return null
}

function parseSameSite(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'strict' || raw === 'lax' || raw === 'none') return raw
  return 'auto'
}

const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/linkora',
  jwtSecret: process.env.JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  frontendPublicUrl: process.env.FRONTEND_PUBLIC_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  backendPublicUrl: process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`,
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  isProduction: process.env.NODE_ENV === 'production',
  cookieName: 'linkora_session',

  // --- session lifetime ----------------------------------------------------
  sessionTtlDays: SESSION_TTL_DAYS,
  sessionTtlMs: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  sessionTtlSeconds: SESSION_TTL_DAYS * 24 * 60 * 60,

  // --- session cookie attributes -------------------------------------------
  // `null` / `'auto'` let the cookie follow the connection and the
  // relationship between the frontend and the API. Pin them only when a
  // deployment needs something the automatic choice cannot work out.
  sessionCookieSecure: parseTriState(process.env.SESSION_COOKIE_SECURE),
  sessionCookieSameSite: parseSameSite(process.env.SESSION_COOKIE_SAMESITE),
}

if (!config.jwtSecret || config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long')
}

if (!Number.isFinite(config.sessionTtlDays) || config.sessionTtlDays <= 0) {
  throw new Error('SESSION_TTL_DAYS must be a positive number of days')
}

config.frontendPublicUrl = config.frontendPublicUrl.replace(/\/+$/, '')
config.backendPublicUrl = config.backendPublicUrl.replace(/\/+$/, '')

module.exports = config

