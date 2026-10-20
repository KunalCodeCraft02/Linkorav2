/**
 * End-to-end backend integration check.
 *
 * Exercises the real HTTP server against the real MongoDB, covering the
 * link-in-bio website builder API: registration, session cookies, the public
 * template catalogue, website creation from a template, section validation,
 * editing, slug uniqueness, asset upload, ownership isolation, publishing and
 * public rendering.
 *
 * Run with: node scripts/integration-check.js
 */
const fs = require('fs')
const path = require('path')

// The upload URLs the API hands out are built from BACKEND_PUBLIC_URL, so it
// has to point at this script's own server rather than the default one.
const PORT = 5099
const BASE = `http://localhost:${PORT}`
process.env.BACKEND_PUBLIC_URL = BASE

const mongoose = require('mongoose')
const { app } = require('../src/server')
const config = require('../src/config/env')

const results = []

/** The exact vocabulary of section types the schema accepts. */
const SECTION_TYPES = [
  'profile',
  'text',
  'image',
  'link-button',
  'social-links',
  'link-card',
  'gallery',
  'video',
  'contact',
  'divider',
  'spacer',
]

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
  const response = await fetch(`${BASE}${pathname}`, { ...options, headers, redirect: 'manual' })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  const text = await response.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text.slice(0, 200) }
  }
  return { status: response.status, body: json, headers: response.headers }
}

