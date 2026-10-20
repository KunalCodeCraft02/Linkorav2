/**
 * Resolves a website document into the values the renderer actually uses.
 *
 * The stored document keeps a `themeId` plus whatever the user overrode.
 * Rendering merges the two, so a user who changes one colour keeps the
 * rest of the theme's coherence, and switching theme later still works.
 *
 * The frontend imports this directly; the backend uses it to validate
 * documents, so the server and the browser always agree on what a
 * document means.
 */

import { getTheme } from './themes.mjs'
import { getTemplate } from './templates.mjs'
import { coerceValue, SITE_SPEC, validateSections, validateProfile } from './website-schema.mjs'

const COLOR_KEYS = ['background', 'surface', 'text', 'muted', 'accent', 'accentText', 'border', 'highlight']
const TYPO_KEYS = ['headingFont', 'bodyFont', 'headingWeight', 'bodyWeight', 'scale']

function pickDefined(source, keys) {
  const result = {}
  if (!source || typeof source !== 'object') return result
  for (const key of keys) {
    const value = source[key]
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && !value.trim()) continue
    result[key] = value
  }
  return result
}

/**
 * The effective design tokens for a document.
 */
export function resolveTokens(site = {}) {
  const theme = getTheme(site.themeId)
  const template = getTemplate(site.templateId)

  const colors = {
    ...theme.colors,
    ...pickDefined(site.colors, COLOR_KEYS),
  }

  const typography = {
    ...theme.typography,
    ...pickDefined(site.typography, TYPO_KEYS),
  }

  const background = {
    ...(theme.background || { type: 'color', value: colors.background, secondary: '' }),
    ...pickDefined(site.background, ['type', 'value', 'secondary']),
    overlay: typeof site.background?.overlay === 'number' ? site.background.overlay : theme.background?.overlay ?? 0,
  }

  // A theme whose background is a plain colour tracks the resolved
  // background colour, so overriding the colour also repaints the page.
  if (background.type === 'color' && !site.background?.value) {
    background.value = colors.background
  }

  return {
    theme,
    template,
    colors,
    typography,
    background,
    radius: typeof site.radius === 'number' ? site.radius : theme.radius,
    shadow: site.shadow || theme.shadow,
    contentWidth: site.contentWidth || 540,
    spacingScale: site.spacingScale || 1,
    layout: site.layout || template?.layout || 'stack',
    profileLayout: site.profileLayout || template?.profileLayout || 'stack',
    socialIconStyle: site.socialIconStyle || template?.socialIconStyle || 'pill',
    buttonPreset: site.buttonPreset || template?.buttonPreset || 'solid',
  }
}

/**
 * A fully-resolved document: the stored one, normalised, together with the
 * effective tokens and the profile.
 */
export function resolveDocument(document = {}) {
  const site = coerceValue(SITE_SPEC, document.site)
  const profile = validateProfile(document.profile)
  const sections = validateSections(document.sections)
  const tokens = resolveTokens(site)

  // The profile section, if there is one, is the authority for the profile
  // block; otherwise the document-level profile is used.
  const profileSection = sections.find((entry) => entry.type === 'profile')
  const mergedProfile = {
    ...profile,
    ...(profileSection
      ? {
          name: profileSection.props.name || profile.name,
          headline: profileSection.props.headline || profile.headline,
          bio: profileSection.props.bio || profile.bio,
          image: profileSection.props.image || profile.image,
        }
      : {}),
  }

  return { site, profile: mergedProfile, sections, tokens }
}

export { COLOR_KEYS, TYPO_KEYS }
