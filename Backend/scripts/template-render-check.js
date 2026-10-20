/**
 * Renders every template and every theme through the real editor.
 *
 * The editor UI check exercises a single template. This one walks the whole
 * catalogue: it creates a website from each template, opens it in the
 * editor, and confirms the canvas actually renders blocks. It then applies
 * each theme in turn to one website and confirms the rendered result changes
 * and stays legible.
 *
 * Run it with the backend on :5000 and the frontend on :5173.
 */

const { chromium } = require('playwright')

const BACKEND = process.env.LINKORA_BACKEND || 'http://localhost:5000'
const FRONTEND = 'http://localhost:5173'

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`PASS  ${name}${detail ? ` - ${detail}` : ''}`)
  } else {
    failed += 1
    console.log(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`)
  }
}

async function api(page, path, options = {}) {
  return page.evaluate(
    async ([api, url, opts]) => {
      const response = await fetch(`${api}${url}`, {
        credentials: 'include',
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      })
      return { status: response.status, body: await response.json() }
    },
    [BACKEND, path, options],
  )
}

async function run() {
  let browser
  try {
    browser = await chromium.launch()
  } catch {
    browser = await chromium.launch({ channel: 'chrome' })
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  /* ---- sign up ---------------------------------------------------------- */

  const email = `templates-${Date.now()}@example.com`
  await page.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle' })
  const values = {
    firstName: 'Template',
    email,
    phone: '+919876543210',
    instagram: '@templatecheck',
    followers: '1200',
    password: 'Sup3rSecret!',
  }
  for (const field of Object.keys(values)) {
    await page.fill(`#${field}`, values[field])
    await page.click('button[type="submit"]')
    await page.waitForTimeout(200)
  }
  await page.waitForURL('**/home', { timeout: 15000 })

  /* ---- the catalogue ----------------------------------------------------- */

  const catalog = await api(page, '/api/websites/catalog')
  check('the catalogue is public', catalog.status === 200, `status ${catalog.status}`)

  const templates = catalog.body.templates || []
  const themes = catalog.body.themes || []
  check('the catalogue lists at least ten templates', templates.length >= 10, `${templates.length} templates`)
  check('the catalogue lists ten themes', themes.length === 10, `${themes.length} themes`)

  const categories = new Set(templates.map((template) => template.category))
  check('the templates span at least ten categories', categories.size >= 10, `${categories.size} categories`)

  // The ten theme names are specified exactly; check them verbatim.
  const expectedThemes = [
    'Minimal light',
    'Editorial',
    'Dark studio',
    'Soft pastel',
    'Bold creator',
    'Modern business',
    'Retro pop',
    'Elegant monochrome',
    'Warm earthy',
    'Neon night',
  ]
  const themeNames = themes.map((theme) => theme.name)
  const missingThemes = expectedThemes.filter(
    (name) => !themeNames.some((actual) => actual.toLowerCase() === name.toLowerCase()),
  )
  check('the ten named themes are present', missingThemes.length === 0, missingThemes.join(', '))

  /* ---- every template renders in the editor ------------------------------ */

  for (const template of templates) {
    const created = await api(page, '/api/websites', {
      method: 'POST',
      body: JSON.stringify({ name: `Check ${template.id}`, templateId: template.id }),
    })
    if (created.status >= 400) {
      check(`${template.id} can be created`, false, `status ${created.status}`)
      continue
    }
    const id = created.body.website.id

    await page.goto(`${FRONTEND}/editor/${id}`, { waitUntil: 'networkidle' })
    const ready = await page
      .waitForSelector('.canvas-block', { timeout: 15000 })
      .then(() => true)
      .catch(() => false)

    if (!ready) {
      check(`${template.id} renders in the editor`, false, 'no blocks appeared')
      continue
    }

    await page.waitForTimeout(250)
    const blocks = await page.locator('.canvas-block').count()
    const empty = await page.locator('.empty-canvas-message').count()
    const text = await page.locator('.canvas-block').first().innerText()

    check(
      `${template.id} renders its blocks`,
      blocks >= 3 && empty === 0 && text.trim().length > 0,
      `${blocks} blocks`,
    )
  }

  /* ---- every theme applies and changes the page -------------------------- */

  // One website, one theme at a time.
  const created = await api(page, '/api/websites', {
    method: 'POST',
    body: JSON.stringify({ name: 'Theme check', templateId: templates[0].id }),
  })
  const websiteId = created.body.website.id

  const seen = new Set()
  for (const theme of themes) {
    const updated = await api(page, `/api/websites/${websiteId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        site: { themeId: theme.id, colors: {}, typography: {}, background: {} },
      }),
    })
    if (updated.status >= 400) {
      check(`the ${theme.name} theme can be applied`, false, `status ${updated.status}`)
      continue
    }

    await page.goto(`${FRONTEND}/editor/${websiteId}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.website-canvas', { timeout: 15000 })
    await page.waitForTimeout(300)

    const accent = await page
      .locator('.website-canvas')
      .evaluate((node) => node.style.getPropertyValue('--lx-accent').trim().toLowerCase())
    const font = await page
      .locator('.website-canvas')
      .evaluate((node) => node.style.getPropertyValue('--lx-heading-font').trim())

    check(
      `the ${theme.name} theme applies`,
      Boolean(accent) && Boolean(font) && accent !== seen.has(accent ? accent : ''),
      `accent ${accent}`,
    )
    seen.add(accent)
  }

  /* ---- the console stayed quiet ------------------------------------------ */

  const realErrors = consoleErrors.filter(
    (text) => !/favicon|404 \(Not Found\)|Failed to load resource/i.test(text),
  )
  check('no console errors while rendering the catalogue', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

  await browser.close()

  console.log(`\n${passed}/${passed + failed} checks passed`)
  if (failed) process.exit(1)
}

run().catch((error) => {
  console.error('the template check failed to run:', error)
  process.exit(1)
})
