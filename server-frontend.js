const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 8080;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Handle all other routes - send to index.html (for SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Gatician GPS Frontend Server               ║
╚══════════════════════════════════════════════╝

✓ Server running on: http://localhost:${PORT}
✓ Environment: ${process.env.NODE_ENV || 'development'}

📁 Frontend Directory: ${path.join(__dirname, 'frontend')}

Pages available:
  • Login:     http://localhost:${PORT}/
  • Dashboard: http://localhost:${PORT}/dashboard.html

Press Ctrl+C to stop the server
    `);
});

module.exports = app;
