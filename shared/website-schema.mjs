/**
 * The single source of truth for a Linkora website document.
 *
 * This module is plain ESM with no dependencies, so it is imported by:
 *   - the CommonJS backend  (via Node's `require(esm)` support)
 *   - the Vite/ESM frontend (via a direct import)
 *
 * Everything a user can author is described here: the vocabulary of section
 * types, the props each one accepts, the site-wide configuration, and the
 * profile block. A prop "spec" is a small declarative description that both
 * the validator and the editor's inspector are generated from, so a control
 * can never exist in the UI for a prop the server would reject.
 *
 * No value coming from the browser is ever interpreted as markup. The
 * validator coerces everything into the controlled shapes below.
 */

/* -------------------------------------------------------------------------- */
/* Primitive specs                                                            */
/* -------------------------------------------------------------------------- */

const string = (max = 2000, defaultValue = '') => ({ type: 'string', max, default: defaultValue })
const text = (max = 4000, defaultValue = '') => ({ type: 'string', max, default: defaultValue })
const number = (min, max, defaultValue) => ({ type: 'number', min, max, default: defaultValue })
const bool = (defaultValue = false) => ({ type: 'boolean', default: defaultValue })
const enumOf = (values, defaultValue) => ({ type: 'enum', values, default: defaultValue })
const color = (defaultValue = '#000000') => ({ type: 'color', default: defaultValue })

/** Colours may also be left empty, meaning "inherit from the theme". */
const optionalColor = (defaultValue = '') => ({ type: 'color', default: defaultValue, allowEmpty: true })

/**
 * A URL. Only the schemes a public bio page should ever link to are
 * accepted - anything else (`javascript:`, `data:`, `vbscript:`) is dropped.
 */
const url = (defaultValue = '') => ({
  type: 'url',
  max: 600,
  default: defaultValue,
})

/** A plain object described field by field. */
const object = (fields, defaultValue = {}) => ({ type: 'object', fields, default: defaultValue })

/** A list of values, optionally of objects. */
const list = (of, max = 24) => ({ type: 'list', of, max })
const partialObject = (fields) => ({ type: 'object', fields, partial: true })

/**
 * A radius that may be left unset, in which case the theme's radius is used.
 * `-1` is the sentinel for "inherit"; the validator keeps it in range.
 */
const inheritedRadius = number(-1, 60, -1)

/**
 * The font families a user can choose from.
 *
 * The list lives here rather than in `themes.mjs` because the section specs
 * need it to describe the font enum, and the spec module must not import the
 * theme module (that would make the dependency graph circular).
 */
export const FONT_LIST = [
  'Inter',
  'Bricolage Grotesque',
  'Playfair Display',
  'Source Serif 4',
  'Sora',
  'Nunito',
  'Nunito Sans',
  'Archivo Black',
  'Space Grotesk',
  'Manrope',
  'Outfit',
  'Instrument Serif',
  'Fraunces',
  'Karla',
  'Georgia',
  'system-ui',
]

/** The value a text block carries when it uses the theme's own font. */
export const INHERIT_FONT = 'inherit'

