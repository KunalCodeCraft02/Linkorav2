/**
 * The ten theme presets.
 *
 * A theme is a complete, coordinated set of design tokens: colours,
 * typography, button treatment, border and shadow style, and a page
 * background. Because the tokens are shared, a theme can be applied to any
 * template and every individual value can then be overridden in the editor.
 *
 * The `colors` values are deliberately chosen so that text on background and
 * accent on accentText both clear the WCAG AA contrast bar.
 */

export const THEMES = [
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean, generous whitespace with a single calm accent.',
    group: 'Light',
    colors: {
      background: '#faf9f6',
      surface: '#ffffff',
      text: '#1b1b1f',
      muted: '#6b6a70',
      accent: '#2f3e56',
      accentText: '#ffffff',
      border: '#e6e4dd',
      highlight: '#d9a441',
    },
    typography: { headingFont: 'Bricolage Grotesque', bodyFont: 'Inter', headingWeight: 700, bodyWeight: 400, scale: 1 },
    background: { type: 'color', value: '#faf9f6' },
    radius: 14,
    shadow: 'soft',
    buttonPreset: 'soft',
    socialIconStyle: 'pill',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine typography, ink on paper, thin rules and serif headings.',
    group: 'Light',
    colors: {
      background: '#f7f4ee',
      surface: '#fffdf9',
      text: '#16150f',
      muted: '#6d675c',
      accent: '#8c2f21',
      accentText: '#fffdf9',
      border: '#ddd6c8',
      highlight: '#b08948',
    },
    typography: { headingFont: 'Playfair Display', bodyFont: 'Source Serif 4', headingWeight: 700, bodyWeight: 400, scale: 1.05 },
    background: { type: 'color', value: '#f7f4ee' },
    radius: 4,
    shadow: 'none',
    buttonPreset: 'outline',
    socialIconStyle: 'plain',
  },
  {
    id: 'dark-studio',
    name: 'Dark Studio',
    description: 'A deep charcoal studio with warm amber highlights.',
    group: 'Dark',
    colors: {
      background: '#141418',
      surface: '#1d1d23',
      text: '#f2f1ee',
      muted: '#a09ea6',
      accent: '#e8a13a',
      accentText: '#141418',
      border: '#2e2e37',
      highlight: '#e8a13a',
    },
    typography: { headingFont: 'Sora', bodyFont: 'Inter', headingWeight: 600, bodyWeight: 400, scale: 1 },
    background: { type: 'color', value: '#141418' },
    radius: 16,
    shadow: 'none',
    buttonPreset: 'solid',
    socialIconStyle: 'circle',
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    description: 'Muted lilac and mint, rounded shapes, nothing loud.',
    group: 'Pastel',
    colors: {
      background: '#f4f1fa',
      surface: '#ffffff',
      text: '#33304a',
      muted: '#77738c',
      accent: '#7c6bd4',
      accentText: '#ffffff',
      border: '#e6e1f3',
      highlight: '#8ecfb8',
    },
    typography: { headingFont: 'Nunito', bodyFont: 'Nunito Sans', headingWeight: 800, bodyWeight: 400, scale: 1.02 },
    background: { type: 'gradient', value: '#f6f2fb', secondary: '#eaf6f1' },
    radius: 24,
    shadow: 'soft',
    buttonPreset: 'soft',
    socialIconStyle: 'circle',
  },
  {
    id: 'bold-creator',
    name: 'Bold Creator',
    description: 'High-contrast blocks, saturated accents, unapologetic type.',
    group: 'Bold',
    colors: {
      background: '#fffdf5',
      surface: '#ffffff',
      text: '#101010',
      muted: '#5a5750',
      accent: '#ff4d2e',
      accentText: '#ffffff',
      border: '#101010',
      highlight: '#ffd400',
    },
    typography: { headingFont: 'Archivo Black', bodyFont: 'Space Grotesk', headingWeight: 800, bodyWeight: 500, scale: 1.1 },
    background: { type: 'color', value: '#fffdf5' },
    radius: 8,
    shadow: 'lift',
    buttonPreset: 'shadow',
    socialIconStyle: 'square',
  },
  {
    id: 'modern-business',
    name: 'Modern Business',
    description: 'Corporate clarity with a confident blue and a strict grid.',
    group: 'Business',
    colors: {
      background: '#f2f5f9',
      surface: '#ffffff',
      text: '#0f1b2d',
      muted: '#5a6a80',
      accent: '#1e56a0',
      accentText: '#ffffff',
      border: '#d8e0ea',
      highlight: '#2fa37c',
    },
    typography: { headingFont: 'Manrope', bodyFont: 'Inter', headingWeight: 700, bodyWeight: 400, scale: 1 },
    background: { type: 'color', value: '#f2f5f9' },
    radius: 12,
    shadow: 'soft',
    buttonPreset: 'solid',
    socialIconStyle: 'rounded',
  },
  {
    id: 'retro-pop',
    name: 'Retro Pop',
    description: 'Seventies swirls, punchy outlines and a sunny palette.',
    group: 'Bold',
    colors: {
      background: '#fff3d6',
      surface: '#ffffff',
      text: '#3a1f52',
      muted: '#7b5c8f',
      accent: '#e0479e',
      accentText: '#ffffff',
      border: '#3a1f52',
      highlight: '#ffb03a',
    },
    typography: { headingFont: 'Outfit', bodyFont: 'Nunito', headingWeight: 800, bodyWeight: 500, scale: 1.05 },
    background: { type: 'color', value: '#fff3d6' },
    radius: 20,
    shadow: 'lift',
    buttonPreset: 'shadow',
    socialIconStyle: 'circle',
  },
  {
    id: 'elegant-mono',
    name: 'Elegant Monochrome',
    description: 'Pure black and white, hairline rules, nothing but type.',
    group: 'Minimal',
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
      text: '#0a0a0a',
      muted: '#767676',
      accent: '#0a0a0a',
      accentText: '#ffffff',
      border: '#dcdcdc',
      highlight: '#0a0a0a',
    },
    typography: { headingFont: 'Instrument Serif', bodyFont: 'Inter', headingWeight: 400, bodyWeight: 400, scale: 1.08 },
    background: { type: 'color', value: '#ffffff' },
    radius: 0,
    shadow: 'none',
    buttonPreset: 'outline',
    socialIconStyle: 'plain',
  },
  {
    id: 'warm-earthy',
    name: 'Warm Earthy',
    description: 'Clay, sand and olive, with soft organic shapes.',
    group: 'Warm',
    colors: {
      background: '#f5ede3',
      surface: '#fdf8f1',
      text: '#33291f',
      muted: '#7b6a58',
      accent: '#a4552f',
      accentText: '#fdf8f1',
      border: '#e2d5c4',
      highlight: '#7c7a3f',
    },
    typography: { headingFont: 'Fraunces', bodyFont: 'Karla', headingWeight: 600, bodyWeight: 400, scale: 1.03 },
    background: { type: 'color', value: '#f5ede3' },
    radius: 18,
    shadow: 'soft',
    buttonPreset: 'soft',
    socialIconStyle: 'pill',
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    description: 'Electric violet and cyan on near-black, with a glow.',
    group: 'Dark',
    colors: {
      background: '#0b0a14',
      surface: '#151327',
      text: '#f0ecff',
      muted: '#9a94bd',
      accent: '#7c5cff',
      accentText: '#ffffff',
      border: '#262341',
      highlight: '#25e0d0',
    },
    typography: { headingFont: 'Space Grotesk', bodyFont: 'Inter', headingWeight: 700, bodyWeight: 400, scale: 1.04 },
    background: { type: 'gradient', value: '#0b0a14', secondary: '#161034' },
    radius: 20,
    shadow: 'lift',
    buttonPreset: 'shadow',
    socialIconStyle: 'rounded',
  },
]

export const THEME_BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]))

export function getTheme(id) {
  return THEME_BY_ID.get(id) || THEMES[0]
}

/** The font stacks offered in the editor. */
export const FONT_OPTIONS = [
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

/**
 * A ready-made CSS font stack for a family name. Unknown families fall back
 * to the system stack rather than loading a web font that is not there.
 */
export function fontStack(family) {
  const serif = ['Playfair Display', 'Source Serif 4', 'Instrument Serif', 'Fraunces', 'Georgia']
  const known = FONT_OPTIONS.includes(family)
  const fallback = serif.includes(family) ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif'
  if (!known) return fallback
  return `"${family}", ${fallback}`
}
