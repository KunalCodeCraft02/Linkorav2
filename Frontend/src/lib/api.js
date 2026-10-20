const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`

/**
 * The backend serves uploaded and exported images from `/uploads`. The
 * frontend runs on a different port during development, so a backend-relative
 * path such as `/uploads/abc.png` has to be resolved against the API origin
 * before the browser can load it.
 *
 * Only backend-served paths are rewritten; absolute URLs are returned as-is.
 */
export function assetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!path.startsWith('/uploads/')) return path
  const origin = API_URL.replace(/\/api\/?$/, '')
  return `${origin}${path}`
}

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: isFormData ? { ...(options.headers || {}) } : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (response.status === 204) return null
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Request failed.')
  return result
}

export { API_URL }
