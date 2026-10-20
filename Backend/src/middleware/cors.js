const cors = require('cors')
const config = require('../config/env')

/**
 * A rejected origin is a client configuration problem, not a server fault.
 * `cors` signals it by calling back with an Error, which would otherwise
 * surface as a 500; this turns it into a clear 403.
 */
function rejectOrigin(message) {
  const error = new Error(message)
  error.status = 403
  error.code = 'CORS_ORIGIN_DENIED'
  return error
}

const allowedOrigins = new Set([
  config.frontendOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/**
 * In development the Vite dev server may pick a different port (5174, 5175…)
 * if 5173 is already taken, which would otherwise fail with a confusing
 * CORS error. Loopback origins are therefore allowed on any port, but only
 * while `NODE_ENV` is not `production`.
 *
 * In production the list above is the complete allowlist.
 */
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (allowedOrigins.has(origin)) return true
  if (!config.isProduction && LOOPBACK_ORIGIN.test(origin)) return true
  return false
}

/**
 * CORS for the Linkora frontend. Only an allowed origin may send
 * credentialed requests.
 */
const frontendCors = cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true)
    return callback(rejectOrigin('Origin is not allowed by CORS'))
  },
  credentials: true,
})

module.exports = { frontendCors, allowedOrigins }
