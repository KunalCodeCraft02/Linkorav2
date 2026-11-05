const { z } = require('zod')
const config = require('../config/env')
const Website = require('../models/Website')
const { slugify, createWebsiteWithUniqueSlug } = require('../services/slugService')
const {
  validateDocument,
  validateSections,
  validateSite,
  validateProfile,
  migrateLegacyDocument,
} = require('../../../shared/website-schema.mjs')
const { buildDocumentFromTemplate, getTemplate } = require('../../../shared/templates.mjs')
const { resolveDocument } = require('../../../shared/resolve.mjs')

const slugInputSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.')

const createSchema = z.object({
  name: z.string().trim().min(1).max(100).default('Untitled website'),
  slug: slugInputSchema.optional(),
  templateId: z.string().trim().min(1).max(60).optional(),
  site: z.record(z.string(), z.unknown()).optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(z.unknown()).max(80).optional(),
})

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: slugInputSchema.optional(),
  site: z.record(z.string(), z.unknown()).optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  sections: z.array(z.unknown()).max(80).optional(),
  status: z.enum(['draft', 'published']).optional(),
})

function publicUrl(slug) {
  return `${config.frontendPublicUrl}/p/${slug}`
}

/**
 * Websites created before the rebuild stored a flat `components` array.
 * They are upgraded to the new section vocabulary on read, so the content a
 * user already wrote is still there without a separate migration step.
 */
function upgradeLegacy(website) {
  if (!website || !Array.isArray(website.components)) return website

  const migrated = migrateLegacyDocument(website)
  const validated = validateDocument({
    site: { ...migrated.site, ...(website.site || {}) },
    profile: { ...migrated.profile, ...(website.profile || {}) },
    sections: migrated.sections,
  })

  return {
    ...website,
    site: validated.site,
    profile: validated.profile,
    sections: validated.sections,
  }
}

/**
 * The stored document, in the shape the frontend expects. The published
 * snapshot is sent instead of the working draft when a published website is
 * requested, so the editor and the public page never disagree.
 */
function serializeWebsite(website, { published = false } = {}) {
  const site = published ? website.publishedSite : website.site
  const profile = published ? website.publishedProfile : website.profile
  const sections = published ? website.publishedSections : website.sections
  const resolved = resolveDocument({ site, profile, sections })

  return {
    id: website._id.toString(),
    name: website.name,
    slug: website.slug,
    status: website.status,
    site: resolved.site,
    profile: resolved.profile,
    sections: resolved.sections,
    tokens: resolved.tokens,
    templateId: resolved.site.templateId,
    themeId: resolved.site.themeId,
    publishedAt: website.publishedAt || null,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
    publicUrl: website.status === 'published' ? publicUrl(website.slug) : null,
  }
}

/** A compact summary for the dashboard list. */
function serializeSummary(website) {
  const resolved = resolveDocument({
    site: website.site,
    profile: website.profile,
    sections: website.sections,
  })
  return {
    id: website._id.toString(),
    name: website.name,
    slug: website.slug,
    status: website.status,
    templateId: resolved.site.templateId,
    themeId: resolved.site.themeId,
    sectionCount: resolved.sections.length,
    colors: resolved.tokens.colors,
    site: resolved.site,
    sections: resolved.sections,
    publishedAt: website.publishedAt || null,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
    publicUrl: website.status === 'published' ? publicUrl(website.slug) : null,
  }
}

async function listWebsites(req, res) {
  const websites = await Website.find({ owner: req.auth.userId }).sort({ updatedAt: -1 }).lean()
  return res.json({ websites: websites.map((website) => serializeSummary(upgradeLegacy(website))) })
}

/**
 * Creates a website. With a `templateId` the website is seeded from that
 * template's default document; otherwise it starts empty.
 */