const URL_SCHEME = /^(https?:\/\/|mailto:|tel:|\/|#)/i

/* -------------------------------------------------------------------------- */
/* Coercion                                                                   */
/* -------------------------------------------------------------------------- */

function coerceString(spec, value) {
  if (typeof value !== 'string') return spec.default
  return value.slice(0, spec.max)
}

function coerceNumber(spec, value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return spec.default
  return Math.min(spec.max, Math.max(spec.min, parsed))
}

function coerceColor(spec, value) {
  if (typeof value !== 'string') return spec.default
  const trimmed = value.trim()
  if (!trimmed) return spec.allowEmpty ? '' : spec.default
  if (!/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return spec.default
  return trimmed
}

function coerceUrl(spec, value) {
  if (typeof value !== 'string') return spec.default
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!URL_SCHEME.test(trimmed)) return spec.default
  return trimmed.slice(0, spec.max)
}

/**
 * Coerce one value against one spec, falling back to the spec default when
 * the incoming value is missing or the wrong shape.
 */
export function coerceValue(spec, value) {
  if (!spec) return undefined
  switch (spec.type) {
    case 'string':
      return coerceString(spec, value)
    case 'number':
      return coerceNumber(spec, value)
    case 'boolean':
      return typeof value === 'boolean' ? value : spec.default
    case 'enum':
      return spec.values.includes(value) ? value : spec.default
    case 'color':
      return coerceColor(spec, value)
    case 'url':
      return coerceUrl(spec, value)
    case 'object': {
      const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      const result = {}
      for (const [key, fieldSpec] of Object.entries(spec.fields)) {
        if (spec.partial && !(key in source)) continue
        result[key] = coerceValue(fieldSpec, source[key])
      }
      return result
    }
    case 'list': {
      if (!Array.isArray(value)) return []
      return value
        .slice(0, spec.max)
        .map((entry) => coerceValue(spec.of, entry))
        .filter((entry) => entry !== undefined)
    }
    default:
      return spec.default
  }
}

/* -------------------------------------------------------------------------- */
/* Section vocabulary                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Props every section understands, whatever its type.
 *
 * `surface` turns the block into a raised panel: a tinted background, a
 * border and a radius. It is the single mechanism behind the "card" look
 * that several templates use, so it only has to be styled once.
 */
const common = {
  hidden: bool(false),
  surface: bool(false),
  surfaceColor: optionalColor(''),
  paddingY: number(0, 80, 0),
  paddingX: number(0, 80, 0),
  radius: inheritedRadius,
  borderColor: optionalColor(''),
  borderWidth: number(0, 8, 0),
  width: number(20, 100, 100),
  align: enumOf(['left', 'center', 'right'], 'center'),
}

export const SECTION_TYPES = [
  'profile',
  'text',
  'image',
  'link-button',
  'social-links',
  'link-card',
  'gallery',
  'video',
  'contact',
  'divider',
  'spacer',
]

export const SECTION_TYPE_SET = new Set(SECTION_TYPES)

export const SOCIAL_PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  'github',
  'facebook',
  'threads',
  'spotify',
  'discord',
  'email',
  'website',
]

export const BUTTON_ICONS = ['none', 'arrow', 'external', 'play', 'cart', 'download', 'heart', 'star', 'mail']

/**
 * The definition of every section type: how it is labelled in the editor,
 * which group it belongs to in the sidebar, its default props, and the spec
 * its props are validated against.
 */
