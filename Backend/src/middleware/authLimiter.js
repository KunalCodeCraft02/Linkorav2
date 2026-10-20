const rateLimit = require('express-rate-limit')
const config = require('../config/env')

// The limit is configurable so that automated check scripts - which create
// a throwaway account on every run - are not blocked by the production
// limit. Production keeps the default of 20 attempts per 15 minutes.
const defaultLimit = 20
const configured = Number(process.env.AUTH_RATE_LIMIT)
const limit = Number.isFinite(configured) && configured > 0
  ? configured
  : config.isProduction
    ? defaultLimit
    : 200

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
})
