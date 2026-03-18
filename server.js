const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 50px; text-align: center;">
            <h1 style="color: #2ecc71;">🚀 Node.js is LIVE!</h1>
            <p>This server is now correctly executing JavaScript.</p>
            <p><strong>Pattern Match:</strong> Express (CRLF)</p>
            <hr style="width: 50px; margin: 20px auto;">
            <p style="color: #7f8c8d;">Time: ${new Date().toLocaleString()}</p>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
