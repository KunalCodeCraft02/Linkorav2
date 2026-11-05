import { assetUrl } from '../lib/api'
import { SocialGlyph, ArrowRightIcon, ExternalIcon, CartIcon, DownloadIcon, PlayIcon, HeartIcon, StarIcon, MailIcon } from './icons'
import { PLATFORM_LABELS } from './platforms'
import { useMemo } from 'react'
import pinkHtml from '../html-designs/pink_profile.html?raw'
import purpleHtml from '../html-designs/purple_profile.html?raw'
import nightHtml from '../html-designs/nightblue_profile.html?raw'
import skyHtml from '../html-designs/blueSKY_profile.html?raw'
import inkHtml from '../html-designs/black_profile.html?raw'
import { extractFields, normalizeHref } from '../lib/htmlFields'

/**
 * The individual section renderers.
 *
 * Every section reads only the props of the controlled vocabulary, so
 * nothing a user (or a migrated document) contains is ever interpreted as
 * markup. The same components render the editor preview, the preview page
 * and the published public page, which is what keeps the three identical.
 */

const ASPECT_RATIOS = {
  '1:1': '1 / 1',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
  '16:9': '16 / 9',
  '21:9': '21 / 9',
  auto: 'auto',
}

const BUTTON_ICONS = {
  arrow: ArrowRightIcon,
  external: ExternalIcon,
  cart: CartIcon,
  download: DownloadIcon,
  play: PlayIcon,
  heart: HeartIcon,
  star: StarIcon,
  mail: MailIcon,
}

function avatarRadius(shape, radius) {
  if (shape === 'circle') return '50%'
  if (shape === 'square') return '0'
  return `${Math.min(radius, 40)}px`
}

/* -------------------------------------------------------------------------- */

