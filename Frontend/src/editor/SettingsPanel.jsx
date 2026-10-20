import { FONT_OPTIONS, THEMES as THEME_OPTIONS } from '../../../shared/themes.mjs'
import { SITE_LAYOUTS } from '../../../shared/website-schema.mjs'

/**
 * The page-level settings.
 *
 * These are the values that belong to the whole document rather than to a
 * single block: the theme, the colour palette, the typography, the page
 * background, the content width and the spacing scale.
 */

const LAYOUT_LABELS = {
  stack: 'Stacked',
  split: 'Split',
  card: 'Cards',
  masonry: 'Masonry',
  editorial: 'Editorial',
  grid: 'Grid',
  showcase: 'Showcase',
  minimal: 'Minimal',
  retro: 'Retro',
  bold: 'Bold',
}

const COLOUR_FIELDS = [
  { key: 'background', label: 'Page background' },
  { key: 'surface', label: 'Card surface' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentText', label: 'Text on accent' },
  { key: 'border', label: 'Border' },
  { key: 'highlight', label: 'Highlight' },
]

function Section({ title, children }) {
  return (
    <section className="insp-group">
      <h4 className="insp-group__title">{title}</h4>
      {children}
    </section>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, suffix = '' }) {
  const id = `site-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="insp-field">
      <div className="insp-field__row">
        <label className="insp-label" htmlFor={id}>
          {label}
        </label>
        <output htmlFor={id}>
          {value}
          {suffix}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

export default function SettingsPanel({
  site,
  tokens,
  onSiteChange,
  slug,
  slugDraft,
  onSlugDraftChange,
  onSlugSave,
  slugStatus,
}) {
  const colours = site.colors || {}
  const typography = site.typography || {}
  const background = site.background || {}

  // The stored values are *overrides*. The colour pickers show what is
  // actually on screen, which is the override when there is one and the
  // theme's colour otherwise.
  const resolvedColours = tokens?.colors || {}
  const resolvedTypography = tokens?.typography || {}
  const resolvedBackground = tokens?.background || {}

  const setColour = (key, value) => onSiteChange('colors', { ...colours, [key]: value })

  return (
    <div className="sidebar-view">
      <Section title="Theme">
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-theme">
            Theme preset
          </label>
          <select
            id="site-theme"
            value={site.themeId || ''}
            onChange={(event) => onSiteChange('themeId', event.target.value)}
          >
            {THEME_OPTIONS.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <p className="insp-help">Changing the theme resets the colours and fonts to that preset.</p>
        </div>

        <div className="insp-field">
          <label className="insp-label" htmlFor="site-layout">
            Page layout
          </label>
          <select
            id="site-layout"
            value={site.layout || 'stack'}
            onChange={(event) => onSiteChange('layout', event.target.value)}
          >
            {SITE_LAYOUTS.map((layout) => (
              <option key={layout} value={layout}>
                {LAYOUT_LABELS[layout] || layout}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title="Colours">
        {COLOUR_FIELDS.map((field) => {
          const value = resolvedColours[field.key] || '#000000'
          const isOverridden = Boolean(colours[field.key])
          return (
            <div className="insp-field" key={field.key}>
              <label className="insp-label" htmlFor={`colour-${field.key}`}>
                {field.label}
              </label>
              <div className="insp-color">
                <input
                  id={`colour-${field.key}`}
                  type="color"
                  value={value}
                  onChange={(event) => setColour(field.key, event.target.value)}
                />
                <span className="insp-color__value">{value}</span>
                <button
                  type="button"
                  className="insp-link-button"
                  onClick={() => setColour(field.key, '')}
                  title="Use the theme default"
                  disabled={!isOverridden}
                >
                  Reset
                </button>
              </div>
            </div>
          )
        })}
      </Section>

      <Section title="Typography">
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-heading-font">
            Heading font
          </label>
          <select
            id="site-heading-font"
            value={resolvedTypography.headingFont || ''}
            onChange={(event) => onSiteChange('typography', { ...typography, headingFont: event.target.value })}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-body-font">
            Body font
          </label>
          <select
            id="site-body-font"
            value={resolvedTypography.bodyFont || ''}
            onChange={(event) => onSiteChange('typography', { ...typography, bodyFont: event.target.value })}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <Slider
          label="Type scale"
          value={resolvedTypography.scale ?? 1}
          min={0.8}
          max={1.6}
          step={0.01}
          onChange={(value) => onSiteChange('typography', { ...typography, scale: value })}
        />
      </Section>

      <Section title="Background">
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-background-type">
            Style
          </label>
          <select
            id="site-background-type"
            value={resolvedBackground.type || 'color'}
            onChange={(event) => onSiteChange('background', { ...background, type: event.target.value })}
          >
            <option value="color">Solid colour</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-background-value">
            Primary colour
          </label>
          <div className="insp-color">
            <input
              id="site-background-value"
              type="color"
              value={resolvedBackground.value || '#f6f5f1'}
              onChange={(event) => onSiteChange('background', { ...background, value: event.target.value })}
            />
            <span className="insp-color__value">{resolvedBackground.value || '#f6f5f1'}</span>
          </div>
        </div>
        {resolvedBackground.type === 'gradient' ? (
          <div className="insp-field">
            <label className="insp-label" htmlFor="site-background-secondary">
              Gradient end colour
            </label>
            <div className="insp-color">
              <input
                id="site-background-secondary"
                type="color"
                value={resolvedBackground.secondary || '#ffffff'}
                onChange={(event) => onSiteChange('background', { ...background, secondary: event.target.value })}
              />
              <span className="insp-color__value">{resolvedBackground.secondary || '#ffffff'}</span>
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Layout & spacing">
        <Slider
          label="Content width"
          value={tokens?.contentWidth ?? site.contentWidth ?? 540}
          min={300}
          max={920}
          step={10}
          suffix="px"
          onChange={(value) => onSiteChange('contentWidth', value)}
        />
        <Slider
          label="Spacing scale"
          value={tokens?.spacingScale ?? site.spacingScale ?? 1}
          min={0.6}
          max={2.2}
          step={0.05}
          onChange={(value) => onSiteChange('spacingScale', value)}
        />
        <Slider
          label="Corner radius"
          value={tokens?.radius ?? site.radius ?? 18}
          min={0}
          max={48}
          suffix="px"
          onChange={(value) => onSiteChange('radius', value)}
        />
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-profile-layout">
            Profile layout
          </label>
          <select
            id="site-profile-layout"
            value={site.profileLayout || 'stack'}
            onChange={(event) => onSiteChange('profileLayout', event.target.value)}
          >
            <option value="stack">Stacked</option>
            <option value="row">Side by side</option>
            <option value="centered">Centred</option>
          </select>
        </div>
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-button-preset">
            Default button style
          </label>
          <select
            id="site-button-preset"
            value={site.buttonPreset || 'solid'}
            onChange={(event) => onSiteChange('buttonPreset', event.target.value)}
          >
            <option value="solid">Solid</option>
            <option value="soft">Soft</option>
            <option value="outline">Outline</option>
            <option value="shadow">Shadow</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-social-style">
            Social icon style
          </label>
          <select
            id="site-social-style"
            value={site.socialIconStyle || 'pill'}
            onChange={(event) => onSiteChange('socialIconStyle', event.target.value)}
          >
            <option value="circle">Circle</option>
            <option value="rounded">Rounded</option>
            <option value="pill">Pill</option>
            <option value="plain">Plain</option>
          </select>
        </div>
      </Section>

      <Section title="Public address">
        <div className="insp-field">
          <label className="insp-label" htmlFor="site-slug">
            Your link
          </label>
          <div className="slug-field">
            <span className="slug-field__prefix">/p/</span>
            <input
              id="site-slug"
              type="text"
              value={slugDraft}
              onChange={(event) => onSlugDraftChange(event.target.value)}
              onBlur={onSlugSave}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onSlugSave()
                }
              }}
              spellCheck="false"
            />
          </div>
          {slugStatus === 'saving' ? <p className="insp-help">Saving...</p> : null}
          {slugStatus === 'saved' ? <p className="insp-help insp-help--ok">Address updated.</p> : null}
          {slugStatus === 'error' ? <p className="insp-error">That address could not be used.</p> : null}
          <p className="insp-help">
            Lowercase letters, numbers and hyphens. Your current address is /p/{slug}.
          </p>
        </div>
      </Section>
    </div>
  )
}
