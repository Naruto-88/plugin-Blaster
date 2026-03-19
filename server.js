const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('*', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 50px; text-align: center; background: #e3f2fd; border-radius: 12px; margin: 40px; border: 2px solid #2196f3; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #1976d2; font-size: 2.5em; margin-bottom: 10px;">🚀 FINAL DEPLOYMENT TEST SUCCESS!</h1>
            <p style="font-size: 1.2em; color: #555;">The server is now correctly executing <strong>server.js</strong> using <strong>Express</strong> via Phusion Passenger/LiteSpeed.</p>
            <p style="background: #fff; display: inline-block; padding: 10px 20px; border-radius: 5px; color: #1976d2; font-weight: bold;">Root Directory: /home/divihdst/ns-app</p>
            <hr style="width: 60px; border: 1px solid #bbdefb; margin: 30px auto;">
            <p style="color: #90a4ae;">Updated Sync Time: ${new Date().toLocaleString()}</p>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Express server running for ns-app on port ${PORT}`);
});