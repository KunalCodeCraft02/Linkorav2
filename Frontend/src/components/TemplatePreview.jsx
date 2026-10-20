import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { resolveDocument } from '../../../shared/resolve.mjs'
import { fontStack } from '../../../shared/themes.mjs'
import { SectionView } from './sections'

/**
 * A faithful, fitted preview of a template.
 *
 * It renders the *actual* template document with the *actual* section
 * components - not a screenshot or a hand-drawn approximation - so what a
 * user sees in the template browser is what they will get.
 *
 * The preview is scaled down with CSS rather than by rendering a smaller
 * document, which keeps the type and spacing exactly proportional.
 *
 * The scale is *measured*, not assumed. Templates have different content
 * widths (520px to 720px) and different page heights, so a fixed scale
 * renders them at wildly different sizes, leaves each one sitting in a
 * corner of its tile, and cuts most of the page off.
 *
 * Instead the preview measures the space it has and scales the page to fit
 * *both* axes, then centres it. Every template in the grid therefore reads
 * as the same size and shows the same amount of itself, whatever its own
 * dimensions.
 */
export default function TemplatePreview({ template, height = 250, maxScale = 1 }) {
  const stageRef = useRef(null)
  const pageRef = useRef(null)
  const [stage, setStage] = useState({ width: 0, height: 0 })

  const resolved = useMemo(() => {
    const theme = template.themeId
    const document_ = {
      site: {
        templateId: template.id,
        themeId: theme,
        layout: template.layout,
        contentWidth: template.contentWidth,
        spacingScale: template.spacingScale,
        radius: template.radius,
        profileLayout: template.profileLayout,
        socialIconStyle: template.socialIconStyle,
        buttonPreset: template.buttonPreset,
        shadow: template.shadow,
      },
      profile: {},
      sections: template.sections,
    }
    return resolveDocument(document_)
  }, [template])

  const { tokens, sections } = resolved
  const { colors, typography } = tokens
  const visible = sections.filter((section) => !section.props?.hidden)

  // Measure the stage so the page can be scaled to fit it exactly.
  useLayoutEffect(() => {
    const element = stageRef.current
    if (!element) return undefined

    const measure = () => setStage({ width: element.clientWidth, height: element.clientHeight })
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const contentWidth = tokens.contentWidth || 540

  // The page's natural height is needed to fit both axes. It is measured
  // from the DOM because the height depends on the rendered type, which
  // only the browser knows.
  //
  // The measurement has to be of the *unscaled* page. Reading
  // `getBoundingClientRect().height` on the scaled element would give the
  // height after the transform, which changes as the scale changes - a
  // feedback loop that would settle on the wrong answer. `offsetHeight` is
  // the layout height, which the transform does not affect.
  const [pageHeight, setPageHeight] = useState(0)

  useLayoutEffect(() => {
    const element = pageRef.current
    if (!element) return undefined

    const measure = () => setPageHeight(element.offsetHeight)
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [template, resolved])

  // Fit the page to the stage.
  //
  // Width is the axis that matters: the page has to fill the tile, or it
  // reads as a postage stamp sitting in a corner, and templates with
  // different content widths end up looking like different sizes. So the
  // page is scaled to fill the width exactly, and the part that is taller
  // than the tile fades out at the bottom.
  //
  // The height only takes over in the extreme case, where filling the
  // width would leave so little of the page on screen that the preview
  // says nothing at all. That is measured as the fraction of the page
  // that would still be visible.
  const widthScale = stage.width > 0 ? stage.width / contentWidth : 0
  const heightScale = stage.height > 0 && pageHeight > 0 ? stage.height / pageHeight : Infinity

  const widthVisible = heightScale > 0 ? heightScale / widthScale : 1
  const tooTallToRead = widthVisible < 0.15
  const finalScale = tooTallToRead
    ? Math.min(heightScale, maxScale)
    : Math.min(widthScale, maxScale)

  // The frame is the page's *scaled* width, so it can be centred with
  // ordinary block layout. Centring the untransformed page instead would
  // be off by the scale factor, because a CSS transform does not change
  // the box that the layout engine centres.
  const scaledWidth = Math.round(contentWidth * finalScale)
  const scaledHeight = Math.round(pageHeight * finalScale)

  // Is the bottom of the page cut off by the tile?
  const isCropped = scaledHeight > stage.height + 1

  // The page's own background. The fade at the bottom of the preview has
  // to fade into *this* colour, not into the editor chrome, or a dark
  // template gets a pale haze across the bottom of its card.
  const pageBackground =
    tokens.background?.type === 'gradient'
      ? tokens.background.secondary || colors.background
      : tokens.background?.value || colors.background

  return (
    <div
      className="template-preview"
      ref={stageRef}
      style={{ height: `${height}px`, '--preview-fade': pageBackground }}
    >
      <div
        className="template-preview__frame"
        style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
      >
        <div
          className="template-preview__scale"
          style={{
            width: `${contentWidth}px`,
            transform: `scale(${finalScale})`,
            transformOrigin: 'top left',
          }}
        >
          <div
            ref={pageRef}
            className={`website-canvas lx-layout--${tokens.layout}`}
            style={{
              '--lx-radius': `${tokens.radius}px`,
              '--lx-shadow': tokens.shadow,
              '--lx-accent': colors.accent,
              '--lx-accent-text': colors.accentText,
              '--lx-surface': colors.surface,
              '--lx-border': colors.border,
              '--lx-muted': colors.muted,
              '--lx-heading-font': fontStack(typography.headingFont),
              '--lx-scale': typography.scale,
              color: colors.text,
              fontFamily: fontStack(typography.bodyFont),
              background:
                tokens.background?.type === 'gradient'
                  ? `linear-gradient(160deg, ${tokens.background.value} 0%, ${tokens.background.secondary} 100%)`
                  : tokens.background?.value || colors.background,
              gap: `${Math.round(24 * tokens.spacingScale)}px`,
              padding: `${Math.round(40 * tokens.spacingScale)}px ${Math.round(24 * tokens.spacingScale)}px`,
              width: `${contentWidth}px`,
            }}
          >
            {visible.map((section) => (
              <div className="canvas-section" key={section.id}>
                <SectionView section={section} tokens={tokens} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* When the page is taller than the tile, fade the bottom edge so it
          reads as "there is more below" rather than as a clipped
          screenshot. The fade uses the page's own background colour, so a
          dark template does not get a pale haze across its card. */}
      {isCropped ? (
        <div className="template-preview__fade" aria-hidden="true" />
      ) : null}
    </div>
  )
}