async function createWebsite(req, res) {
  const data = createSchema.parse(req.body)

  let site = {}
  let profile = {}
  let sections = []

  if (data.templateId) {
    const template = getTemplate(data.templateId)
    if (!template) {
      return res.status(400).json({ message: 'That template does not exist.' })
    }
    const document = buildDocumentFromTemplate(template.id)
    const validated = validateDocument({
      site: { ...document.site, ...(data.site || {}) },
      profile: { ...document.profile, ...(data.profile || {}) },
      sections: data.sections?.length ? data.sections : document.sections,
    })
    site = validated.site
    profile = validated.profile
    sections = validated.sections
  } else {
    const validated = validateDocument({
      site: data.site || {},
      profile: data.profile || {},
      sections: data.sections || [],
    })
    site = validated.site
    profile = validated.profile
    sections = validated.sections
  }

  const website = await createWebsiteWithUniqueSlug({
    owner: req.auth.userId,
    name: data.name,
    slug: data.slug || slugify(data.name) || 'my-site',
    site,
    profile,
    sections,
  })

  return res.status(201).json({ website: serializeWebsite(website) })
}

async function getWebsite(req, res) {
  const website = await Website.findOne({ _id: req.params.websiteId, owner: req.auth.userId }).lean()
  if (!website) return res.status(404).json({ message: 'Website not found.' })
  return res.json({ website: serializeWebsite(upgradeLegacy(website)) })
}

/**
 * Merge a partial `site` update into the stored site.
 *
 * `colors`, `typography` and `background` are nested objects of *overrides*.
 * A shallow merge would replace the whole nested object, so changing one
 * colour would silently discard the user's other colour overrides. They are
 * therefore merged one level deeper.
 */
function mergeSite(current, incoming) {
  const base = current?.toObject?.() ? current.toObject() : { ...(current || {}) }
  const next = { ...base, ...incoming }

  for (const key of ['colors', 'typography', 'background']) {
    if (incoming[key] === undefined) continue
    const from = base[key] && typeof base[key] === 'object' ? base[key] : {}
    const to = incoming[key] && typeof incoming[key] === 'object' ? incoming[key] : {}
    next[key] = { ...from, ...to }
  }

  return next
}

/**
 * Saves edits to a draft. Every write is scoped to the owner taken from the
 * session, so a user can never edit somebody else's website.
 */
async function updateWebsite(req, res) {
  const data = updateSchema.parse(req.body)
  const stored = await Website.findOne({ _id: req.params.websiteId, owner: req.auth.userId }).lean()
  if (!stored) return res.status(404).json({ message: 'Website not found.' })

  // A website created before the rebuild is upgraded first, so an edit is
  // applied to the migrated content and then stored in the new shape.
  const website = upgradeLegacy(stored)

  const update = {}
  if (data.name !== undefined) update.name = data.name
  if (data.site !== undefined) update.site = validateSite(mergeSite(website.site, data.site))
  if (data.profile !== undefined) {
    const currentProfile = website.profile?.toObject?.() ? website.profile.toObject() : { ...(website.profile || {}) }
    update.profile = validateProfile({ ...currentProfile, ...data.profile })
  }
  if (data.sections !== undefined) update.sections = validateSections(data.sections)

  if (data.slug !== undefined && data.slug !== website.slug) {
    const taken = await Website.exists({ slug: data.slug, _id: { $ne: website._id } })
    if (taken) return res.status(409).json({ message: 'That address is already taken. Please choose another one.' })
    update.slug = data.slug
  }

  // Once a legacy website has been written to, the old `components` array is
  // removed so the two shapes cannot drift apart.
  const unset = Array.isArray(stored.components) ? { components: 1 } : null

  const updated = await Website.findOneAndUpdate(
    { _id: website._id, owner: req.auth.userId },
    { $set: update, ...(unset ? { $unset: unset } : {}) },
    { returnDocument: 'after', runValidators: true },
  )
  if (!updated) return res.status(404).json({ message: 'Website not found.' })
  return res.json({ website: serializeWebsite(updated) })
}

/**
 * Publishes a snapshot of the draft. The public page renders the snapshot,
 * so editing afterwards never changes a live page until the next publish.
 */
async function publishWebsite(req, res) {
  const current = await Website.findOne({ _id: req.params.websiteId, owner: req.auth.userId })
  if (!current) return res.status(404).json({ message: 'Website not found.' })
  if (!current.sections?.length) {
    return res.status(400).json({ message: 'Add some content before publishing.' })
  }
  const website = await Website.findOneAndUpdate(
    { _id: current._id, owner: req.auth.userId },
    {
      $set: {
        status: 'published',
        publishedAt: new Date(),
        publishedSections: current.sections,
        publishedSite: current.site,
        publishedProfile: current.profile,
      },
    },
    { returnDocument: 'after' },
  )
  return res.json({ website: serializeWebsite(website), publicUrl: publicUrl(website.slug) })
}

