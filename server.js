// DIAGNOSTIC ID: [SERVER_EXECUTION_CHECK_001]
// If you see this text in your browser window, Node.js is NOT running.
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h1>Node.js Execution Success!</h1>
    <p>If you see this, the server is correctly running Node.js.</p>
    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'not set'}</p>
    <p><strong>Port:</strong> ${process.env.PORT || '3000'}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  `);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Test server running on port', port);
});