export const SECTION_DEFS = {
  profile: {
    label: 'Profile',
    group: 'website',
    icon: 'user',
    description: 'Your photo, name and short introduction.',
    spec: {
      ...common,
      name: string(80, 'Your name'),
      headline: string(120, 'Creator & maker'),
      bio: text(400, 'A short line about what you do.'),
      image: url(''),
      avatarShape: enumOf(['circle', 'squircle', 'square'], 'circle'),
      imageSize: number(48, 220, 96),
      showHeadline: bool(true),
      showBio: bool(true),
    },
  },

  text: {
    label: 'Text',
    group: 'text',
    icon: 'type',
    description: 'A heading or a paragraph.',
    spec: {
      ...common,
      text: text(2000, 'A thoughtful line about what you make.'),
      role: enumOf(['body', 'heading', 'lead'], 'body'),
      font: enumOf([INHERIT_FONT, ...FONT_LIST], INHERIT_FONT),
      size: number(12, 72, 18),
      weight: number(300, 800, 400),
      lineHeight: number(0.9, 3, 1.55),
      letterSpacing: number(-3, 12, 0),
      color: optionalColor(''),
      transform: enumOf(['none', 'uppercase', 'lowercase', 'capitalize'], 'none'),
    },
  },

  image: {
    label: 'Image',
    group: 'media',
    icon: 'image',
    description: 'A single photograph or illustration.',
    spec: {
      ...common,
      url: url(''),
      alt: string(200, ''),
      caption: string(200, ''),
      aspect: enumOf(['auto', '1:1', '4:3', '3:4', '16:9', '21:9'], '4:3'),
      objectPosition: string(40, '50% 50%'),
      radius: number(0, 80, 18),
      shadow: bool(false),
      showCaption: bool(false),
    },
  },

  'link-button': {
    label: 'Link button',
    group: 'links',
    icon: 'link',
    description: 'A call to action that opens a link.',
    spec: {
      ...common,
      label: string(80, 'Explore more'),
      url: url('https://example.com'),
      style: enumOf(['solid', 'soft', 'outline', 'shadow', 'minimal'], 'solid'),
      background: optionalColor(''),
      textColor: optionalColor(''),
      borderColor: optionalColor(''),
      radius: number(0, 60, 999),
      paddingY: number(6, 40, 14),
      paddingX: number(10, 60, 24),
      size: number(11, 24, 16),
      weight: number(300, 800, 600),
      fullWidth: bool(false),
      openInNewTab: bool(true),
      icon: enumOf(BUTTON_ICONS, 'none'),
    },
  },

  'social-links': {
    label: 'Social links',
    group: 'links',
    icon: 'share',
    description: 'A row of social profile links.',
    spec: {
      ...common,
      items: list(
        object({
          id: string(40, ''),
          platform: enumOf(SOCIAL_PLATFORMS, 'instagram'),
          url: url(''),
          label: string(60, ''),
        }),
        14,
      ),
      style: enumOf(['icons', 'pills', 'labeled', 'plain'], 'icons'),
      shape: enumOf(['circle', 'rounded', 'square'], 'circle'),
      size: number(30, 72, 42),
      gap: number(4, 40, 12),
      color: optionalColor(''),
      background: optionalColor(''),
    },
  },

  'link-card': {
    label: 'Link card',
    group: 'links',
    icon: 'card',
    description: 'A richer card for a link, with a title and description.',
    spec: {
      ...common,
      title: string(120, 'The new course'),
      description: text(280, 'Six weeks of lessons, plus the community.'),
      url: url('https://example.com'),
      image: url(''),
      meta: string(60, 'Course'),
      style: enumOf(['card', 'outline', 'flat', 'media'], 'card'),
      radius: number(0, 48, 20),
      showImage: bool(false),
      showDescription: bool(true),
      accentLine: bool(false),
    },
  },

  gallery: {
    label: 'Gallery',
    group: 'media',
    icon: 'grid',
    description: 'A grid of images.',
    spec: {
      ...common,
      items: list(
        object({
          id: string(40, ''),
          url: url(''),
          alt: string(160, ''),
          caption: string(120, ''),
        }),
        24,
      ),
      columns: number(1, 4, 2),
      gap: number(4, 48, 14),
      radius: number(0, 60, 16),
      aspect: enumOf(['auto', '1:1', '4:3', '3:4', '16:9'], '1:1'),
      showCaptions: bool(false),
    },
  },

  video: {
    label: 'Video',
    group: 'media',
    icon: 'play',
    description: 'An embedded or uploaded video.',
    spec: {
      ...common,
      url: url(''),
      poster: url(''),
      aspect: enumOf(['16:9', '4:3', '1:1', '21:9'], '16:9'),
      radius: number(0, 60, 18),
      autoplay: bool(false),
      loop: bool(false),
      muted: bool(false),
    },
  },

  contact: {
    label: 'Contact',
    group: 'website',
    icon: 'mail',
    description: 'Email, phone and location.',
    spec: {
      ...common,
      email: string(254, ''),
      phone: string(40, ''),
      location: string(160, ''),
      style: enumOf(['inline', 'stacked', 'cards'], 'stacked'),
      showEmail: bool(true),
      showPhone: bool(true),
      showLocation: bool(true),
    },
  },

  divider: {
    label: 'Divider',
    group: 'shapes',
    icon: 'minus',
    description: 'A horizontal rule.',
    spec: {
      ...common,
      style: enumOf(['solid', 'dashed', 'dotted', 'gradient'], 'solid'),
      color: optionalColor(''),
      width: number(10, 100, 100),
      thickness: number(1, 12, 1),
    },
  },

  spacer: {
    label: 'Spacer',
    group: 'shapes',
    icon: 'space',
    description: 'Empty space between sections.',
    spec: {
      ...common,
      height: number(4, 320, 48),
    },
  },
}

/** The sidebar groups, in the order they appear. */
export const SECTION_GROUPS = [
  { id: 'website', label: 'Website' },
  { id: 'text', label: 'Text' },
  { id: 'media', label: 'Images & media' },
  { id: 'links', label: 'Buttons & links' },
  { id: 'shapes', label: 'Shapes' },
]

/* -------------------------------------------------------------------------- */
/* Site-wide configuration                                                     */
/* -------------------------------------------------------------------------- */

export const SITE_LAYOUTS = [
  'stack',
  'split',
  'card',
  'masonry',
  'editorial',
  'grid',
  'showcase',
  'minimal',
  'retro',
  'bold',
]

