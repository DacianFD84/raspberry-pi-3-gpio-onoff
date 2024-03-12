const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath;

    // Serve files from the 'imgs' folder
    if (req.url.startsWith('/imgs/')) {
        filePath = path.join(__dirname, 'imgs', req.url.replace(/^\/imgs\//, ''));
    } else if (req.url.startsWith('/docs/')) {
        filePath = path.join(__dirname, 'docs', req.url.replace(/^\/docs\//, ''));
    } else {
        // Handle other requests
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
    }

    // Serve files from the 'imgs' or 'docs' folder
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error loading file ${req.url}:`, err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        } else {
            // Determine content type based on file extension
            const contentType = getContentType(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

// Function to determine content type based on file extension
function getContentType(filePath) {
    const ext = path.extname(filePath);
    switch (ext.toLowerCase()) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.pdf':
            return 'application/pdf';
        case '.txt':
            return 'application/txt';
        default:
            return 'application/octet-stream';
    }
}

const PORT = 8081; // Change to port 8081
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
