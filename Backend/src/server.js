const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')
const path = require('path')
const config = require('./config/env')
const { connectDatabase, getDatabaseStatus } = require('./config/database')
const authRoutes = require('./routes/authRoutes')
const websiteRoutes = require('./routes/websiteRoutes')
const { frontendCors } = require('./middleware/cors')
const errorHandler = require('./middleware/errorHandler')
const morgan = require('morgan')

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(frontendCors)
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: false, limit: '256kb' }))
app.use(cookieParser())
app.use(morgan('dev'))

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { index: false, maxAge: '7d' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: getDatabaseStatus() })
})

app.use('/api/auth', authRoutes)
app.use('/api/websites', websiteRoutes)

app.use((req, res) => res.status(404).json({ message: 'Endpoint not found.' }))
app.use(errorHandler)

async function start() {
  await connectDatabase()
  app.listen(config.port, () => console.log(`Linkora API listening on port ${config.port}`))
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Unable to start Linkora API:', error)
    process.exit(1)
  })
}

module.exports = { app, start }