async function unpublishWebsite(req, res) {
  const website = await Website.findOneAndUpdate(
    { _id: req.params.websiteId, owner: req.auth.userId },
    { $set: { status: 'draft' } },
    { returnDocument: 'after' },
  )
  if (!website) return res.status(404).json({ message: 'Website not found.' })
  return res.json({ website: serializeWebsite(website) })
}

async function duplicateWebsite(req, res) {
  const source = await Website.findOne({ _id: req.params.websiteId, owner: req.auth.userId }).lean()
  if (!source) return res.status(404).json({ message: 'Website not found.' })
  const copy = await createWebsiteWithUniqueSlug({
    owner: req.auth.userId,
    name: `${source.name} copy`,
    slug: slugify(`${source.slug}-copy`) || 'site-copy',
    site: source.site,
    profile: source.profile,
    sections: source.sections,
  })
  return res.status(201).json({ website: serializeWebsite(copy) })
}

async function deleteWebsite(req, res) {
  const result = await Website.deleteOne({ _id: req.params.websiteId, owner: req.auth.userId })
  if (!result.deletedCount) return res.status(404).json({ message: 'Website not found.' })
  return res.status(204).send()
}

/**
 * Uploads an image that can be used inside a website. The file is served
 * from /uploads and referenced by URL, never stored in MongoDB.
 */
async function uploadAsset(req, res) {
  const website = await Website.findOne({ _id: req.params.websiteId, owner: req.auth.userId }).select('_id')
  if (!website) return res.status(404).json({ message: 'Website not found.' })
  if (!req.file) return res.status(400).json({ message: 'An image file is required.' })
  const url = `${config.backendPublicUrl}/uploads/${req.file.filename}`
  return res.status(201).json({
    url,
    path: `/uploads/${req.file.filename}`,
    mimeType: req.file.detectedMime || req.file.mimetype,
    size: req.file.size,
  })
}

/**
 * The catalogue of templates and themes. This is public: it contains no
 * user data and the frontend needs it before signing in.
 */
function getCatalog(req, res) {
  return res.json({
    templates: require('../../../shared/templates.mjs').TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      themeId: template.themeId,
      tags: template.tags,
      swatches: template.swatches,
      sectionTypes: template.sections.map((entry) => entry.type),
    })),
    themes: require('../../../shared/themes.mjs').THEMES.map((theme) => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      group: theme.group,
      colors: theme.colors,
      buttonPreset: theme.buttonPreset,
      socialIconStyle: theme.socialIconStyle,
      radius: theme.radius,
      shadow: theme.shadow,
    })),
  })
}

/**
 * Public read. Only a published website is served, and only its published
 * snapshot - never the working draft. No account is required.
 */
async function getPublicWebsite(req, res) {
  const website = await Website.findOne({ slug: req.params.slug, status: 'published' })
    .select('name slug publishedSections publishedSite publishedProfile publishedAt components settings')
    .lean()
  if (!website) return res.status(404).json({ message: 'Published website not found.' })

  // A website published before the rebuild has no snapshot. Its `components`
  // array is migrated so the page still renders what the author wrote.
  const hasSnapshot = Array.isArray(website.publishedSections) && website.publishedSections.length > 0
  const source = hasSnapshot
    ? {
        site: website.publishedSite,
        profile: website.publishedProfile,
        sections: website.publishedSections,
      }
    : upgradeLegacy({
        ...website,
        site: website.publishedSite,
        profile: website.publishedProfile,
        sections: [],
      })

  const resolved = resolveDocument({
    site: source.site,
    profile: source.profile,
    sections: source.sections,
  })

  return res.json({
    website: {
      name: website.name,
      slug: website.slug,
      site: resolved.site,
      profile: resolved.profile,
      sections: resolved.sections,
      tokens: resolved.tokens,
      publishedAt: website.publishedAt,
      publicUrl: publicUrl(website.slug),
    },
  })
}

module.exports = {
  listWebsites,
  createWebsite,
  getWebsite,
  updateWebsite,
  publishWebsite,
  unpublishWebsite,
  duplicateWebsite,
  deleteWebsite,
  uploadAsset,
  getCatalog,
  getPublicWebsite,
}