export const SITE_SPEC = object({
  templateId: string(60, 'aurora'),
  themeId: string(60, 'minimal-light'),
  layout: enumOf(SITE_LAYOUTS, 'stack'),
  // Colours are *overrides*. An empty value means "use the theme's colour",
  // which is what lets a user reset a single colour without freezing the
  // whole palette into the document.
  colors: partialObject({
    background: optionalColor(''),
    surface: optionalColor(''),
    text: optionalColor(''),
    muted: optionalColor(''),
    accent: optionalColor(''),
    accentText: optionalColor(''),
    border: optionalColor(''),
    highlight: optionalColor(''),
  }),
  typography: partialObject({
    headingFont: string(80, 'Bricolage Grotesque'),
    bodyFont: string(80, 'Inter'),
    headingWeight: number(300, 800, 700),
    bodyWeight: number(300, 700, 400),
    scale: number(0.8, 1.6, 1),
  }),
  background: partialObject({
    type: enumOf(['color', 'gradient', 'image'], 'color'),
    // Empty means "inherit from the theme" - the value may also be an image
    // URL when the type is `image`.
    value: string(500, ''),
    secondary: optionalColor(''),
    overlay: number(0, 90, 0),
  }),
  contentWidth: number(300, 920, 540),
  spacingScale: number(0.6, 2.2, 1),
  radius: number(0, 48, 18),
  profileLayout: enumOf(['stack', 'row', 'centered'], 'stack'),
  socialIconStyle: enumOf(['circle', 'rounded', 'pill', 'plain'], 'pill'),
  buttonPreset: enumOf(['soft', 'solid', 'outline', 'shadow', 'minimal'], 'solid'),
  shadow: enumOf(['none', 'soft', 'lift'], 'soft'),
})

export const PROFILE_SPEC = object({
  name: string(80, ''),
  headline: string(120, ''),
  bio: text(400, ''),
  image: url(''),
  email: string(254, ''),
  phone: string(40, ''),
  location: string(160, ''),
  avatarShape: enumOf(['circle', 'squircle', 'square'], 'circle'),
})

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

let idCounter = 0

