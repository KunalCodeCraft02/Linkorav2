/**
 * The premium template library.
 *
 * A template is a complete starting point: a theme, a page layout, a
 * section arrangement and realistic default content. Creating a website
 * from a template copies all of it into the user's document, after which
 * every single value is editable in the visual editor - the template is
 * never referenced again.
 *
 * The templates are genuinely different from one another: they use
 * different page layouts, different type scale, different accent colours,
 * different button treatments and different section orders. None of them is
 * a recolouring of another.
 */

import { defaultSectionProps, newId } from './website-schema.mjs'

/* -------------------------------------------------------------------------- */
/* Helpers used while defining the default content                            */
/* -------------------------------------------------------------------------- */

let seed = 0
const sid = (prefix) => {
  seed += 1
  return `${prefix}-tpl-${seed}`
}

const section = (type, props = {}) => ({ id: sid(type), type, props: { ...defaultSectionProps(type), ...props } })

const socialItems = (entries) =>
  entries.map(([platform, url]) => ({ id: sid('social'), platform, url, label: '' }))

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

export const TEMPLATES = [
  
  

  /* ---------------------------------------------------------------- */
  {
    id: 'hearth',
    name: 'Hearth',
    description: 'A warm, appetising page for a restaurant, café or local shop.',
    category: 'Restaurant & Local Business',
    themeId: 'warm-earthy',
    layout: 'card',
    profileLayout: 'stack',
    socialIconStyle: 'pill',
    buttonPreset: 'solid',
    shadow: 'soft',
    radius: 20,
    spacingScale: 1.05,
    contentWidth: 540,
    tags: ['restaurant', 'local', 'menu'],
    swatches: ['#f5ede3', '#a4552f', '#7c7a3f'],
    sections: [
      section('profile', {
        name: 'Hearth & Rye',
        headline: 'Wood-fired cooking, open late',
        bio: 'A neighbourhood kitchen on Ferrier Street. Walk-ins welcome, no bookings needed before seven.',
        avatarShape: 'squircle',
        imageSize: 96,
        surface: true,
      }),
      section('image', { aspect: '16:9', radius: 20, showCaption: true, caption: 'The room, most evenings.' }),
      section('text', {
        text: 'Tonight at the pass',
        role: 'heading',
        size: 15,
        weight: 700,
        letterSpacing: 2.5,
        align: 'left',
      }),
      section('link-card', {
        title: 'Tuesday · Smoked brisket & pickles',
        description: 'Twelve-hour brisket, fermented pickles, charred bread.',
        meta: 'From £18',
        style: 'card',
        accentLine: true,
      }),
      section('link-card', {
        title: 'Wednesday · Whole roast celeriac',
        description: 'Hazelnut, brown butter, lovage, and a very good bread sauce.',
        meta: 'From £16',
        style: 'card',
        accentLine: true,
      }),
      section('link-button', {
        label: 'Book a table',
        url: 'https://example.com/tables',
        style: 'solid',
        icon: 'arrow',
      }),
      section('link-button', {
        label: 'See the full menu',
        url: 'https://example.com/menu',
        style: 'outline',
      }),
      section('contact', { phone: '+44 20 7946 0999', location: '14 Ferrier Street, London', email: 'eat@example.com' }),
    ],
  },

  
    /* ---------------------------------------------------------------- */
  {
    id: 'html-rose', name: 'Rose Studio', description: 'A warm pink agency page with quick links, contact cards and a map.',
    category: 'Business & Agency', themeId: 'agency-rose', layout: 'stack', profileLayout: 'stack', socialIconStyle: 'circle',
    buttonPreset: 'solid', shadow: 'soft', radius: 22, spacingScale: 0.6, contentWidth: 460,
    tags: ['agency', 'pink'], swatches: ['#fdf0f2', '#a94679', '#f8cbd7'],
    sections: [section('html-page', { style: 'pink' })],
  },
  {
    id: 'html-cosmos', name: 'Cosmos', description: 'A starry purple page with a fox, contact cards and a map.',
    category: 'Business & Agency', themeId: 'agency-cosmos', layout: 'stack', profileLayout: 'stack', socialIconStyle: 'circle',
    buttonPreset: 'soft', shadow: 'soft', radius: 28, spacingScale: 0.6, contentWidth: 460,
    tags: ['agency', 'purple'], swatches: ['#1d1458', '#7c52d4', '#ffd98a'],
    sections: [section('html-page', { style: 'purple' })],
  },
  {
    id: 'html-night', name: 'Night Sky', description: 'A deep blue night scene with glowing glass link cards.',
    category: 'Business & Agency', themeId: 'agency-night', layout: 'stack', profileLayout: 'stack', socialIconStyle: 'circle',
    buttonPreset: 'soft', shadow: 'soft', radius: 24, spacingScale: 0.6, contentWidth: 460,
    tags: ['agency', 'dark', 'blue'], swatches: ['#0d1a6b', '#5064e6', '#f5b53f'],
    sections: [section('html-page', { style: 'nightblue' })],
  },
  {
    id: 'html-sky', name: 'Blue Sky', description: 'A soft sky with drifting clouds and pillowy link cards.',
    category: 'Business & Agency', themeId: 'agency-sky', layout: 'stack', profileLayout: 'stack', socialIconStyle: 'pill',
    buttonPreset: 'soft', shadow: 'soft', radius: 40, spacingScale: 0.6, contentWidth: 460,
    tags: ['agency', 'soft', 'blue'], swatches: ['#b7cbea', '#5576c9', '#f0e8db'],
    sections: [section('html-page', { style: 'bluesky' })],
  },
  {
    id: 'html-ink', name: 'Ink Drip', description: 'A cream page with a living ink-drip header and dark cards.',
    category: 'Business & Agency', themeId: 'agency-ink', layout: 'stack', profileLayout: 'stack', socialIconStyle: 'circle',
    buttonPreset: 'solid', shadow: 'soft', radius: 30, spacingScale: 0.6, contentWidth: 460,
    tags: ['agency', 'cream'], swatches: ['#d28717', '#171c28', '#2f86d6'],
    sections: [section('html-page', { style: 'ink' })],
  },
  
]

