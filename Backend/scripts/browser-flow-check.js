/**
 * Browser-flow check: exercises the exact sequence a user performs in the
 * dashboard, and verifies that every URL the frontend is handed actually
 * resolves in a browser.
 *
 * Run with: node scripts/browser-flow-check.js
 */
const fs = require('fs')
const path = require('path')

const BACKEND = process.env.LINKORA_BACKEND || 'http://localhost:5000'
const FRONTEND = 'http://localhost:5173'
const results = []

/**
 * Markers that only ever appear in the editor chrome. The public page must
 * never contain them.
 */
const EDITOR_CHROME = ['canvas-stage', 'canvas-block__chrome', 'editor-toolbar', 'inspector__head', 'editor-sidebar']

function check(name, passed, detail) {
  results.push({ name, passed, detail })
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`)
}

let cookie = ''

async function api(pathname, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (cookie) headers.Cookie = cookie
  const isForm = options.body instanceof FormData
  if (options.body && !isForm) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${BACKEND}${pathname}`, { ...options, headers, redirect: 'manual' })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  const text = await response.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: response.status, body: json }
}

/**
 * Mirrors `assetUrl` in Frontend/src/lib/api.js: a backend-relative
 * `/uploads/...` path is resolved against the API origin before use.
 */
function assetUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (!value.startsWith('/uploads/')) return value
  return `${BACKEND}${value}`
}

async function main() {
  const stamp = Date.now()
  const email = `browser-${stamp}@linkora.test`

  // --- register ---------------------------------------------------------------
  const register = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Browser',
      email,
      phone: '+919000000000',
      instagram: '@browser_test',
      followers: 1,
      password: 'supersecret123',
    }),
  })
  check('a visitor can register and gets a session', register.status === 201, `status ${register.status}`)

  // --- pick a template from the public catalogue --------------------------------
  const catalog = await api('/api/websites/catalog')
  const template = catalog.body.templates?.[0]
  check('the template catalogue loads without a session', catalog.status === 200 && Boolean(template?.id), `status ${catalog.status}`)

  // --- create a website from that template ----------------------------------------
  const created = await api('/api/websites', {
    method: 'POST',
    body: JSON.stringify({ name: 'Browser Flow Site', templateId: template.id }),
  })
  const website = created.body.website
  check('a website can be created from a template', created.status === 201 && Boolean(website?.id), `status ${created.status}`)
  check('the new website starts with sections', Array.isArray(website?.sections) && website.sections.length > 0, `sections ${website?.sections?.length}`)

  const websiteId = website.id

  // --- read it back ---------------------------------------------------------------
  const fetched = await api(`/api/websites/${websiteId}`)
  check(
    'the created website can be read back',
    fetched.status === 200 && fetched.body.website?.id === websiteId && Array.isArray(fetched.body.website?.sections),
    `status ${fetched.status}`,
  )

  // --- edit the sections -----------------------------------------------------------
  const currentSections = fetched.body.website.sections
  const textSection = currentSections.find((section) => section.type === 'text') || currentSections[0]
  const editedSections = [
    {
      ...textSection,
      id: textSection.id || 'text-one',
      type: 'text',
      props: { ...(textSection.props || {}), text: 'Hello from the browser', align: 'center' },
    },
    { id: 'link-one', type: 'link-button', props: { label: 'Go', url: 'https://example.com', align: 'center' } },
    ...currentSections.filter((section) => section.id !== textSection.id),
  ]

  const edited = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: 'Edited in the browser flow', sections: editedSections }),
  })
  check(
    'the sections can be edited without regenerating',
    edited.status === 200 && edited.body.website?.sections?.length === editedSections.length,
    `status ${edited.status} sections ${edited.body.website?.sections?.length}`,
  )
  check(
    'the edited text is stored',
    edited.body.website?.sections?.[0]?.props?.text === 'Hello from the browser',
    edited.body.website?.sections?.[0]?.props?.text,
  )
  check(
    'the added link button is stored',
    edited.body.website?.sections?.some((section) => section.type === 'link-button' && section.props?.url === 'https://example.com'),
    'link-button present',
  )

  // --- reorder the sections ----------------------------------------------------------
  const reordered = [...edited.body.website.sections].reverse()
  const reorderResponse = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ sections: reordered }),
  })
  const storedOrder = (reorderResponse.body.website?.sections || []).map((section) => section.id)
  check(
    'the section order is stored as sent',
    reorderResponse.status === 200 && JSON.stringify(storedOrder) === JSON.stringify(reordered.map((section) => section.id)),
    storedOrder.join(','),
  )

  const reorderedFetch = await api(`/api/websites/${websiteId}`)
  const refetchedOrder = (reorderedFetch.body.website?.sections || []).map((section) => section.id)
  check(
    'the reordered sections survive a re-GET',
    JSON.stringify(refetchedOrder) === JSON.stringify(storedOrder),
    refetchedOrder.join(','),
  )

  // --- upload an asset into the website -------------------------------------------------
  const imageBytes = fs.readFileSync(path.join(__dirname, 'test-design.png'))
  const assetForm = new FormData()
  assetForm.append('asset', new Blob([imageBytes], { type: 'image/png' }), 'asset.png')
  const asset = await api(`/api/websites/${websiteId}/assets`, { method: 'POST', body: assetForm })
  check('an image can be uploaded into a website', asset.status === 201 && Boolean(asset.body.url), `status ${asset.status}`)
  const assetImage = await fetch(assetUrl(asset.body.url))
  check('the uploaded image loads', assetImage.status === 200, `status ${assetImage.status}`)

  // --- publish, then read the public page without any cookie --------------------------------
  const publish = await api(`/api/websites/${websiteId}/publish`, { method: 'POST' })
  check('the website publishes', publish.status === 200 && publish.body.website?.status === 'published', `status ${publish.status}`)
  const slug = publish.body.website?.slug

  const publicResponse = await fetch(`${BACKEND}/api/websites/public/${slug}`)
  const publicBody = await publicResponse.json()
  check(
    'the public API renders without a session',
    publicResponse.status === 200 && Array.isArray(publicBody.website?.sections) && publicBody.website.sections.length > 0,
    `status ${publicResponse.status} sections ${publicBody.website?.sections?.length}`,
  )

  // The public URL the dashboard shows must actually be reachable.
  const publicUrl = `${FRONTEND}/p/${slug}`
  const publicPage = await fetch(publicUrl)
  const publicHtml = await publicPage.text()
  check('the public URL from the dashboard loads', publicPage.status === 200, `status ${publicPage.status} ${publicUrl}`)

  const chromeFound = EDITOR_CHROME.filter((marker) => publicHtml.includes(marker))
  check(
    'the public page does not contain the editor chrome',
    chromeFound.length === 0,
    chromeFound.length ? `found: ${chromeFound.join(', ')}` : 'no editor markers',
  )

  const failed = results.filter((result) => !result.passed)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) process.exit(1)
}

main().catch((error) => {
  console.error('BROWSER FLOW CHECK CRASHED:', error)
  process.exit(1)
})