/** A stable, human-readable id that does not depend on array position. */
export function newId(prefix = 'sec') {
  idCounter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}-${random}`
}

function ensureListIds(section) {
  if (section.type === 'social-links' && Array.isArray(section.props.items)) {
    section.props.items = section.props.items.map((item) => ({ ...item, id: item.id || newId('social') }))
  }
  if (section.type === 'gallery' && Array.isArray(section.props.items)) {
    section.props.items = section.props.items.map((item) => ({ ...item, id: item.id || newId('img') }))
  }
}

/**
 * Validate one section. An unknown type collapses to `text` rather than
 * throwing, so a document written by an older version of the app still
 * opens in the editor.
 */
export function validateSection(section) {
  const source = section && typeof section === 'object' ? section : {}
  const type = SECTION_TYPE_SET.has(source.type) ? source.type : 'text'
  const def = SECTION_DEFS[type]
  const props = coerceValue(sectionSpec(type), source.props)
  const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim().slice(0, 80) : newId(type)
  const result = { id, type, props }
  ensureListIds(result)
  return result
}

export function validateSections(sections, max = 80) {
  if (!Array.isArray(sections)) return []
  const seen = new Set()
  return sections.slice(0, max).map((section) => {
    const validated = validateSection(section)
    let id = validated.id
    while (seen.has(id)) id = `${id}-x`
    seen.add(id)
    return { ...validated, id }
  })
}

export function validateSite(site) {
  return coerceValue(SITE_SPEC, site)
}

export function validateProfile(profile) {
  return coerceValue(PROFILE_SPEC, profile)
}

/**
 * Validate a whole website document. This is the only shape that may be
 * written to the database.
 */
export function validateDocument(document) {
  const source = document && typeof document === 'object' ? document : {}
  return {
    site: validateSite(source.site),
    profile: validateProfile(source.profile),
    sections: validateSections(source.sections),
  }
}

/**
 * The coercion spec for a section's props. A section's props are written
 * as a flat map of prop specs, so they are wrapped in an object spec here.
 */
export function sectionSpec(type) {
  const def = SECTION_DEFS[type] || SECTION_DEFS.text
  return object(def.spec)
}

/**
 * The default props for a fresh section of the given type.
 */
export function defaultSectionProps(type) {
  return coerceValue(sectionSpec(type), undefined)
}

/** A brand new section with a fresh id. */
export function createSection(type) {
  const safeType = SECTION_TYPE_SET.has(type) ? type : 'text'
  return { id: newId(safeType), type: safeType, props: defaultSectionProps(safeType) }
}

/* -------------------------------------------------------------------------- */
/* Migration from the previous (Figma / AI) document shape                    */
/* -------------------------------------------------------------------------- */

/**
 * Websites created before the rebuild stored a flat `components` array and a
 * `settings` object. The new document uses a typed `sections` array and a
 * theme-based `site` object. This migration reads the old shape so that
 * content the user already wrote is not thrown away.
 *
 * The mapping is deliberately conservative: anything that cannot be
 * represented in the new vocabulary is dropped rather than guessed at, and
 * everything that can be represented is carried across.
 */

const LEGACY_ALIGN = ['left', 'center', 'right']

/** Pick a value only if it is one of the allowed ones. */
function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

/** Keep a legacy colour only if it looks like a hex colour. */
function legacyColor(value, fallback = '') {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
    ? value.trim()
    : fallback
}

const LEGACY_FONTS = FONT_LIST

/**
 * Convert one legacy component into a section of the new vocabulary.
 */
function migrateLegacyComponent(component) {
  const type = component?.type
  const props = component?.props || {}
  const id = component?.id || newId(type || 'section')
  const align = pick(props.align, LEGACY_ALIGN, 'center')
  const hidden = props.hidden === true
  // The old builder positioned blocks with a percentage. It is not a
  // property the new layout has, so it is dropped.
  const common = { align, hidden }

  switch (type) {
    case 'profile':
      return {
        id,
        type: 'profile',
        props: {
          ...common,
          name: props.name || '',
          headline: props.bio || '',
          bio: '',
          image: props.image || '',
        },
      }

    case 'heading':
    case 'text': {
      const role = type === 'heading' ? 'heading' : 'body'
      const migrated = {
        ...common,
        text: props.text || '',
        role,
        align: pick(props.align, LEGACY_ALIGN, 'left'),
      }
      const color = legacyColor(props.color)
      if (color) migrated.color = color
      return { id, type: 'text', props: migrated }
    }

    case 'button':
      return {
        id,
        type: 'link-button',
        props: {
          ...common,
          label: props.label || 'Explore more',
          url: props.url || '',
          align: pick(props.align, LEGACY_ALIGN, 'center'),
        },
      }

    case 'image':
      return {
        id,
        type: 'image',
        props: {
          ...common,
          url: props.url || '',
          alt: props.alt || '',
          align: pick(props.align, LEGACY_ALIGN, 'center'),
        },
      }

    case 'social': {
      const items = ['instagram', 'linkedin', 'youtube', 'x']
        .filter((platform) => props[platform])
        .map((platform) => ({ id: newId('social'), platform, url: props[platform], label: '' }))
      return { id, type: 'social-links', props: { ...common, items } }
    }

    case 'contact':
      return {
        id,
        type: 'contact',
        props: {
          ...common,
          email: props.email || '',
          phone: props.phone || '',
          location: props.location || '',
        },
      }

    case 'video':
      return { id, type: 'video', props: { ...common, url: props.url || '' } }

    case 'spacer':
      return { id, type: 'spacer', props: { ...common, height: Number(props.height) || 48 } }

    case 'divider':
      return { id, type: 'divider', props: { ...common } }

    case 'shape':
      return { id, type: 'divider', props: { ...common } }

    case 'banner': {
      const migrated = {
        ...common,
        title: props.title || props.text || '',
        description: props.description || '',
        url: props.url || '',
      }
      const color = legacyColor(props.color)
      if (color) migrated.background = color
      return { id, type: 'link-card', props: migrated }
    }

    default:
      // Anything else - including the artefacts the old AI importer
      // produced - is kept as plain text so the words are not lost.
      return {
        id,
        type: 'text',
        props: { ...common, text: props.text || props.description || '', role: 'body' },
      }
  }
}

/**
 * Convert a document written by the old builder into the new section
 * vocabulary, so websites created before the rebuild keep their content.
 */
export function migrateLegacyDocument(legacy) {
  const source = legacy && typeof legacy === 'object' ? legacy : {}
  const settings = source.settings || {}
  const components = Array.isArray(source.components) ? source.components : []

  const sections = components
    .map(migrateLegacyComponent)
    .filter((section) => Boolean(section))

  const background = legacyColor(settings.background, '#f6f5f1')
  const accent = legacyColor(settings.accent, '#2b3fa0')
  const text = legacyColor(settings.textColor, '#1d1b2e')
  const font = pick(settings.font, LEGACY_FONTS, 'Inter')

  return {
    site: {
      colors: { background, accent, text },
      typography: { bodyFont: font },
      background: { type: 'color', value: background },
    },
    profile: {},
    sections,
  }
}