function ProfileSection({ props, tokens }) {
  const { colors, typography } = tokens
  const size = props.imageSize || 96
  const shape = avatarRadius(props.avatarShape, tokens.radius)
  const align = props.align || 'center'

  return (
    <div className={`lx-profile lx-profile--${align}`}>
      <div
        className="lx-avatar"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: shape,
          background: `linear-gradient(135deg, ${colors.highlight}, ${colors.accent})`,
          boxShadow: tokens.shadow === 'lift' ? `0 14px 30px -12px ${colors.accent}` : undefined,
        }}
      >
        {props.image ? (
          <img src={assetUrl(props.image)} alt={props.name || ''} />
        ) : (
          <span className="lx-avatar__initial" style={{ fontSize: `${size * 0.4}px`, color: colors.accentText }}>
            {(props.name || 'Y').trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {props.name ? (
        <h2 className="lx-profile__name" style={{ color: colors.text, fontFamily: typography.headingFont, fontWeight: typography.headingWeight }}>
          {props.name}
        </h2>
      ) : null}

      {props.showHeadline && props.headline ? (
        <p className="lx-profile__headline" style={{ color: colors.accent }}>
          {props.headline}
        </p>
      ) : null}

      {props.showBio && props.bio ? (
        <p className="lx-profile__bio" style={{ color: colors.muted }}>
          {props.bio}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function TextSection({ props, tokens }) {
  const { colors, typography } = tokens
  const style = {
    color: props.color || colors.text,
    fontSize: `${props.size}px`,
    fontWeight: props.weight,
    lineHeight: props.lineHeight,
    letterSpacing: `${props.letterSpacing}px`,
    textAlign: props.align || 'center',
    textTransform: props.transform === 'none' ? undefined : props.transform,
    fontFamily:
      props.font && props.font !== 'inherit'
        ? `"${props.font}", ${typography.bodyFont}`
        : props.role === 'heading'
          ? typography.headingFont
          : typography.bodyFont,
  }

  if (props.role === 'heading') {
    return <h3 className="lx-text lx-text--heading" style={style}>{props.text}</h3>
  }
  if (props.role === 'lead') {
    return <p className="lx-text lx-text--lead" style={style}>{props.text}</p>
  }
  return <p className="lx-text" style={style}>{props.text}</p>
}

/* -------------------------------------------------------------------------- */

function ImageSection({ props, tokens }) {
  const { colors } = tokens

  if (!props.url) {
    return (
      <div className="lx-placeholder" style={{ borderColor: colors.border, color: colors.muted, borderRadius: `${tokens.radius}px` }}>
        <span>Add an image</span>
      </div>
    )
  }

  return (
    <figure className="lx-figure">
      <div
        className="lx-figure__frame"
        style={{
          aspectRatio: ASPECT_RATIOS[props.aspect] || ASPECT_RATIOS.auto,
          borderRadius: `${props.radius}px`,
          boxShadow: props.shadow && tokens.shadow !== 'none' ? '0 18px 40px -22px rgba(0,0,0,.55)' : undefined,
        }}
      >
        <img src={assetUrl(props.url)} alt={props.alt || ''} style={{ objectPosition: props.objectPosition || '50% 50%' }} />
      </div>
      {props.showCaption && props.caption ? (
        <figcaption style={{ color: colors.muted }}>{props.caption}</figcaption>
      ) : null}
    </figure>
  )
}

/* -------------------------------------------------------------------------- */

function LinkButtonSection({ props, tokens }) {
  const { colors, typography } = tokens
  const IconComponent = BUTTON_ICONS[props.icon]
  const preset = tokens.buttonPreset
  const style = props.style || preset

  const isSolid = style === 'solid' || style === 'shadow'
  const isOutline = style === 'outline'
  const isSoft = style === 'soft'
  const isMinimal = style === 'minimal'

  const background = props.background || (isSolid ? colors.accent : isSoft ? `${colors.accent}1f` : 'transparent')
  const textColor = props.textColor || (isSolid ? colors.accentText : isSoft || isOutline || isMinimal ? colors.accent : colors.text)
  const borderColor = props.borderColor || (isOutline ? colors.accent : 'transparent')

  const buttonStyle = {
    background: isMinimal ? 'transparent' : background,
    color: textColor,
    border: isOutline || style === 'shadow' ? `1.5px solid ${borderColor}` : '1.5px solid transparent',
    borderRadius: `${props.radius}px`,
    padding: `${props.paddingY}px ${props.paddingX}px`,
    fontSize: `${props.size}px`,
    fontWeight: props.weight,
    fontFamily: typography.bodyFont,
    width: props.fullWidth ? '100%' : undefined,
    boxShadow:
      style === 'shadow'
        ? `0 6px 0 ${props.background || colors.text}, 0 14px 26px -14px rgba(0,0,0,.6)`
        : undefined,
  }

  return (
    <div className="lx-button-row" style={{ justifyContent: props.align === 'center' ? 'center' : props.align === 'right' ? 'flex-end' : 'flex-start' }}>
      <a className={`lx-button lx-button--${style}`} style={buttonStyle} href={props.url || '#'}>
        {IconComponent ? <IconComponent size={Math.round(props.size * 1.1)} /> : null}
        <span>{props.label}</span>
      </a>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function SocialLinksSection({ props, tokens }) {
  const { colors, typography } = tokens
  const items = (props.items || []).filter((item) => item.url)
  if (!items.length) {
    return (
      <div className="lx-placeholder" style={{ borderColor: colors.border, color: colors.muted, borderRadius: `${tokens.radius}px` }}>
        <span>Add your social links</span>
      </div>
    )
  }

  const style = props.style || 'icons'
  const size = props.size || 42
  const shape = props.shape === 'circle' ? '50%' : props.shape === 'square' ? '4px' : `${Math.round(size / 3)}px`

  return (
    <div
      className={`lx-socials lx-socials--${style}`}
      style={{ gap: `${props.gap || 12}px`, justifyContent: props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center' }}
    >
      {items.map((item) => {
        const label = item.label || PLATFORM_LABELS[item.platform] || 'Link'
        const content = (
          <>
            <SocialGlyph platform={item.platform} size={Math.round(size * 0.5)} />
            {style === 'labeled' ? <span>{label}</span> : null}
          </>
        )

        const linkStyle = {
          width: style === 'labeled' ? undefined : `${size}px`,
          height: style === 'labeled' ? undefined : `${size}px`,
          borderRadius: style === 'labeled' ? `${Math.round(size / 3)}px` : shape,
          color: props.color || colors.text,
          background: props.background || (style === 'labeled' ? `${colors.accent}14` : 'transparent'),
          border: style === 'labeled' ? `1px solid ${colors.border}` : '1px solid transparent',
          fontFamily: typography.bodyFont,
          fontSize: `${Math.round(size * 0.3)}px`,
        }

        if (style === 'plain') {
          return (
            <a className="lx-social lx-social--plain" key={item.id || item.url} href={item.url} style={{ color: props.color || colors.text }}>
              {label}
            </a>
          )
        }

        return (
          <a className="lx-social" key={item.id || item.url} href={item.url} style={linkStyle} title={label} aria-label={label}>
            {content}
          </a>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function LinkCardSection({ props, tokens }) {
  const { colors, typography } = tokens
  const style = props.style || 'card'

  const cardStyle = {
    background: style === 'flat' ? 'transparent' : colors.surface,
    border: style === 'outline' ? `1.5px solid ${colors.border}` : style === 'flat' ? 'none' : `1px solid ${colors.border}`,
    borderRadius: `${props.radius}px`,
    boxShadow: style === 'card' && tokens.shadow !== 'none' ? '0 10px 30px -20px rgba(0,0,0,.5)' : undefined,
    textAlign: props.align === 'center' ? 'center' : 'left',
  }

  return (
    <a className={`lx-card lx-card--${style}`} style={cardStyle} href={props.url || '#'}>
      {props.showImage && props.image ? (
        <div className="lx-card__media" style={{ borderRadius: `${Math.max(0, props.radius - 8)}px` }}>
          <img src={assetUrl(props.image)} alt="" />
        </div>
      ) : null}
      <div className="lx-card__body">
        {props.meta ? (
          <span className="lx-card__meta" style={{ color: colors.accent, fontFamily: typography.bodyFont }}>
            {props.meta}
          </span>
        ) : null}
        <h4 className="lx-card__title" style={{ color: colors.text, fontFamily: typography.headingFont, fontWeight: typography.headingWeight }}>
          {props.title}
        </h4>
        {props.showDescription && props.description ? (
          <p className="lx-card__description" style={{ color: colors.muted }}>
            {props.description}
          </p>
        ) : null}
      </div>
      {props.accentLine ? <span className="lx-card__accent" style={{ background: colors.accent }} /> : null}
    </a>
  )
}

/* -------------------------------------------------------------------------- */

function GallerySection({ props, tokens }) {
  const { colors } = tokens
  const items = (props.items || []).filter((item) => item.url)

  if (!items.length) {
    return (
      <div className="lx-placeholder" style={{ borderColor: colors.border, color: colors.muted, borderRadius: `${tokens.radius}px` }}>
        <span>Add images to your gallery</span>
      </div>
    )
  }

  return (
    <div className="lx-gallery" style={{ gridTemplateColumns: `repeat(${props.columns || 2}, 1fr)`, gap: `${props.gap || 14}px` }}>
      {items.map((item) => (
        <figure className="lx-gallery__item" key={item.id || item.url} style={{ borderRadius: `${props.radius}px` }}>
          <div className="lx-gallery__frame" style={{ aspectRatio: ASPECT_RATIOS[props.aspect] || ASPECT_RATIOS['1:1'] }}>
            <img src={assetUrl(item.url)} alt={item.alt || ''} />
          </div>
          {props.showCaptions && item.caption ? (
            <figcaption style={{ color: colors.muted }}>{item.caption}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function VideoSection({ props, tokens }) {
  const { colors } = tokens

  if (!props.url) {
    return (
      <div
        className="lx-placeholder"
        style={{ aspectRatio: ASPECT_RATIOS[props.aspect], borderColor: colors.border, color: colors.muted, borderRadius: `${props.radius}px` }}
      >
        <span>Add a video</span>
      </div>
    )
  }

  return (
    <div
      className="lx-video"
      style={{
        aspectRatio: ASPECT_RATIOS[props.aspect] || ASPECT_RATIOS['16:9'],
        borderRadius: `${props.radius}px`,
      }}
    >
      <video
        src={assetUrl(props.url)}
        poster={props.poster ? assetUrl(props.poster) : undefined}
        controls
        autoPlay={props.autoplay}
        loop={props.loop}
        muted={props.muted}
        playsInline
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function ContactSection({ props, tokens }) {
  const { colors, typography } = tokens
  const style = props.style || 'stacked'
  const entries = []

  if (props.showEmail && props.email) {
    entries.push({ key: 'email', label: 'Email', value: props.email, href: `mailto:${props.email}` })
  }
  if (props.showPhone && props.phone) {
    entries.push({ key: 'phone', label: 'Phone', value: props.phone, href: `tel:${props.phone}` })
  }
  if (props.showLocation && props.location) {
    entries.push({ key: 'location', label: 'Location', value: props.location, href: null })
  }

  if (!entries.length) {
    return (
      <div className="lx-placeholder" style={{ borderColor: colors.border, color: colors.muted, borderRadius: `${tokens.radius}px` }}>
        <span>Add your contact details</span>
      </div>
    )
  }

  if (style === 'inline') {
    return (
      <div className="lx-contact lx-contact--inline" style={{ justifyContent: props.align === 'center' ? 'center' : props.align === 'right' ? 'flex-end' : 'flex-start' }}>
        {entries.map((entry) => (
          <a key={entry.key} className="lx-contact__link" style={{ color: colors.muted, fontFamily: typography.bodyFont }} href={entry.href || undefined}>
            {entry.value}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className={`lx-contact lx-contact--${style}`}>
      {entries.map((entry) => {
        const body = (
          <>
            <span className="lx-contact__label" style={{ color: colors.muted }}>
              {entry.label}
            </span>
            <span className="lx-contact__value" style={{ color: colors.text, fontFamily: typography.bodyFont }}>
              {entry.value}
            </span>
          </>
        )
        if (!entry.href) {
          return (
            <div className="lx-contact__item" key={entry.key} style={{ background: colors.surface, borderColor: colors.border, borderRadius: `${tokens.radius}px` }}>
              {body}
            </div>
          )
        }
        return (
          <a className="lx-contact__item" key={entry.key} style={{ background: colors.surface, borderColor: colors.border, borderRadius: `${tokens.radius}px` }} href={entry.href}>
            {body}
          </a>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function DividerSection({ props, tokens }) {
  const { colors } = tokens
  const style = props.style || 'solid'

  if (style === 'gradient') {
    return (
      <div className="lx-divider lx-divider--gradient" style={{ width: `${props.width}%` }}>
        <span style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }} />
      </div>
    )
  }

  return (
    <hr
      className={`lx-divider lx-divider--${style}`}
      style={{
        width: `${props.width}%`,
        borderTopWidth: `${props.thickness}px`,
        borderColor: props.color || colors.border,
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */

function SpacerSection({ props }) {
  return <div className="lx-spacer" style={{ height: `${props.height || 48}px` }} />
}

/* -------------------------------------------------------------------------- */
/* The shared wrapper                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Every section understands the same handful of layout props - a panel
 * background, padding, a border, a radius and a width. Applying them here
 * means one implementation covers all eleven section types, and the same
 * rule applies in the editor, the preview and the published page.
 */
function sectionFrameStyle(props, tokens) {
  const {
    colors,
    typography,
  } = tokens

  const hasBorder = Number(props.borderWidth) > 0 && props.borderColor
  const radius = Number.isFinite(Number(props.radius)) && Number(props.radius) >= 0
    ? Number(props.radius)
    : tokens.radius
  const align = props.align || 'center'

  return {
    maxWidth: props.width ? `${props.width}%` : undefined,
    // The block itself is centred on the page; the alignment control moves
    // it to one side.
    marginLeft: align === 'right' ? 'auto' : align === 'left' ? '0' : 'auto',
    marginRight: align === 'left' ? 'auto' : align === 'right' ? '0' : 'auto',
    padding: props.paddingY || props.paddingX
      ? `${props.paddingY || 0}px ${props.paddingX || 0}px`
      : undefined,
    background: props.surface ? props.surfaceColor || colors.surface : undefined,
    border: hasBorder ? `${props.borderWidth}px solid ${props.borderColor}` : undefined,
    borderRadius: `${radius}px`,
    boxShadow: props.surface && tokens.shadow !== 'none'
      ? '0 12px 30px -22px rgba(0,0,0,.55)'
      : undefined,
    color: colors.text,
    fontFamily: typography.bodyFont,
  }
}
/* -------------------------------------------------------------------------- */
/* Designed pages: a finished HTML design shown in a sandboxed frame           */
/* -------------------------------------------------------------------------- */

export const DESIGNS = {
  pink:      { html: pinkHtml,   ratio: '430 / 860', name: 'h1.name',    brand: '.brand', bio: 'p.bio', avatar: '.av' },
  purple:    { html: purpleHtml, ratio: '430 / 905', name: '#title',                       bio: '#bio',  avatar: '.avatar' },
  nightblue: { html: nightHtml,  ratio: '430 / 921', name: 'h1.name', first: true,         bio: '.bio',  avatar: '.avatar div' },
  bluesky:   { html: skyHtml,    ratio: '430 / 917', name: '#name span',                   bio: '#bio',  avatar: '.avatar' },
  ink:       { html: inkHtml,    ratio: '430 / 918', name: '#name span',                   bio: '#bio',  avatar: '#avatar' },
}


function buildSrcDoc(design, values) {
  const data = JSON.stringify({
    sel: { name: design.name, brand: design.brand || '', bio: design.bio, avatar: design.avatar, first: Boolean(design.first) },
    name: values.name,
    bio: values.bio,
    image: values.image,
    edits: values.edits || {},
  }).replace(/</g, '\\u003c')

  const fontLinks = (values.fonts || [])
    .map((f) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}&display=swap">`)
    .join('')

  // Values are only written with nodeValue, textContent, style or href, never as markup.
  const script = `<script>(function(){var d=${data};var done=false;
var extract=${extractFields.toString()};
var fixHref=${normalizeHref.toString()};
function q(s){return s?document.querySelector(s):null}
var sized=[];
function resize(){sized.forEach(function(o){o.el.style.fontSize='';var c=parseFloat(getComputedStyle(o.el).fontSize);if(c)o.el.style.fontSize=(c*o.k)+'px'})}
function go(){if(done)return;done=true;
var ex=extract(document.body);
if(d.name){var n=q(d.sel.name);if(n){if(d.sel.first){for(var i=0;i<n.childNodes.length;i++){var c=n.childNodes[i];if(c.nodeType===3&&c.nodeValue.trim()){c.nodeValue=d.name;break}}}else{n.textContent=d.name}}
var b=q(d.sel.brand);if(b)b.textContent=d.name}
if(d.bio){var p=q(d.sel.bio);if(p)p.textContent=d.bio}
if(d.image){var a=q(d.sel.avatar);if(a){var im=document.createElement('img');im.src=d.image;im.alt='';im.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:9;border-radius:inherit';a.appendChild(im)}}
ex.texts.forEach(function(node,i){var e=d.edits['t'+i];if(!e)return;
if(e.text){var m=node.nodeValue.match(/^(\\s*)[\\s\\S]*?(\\s*)$/);node.nodeValue=(m?m[1]:'')+e.text+(m?m[2]:'')}
var el=node.parentElement;if(!el)return;var s=el.style;
if(e.font)s.fontFamily='"'+e.font+'",sans-serif';
if(e.weight)s.fontWeight=e.weight;
if(e.lh)s.lineHeight=e.lh;
if(e.ls)s.letterSpacing=(Number(e.ls)/100)+'em';
if(e.color)s.color=e.color;
if(e.align)s.textAlign=e.align;
if(e.size&&Number(e.size)!==100)sized.push({el:el,k:Number(e.size)/100})});
ex.links.forEach(function(el,i){var e=d.edits['l'+i];if(!e)return;
if(e.del){el.style.display='none';return}
if(e.href){var h=fixHref(e.href);if(h){el.setAttribute('href',h);if(h.charAt(0)!=='#'){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}}}});
resize();addEventListener('resize',resize)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
addEventListener('load',function(){go();resize()})})()<\/script>`

  const end = design.html.lastIndexOf('</body>')
  const injected = fontLinks + script
  return end < 0 ? design.html + injected : design.html.slice(0, end) + injected + design.html.slice(end)
}

const EDIT_KEYS = ['text', 'href', 'del', 'font', 'size', 'weight', 'lh', 'ls', 'color', 'align']

function HtmlPageSection({ props }) {
  const design = DESIGNS[props.style] || DESIGNS.pink
  const image = props.image ? new URL(assetUrl(props.image), window.location.href).href : ''
  const editsKey = JSON.stringify(props.edits || [])

  const srcDoc = useMemo(() => {
    const edits = {}
    for (const entry of JSON.parse(editsKey)) {
      const e = {}
      for (const key of EDIT_KEYS) if (entry[key]) e[key] = entry[key]
      if (Object.keys(e).length) edits[entry.id] = e
    }
    const fonts = [...new Set(Object.values(edits).map((e) => e.font).filter(Boolean))]
    return buildSrcDoc(design, { name: props.name || '', bio: props.bio || '', image, edits, fonts })
  }, [design, props.name, props.bio, image, editsKey])

  const extra = (props.extra || []).filter((link) => link.text)

  return (
    <>
      <div className="lx-htmlpage" style={{ aspectRatio: design.ratio }}>
        <iframe
          title="Designed page"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
      {extra.length ? (
        <div className="lx-extra-links">
          {extra.map((link) => (
            <a
              key={link.id}
              className="lx-extra-link"
              href={normalizeHref(link.href) || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.text}
            </a>
          ))}
        </div>
      ) : null}
    </>
  )
}

/* -------------------------------------------------------------------------- */


const RENDERERS = {
  profile: ProfileSection,
  text: TextSection,
  image: ImageSection,
  'link-button': LinkButtonSection,
  'social-links': SocialLinksSection,
  'link-card': LinkCardSection,
  gallery: GallerySection,
  video: VideoSection,
  contact: ContactSection,
  divider: DividerSection,
  spacer: SpacerSection,
  'html-page': HtmlPageSection,
}


/** Render one section. Unknown types render nothing rather than throwing. */
export function SectionView({ section, tokens }) {
  const Renderer = RENDERERS[section.type]
  if (!Renderer) return null
  const props = section.props || {}

  return (
    <div className="lx-section" style={sectionFrameStyle(props, tokens)}>
         <Renderer props={props} tokens={tokens} sectionId={section.id} />
    </div>
  )
}

