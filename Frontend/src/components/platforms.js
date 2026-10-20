/**
 * The display names of the social platforms a link can point at.
 *
 * This lives on its own rather than in `icons.jsx` so that the icon module
 * exports nothing but components, which keeps React Fast Refresh working
 * while the editor is being developed.
 */
export const PLATFORM_LABELS = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  facebook: 'Facebook',
  threads: 'Threads',
  spotify: 'Spotify',
  discord: 'Discord',
  email: 'Email',
  website: 'Website',
}
