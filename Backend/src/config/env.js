const path = require('path')

// The env file lives next to the backend, not in the current working
// directory. A script run from the repository root would otherwise load no
// configuration at all and fail on the JWT secret check.
require('dotenv').config({ quiet: true, path: path.resolve(__dirname, '../../.env') })

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
}

if (!config.jwtSecret || config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long')
}

config.frontendPublicUrl = config.frontendPublicUrl.replace(/\/+$/, '')
config.backendPublicUrl = config.backendPublicUrl.replace(/\/+$/, '')

module.exports = config
