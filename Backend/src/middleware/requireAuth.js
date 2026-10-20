const jwt = require('jsonwebtoken')
const config = require('../config/env')

function requireAuth(req, res, next) {
  const token = req.cookies[config.cookieName]
  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    if (!payload.sub || typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'Invalid authentication session.' })
    }
    req.auth = { userId: payload.sub }
    return next()
  } catch {
    return res.status(401).json({ message: 'Authentication required.' })
  }
}

module.exports = requireAuth
