const crypto = require('crypto')
const Website = require('../models/Website')

const RESERVED = new Set([
  'api',
  'home',
  'login',
  'register',
  'builder',
  'editor',
  'preview',
  'site',
  'p',
  'public',
  'admin',
  'www',
  'templates',
  'assets',
  'uploads',
])

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Create a website whose slug is guaranteed unique.
 *
 * The candidate is a readable base plus random entropy, written against the
 * unique index. If two concurrent requests race for the same slug, the loser
 * retries with fresh entropy rather than failing, so uniqueness holds under
 * concurrent generation as well as in the common case.
 */
async function createWebsiteWithUniqueSlug(website) {
  const base = slugify(website.slug || website.name) || 'site'
  const root = RESERVED.has(base) ? `${base}-site` : base

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = crypto.randomBytes(4).toString('hex')
    const slug = attempt === 0 ? `${root}-${suffix}` : `${root}-${attempt}-${suffix}`
    try {
      return await Website.create({ ...website, slug })
    } catch (error) {
      // Duplicate key means another request won the race; retry with new entropy.
      if (error?.code !== 11000) throw error
    }
  }

  throw Object.assign(new Error('Could not reserve a unique slug. Please try again.'), { status: 503 })
}

module.exports = { slugify, createWebsiteWithUniqueSlug }
