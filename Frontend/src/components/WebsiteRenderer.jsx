import { useMemo } from 'react'
import { resolveDocument } from '../../../shared/resolve.mjs'
import { fontStack } from '../../../shared/themes.mjs'
import { SectionView } from './sections'

/**
 * The single renderer used by the editor canvas, the preview page and the
 * published public page.
 *
 * Because all three go through this component, what the editor shows is
 * exactly what the public page shows - there is no second implementation
 * that could drift.
 *
 * The renderer reads only the controlled section vocabulary, so a saved
 * document can never inject markup or script.
 */

function backgroundStyle(background, colors) {
  if (!background) return { background: colors.background }

  if (background.type === 'gradient') {
    const secondary = background.secondary || colors.surface
    return { background: `linear-gradient(160deg, ${background.value || colors.background} 0%, ${secondary} 100%)` }
  }

  if (background.type === 'image' && background.value) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${(background.overlay || 0) / 100}), rgba(0,0,0,${(background.overlay || 0) / 100})), url(${background.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return { background: background.value || colors.background }
}

export default function WebsiteRenderer({ website, interactive = false, onSelect, selectedId, showFallback = false }) {
  const resolved = useMemo(
    () => resolveDocument({ site: website?.site, profile: website?.profile, sections: website?.sections }),
    [website?.site, website?.profile, website?.sections],
  )

  const { tokens, sections } = resolved
  const { colors, typography } = tokens
  const visible = sections.filter((section) => !section.props?.hidden)

  const style = {
    ...backgroundStyle(tokens.background, colors),
    color: colors.text,
    fontFamily: fontStack(typography.bodyFont),
    '--lx-radius': `${tokens.radius}px`,
    '--lx-shadow': tokens.shadow,
    '--lx-accent': colors.accent,
    '--lx-accent-text': colors.accentText,
    '--lx-surface': colors.surface,
    '--lx-border': colors.border,
    '--lx-muted': colors.muted,
    '--lx-heading-font': fontStack(typography.headingFont),
    '--lx-scale': typography.scale,
  }

  if (!visible.length && !showFallback) {
    return (
      <div className="website-canvas" style={style}>
        <div className="empty-canvas-message">
          <span className="lx-eyebrow">your canvas is ready</span>
          <strong>Choose a block from the left</strong>
          <small>Click a block or drag it here to begin.</small>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`website-canvas lx-layout--${tokens.layout}`}
      style={{
        ...style,
        maxWidth: `${tokens.contentWidth}px`,
        gap: `${Math.round(24 * tokens.spacingScale)}px`,
        padding: `${Math.round(40 * tokens.spacingScale)}px ${Math.round(24 * tokens.spacingScale)}px`,
      }}
    >
      {visible.map((section) => {
        const isSelected = selectedId === section.id
        return (
          <div
            className={`canvas-section ${isSelected ? 'is-selected' : ''}`}
            key={section.id}
            data-section-id={section.id}
            data-section-type={section.type}
            onClick={interactive ? undefined : (event) => {
              event.stopPropagation()
              onSelect?.(section.id)
            }}
            role={interactive ? undefined : 'button'}
            tabIndex={interactive ? undefined : -1}
            aria-label={interactive ? undefined : `Select ${section.type} section`}
          >
            <SectionView section={section} tokens={tokens} />
          </div>
        )
      })}
    </div>
  )
}
