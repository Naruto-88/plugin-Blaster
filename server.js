const path = require('path');
const fs = require('fs');

try {
  // Ensure we are in the correct directory for Next.js standalone
  process.chdir(path.join(__dirname, 'apps/web'));
  
  // Start the Next.js standalone server
  require('./server.js');
} catch (err) {
  // Log startup errors for debugging
  fs.writeFileSync(path.join(__dirname, 'debug_error.txt'), err.stack);
  console.error('Failed to start server:', err);
}