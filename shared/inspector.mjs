/**
 * How the editor presents each property.
 *
 * `website-schema.mjs` describes what a property *is* (its type, its range,
 * its default) and the server validates against exactly that. This module
 * describes how the property should be *shown* - its label, which control to
 * use, which group it belongs to.
 *
 * Because the two live side by side and are derived from the same key set,
 * the inspector can never offer a control for a property the server would
 * reject, and a property can never be editable in the UI without the server
 * accepting it.
 */

import { SECTION_DEFS, sectionSpec, FONT_LIST, INHERIT_FONT } from './website-schema.mjs'

/**
 * Presentation metadata for a property key.
 *
 *   label  - the text shown next to the control
 *   group  - the heading the control sits under in the inspector
 *   control- 'text' | 'textarea' | 'number' | 'slider' | 'toggle' |
 *            'select' | 'color' | 'url' | 'image'
 *   options- the choices for a 'select'
 */
const PRESENTATION = {
  /* --- text --------------------------------------------------------------- */
  text: { label: 'Text', group: 'Content', control: 'textarea' },
  name: { label: 'Name', group: 'Content', control: 'text' },
  headline: { label: 'Headline', group: 'Content', control: 'text' },
  bio: { label: 'Bio', group: 'Content', control: 'textarea' },
  label: { label: 'Label', group: 'Content', control: 'text' },
  title: { label: 'Title', group: 'Content', control: 'text' },
  description: { label: 'Description', group: 'Content', control: 'textarea' },
  meta: { label: 'Eyebrow', group: 'Content', control: 'text' },
  caption: { label: 'Caption', group: 'Content', control: 'text' },
  alt: { label: 'Alternative text', group: 'Content', control: 'text', help: 'Describes the image for people who cannot see it.' },
  email: { label: 'Email', group: 'Content', control: 'text' },
  phone: { label: 'Phone', group: 'Content', control: 'text' },
  location: { label: 'Location', group: 'Content', control: 'text' },

  /* --- links -------------------------------------------------------------- */
  url: { label: 'Destination URL', group: 'Content', control: 'url' },
  openInNewTab: { label: 'Open in a new tab', group: 'Content', control: 'toggle' },

  /* --- typography --------------------------------------------------------- */
  font: { label: 'Font', group: 'Typography', control: 'select', options: [INHERIT_FONT, ...FONT_LIST] },
  role: { label: 'Style', group: 'Typography', control: 'select', options: ['body', 'heading', 'lead'] },
  size: { label: 'Size', group: 'Typography', control: 'slider', step: 1 },
  weight: { label: 'Weight', group: 'Typography', control: 'select', options: [300, 400, 500, 600, 700, 800] },
  lineHeight: { label: 'Line height', group: 'Typography', control: 'slider', step: 0.05 },
  letterSpacing: { label: 'Letter spacing', group: 'Typography', control: 'slider', step: 0.5 },
  transform: { label: 'Capitalisation', group: 'Typography', control: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'] },
  color: { label: 'Text colour', group: 'Typography', control: 'color' },
  textColor: { label: 'Text colour', group: 'Typography', control: 'color' },
  background: { label: 'Background', group: 'Typography', control: 'color' },

  /* --- image -------------------------------------------------------------- */
  image: { label: 'Image', group: 'Media', control: 'image' },
  poster: { label: 'Poster image', group: 'Media', control: 'image' },
  aspect: { label: 'Aspect ratio', group: 'Media', control: 'select', options: ['auto', '1:1', '4:3', '3:4', '16:9', '21:9'] },
  objectPosition: { label: 'Focus point', group: 'Media', control: 'text', help: 'CSS position, for example "50% 30%".' },
  shadow: { label: 'Drop shadow', group: 'Media', control: 'toggle' },
  showCaption: { label: 'Show caption', group: 'Media', control: 'toggle' },
  showDescription: { label: 'Show description', group: 'Media', control: 'toggle' },
  showImage: { label: 'Show image', group: 'Media', control: 'toggle' },
  showCaptions: { label: 'Show captions', group: 'Media', control: 'toggle' },
  columns: { label: 'Columns', group: 'Media', control: 'slider', step: 1 },
  gap: { label: 'Gap', group: 'Media', control: 'slider', step: 1 },

  /* --- links & buttons ---------------------------------------------------- */
  style: { label: 'Style', group: 'Appearance', control: 'select' },
  radius: { label: 'Corner radius', group: 'Appearance', control: 'slider', step: 1 },
  paddingY: { label: 'Padding', group: 'Appearance', control: 'slider', step: 1 },
  paddingX: { label: 'Side padding', group: 'Appearance', control: 'slider', step: 1 },
  borderColor: { label: 'Border colour', group: 'Appearance', control: 'color' },
  borderWidth: { label: 'Border width', group: 'Appearance', control: 'slider', step: 1 },
  fullWidth: { label: 'Full width', group: 'Appearance', control: 'toggle' },
  icon: { label: 'Icon', group: 'Appearance', control: 'select', options: ['none', 'arrow', 'external', 'play', 'cart', 'download', 'heart', 'star', 'mail'] },
  accentLine: { label: 'Accent line', group: 'Appearance', control: 'toggle' },

  /* --- social ------------------------------------------------------------- */
  shape: { label: 'Shape', group: 'Appearance', control: 'select', options: ['circle', 'rounded', 'square'] },

  /* --- profile ------------------------------------------------------------ */
  avatarShape: { label: 'Avatar shape', group: 'Profile', control: 'select', options: ['circle', 'squircle', 'square'] },
  imageSize: { label: 'Avatar size', group: 'Profile', control: 'slider', step: 2 },
  showHeadline: { label: 'Show headline', group: 'Profile', control: 'toggle' },
  showBio: { label: 'Show bio', group: 'Profile', control: 'toggle' },

  /* --- video -------------------------------------------------------------- */
  autoplay: { label: 'Autoplay', group: 'Media', control: 'toggle' },
  loop: { label: 'Loop', group: 'Media', control: 'toggle' },
  muted: { label: 'Muted', group: 'Media', control: 'toggle' },

  /* --- contact ------------------------------------------------------------ */
  showEmail: { label: 'Show email', group: 'Content', control: 'toggle' },
  showPhone: { label: 'Show phone', group: 'Content', control: 'toggle' },
  showLocation: { label: 'Show location', group: 'Content', control: 'toggle' },

  /* --- divider & spacer --------------------------------------------------- */
  thickness: { label: 'Thickness', group: 'Appearance', control: 'slider', step: 1 },
  height: { label: 'Height', group: 'Appearance', control: 'slider', step: 4 },

  /* --- shared layout ------------------------------------------------------ */
  width: { label: 'Width', group: 'Layout', control: 'slider', step: 1 },
  align: { label: 'Alignment', group: 'Layout', control: 'select', options: ['left', 'center', 'right'] },
  hidden: { label: 'Hidden', group: 'Layout', control: 'toggle' },
  surface: { label: 'Panel background', group: 'Layout', control: 'toggle' },
  surfaceColor: { label: 'Panel colour', group: 'Layout', control: 'color' },
}

/**
 * The order groups appear in the inspector. A group with no controls for the
 * current section is simply not rendered.
 */
const GROUP_ORDER = ['Content', 'Typography', 'Media', 'Appearance', 'Profile', 'Layout']

/**
 * Options for the `style` enum differ per section type, so they are filled in
 * from the spec rather than hard-coded in the presentation table.
 */
const STYLE_OPTIONS = {
  'link-button': ['solid', 'soft', 'outline', 'shadow', 'minimal'],
  'link-card': ['card', 'outline', 'flat', 'media'],
  'social-links': ['icons', 'pills', 'labeled', 'plain'],
  contact: ['inline', 'stacked', 'cards'],
  divider: ['solid', 'dashed', 'dotted', 'gradient'],
}

/**
 * Build the ordered list of controls for one section type.
 *
 * Returns an array of groups, each with a `label` and a list of controls.
 * Every control carries the spec's own range and default, so the numbers the
 * user sees are the numbers the server will accept.
 */
export function describeSectionProps(type) {
  const def = SECTION_DEFS[type]
  if (!def) return []

  const spec = sectionSpec(type).fields
  const byGroup = new Map()

  for (const [key, propSpec] of Object.entries(spec)) {
    const presentation = PRESENTATION[key]
    if (!presentation) continue

    // Lists of objects (social links, gallery images) get a dedicated
    // repeating editor rather than a generic control.
    if (propSpec.type === 'list') continue

    const control = { key, spec: propSpec, ...presentation }

    if (propSpec.type === 'enum' && !control.options) {
      control.options = STYLE_OPTIONS[key] || propSpec.values
    }

    // A slider needs its bounds; the spec is the single source for them.
    if (control.control === 'slider') {
      control.min = propSpec.min ?? 0
      control.max = propSpec.max ?? 100
    }

    const groupLabel = presentation.group
    if (!byGroup.has(groupLabel)) byGroup.set(groupLabel, [])
    byGroup.get(groupLabel).push(control)
  }

  const ordered = GROUP_ORDER.filter((label) => byGroup.has(label)).map((label) => ({
    label,
    controls: byGroup.get(label),
  }))

  // Any group not in the known order still gets shown, rather than dropped.
  for (const [label, controls] of byGroup) {
    if (!GROUP_ORDER.includes(label)) ordered.push({ label, controls })
  }

  return ordered
}

/**
 * The sections whose props are a repeating list the editor edits as a list:
 * social links and gallery images.
 */
export const LIST_SECTION_TYPES = new Set(['social-links', 'gallery'])

/**
 * Which section types carry a list of items, and what each item holds.
 */
export const LIST_ITEM_FIELDS = {
  'social-links': [
    { key: 'platform', label: 'Platform', control: 'select' },
    { key: 'url', label: 'URL', control: 'url' },
    { key: 'label', label: 'Label', control: 'text' },
  ],
  gallery: [
    { key: 'url', label: 'Image', control: 'image' },
    { key: 'alt', label: 'Alternative text', control: 'text' },
    { key: 'caption', label: 'Caption', control: 'text' },
  ],
}

export { PRESENTATION, GROUP_ORDER }
