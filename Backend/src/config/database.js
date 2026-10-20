const mongoose = require('mongoose')
const config = require('./env')

async function connectDatabase() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')
}

function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}

module.exports = { connectDatabase, getDatabaseStatus }
