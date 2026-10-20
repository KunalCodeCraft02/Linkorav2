const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const config = require('../config/env')

const uploadDirectory = path.join(__dirname, '../../uploads')
fs.mkdirSync(uploadDirectory, { recursive: true })

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/**
 * Magic-byte signatures for the accepted formats. The browser-supplied MIME
 * type is not trusted on its own; the uploaded bytes are checked too.
 */
const SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
]

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function matchesSignature(buffer, signature) {
  return signature.bytes.every((byte, index) => buffer[index] === byte)
}

function detectImageType(buffer) {
  for (const signature of SIGNATURES) {
    if (matchesSignature(buffer, signature)) return signature.mime
  }
  // RIFF....WEBP
  if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    // Extension is derived from the validated MIME type, never from the
    // client-supplied filename.
    const extension = EXTENSIONS[file.mimetype] || '.bin'
    callback(null, `${crypto.randomUUID()}${extension}`)
  },
})

function fileFilter(req, file, callback) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return callback(Object.assign(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), { status: 400 }))
  }
  return callback(null, true)
}

/**
 * A single image: a profile photo, a section image or a gallery image.
 *
 * The field-size limit keeps a stray multipart field from becoming a
 * multi-megabyte string in memory.
 */
const imageUpload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadBytes,
    files: 1,
    fields: 12,
    fieldSize: config.maxUploadBytes,
  },
  fileFilter,
})

/**
 * Runs after multer has written the files: confirms the bytes really are one
 * of the accepted image formats and removes any upload that is not.
 *
 * The stored file extension is corrected to match the detected format, so a
 * browser never receives, say, PNG bytes labelled as a .jpg file.
 */
function verifyImageUpload(req, res, next) {
  const files = []
  if (req.file) files.push(req.file)

  for (const file of files) {
    let header
    try {
      header = fs.readFileSync(file.path).subarray(0, 16)
    } catch {
      return next(Object.assign(new Error('The uploaded image could not be read.'), { status: 400 }))
    }
    const detected = detectImageType(header)
    if (!detected) {
      fs.rm(file.path, { force: true }, () => {})
      return next(Object.assign(new Error('That file is not a valid JPEG, PNG, WebP, or GIF image.'), { status: 400 }))
    }
    file.detectedMime = detected

    const expectedExtension = EXTENSIONS[detected]
    const currentExtension = path.extname(file.filename).toLowerCase()
    if (expectedExtension && currentExtension !== expectedExtension) {
      const correctedName = `${path.basename(file.filename, currentExtension)}${expectedExtension}`
      const correctedPath = path.join(uploadDirectory, correctedName)
      try {
        fs.renameSync(file.path, correctedPath)
        file.filename = correctedName
        file.path = correctedPath
      } catch {
        // The extension is cosmetic; keep going with the file as-is.
      }
    }
  }

  return next()
}

module.exports = { imageUpload, verifyImageUpload, uploadDirectory, ALLOWED_MIME }
