/**
 * Drops the database collections that belonged to the removed Figma and
 * Groq features.
 *
 * The Mongoose models, routes and services are already gone from the code.
 * These two collections are the leftover records:
 *
 *   generationjobs - one row per AI generation attempt
 *   exporttokens  - single-use tokens the Figma plugin used to authenticate
 *
 * The export tokens are all expired, and a generation job is only a
 * historical note about a feature that no longer exists. Neither is read by
 * any code path any more.
 *
 * This script is deliberately not run automatically. It is here so the
 * removal can be done deliberately rather than as a side effect.
 *
 * Usage:
 *   node scripts/cleanup-removed-collections.js --dry-run
 *   node scripts/cleanup-removed-collections.js
 */

const path = require('path')
const mongoose = require('mongoose')

require('dotenv').config({ quiet: true, path: path.resolve(__dirname, '../.env') })
const config = require('../src/config/env')

const COLLECTIONS = ['generationjobs', 'exporttokens']
const dryRun = process.argv.includes('--dry-run')

async function main() {
  await mongoose.connect(config.mongoUri)
  const db = mongoose.connection.db

  const existing = new Set((await db.listCollections().toArray()).map((entry) => entry.name))

  for (const name of COLLECTIONS) {
    if (!existing.has(name)) {
      console.log(`  ${name} - not present, nothing to do`)
      continue
    }

    const count = await db.collection(name).countDocuments()
    if (dryRun) {
      console.log(`  would drop ${name} - ${count} document(s)`)
      continue
    }

    await db.collection(name).drop()
    console.log(`  dropped ${name} - ${count} document(s) removed`)
  }

  // Anything else in the database is left alone.
  const remaining = (await db.listCollections().toArray()).map((entry) => entry.name)
  console.log(`\nCollections now: ${remaining.join(', ')}`)

  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
