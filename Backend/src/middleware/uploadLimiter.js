const rateLimit = require('express-rate-limit')

/**
 * Uploads are the one endpoint that writes to disk, so it gets its own
 * limiter. The window is generous enough for a gallery of images but still
 * stops a script from filling the uploads directory.
 */
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many uploads. Please wait a few minutes and try again.' },
})
