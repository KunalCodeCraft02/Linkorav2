const { z } = require('zod')

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Please check the submitted details.', issues: error.issues })
  }

  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Images must be 5 MB or smaller.' })
  }
  if (error?.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field in the upload.' })
  }
  if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_FIELD_COUNT') {
    return res.status(400).json({ message: 'Too many files or fields in the upload.' })
  }
  if (error?.code === 'LIMIT_FIELD_SIZE' || error?.code === 'LIMIT_FIELD_VALUE') {
    return res.status(400).json({ message: 'That upload contains a field that is too large.' })
  }
  if (error?.message?.includes('Only JPEG') || error?.message?.includes('not a valid JPEG')) {
    return res.status(400).json({ message: error.message })
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: 'That value is already taken. Please choose another one.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request body is too large.' })
  }
  // A malformed id in the URL is a bad request, not a server fault. Without
  // this, `findOne({ _id: 'not-an-object-id' })` surfaces as a 500.
  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'That identifier is not valid.' })
  }

  // Errors created by our own services carry an explicit status.
  if (typeof error?.status === 'number' && error.status >= 400 && error.status < 600) {
    return res.status(error.status).json({ message: error.message || 'Request failed.' })
  }

  console.error('[error]', req.method, req.originalUrl, '-', error)
  return res.status(500).json({ message: 'Something went wrong. Please try again.' })
}

module.exports = errorHandler
