// Minimal test server to verify Node.js execution
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Node.js is Working!</h1><p>Environment: ' + process.env.NODE_ENV + '</p>');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Test server running on port', port);
});
