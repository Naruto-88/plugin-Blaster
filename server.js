const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
  res.send(`
    <h1>Node.js is Working (Express)</h1>
    <p>This matches the pattern of your working site.</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
