const express = require('express');
const app = express();

// Middleware to parse raw text body for any content type
// This helps in capturing various body types like JSON, XML, plain text, etc.
app.use(express.text({ type: '*/*' }));

// A catch-all route that handles all paths and all HTTP methods
app.all('*', (req, res) => {
    console.log("--- New Request Received ---");

    // Log basic information
    // Note: 'x-forwarded-for' header is used by proxies like Google's to show the original client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`IP Address: ${ip}`);
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.originalUrl}`);

    // Log headers
    console.log("\n[ Headers ]");
    for (const [header, value] of Object.entries(req.headers)) {
        console.log(`${header}: ${value}`);
    }

    // Log the raw body
    if (req.body) {
        console.log("\n[ Body ]");
        // req.body will be a string because of the express.text() middleware
        console.log(req.body);
    }

    console.log("--- End of Request ---\n");

    // Send a response to the client
    res.status(200).send("Request received and logged.");
});

// The server listens on the port defined by the PORT environment variable,
// which is standard for cloud environments, or defaults to 8080.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});