const path = require('path')
const express = require('express')
const cors = require('cors')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()

const PORT = process.env.PORT || 4000
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:4200'

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    exposedHeaders: ['Content-Disposition', 'X-Encrypted'],
  })
)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/files', require('./routes/files'))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})


