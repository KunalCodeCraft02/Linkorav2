const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const User = require('../models/User')
const config = require('../config/env')

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  instagram: z.string().trim().min(1).max(80),
  followers: z.coerce.number().int().min(0).max(1000000000),
  password: z.string().min(8).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
})

function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    instagram: user.instagram,
    followers: user.followers,
  }
}

function setSessionCookie(res, userId) {
  const token = jwt.sign({ sub: userId.toString() }, config.jwtSecret, { expiresIn: '7d' })
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

async function register(req, res) {
  const data = registerSchema.parse(req.body)
  const email = data.email.toLowerCase()
  const existingUser = await User.findOne({ email }).select('_id').lean()
  if (existingUser) return res.status(409).json({ message: 'An account with this email already exists.' })

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await User.create({ ...data, email, passwordHash })
  setSessionCookie(res, user._id)
  return res.status(201).json({ user: publicUser(user) })
}

async function login(req, res) {
  const data = loginSchema.parse(req.body)
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }
  setSessionCookie(res, user._id)
  return res.json({ user: publicUser(user) })
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.auth.userId)
  if (!user) return res.status(401).json({ message: 'Not authenticated.' })
  return res.json({ user: publicUser(user) })
}

function logout(req, res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  })
  return res.status(204).send()
}

module.exports = { register, login, getCurrentUser, logout }
