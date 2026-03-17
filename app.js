// Production entry for cPanel/Passenger
// This file MUST be named app.js for some cPanel configurations
const path = require('path')
const express = require('express')
const next = require('next')

const dev = false
// In standalone mode, we point to the build folder
const dir = path.resolve(__dirname)
const app = next({ dev, dir: path.join(dir, 'apps', 'web') })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()
  
  // Handle all requests via Next.js
  server.all('*', (req, res) => {
    return handle(req, res)
  })

  // Start server on the port provided by Passenger/Environment
  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log('Next.js is live on port', port)
  })
}).catch(err => {
  console.error('Entry point error:', err)
  process.exit(1)
})
