// Production entry for cPanel/Passenger
// Serves the Next.js app located in apps/web
const path = require('path')
const express = require('express')
const next = require('next')

const dev = false
const dir = path.join(__dirname, 'apps', 'web')
const app = next({ dev, dir })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3000

app
  .prepare()
  .then(() => {
    const server = express()
    // Simple process health endpoint (useful for uptime checks)
    server.get('/healthz', (_req, res) => res.status(200).send('ok'))

    server.all('*', (req, res) => handle(req, res))
    server.listen(port, () => {
      console.log(`Next.js (apps/web) listening on :${port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })

