/**
 * A small, consistent icon set.
 *
 * The project has no icon library installed, so the icons are drawn here as
 * inline SVG on a 24x24 grid with a single stroke weight. Every icon is
 * `aria-hidden` because it always sits next to a text label or an
 * `aria-label` on the control that owns it.
 */

function Icon({ children, size = 18, strokeWidth = 1.7, fill = 'none', className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const UserIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c.8-3.6 3.7-5.6 7.5-5.6s6.7 2 7.5 5.6" />
  </Icon>
)

export const TypeIcon = (p) => (
  <Icon {...p}>
    <path d="M4 6.5V5h16v1.5" />
    <path d="M12 5v14" />
    <path d="M9 19h6" />
  </Icon>
)

export const ImageIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="m3.5 17 4.5-4.5 3.5 3.5 3-3 6 6" />
  </Icon>
)

export const LinkIcon = (p) => (
  <Icon {...p}>
    <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
    <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </Icon>
)

export const ShareIcon = (p) => (
  <Icon {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4" />
  </Icon>
)

export const CardIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M3 9.5h18" />
    <path d="M6.5 13.5h7" />
    <path d="M6.5 16.5h4" />
  </Icon>
)

export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </Icon>
)

export const PlayIcon = (p) => (
  <Icon {...p}>
    <path d="M3.5 6.5A2 2 0 0 1 5.6 4.7l13 5.8a2 2 0 0 1 0 3.5l-13 5.8a2 2 0 0 1-2.1-1.2z" />
  </Icon>
)

export const MailIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 6.8 8.2 6 8.2-6" />
  </Icon>
)

export const MinusIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12h16" />
  </Icon>
)

export const SpaceIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8h16M4 16h16" />
    <path d="M8 5v6M16 13v6" strokeDasharray="2 2" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4 6.5h16" />
    <path d="M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5" />
  </Icon>
)

export const CopyIcon = (p) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.4" />
    <path d="M15.5 8.5v-2a2.4 2.4 0 0 0-2.4-2.4H5.9a2.4 2.4 0 0 0-2.4 2.4v7.2a2.4 2.4 0 0 0 2.4 2.4h2" />
  </Icon>
)

export const EyeIcon = (p) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const EyeOffIcon = (p) => (
  <Icon {...p}>
    <path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.4 3.3" />
    <path d="M6.2 7.6A16.7 16.7 0 0 0 2.5 12S6 18.2 12 18.2a9.3 9.3 0 0 0 3.6-.7" />
    <path d="M10 10a2.9 2.9 0 0 0 4 4" />
    <path d="m3.5 3.5 17 17" />
  </Icon>
)

export const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.4" />
    <path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
  </Icon>
)

export const UnlockIcon = (p) => (
  <Icon {...p}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.4" />
    <path d="M8 10V7.6a4 4 0 0 1 7.6-1.7" />
  </Icon>
)

export const UndoIcon = (p) => (
  <Icon {...p}>
    <path d="M4 9h9.5a5.5 5.5 0 0 1 0 11H8" />
    <path d="M7.5 5 4 9l3.5 4" />
  </Icon>
)

export const RedoIcon = (p) => (
  <Icon {...p}>
    <path d="M20 9h-9.5a5.5 5.5 0 0 0 0 11H16" />
    <path d="m16.5 5 3.5 4-3.5 4" />
  </Icon>
)

export const ArrowUpIcon = (p) => (
  <Icon {...p}>
    <path d="M12 19V6" />
    <path d="m6 12 6-6 6 6" />
  </Icon>
)

export const ArrowDownIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5v13" />
    <path d="m6 12 6 6 6-6" />
  </Icon>
)

export const GripIcon = (p) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </Icon>
)

export const UploadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 16V4.5" />
    <path d="m7.5 9 4.5-4.5L16.5 9" />
    <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
)

export const GlobeIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
  </Icon>
)

export const MonitorIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="12.5" rx="2.2" />
    <path d="M8.5 20.5h7" />
    <path d="M12 17v3.5" />
  </Icon>
)

export const TabletIcon = (p) => (
  <Icon {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2.4" />
    <path d="M11 18h2" />
  </Icon>
)

export const PhoneIcon = (p) => (
  <Icon {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
    <path d="M10.5 5.5h3" />
  </Icon>
)

export const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
)

export const ChevronRightIcon = (p) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
)

export const CloseIcon = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Icon>
)

export const SettingsIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.2 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Icon>
)

export const LayersIcon = (p) => (
  <Icon {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </Icon>
)

export const TextIcon = (p) => (
  <Icon {...p}>
    <path d="M4 6V4.5h16V6" />
    <path d="M12 4.5v15" />
  </Icon>
)

export const LayoutIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
    <path d="M3 9.5h18" />
  </Icon>
)

export const PaletteIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.8 0-1.4-1.2-1.6-1.2-2.7 0-.8.7-1.5 1.6-1.5h1.6a4.5 4.5 0 0 0 4.5-4.5c0-3.6-3.7-6.5-8.5-6.5Z" />
    <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
)

export const SaveIcon = (p) => (
  <Icon {...p}>
    <path d="M5 4.5h11L20 8.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5V6a1.5 1.5 0 0 1 1-1.5Z" />
    <path d="M8 4.5v5h7v-5" />
    <path d="M8 20v-5.5h8V20" />
  </Icon>
)

export const RocketIcon = (p) => (
  <Icon {...p}>
    <path d="M13.5 3.5c3.5 1 6 4 6.5 7.5l-4 4-6.5-6.5 4-5z" />
    <path d="M9.5 8.5 5 10l-2 4 4-1" />
    <path d="M15.5 14.5 14 19l-4 2 1-4" />
    <circle cx="14.5" cy="9" r="1.4" />
  </Icon>
)

export const ExternalIcon = (p) => (
  <Icon {...p}>
    <path d="M14 4h6v6" />
    <path d="m20 4-8.5 8.5" />
    <path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </Icon>
)

export const CartIcon = (p) => (
  <Icon {...p}>
    <path d="M3 4h2.2l2.3 11h9.4l2-7.5H6.2" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="16.5" cy="19" r="1.4" />
  </Icon>
)

export const DownloadIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 19.5h15" />
  </Icon>
)

export const HeartIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
  </Icon>
)

export const StarIcon = (p) => (
  <Icon {...p}>
    <path d="m12 3.8 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z" />
  </Icon>
)

export const ArrowRightIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12h15" />
    <path d="m13.5 6 6 6-6 6" />
  </Icon>
)

export const ArrowLeftIcon = (p) => (
  <Icon {...p}>
    <path d="M20 12H5" />
    <path d="m10.5 6-6 6 6 6" />
  </Icon>
)

export const WarningIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
)

/** The platform marks used in the social-links row. */
const SOCIAL_GLYPHS = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: <path d="M14.5 3.5v10.8a3.4 3.4 0 1 1-3.4-3.4" />,
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10.5 9.5 5 2.5-5 2.5z" />
    </>
  ),
  x: (
    <>
      <path d="M4 4l16 16" />
      <path d="M20 4 4 20" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V17" />
      <circle cx="8" cy="7.4" r="1" fill="currentColor" stroke="none" />
      <path d="M12 17v-3.6a2.2 2.2 0 0 1 4.4 0V17" />
    </>
  ),
  github: (
    <>
      <path d="M9 19.5c-4 1.2-4-2.2-5.6-2.6m11.2 5.1v-3.3a2.9 2.9 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.2 3.6 5.2 3.9 5.2 3.9a4.3 4.3 0 0 0-.1 3.3A4.7 4.7 0 0 0 3.8 10.4c0 4.7 2.8 5.7 5.5 6a2.9 2.9 0 0 0-.8 2.2v3.4" />
    </>
  ),
  facebook: <path d="M14.5 8.5h2.6V5.2h-2.6a3.4 3.4 0 0 0-3.4 3.4v1.4H8.4v3.3h2.7V21h3.4v-7.7h2.6l.4-3.3h-3V8.6a.1.1 0 0 1 .1-.1Z" />,
  threads: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.6 12.4c0-2.3-1.4-3.8-3.6-3.8s-3.5 1.4-3.5 3.4 1.3 3.3 3 3.3c1.5 0 2.6-.8 2.6-2 0-1.1-.9-1.8-2-1.8-1 0-1.7.5-1.7 1.3" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.6 9.4a10 10 0 0 1 9 1.1M8 12.7a8 8 0 0 1 7.3.9M8.5 15.8a6 6 0 0 1 5.6.7" />
    </>
  ),
  discord: (
    <>
      <path d="M8.5 6.5A13 13 0 0 1 12 6c1.2 0 2.4.2 3.5.5l.7-1.4c1.7.4 3 1.1 3.7 1.7 1.2 2.4 1.7 5 1.6 7.6a12 12 0 0 1-4 2.4l-1-1.6" />
      <path d="M8.5 6.5 7.8 5.1c-1.7.4-3 1.1-3.7 1.7-1.2 2.4-1.7 5-1.6 7.6a12 12 0 0 0 4 2.4l1-1.6" />
      <path d="M9.4 14.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM14.6 14.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 6.8 8.2 6 8.2-6" />
    </>
  ),
  website: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
}

/** A single social platform mark. */
export function SocialGlyph({ platform, size = 20 }) {
  const glyph = SOCIAL_GLYPHS[platform] || SOCIAL_GLYPHS.website
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  )
}

