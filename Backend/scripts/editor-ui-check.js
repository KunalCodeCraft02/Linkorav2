/**
 * Drives the real editor UI in a browser.
 *
 * The other two check scripts exercise the API. This one exercises the
 * interface: it signs up, creates a website from a template, opens the
 * editor, edits text and colours through the inspector, reorders a block,
 * undoes and redoes, checks that the changes survive a reload, and confirms
 * the published page shows the same content without any editor chrome.
 *
 * Run it with the backend on :5000 and the frontend on :5173.
 */

const { chromium } = require('playwright')
const path = require('path')

const BACKEND = process.env.LINKORA_BACKEND || 'http://localhost:5000'
const FRONTEND = 'http://localhost:5173'

// A small valid PNG used for the upload tests.
const TEST_IMAGE = path.join(__dirname, 'test-design.png')

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
  // Prefer the browser Playwright downloaded; fall back to the system
  // Chrome when the bundled build is not present.
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

  const email = `editor-${Date.now()}@example.com`
  const password = 'Sup3rSecret!'

  /* ---- sign up ---------------------------------------------------------- */

  await page.goto(`${FRONTEND}/register`, { waitUntil: 'networkidle' })
  // The sign-up form is one step per field, so each value has to satisfy
  // that step's own input validation before the form will advance.
  const values = {
    firstName: 'Editor',
    email,
    phone: '+919876543210',
    instagram: '@editorcheck',
    followers: '1200',
    password,
  }
  for (const field of Object.keys(values)) {
    await page.fill(`#${field}`, values[field])
    await page.click('button[type="submit"]')
    await page.waitForTimeout(200)
  }
  await page.waitForURL('**/home', { timeout: 15000 })
  check('sign up reaches the dashboard', page.url().endsWith('/home'), page.url())

  /* ---- the dashboard --------------------------------------------------- */

  await page.waitForSelector('.site-grid, .dashboard__empty', { timeout: 10000 })
  const emptyDashboard = await page.locator('.dashboard__empty').count()
  check('an empty dashboard shows a designed empty state', emptyDashboard === 1)

  /* ---- the template browser -------------------------------------------- */

  await page.click('a[href="/templates"]')
  await page.waitForURL('**/templates')
  await page.waitForSelector('.templates-grid .template-tile', { timeout: 10000 })
  const tileCount = await page.locator('.templates-grid .template-tile').count()
  check('the template browser lists every template', tileCount >= 10, `${tileCount} templates`)

  // Every preview has to fill its tile and be centred in it. Templates
  // have different content widths, so a fixed scale would render them at
  // different sizes and leave them hugging one edge.
  const previewFit = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.template-tile'))
    return tiles.map((tile) => {
      const stage = tile.querySelector('.template-preview')
      const frame = tile.querySelector('.template-preview__frame')
      if (!stage || !frame) return null
      const stageBox = stage.getBoundingClientRect()
      const frameBox = frame.getBoundingClientRect()
      return {
        name: tile.querySelector('h3')?.textContent,
        stageWidth: Math.round(stageBox.width),
        frameWidth: Math.round(frameBox.width),
        leftGap: Math.round(frameBox.left - stageBox.left),
        rightGap: Math.round(stageBox.right - frameBox.right),
      }
    }).filter(Boolean)
  })

  const narrow = previewFit.filter((entry) => entry.frameWidth < entry.stageWidth - 2)
  check('every template preview fills its tile',
    previewFit.length > 0 && narrow.length === 0,
    narrow.map((entry) => `${entry.name} ${entry.frameWidth}/${entry.stageWidth}`).join(', '))

  const offCentre = previewFit.filter(
    (entry) => Math.abs(entry.leftGap - entry.rightGap) > 2,
  )
  check('every template preview is centred in its tile',
    offCentre.length === 0,
    offCentre.map((entry) => `${entry.name} ${entry.leftGap}/${entry.rightGap}`).join(', '))

  const categoryChips = await page.locator('.chip-row .chip').count()
  check('the template browser filters by category', categoryChips >= 10, `${categoryChips} categories`)

  // Filter down to a single category and check the grid actually changes.
  const beforeFilter = tileCount
  await page.locator('.chip-row .chip').nth(1).click()
  await page.waitForTimeout(200)
  const afterFilter = await page.locator('.templates-grid .template-tile').count()
  check('choosing a category filters the grid', afterFilter > 0 && afterFilter < beforeFilter, `${afterFilter} shown`)

  // Open the detail modal for the first template.
  await page.locator('.templates-grid .template-tile__preview').first().click()
  await page.waitForSelector('.modal--large', { timeout: 5000 })
  check('a template opens a detail preview', await page.locator('.modal--large').count() === 1)
  await page.locator('.modal--large .btn.ghost').click()
  await page.waitForTimeout(200)

  /* ---- create from a template ------------------------------------------- */

  // "Prism" is used rather than the first template in the grid because it
  // contains a video block, and the upload checks below need one.
  const prismTile = page.locator('.templates-grid .template-tile', { hasText: 'Prism' }).first()
  const prismFound = await prismTile.count()
  if (prismFound === 0) {
    // Fall back to the first template if the grid order ever changes.
    await page.locator('.templates-grid .template-tile .btn').first().click()
  } else {
    await prismTile.locator('.btn').first().click()
  }
  await page.waitForURL('**/editor/**', { timeout: 15000 })
  check('choosing a template opens the editor', /\/editor\//.test(page.url()), page.url())

  const websiteId = new URL(page.url()).pathname.split('/')[2]

  await page.waitForSelector('.editor-body', { timeout: 15000 })
  await page.waitForSelector('.canvas-block', { timeout: 15000 })

  const blockCount = await page.locator('.canvas-block').count()
  check('the editor canvas renders the template blocks', blockCount >= 3, `${blockCount} blocks`)

  check('the three-panel editor is present',
    (await page.locator('.sidebar').count()) === 1 &&
    (await page.locator('.editor-body > .canvas-stage, .canvas-stage').count()) === 1 &&
    (await page.locator('.inspector').count()) === 1)

  /* ---- selecting a block drives the inspector --------------------------- */

  await page.locator('.canvas-block__select').first().click()
  await page.waitForTimeout(250)
  const inspectorTitle = await page.locator('.inspector__head h3').textContent()
  check('selecting a block shows its properties', Boolean(inspectorTitle && inspectorTitle.trim()), inspectorTitle)

  const controlCount = await page.locator('.inspector .insp-field').count()
  check('the inspector offers controls for the selected type', controlCount > 0, `${controlCount} controls`)

  // The inspector must not show the same controls for two different types.
  const firstTypeControls = await page.locator('.inspector .insp-field').allTextContents()
  await page.locator('.canvas-block__select').last().click()
  await page.waitForTimeout(250)
  const lastTypeControls = await page.locator('.inspector .insp-field').allTextContents()
  check('the inspector changes with the selection', JSON.stringify(firstTypeControls) !== JSON.stringify(lastTypeControls))

  /* ---- editing text ----------------------------------------------------- */

  // Find a text block and edit it through the inspector.
  const textBlockIndex = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.canvas-block'))
    return blocks.findIndex((block) => block.querySelector('.lx-text'))
  })
  check('the template contains a text block', textBlockIndex >= 0)

  if (textBlockIndex >= 0) {
    await page.locator('.canvas-block__select').nth(textBlockIndex).click()
    await page.waitForTimeout(200)
    const textarea = page.locator('.inspector textarea').first()
    const hadTextarea = await textarea.count()
    check('a text block offers a text control', hadTextarea === 1)

    if (hadTextarea) {
      const marker = 'Edited by the editor check'
      await textarea.fill(marker)
      await page.waitForTimeout(600)
      const onCanvas = await page.locator('.canvas-block').nth(textBlockIndex).locator('.lx-text').first().textContent()
      check('the text edit appears on the canvas immediately', onCanvas === marker, onCanvas)
    }
  }

  /* ---- uploading an image to a section ------------------------------------ */

  // An image control must write to the property it is labelled with. The
  // video block is the strictest case: it has two URL-shaped properties -
  // "url" for the video itself and "poster" for the still image. If an
  // upload always wrote to "url", setting a poster would replace the video
  // with a picture.
  const videoIndex = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.canvas-block'))
    return blocks.findIndex((block) => block.querySelector('.lx-video, .lx-placeholder'))
  })

  const profileIndex = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.canvas-block'))
    return blocks.findIndex((block) => block.querySelector('.lx-profile, .lx-avatar'))
  })

  if (profileIndex >= 0) {
    await page.locator('.canvas-block__select').nth(profileIndex).click()
    await page.waitForTimeout(300)

    const fileInput = page.locator('.inspector input[type="file"]').first()
    const hasFileInput = await fileInput.count() === 1
    check('the profile block offers an image upload', hasFileInput)

    if (hasFileInput) {
      await fileInput.setInputFiles(TEST_IMAGE)
      await page.waitForTimeout(2500)

      const storedImage = await page.evaluate(async ({ id, api }) => {
        const response = await fetch(`${api}/api/websites/${id}`, { credentials: 'include' })
        const result = await response.json()
        const profile = result.website?.sections?.find((entry) => entry.type === 'profile')
        return profile?.props?.image || ''
      }, { id: websiteId, api: BACKEND })

      check('the uploaded photo is stored on the profile image property',
        Boolean(storedImage && storedImage.includes('/uploads/')), storedImage)

      const onCanvas = await page.locator('.canvas-block').nth(profileIndex).locator('img').count()
      check('the uploaded photo appears on the canvas', onCanvas > 0)
    }
  } else {
    check('the profile block offers an image upload', false, 'no profile block found')
  }

  // A poster upload must land on "poster" and leave the video's own "url"
  // alone. The video block is found by selecting each block and looking at
  // the inspector, because the canvas only renders a video once it has a
  // source.
  let posterIndex = -1
  const blockTotal = await page.locator('.canvas-block').count()
  for (let index = 0; index < blockTotal; index += 1) {
    await page.locator('.canvas-block__select').nth(index).click()
    await page.waitForTimeout(200)
    const hasPoster = await page.locator('.inspector #insp-poster').count()
    if (hasPoster === 1) {
      posterIndex = index
      break
    }
  }

  check('a video block offers a poster upload', posterIndex >= 0)

  if (posterIndex >= 0) {
    // Give the video a source first, so we can prove it survives.
    const urlField = page.locator('.inspector #insp-url').first()
    if (await urlField.count() === 1) {
      await urlField.fill('https://example.com/clip.mp4')
      await page.waitForTimeout(1200)
    }

    const posterInput = page.locator('.inspector #insp-poster').locator('xpath=ancestor::div[contains(@class,"insp-field")]//input[@type="file"]').first()
    const posterFile = await posterInput.count() === 1
      ? posterInput
      : page.locator('.inspector input[type="file"]').last()

    await posterFile.setInputFiles(TEST_IMAGE)
    await page.waitForTimeout(2500)

    const video = await page.evaluate(async ({ id, api }) => {
      const response = await fetch(`${api}/api/websites/${id}`, { credentials: 'include' })
      const result = await response.json()
      const section = result.website?.sections?.find((entry) => entry.type === 'video')
      return { url: section?.props?.url || '', poster: section?.props?.poster || '' }
    }, { id: websiteId, api: BACKEND })

    check('a poster upload is stored on the poster property',
      Boolean(video.poster && video.poster.includes('/uploads/')), video.poster)
    check('a poster upload does not replace the video source',
      video.url.includes('clip.mp4'), video.url)
  }

  /* ---- changing a colour ------------------------------------------------ */

  await page.locator('.sidebar-tabs button', { hasText: 'Settings' }).click()
  await page.waitForTimeout(300)
  const accentPicker = page.locator('#colour-accent')
  const hasColourPicker = await accentPicker.count()
  check('the settings panel exposes the accent colour', hasColourPicker === 1)

  if (hasColourPicker) {
    const before = await accentPicker.inputValue()
    await accentPicker.fill('#ff0066')
    await page.waitForTimeout(600)
    const after = await accentPicker.inputValue()
    check('the accent colour can be changed', after === '#ff0066' && after !== before, `${before} -> ${after}`)
  }

  /* ---- adding a block ---------------------------------------------------- */

  await page.locator('.sidebar-tabs button', { hasText: 'Add' }).click()
  await page.waitForTimeout(200)
  const blocksBefore = await page.locator('.canvas-block').count()
  await page.locator('.block-button', { hasText: 'Divider' }).first().click()
  await page.waitForTimeout(500)
  const blocksAfter = await page.locator('.canvas-block').count()
  check('a block can be added from the sidebar', blocksAfter === blocksBefore + 1, `${blocksBefore} -> ${blocksAfter}`)

  /* ---- reordering with the keyboard-accessible controls ------------------ */

  const firstLabelBefore = await page.locator('.canvas-block').first().getAttribute('data-section-id')
  const secondId = await page.locator('.canvas-block').nth(1).getAttribute('data-section-id')
  await page.locator('.canvas-block').nth(1).locator('.canvas-block__tools button[aria-label="Move block up"]').click()
  await page.waitForTimeout(400)
  const firstLabelAfter = await page.locator('.canvas-block').first().getAttribute('data-section-id')
  check('a block can be moved up', firstLabelAfter === secondId && firstLabelBefore !== firstLabelAfter,
    `${firstLabelBefore} -> ${firstLabelAfter}`)

  /* ---- reordering by dragging the handle --------------------------------- */

  // Drag the third block onto the first. The handle has to be reachable
  // without selecting the block first, and the drop has to land the block
  // in the new position.
  const orderBeforeDrag = await page.locator('.canvas-block').evaluateAll(
    (nodes) => nodes.map((node) => node.getAttribute('data-section-id')),
  )

  // Wait for the canvas layout to settle before measuring. The block
  // heights depend on images that were uploaded earlier in the run, and
  // an image that is still loading makes the block a different height
  // from one moment to the next. If the layout shifts *during* the drag,
  // the drop lands a slot away from the intended one and the test fails
  // for reasons that have nothing to do with the drag.
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('img')).every((img) => img.complete),
    null,
    { timeout: 10000 },
  ).catch(() => {})

  const handle = page.locator('.canvas-block').nth(2).locator('.canvas-handle')
  const handleBox = await handle.boundingBox()
  const targetBox = await page.locator('.canvas-block').first().boundingBox()
  const draggedBox = await page.locator('.canvas-block').nth(2).boundingBox()

  if (handleBox && targetBox && draggedBox) {
    // dnd-kit resolves the drop with `closestCenter`, which compares the
    // *centre* of the dragged block against the centres of the blocks it
    // can land on. The pointer is not what is measured - the block is
    // moved by the same delta as the pointer, so its centre is the
    // pointer's offset by however far the grab point is from the block's
    // own centre.
    //
    // Aiming the *handle* at the target is therefore wrong for a block
    // that is taller than the grab offset: the block's centre ends up
    // somewhere else entirely and the drop lands a slot off. To drop the
    // block onto the target, the pointer has to go far enough to bring
    // the block's centre onto the target's centre.
    const grabY = handleBox.y + handleBox.height / 2
    const blockCentreY = draggedBox.y + draggedBox.height / 2
    const targetCentreY = targetBox.y + targetBox.height / 2
    const aimY = targetCentreY - (blockCentreY - grabY)

    await page.mouse.move(handleBox.x + handleBox.width / 2, grabY)
    await page.mouse.down()
    // dnd-kit needs a few intermediate moves before it recognises the drag.
    await page.mouse.move(handleBox.x + handleBox.width / 2, grabY - 20, { steps: 5 })
    await page.mouse.move(targetBox.x + targetBox.width / 2, aimY, { steps: 12 })
    await page.mouse.up()
    await page.waitForTimeout(600)

    const orderAfterDrag = await page.locator('.canvas-block').evaluateAll(
      (nodes) => nodes.map((node) => node.getAttribute('data-section-id')),
    )
    check(
      'a block can be dragged to a new position',
      orderAfterDrag[0] === orderBeforeDrag[2] && orderAfterDrag.length === orderBeforeDrag.length,
      `${orderBeforeDrag[2]} -> first`,
    )
    check(
      'dragging reorders rather than duplicating',
      new Set(orderAfterDrag).size === orderAfterDrag.length,
      `${orderAfterDrag.length} unique of ${orderAfterDrag.length}`,
    )
  } else {
    check('a block can be dragged to a new position', false, 'the drag handle has no position')
  }

  // Put the order back so the checks below are not affected.
  await page.locator('.editor-toolbar button[aria-label="Undo"]').click()
  await page.waitForTimeout(300)

  /* ---- undo / redo ------------------------------------------------------- */

  await page.locator('.editor-toolbar button[aria-label="Undo"]').click()
  await page.waitForTimeout(300)
  const firstAfterUndo = await page.locator('.canvas-block').first().getAttribute('data-section-id')
  check('undo restores the previous order', firstAfterUndo === firstLabelBefore, firstAfterUndo)

  await page.locator('.editor-toolbar button[aria-label="Redo"]').click()
  await page.waitForTimeout(300)
  const firstAfterRedo = await page.locator('.canvas-block').first().getAttribute('data-section-id')
  check('redo re-applies the change', firstAfterRedo === secondId, firstAfterRedo)

  /* ---- saving ------------------------------------------------------------ */

  // The indicator must not claim "saved" while a change is still queued.
  await page.locator('.sidebar-tabs button', { hasText: 'Add' }).click()
  await page.waitForTimeout(200)
  await page.locator('.block-button', { hasText: 'Divider' }).first().click()
  const pendingShown = await page
    .waitForSelector('.save-indicator--pending', { timeout: 3000 })
    .then(() => true)
    .catch(() => false)
  check('the editor reports that changes are not saved yet', pendingShown)
  await page.locator('.editor-toolbar button[aria-label="Undo"]').click()
  await page.waitForTimeout(300)

  // The save indicator should settle on "Saved".
  await page.waitForFunction(
    () => document.querySelector('.save-indicator--saved') !== null,
    { timeout: 15000 },
  ).catch(() => {})

  const savedIndicator = await page.locator('.save-indicator--saved').count()
  check('the editor reports that changes are saved', savedIndicator === 1)

  /* ---- the changes survive a reload -------------------------------------- */

  const editorUrl = page.url()
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.canvas-block', { timeout: 15000 })
  await page.waitForTimeout(400)

  const reloadedFirst = await page.locator('.canvas-block').first().getAttribute('data-section-id')
  check('the new order survives a reload', reloadedFirst === secondId, reloadedFirst)

  const reloadedBlocks = await page.locator('.canvas-block').count()
  check('the added block survives a reload', reloadedBlocks === blocksAfter, `${reloadedBlocks} blocks`)

  const reloadedText = await page.locator('.lx-text').allTextContents()
  check('the edited text survives a reload', reloadedText.some((text) => text.includes('Edited by the editor check')))

  /* ---- the dashboard lists it -------------------------------------------- */

  await page.goto(`${FRONTEND}/home`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.site-card', { timeout: 10000 })
  check('the dashboard lists the new website', await page.locator('.site-card').count() >= 1)

  const cardStatus = await page.locator('.site-card__status').first().textContent()
  check('the dashboard shows the draft status', /draft/i.test(cardStatus || ''), cardStatus)

  /* ---- publishing --------------------------------------------------------- */

  await page.locator('.site-card').first().locator('button', { hasText: 'Publish' }).click()
  await page.waitForTimeout(1500)
  const publishedStatus = await page.locator('.site-card__status').first().textContent()
  check('the dashboard shows the published status', /published/i.test(publishedStatus || ''), publishedStatus)

  const publicUrl = await page.locator('.site-card__url').first().getAttribute('href')
  check('the dashboard shows the public link', Boolean(publicUrl && publicUrl.includes('/p/')), publicUrl)

  /* ---- the public page --------------------------------------------------- */

  const publicPage = await context.newPage()
  await publicPage.goto(publicUrl, { waitUntil: 'networkidle' })
  await publicPage.waitForTimeout(600)

  check('the public page renders without a login', await publicPage.locator('.website-canvas').count() === 1)
  check('the public page has no editor chrome',
    (await publicPage.locator('.editor-toolbar, .inspector, .sidebar, .canvas-block__chrome').count()) === 0)

  const publicText = await publicPage.locator('.lx-text').allTextContents()
  check('the public page shows the edited text',
    publicText.some((text) => text.includes('Edited by the editor check')))

  const publicAccent = await publicPage.locator('.website-canvas').evaluate((node) => node.style.getPropertyValue('--lx-accent'))
  check('the public page shows the edited colour', (publicAccent || '').trim().toLowerCase() === '#ff0066', publicAccent)

  /* ---- unpublishing ------------------------------------------------------ */

  await page.goto(`${FRONTEND}/home`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.site-card', { timeout: 10000 })
  await page.locator('.site-card').first().locator('button', { hasText: 'Unpublish' }).click()
  await page.waitForTimeout(1500)

  const unpublishResponse = await publicPage.goto(publicUrl, { waitUntil: 'networkidle' })
  const unpublishBody = await publicPage.locator('body').textContent()
  check('an unpublished website is no longer public',
    !unpublishBody.includes('Edited by the editor check'), `status ${unpublishResponse.status()}`)

  /* ---- the console stayed quiet ------------------------------------------ */

  const realErrors = consoleErrors.filter(
    (text) => !/favicon|404 \(Not Found\)|Failed to load resource/i.test(text),
  )
  check('the editor logged no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

  await browser.close()

  console.log(`\n${passed}/${passed + failed} checks passed`)
  if (failed) process.exit(1)
}

run().catch((error) => {
  console.error('the editor check failed to run:', error)
  process.exit(1)
})
