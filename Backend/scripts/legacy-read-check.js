/**
 * Checks that websites created before the rebuild are still readable.
 *
 * The API upgrades the old `components` shape to the new section vocabulary
 * on read, so content the user already wrote survives the rebuild. This
 * script signs a session for a legacy owner and confirms their website comes
 * back with real, valid sections instead of an empty page.
 *
 * It only reads.
 *
 * Run it with the backend on :5000.
 */

const path = require('path')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

require('dotenv').config({ quiet: true, path: path.resolve(__dirname, '../.env') })
const config = require('../src/config/env')

const BASE = process.env.LINKORA_BACKEND || 'http://localhost:5000'

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

async function main() {
  await mongoose.connect(config.mongoUri)
  const db = mongoose.connection.db

  const legacy = await db
    .collection('websites')
    .find({ components: { $exists: true } })
    .sort({ components: -1 })
    .toArray()

  // Documents with no mappable content are expected to stay empty.
  const withContent = legacy.filter((document) => (document.components || []).length > 0)
  check('there are legacy websites to check', legacy.length > 0, `${legacy.length} documents`)

  if (!withContent.length) {
    await mongoose.disconnect()
    console.log('\nNo legacy content to read.')
    return
  }

  // Sign a session for the owner of the first document with content.
  const owner = withContent[0].owner
  const token = jwt.sign({ sub: owner.toString() }, config.jwtSecret, { expiresIn: '10m' })
  const cookie = `${config.cookieName}=${token}`

  const listed = await fetch(`${BASE}/api/websites`, { headers: { Cookie: cookie } })
  const listBody = await listed.json()
  check('the legacy owner can list their websites', listed.status === 200, `status ${listed.status}`)
  check(
    'the dashboard shows the legacy websites',
    (listBody.websites || []).length > 0,
    `${(listBody.websites || []).length} websites`,
  )

  const legacySummary = (listBody.websites || []).find((website) => website.id === withContent[0]._id.toString())
  check(
    'a legacy website reports a section count',
    legacySummary && legacySummary.sectionCount > 0,
    legacySummary ? `${legacySummary.sectionCount} sections` : 'not listed',
  )

  // Read every legacy website this owner has.
  let readable = 0
  let withSections = 0
  for (const document of withContent.filter((item) => item.owner.toString() === owner.toString())) {
    const response = await fetch(`${BASE}/api/websites/${document._id}`, { headers: { Cookie: cookie } })
    if (response.status !== 200) continue
    readable += 1
    const body = await response.json()
    if ((body.website?.sections || []).length > 0) withSections += 1
  }

  check('every legacy website can be read', readable === withContent.filter((item) => item.owner.toString() === owner.toString()).length, `${readable} read`)
  check('the legacy content survives the rebuild', withSections > 0, `${withSections} with sections`)

  // The migrated document must use the new vocabulary only.
  const sample = await fetch(`${BASE}/api/websites/${withContent[0]._id}`, { headers: { Cookie: cookie } })
  const sampleBody = await sample.json()
  const types = new Set((sampleBody.website?.sections || []).map((section) => section.type))
  const allowed = new Set([
    'profile', 'text', 'image', 'link-button', 'social-links',
    'link-card', 'gallery', 'video', 'contact', 'divider', 'spacer',
  ])
  const bad = [...types].filter((type) => !allowed.has(type))
  check('the migrated sections use the current vocabulary', bad.length === 0, bad.join(', ') || 'all valid')

  const ids = (sampleBody.website?.sections || []).map((section) => section.id)
  check('every migrated section has a stable id', ids.every(Boolean) && new Set(ids).size === ids.length, `${ids.length} sections`)

  await mongoose.disconnect()
  console.log(`\n${passed}/${passed + failed} checks passed`)
  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
