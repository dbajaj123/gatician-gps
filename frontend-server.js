const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080; // Different port for frontend

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend server running at http://localhost:${PORT}`);
    console.log(`📡 Backend API should be running at http://localhost:3001`);
});