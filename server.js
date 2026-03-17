// Final production entry point for cPanel
const path = require('path');
process.chdir(__dirname); // Ensure we're in the right root
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Ensure we are in the right directory
process.chdir(__dirname);

const dev = false;
const app = next({ dev, dir: path.join(__dirname, 'apps', 'web') });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
}).catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
