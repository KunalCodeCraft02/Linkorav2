/**
 * Makes sure the MongoDB indexes match the Mongoose schemas.
 *
 * MongoDB keeps an existing index and ignores changed options, so a TTL
 * index that was first created as a plain index keeps its plain definition.
 * `collMod` converts it in place, which is what lets MongoDB expire the
 * documents that declare an expiry.
 *
 * Run with: node scripts/sync-indexes.js
 */
const mongoose = require('mongoose')
const config = require('../src/config/env')

const MODELS = [
  require('../src/models/User'),
  require('../src/models/Website'),
]

/**
 * The collection name of a model. Mongoose 9 exposes `collection.collectionName`
 * as a string property; older versions exposed it as a method.
 */
function collectionName(Model) {
  const name = Model.collection.collectionName
  return typeof name === 'function' ? name.call(Model.collection) : name
}

async function main() {
  await mongoose.connect(config.mongoUri)
  const db = mongoose.connection.db

  for (const Model of MODELS) {
    const name = Model.modelName
    const collection = db.collection(collectionName(Model))

    for (const [keys, options] of Model.schema.indexes()) {
      const indexName = options.name || Object.keys(keys).map((key) => `${key}_1`).join('_')
      if (options.expireAfterSeconds === undefined) continue

      const existing = (await collection.indexes()).find((index) => index.name === indexName)
      if (existing && existing.expireAfterSeconds === options.expireAfterSeconds) continue

      try {
        await db.command({
          collMod: collectionName(Model),
          index: { name: indexName, expireAfterSeconds: options.expireAfterSeconds },
        })
        console.log(`${name}: converted ${indexName} to a TTL index`)
      } catch (error) {
        console.log(`${name}: could not convert ${indexName} - ${error.message}`)
      }
    }

    const indexes = await collection.indexes()
    console.log(
      `${name}: ${indexes
        .map((index) => `${index.name}${index.expireAfterSeconds !== undefined ? ` (ttl=${index.expireAfterSeconds})` : ''}`)
        .join(', ')}`,
    )
  }

  await mongoose.disconnect()
}

main().catch((error) => {
  console.error('Index sync failed:', error)
  process.exit(1)
})
