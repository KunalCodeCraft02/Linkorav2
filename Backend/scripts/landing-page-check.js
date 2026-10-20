/**
 * Checks the landing page.
 *
 * The landing page is the first thing a visitor sees, so it has to render
 * without errors and describe the product that actually exists - no stale
 * copy, no links to pages that were removed, no features that were never
 * built.
 *
 * Run it with the frontend on :5173.
 */

const { chromium } = require('playwright')

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

async function run() {
  let browser
  try {
    browser = await chromium.launch()
  } catch {
    browser = await chromium.launch({ channel: 'chrome' })
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  await page.goto(FRONTEND, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)

  const body = await page.locator('body').innerText()

  check('the landing page renders', body.length > 200, `${body.length} characters`)

  // The brand is Linkora, not whatever the copy used to say.
  check('the page says Linkora', /Linkora/.test(body))
  check('the page does not mention a different brand', !/Inkwell/i.test(body))

  // The features that are actually shipped.
  const shipped = [
    ['the template count', /14 templates/],
    ['the theme count', /10 themes/],
    ['image upload', /image upload/i],
    ['drag and drop', /drag/i],
    ['public link', /public link/i],
  ]
  for (const [label, pattern] of shipped) {
    check(`the landing page mentions ${label}`, pattern.test(body))
  }

  // Features that were never built must not be advertised.
  const unbuilt = [
    ['click analytics', /click analytics/i],
    ['AI page coach', /AI page coach/i],
    ['A/B testing', /A\/B test/i],
    ['UPI payments', /UPI payment/i],
    ['a paid plan', /\/month/],
    ['password-protected pages', /password-protected/i],
    ['custom domains', /custom domain/i],
    ['QR codes', /QR code/i],
    ['team access', /team access/i],
  ]
  for (const [label, pattern] of unbuilt) {
    check(`the landing page does not advertise ${label}`, !pattern.test(body))
  }

  // Every number the landing page claims must match the real catalogue.
  const catalogue = await page.evaluate(async () => {
    const response = await fetch('http://localhost:5000/api/websites/catalog')
    return response.json()
  })
  check(
    'the template count on the page matches the catalogue',
    catalogue.templates.length === 14,
    `${catalogue.templates.length} templates in the catalogue`,
  )
  check(
    'the theme count on the page matches the catalogue',
    catalogue.themes.length === 10,
    `${catalogue.themes.length} themes in the catalogue`,
  )
  check(
    'the category count on the page matches the catalogue',
    new Set(catalogue.templates.map((template) => template.category)).size === 10,
  )

  // Every in-page link must point at a section that exists.
  const anchors = await page.locator('a[href^="#"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('href')),
  )
  const broken = []
  for (const href of anchors) {
    const id = href.slice(1)
    if (id && (await page.locator(`#${id}`).count()) === 0) broken.push(href)
  }
  check('every in-page link points at a section that exists', broken.length === 0, broken.join(', '))

  // The calls to action must lead somewhere that exists.
  const ctas = await page.locator('a.btn').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('href')),
  )
  const badCtas = ctas.filter((href) => href && !href.startsWith('#') && !href.startsWith('/'))
  check('every call to action has a destination', badCtas.length === 0, badCtas.join(', '))

  check('the page offers a sign up', ctas.some((href) => href === '/register'))
  check('the page offers a login', ctas.some((href) => href === '/login'))

  // The theme swatches are a real interaction, not a decoration.
  const swatches = page.locator('.swatches .sw')
  check('the landing page offers theme swatches', (await swatches.count()) === 4)
  const before = await page.locator('.screen').getAttribute('style')
  await swatches.nth(1).click()
  await page.waitForTimeout(200)
  const after = await page.locator('.screen').getAttribute('style')
  check('choosing a swatch repaints the preview', before !== after)

  const realErrors = consoleErrors.filter(
    (text) => !/favicon|404 \(Not Found\)|Failed to load resource/i.test(text),
  )
  check('the landing page logged no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

  await browser.close()

  console.log(`\n${passed}/${passed + failed} checks passed`)
  if (failed) process.exit(1)
}

run().catch((error) => {
  console.error('the landing page check failed to run:', error)
  process.exit(1)
})
