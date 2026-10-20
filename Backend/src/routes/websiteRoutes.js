const express = require('express')
const websiteController = require('../controllers/websiteController')
const asyncHandler = require('../middleware/asyncHandler')
const requireAuth = require('../middleware/requireAuth')
const uploadLimiter = require('../middleware/uploadLimiter')
const { imageUpload, verifyImageUpload } = require('../middleware/upload')

const router = express.Router()

// The template and theme catalogue is public: the landing page shows it
// before anyone signs in, and it contains no user data.
router.get('/catalog', asyncHandler(websiteController.getCatalog))

// Public rendering lives under /api/websites/public/:slug and is reachable
// without a Linkora account.
router.get('/public/:slug', asyncHandler(websiteController.getPublicWebsite))

router.use(requireAuth)

router.get('/', asyncHandler(websiteController.listWebsites))
router.post('/', asyncHandler(websiteController.createWebsite))
router.get('/:websiteId', asyncHandler(websiteController.getWebsite))
router.patch('/:websiteId', asyncHandler(websiteController.updateWebsite))
router.post('/:websiteId/publish', asyncHandler(websiteController.publishWebsite))
router.post('/:websiteId/unpublish', asyncHandler(websiteController.unpublishWebsite))
router.post('/:websiteId/duplicate', asyncHandler(websiteController.duplicateWebsite))
router.delete('/:websiteId', asyncHandler(websiteController.deleteWebsite))
router.post(
  '/:websiteId/assets',
  uploadLimiter,
  imageUpload.single('asset'),
  verifyImageUpload,
  asyncHandler(websiteController.uploadAsset),
)

module.exports = router
