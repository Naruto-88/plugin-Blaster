// Raw Node.js HTTP server (no dependencies) to test 503 error
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <div style="font-family: sans-serif; padding: 50px; text-align: center; background: #e8f5e9; border-radius: 10px; margin: 20px; border: 2px solid #2ecc71;">
        <h1 style="color: #2ecc71; font-size: 3em;">✅ NODE.JS IS EXECUTING!</h1>
        <p style="font-size: 1.2em;">The 503 error was likely a dependency (Express) issue.</p>
        <p><strong>Mode:</strong> Raw HTTP Server</p>
        <p><strong>Process ID:</strong> ${process.pid}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
        <hr style="width: 100px; border: 1px solid #c8e6c9; margin: 30px auto;">
        <p style="color: #666;">Time: ${new Date().toLocaleString()}</p>
    </div>
  `);
});

// Passenger passes the port/pipe via process.env.PORT
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server successfully bound to port:', port);
});