export const TEMPLATE_BY_ID = new Map(TEMPLATES.map((template) => [template.id, template]))

export function getTemplate(id) {
  return TEMPLATE_BY_ID.get(id) || null
}

export const TEMPLATE_CATEGORIES = [
  'Creator & Influencer',
  'Developer & Portfolio',
  'Freelancer & Personal Brand',
  'Business & Agency',
  'Product Launch & Startup',
  'Artist & Photographer',
  'Musician & Entertainment',
  'Coach & Consultant',
  'Restaurant & Local Business',
  'Event & Community',
]

/**
 * Build a fresh website document from a template. The returned document is a
 * plain object with no references back to the template, so the user can
 * change anything without affecting the template or anyone else's site.
 */
export function buildDocumentFromTemplate(templateId, overrides = {}) {
  const template = getTemplate(templateId) || TEMPLATES[0]
  const sections = template.sections.map((entry) => ({
    id: newId(entry.type),
    type: entry.type,
    props: JSON.parse(JSON.stringify(entry.props)),
  }))

  return {
    site: {
      templateId: template.id,
      themeId: template.themeId,
      layout: template.layout,
      colors: {},
      typography: {},
      background: {},
      contentWidth: template.contentWidth,
      spacingScale: template.spacingScale,
      radius: template.radius,
      profileLayout: template.profileLayout,
      socialIconStyle: template.socialIconStyle,
      buttonPreset: template.buttonPreset,
      shadow: template.shadow,
    },
    profile: {
      name: '',
      headline: '',
      bio: '',
      image: '',
    },
    sections,
    ...overrides,
  }
}
