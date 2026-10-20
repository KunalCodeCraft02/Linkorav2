const express = require('express')
const authController = require('../controllers/authController')
const asyncHandler = require('../middleware/asyncHandler')
const authLimiter = require('../middleware/authLimiter')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

router.post('/register', authLimiter, asyncHandler(authController.register))
router.post('/login', authLimiter, asyncHandler(authController.login))
router.get('/me', requireAuth, asyncHandler(authController.getCurrentUser))
router.post('/logout', authController.logout)

module.exports = router
