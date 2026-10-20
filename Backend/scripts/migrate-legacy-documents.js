/**
 * Migrates websites that were created before the rebuild.
 *
 * The old builder stored a flat `components` array and a `settings` object.
 * The new document uses a typed `sections` array and a theme-based `site`
 * object. The API already upgrades those documents on read, so this script
 * is not required for the app to work - it writes the migration back to
 * MongoDB so the old shape stops lingering in the database.
 *
 * Usage:
 *   node scripts/migrate-legacy-documents.js            # migrate
 *   node scripts/migrate-legacy-documents.js --dry-run  # report only
 */

const path = require('path')
const mongoose = require('mongoose')

require('dotenv').config({ quiet: true, path: path.resolve(__dirname, '../.env') })
const config = require('../src/config/env')
const { migrateLegacyDocument, validateDocument } = require('../../shared/website-schema.mjs')

const dryRun = process.argv.includes('--dry-run')

async function main() {
  await mongoose.connect(config.mongoUri)
  const db = mongoose.connection.db

  const legacy = await db
    .collection('websites')
    .find({ components: { $exists: true } })
    .toArray()

  console.log(`Found ${legacy.length} legacy website(s). ${dryRun ? 'Dry run - nothing will be written.' : ''}`)

  let migrated = 0
  let skipped = 0
  const typeCounts = {}

  for (const document of legacy) {
    const result = migrateLegacyDocument(document)
    const validated = validateDocument({
      site: { ...result.site, ...(document.site || {}) },
      profile: { ...result.profile, ...(document.profile || {}) },
      sections: result.sections,
    })

    if (!validated.sections.length) {
      skipped += 1
      console.log(`  skip ${document.name} (${document.slug}) - no mappable content`)
      continue
    }

    for (const section of validated.sections) {
      typeCounts[section.type] = (typeCounts[section.type] || 0) + 1
    }

    if (!dryRun) {
      await db.collection('websites').updateOne(
        { _id: document._id },
        {
          $set: {
            site: validated.site,
            profile: validated.profile,
            sections: validated.sections,
          },
          $unset: { components: 1, settings: 1 },
        },
      )
    }

    migrated += 1
    console.log(`  ${dryRun ? 'would migrate' : 'migrated'} ${document.name} (${document.slug}) - ${validated.sections.length} section(s)`)
  }

  console.log(`\n${migrated} migrated, ${skipped} skipped.`)
  console.log('Section types:', JSON.stringify(typeCounts))

  if (!dryRun) {
    const remaining = await db.collection('websites').countDocuments({ components: { $exists: true } })
    console.log(`Legacy documents remaining: ${remaining}`)
  }

  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
