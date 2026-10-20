const mongoose = require('mongoose')

/**
 * A section of a website. The vocabulary of `type` values is defined in
 * `shared/website-schema.mjs` and validated on every write; the schema here
 * only enforces the shape of the container.
 */
const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 80 },
    type: { type: String, required: true, maxlength: 40 },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
)

/**
 * The site-wide configuration. The theme preset supplies the defaults; the
 * values stored here are the user's overrides.
 */
const siteSchema = new mongoose.Schema(
  {
    templateId: { type: String, default: 'aurora', maxlength: 60 },
    themeId: { type: String, default: 'minimal-light', maxlength: 60 },
    layout: { type: String, default: 'stack', maxlength: 30 },
    colors: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    typography: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    background: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    contentWidth: { type: Number, default: 540, min: 300, max: 920 },
    spacingScale: { type: Number, default: 1, min: 0.6, max: 2.2 },
    radius: { type: Number, default: 18, min: 0, max: 48 },
    profileLayout: { type: String, default: 'stack', maxlength: 30 },
    socialIconStyle: { type: String, default: 'pill', maxlength: 30 },
    buttonPreset: { type: String, default: 'solid', maxlength: 30 },
    shadow: { type: String, default: 'soft', maxlength: 20 },
  },
  { _id: false },
)

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', maxlength: 80 },
    headline: { type: String, default: '', maxlength: 120 },
    bio: { type: String, default: '', maxlength: 400 },
    image: { type: String, default: '', maxlength: 600 },
    email: { type: String, default: '', maxlength: 254 },
    phone: { type: String, default: '', maxlength: 40 },
    location: { type: String, default: '', maxlength: 160 },
    avatarShape: { type: String, default: 'circle', maxlength: 20 },
  },
  { _id: false },
)

const websiteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 80 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    site: { type: siteSchema, default: () => ({}) },
    profile: { type: profileSchema, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
    publishedSite: { type: siteSchema, default: () => ({}) },
    publishedProfile: { type: profileSchema, default: () => ({}) },
    publishedSections: { type: [sectionSchema], default: [] },
    publishedAt: { type: Date },
  },
  { timestamps: true },
)

websiteSchema.index({ owner: 1, updatedAt: -1 })
websiteSchema.index({ slug: 1, status: 1 })

module.exports = mongoose.model('Website', websiteSchema)