async function main() {
  await mongoose.connect(config.mongoUri)
  const server = await new Promise((resolve) => {
    const listener = app.listen(PORT, () => resolve(listener))
  })

  const stamp = Date.now()
  const email = `integration-${stamp}@linkora.test`
  const imageBytes = fs.readFileSync(path.join(__dirname, 'test-design.png'))

  // --- registration + session -------------------------------------------------
  const register = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Integration',
      email,
      phone: '+919999999999',
      instagram: '@linkora_test',
      followers: 10,
      password: 'supersecret123',
    }),
  })
  check('register returns 201 with the user', register.status === 201 && register.body.user?.email === email, `status ${register.status}`)

  const rawCookie = register.headers.get('set-cookie') || ''
  check(
    'register sets an http-only linkora_session cookie',
    rawCookie.startsWith('linkora_session=') && /HttpOnly/i.test(rawCookie),
    rawCookie ? 'cookie set' : 'no cookie',
  )

  const me = await api('/api/auth/me')
  check('GET /auth/me works with the cookie', me.status === 200 && me.body.user?.email === email, `status ${me.status}`)

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'supersecret123' }),
  })
  check('login works with the registered credentials', login.status === 200 && login.body.user?.email === email, `status ${login.status}`)

  // --- public catalogue --------------------------------------------------------
  const catalogNoCookie = await fetch(`${BASE}/api/websites/catalog`)
  const catalogBody = await catalogNoCookie.json()
  check(
    'the catalogue works without a session cookie',
    catalogNoCookie.status === 200 && Array.isArray(catalogBody.templates) && Array.isArray(catalogBody.themes),
    `status ${catalogNoCookie.status}`,
  )
  check(
    'the catalogue lists templates and themes',
    catalogBody.templates?.length > 0 && catalogBody.themes?.length > 0,
    `${catalogBody.templates?.length} templates, ${catalogBody.themes?.length} themes`,
  )

  // --- create a website from a template ----------------------------------------
  const firstTemplate = catalogBody.templates[0]
  const created = await api('/api/websites', {
    method: 'POST',
    body: JSON.stringify({ name: 'Integration Site', templateId: firstTemplate.id }),
  })
  const website = created.body.website
  check('creating a website from a template returns 201', created.status === 201 && Boolean(website?.id), `status ${created.status}`)
  check(
    'the created website has site, profile and sections',
    Boolean(website?.site) && Boolean(website?.profile) && Array.isArray(website?.sections) && website.sections.length > 0,
    `sections ${website?.sections?.length}`,
  )
  check(
    'the created website has a url-safe slug',
    typeof website?.slug === 'string' && /^[a-z0-9-]+$/.test(website.slug),
    website?.slug,
  )
  check(
    'the created website is seeded from the template',
    website?.site?.templateId === firstTemplate.id,
    `templateId ${website?.site?.templateId}`,
  )

  const websiteId = website.id

  const badTemplate = await api('/api/websites', {
    method: 'POST',
    body: JSON.stringify({ name: 'Broken Template', templateId: 'no-such-template' }),
  })
  check('creating a website from an unknown template returns 400', badTemplate.status === 400, `status ${badTemplate.status}`)

  // --- every catalogue template can be used ------------------------------------
  const templateProblems = []
  const templateWebsites = []
  for (const template of catalogBody.templates) {
    const response = await api('/api/websites', {
      method: 'POST',
      body: JSON.stringify({ name: `Template ${template.id}`, templateId: template.id }),
    })
    const document = response.body.website
    if (response.status !== 201) {
      templateProblems.push(`${template.id}: status ${response.status}`)
      continue
    }
    templateWebsites.push(document)
    if (!Array.isArray(document.sections) || document.sections.length === 0) {
      templateProblems.push(`${template.id}: no sections`)
      continue
    }
    const unknown = document.sections.filter((section) => !SECTION_TYPES.includes(section.type))
    if (unknown.length) templateProblems.push(`${template.id}: unknown section type ${unknown[0].type}`)
  }
  check(
    'every catalogue template creates a website with known sections',
    templateProblems.length === 0 && templateWebsites.length === catalogBody.templates.length,
    templateProblems.length ? templateProblems.join('; ') : `${templateWebsites.length} templates checked`,
  )

  // --- the list only shows the caller's own websites ----------------------------
  const list = await api('/api/websites')
  const listed = list.body.websites || []
  check(
    'GET /api/websites lists the caller\'s websites',
    list.status === 200 && listed.some((entry) => entry.id === websiteId) && listed.every((entry) => entry.slug),
    `count ${listed.length}`,
  )

  // --- editing -------------------------------------------------------------------
  const editedSections = [
    { id: 'text-one', type: 'text', props: { text: 'Hand edited text', align: 'center' } },
    { id: 'link-one', type: 'link-button', props: { label: 'Go', url: 'https://example.com' } },
  ]
  const patch = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: 'Edited by hand',
      profile: { name: 'Integration Editor', headline: 'Edited headline' },
      sections: editedSections,
    }),
  })
  check(
    'PATCH edits the name, the profile and the sections',
    patch.status === 200 &&
      patch.body.website?.name === 'Edited by hand' &&
      patch.body.website?.profile?.name === 'Integration Editor' &&
      patch.body.website?.sections?.length === 2,
    `status ${patch.status} name ${patch.body.website?.name}`,
  )

  const refetched = await api(`/api/websites/${websiteId}`)
  check(
    'the edit survives a re-GET',
    refetched.status === 200 &&
      refetched.body.website?.name === 'Edited by hand' &&
      refetched.body.website?.profile?.headline === 'Edited headline' &&
      refetched.body.website?.sections?.[0]?.props?.text === 'Hand edited text',
    `status ${refetched.status}`,
  )

  // --- coercion ------------------------------------------------------------------
  const injected = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sections: [{ id: 'injected', type: 'text', props: { text: 'ok', evil: '<script>alert(1)</script>', html: '<img onerror=x>' } }],
    }),
  })
  check(
    'unknown props are stripped from edits',
    injected.status === 200 &&
      injected.body.website?.sections?.[0]?.props?.evil === undefined &&
      injected.body.website?.sections?.[0]?.props?.html === undefined,
    JSON.stringify(injected.body.website?.sections?.[0]?.props),
  )

  const badType = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ sections: [{ id: 'bad', type: 'script', props: { src: 'evil.js' } }] }),
  })
  check(
    'an unknown section type collapses to text',
    badType.status === 200 && badType.body.website?.sections?.[0]?.type === 'text',
    badType.body.website?.sections?.[0]?.type,
  )

  // --- slug uniqueness ------------------------------------------------------------
  const slugOne = await api('/api/websites', { method: 'POST', body: JSON.stringify({ name: 'Same Name', slug: 'same-name' }) })
  const slugTwo = await api('/api/websites', { method: 'POST', body: JSON.stringify({ name: 'Same Name', slug: 'same-name' }) })
  check(
    'duplicate slugs are made unique on creation',
    slugOne.body.website?.slug !== slugTwo.body.website?.slug,
    `${slugOne.body.website?.slug} vs ${slugTwo.body.website?.slug}`,
  )

  const takenSlug = await api(`/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ slug: slugOne.body.website.slug }),
  })
  check('editing to a taken slug is refused', takenSlug.status === 409, `status ${takenSlug.status}`)

  // --- duplication ------------------------------------------------------------------
  const duplicated = await api(`/api/websites/${websiteId}/duplicate`, { method: 'POST' })
  check(
    'duplicate returns 201 with a new id and a different slug',
    duplicated.status === 201 &&
      duplicated.body.website?.id !== websiteId &&
      duplicated.body.website?.slug !== website.slug &&
      typeof duplicated.body.website?.slug === 'string',
    `status ${duplicated.status} ${duplicated.body.website?.slug}`,
  )

  // --- asset upload ------------------------------------------------------------------
  const assetForm = new FormData()
  assetForm.append('asset', new Blob([imageBytes], { type: 'image/png' }), 'asset.png')
  const asset = await api(`/api/websites/${websiteId}/assets`, { method: 'POST', body: assetForm })
  check(
    'asset upload returns 201 with a url',
    asset.status === 201 && typeof asset.body.url === 'string' && asset.body.url.length > 0,
    `status ${asset.status} ${asset.body.url || ''}`,
  )

  if (asset.body.url) {
    const assetResponse = await fetch(asset.body.url)
    check('the uploaded asset is fetchable over http', assetResponse.status === 200, `status ${assetResponse.status}`)
  }

  // --- publish + public ---------------------------------------------------------------
  const publish = await api(`/api/websites/${websiteId}/publish`, { method: 'POST' })
  check('publish returns 200 with a published status', publish.status === 200 && publish.body.website?.status === 'published', `status ${publish.status}`)
  check(
    'publish returns a public url',
    typeof publish.body.publicUrl === 'string' && publish.body.publicUrl.includes('/p/'),
    publish.body.publicUrl,
  )

  const publicNoCookie = await fetch(`${BASE}/api/websites/public/${website.slug}`)
  const publicBody = await publicNoCookie.json()
  check(
    'the public page works without a session',
    publicNoCookie.status === 200 && Array.isArray(publicBody.website?.sections) && publicBody.website.sections.length > 0,
    `status ${publicNoCookie.status} sections ${publicBody.website?.sections?.length}`,
  )

  const publicUnknown = await fetch(`${BASE}/api/websites/public/does-not-exist-${stamp}`)
  check('an unknown public slug returns 404', publicUnknown.status === 404, `status ${publicUnknown.status}`)

  // --- unpublish ------------------------------------------------------------------------
  const unpublish = await api(`/api/websites/${websiteId}/unpublish`, { method: 'POST' })
  check('unpublish returns 200 with a draft status', unpublish.status === 200 && unpublish.body.website?.status === 'draft', `status ${unpublish.status}`)
  const publicAfterUnpublish = await fetch(`${BASE}/api/websites/public/${website.slug}`)
  check('an unpublished page is no longer public', publicAfterUnpublish.status === 404, `status ${publicAfterUnpublish.status}`)

  // --- ownership isolation -----------------------------------------------------------------
  const other = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Other',
      email: `integration-other-${stamp}@linkora.test`,
      phone: '+919888888888',
      instagram: '@other_test',
      followers: 5,
      password: 'supersecret456',
    }),
  })
  const otherCookie = (other.headers.get('set-cookie') || '').split(';')[0]
  const otherHeaders = { Cookie: otherCookie, 'Content-Type': 'application/json' }

  const otherGet = await fetch(`${BASE}/api/websites/${websiteId}`, { headers: { Cookie: otherCookie } })
  check('another user cannot read my website', otherGet.status === 404, `status ${otherGet.status}`)

  const otherPatch = await fetch(`${BASE}/api/websites/${websiteId}`, {
    method: 'PATCH',
    headers: otherHeaders,
    body: JSON.stringify({ name: 'hijacked' }),
  })
  check('another user cannot edit my website', otherPatch.status === 404, `status ${otherPatch.status}`)

  const otherPublish = await fetch(`${BASE}/api/websites/${websiteId}/publish`, {
    method: 'POST',
    headers: { Cookie: otherCookie },
  })
  check('another user cannot publish my website', otherPublish.status === 404, `status ${otherPublish.status}`)

  const otherDelete = await fetch(`${BASE}/api/websites/${websiteId}`, {
    method: 'DELETE',
    headers: { Cookie: otherCookie },
  })
  check('another user cannot delete my website', otherDelete.status === 404, `status ${otherDelete.status}`)

  const otherList = await fetch(`${BASE}/api/websites`, { headers: { Cookie: otherCookie } })
  const otherListBody = await otherList.json()
  check(
    'the website list only shows my own websites',
    otherListBody.websites?.length === 0,
    `count ${otherListBody.websites?.length}`,
  )

  // --- deletion --------------------------------------------------------------------------
  const removed = await api(`/api/websites/${websiteId}`, { method: 'DELETE' })
  check('DELETE returns 204', removed.status === 204, `status ${removed.status}`)

  const gone = await api(`/api/websites/${websiteId}`)
  check('the deleted website is gone', gone.status === 404, `status ${gone.status}`)

  // --- secrets are not leaked ----------------------------------------------------------------
  const healthText = JSON.stringify((await api('/api/health')).body)
  const secrets = [config.jwtSecret, config.mongoUri, process.env.MONGODB_URI].filter(Boolean)
  check(
    'the health endpoint leaks no secrets',
    secrets.every((secret) => !healthText.includes(secret)),
    'ok',
  )

  server.close()
  await mongoose.disconnect()

  const failed = results.filter((result) => !result.passed)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('FAILURES:')
    failed.forEach((result) => console.log(` - ${result.name} (${result.detail || ''})`))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('INTEGRATION CHECK CRASHED:', error)
  process.exit(1)
})
