const http = require('http');
const fs = require('fs');
const cors = require('cors'); // Add this line to require the cors module

function readGPIOStatesFromCSV(callback) {
    fs.readFile('gpios_state.csv', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading GPIO states from CSV:', err);
            callback(err, null);
            return;
        }
        // Process the data to extract GPIO states
        const gpioStates = data.trim().split('\n');
        const states = {};
        gpioStates.forEach(gpioState => {
            const [pinNumber, state] = gpioState.split(',');
            states[pinNumber] = state.trim(); // Store GPIO state in an object
        });
        callback(null, states);
    });
}

const server = http.createServer((req, res) => {
    // Enable CORS for all routes
    cors()(req, res, () => {
        if (req.url === '/gpioStates' && req.method === 'GET') {
            readGPIOStatesFromCSV((err, states) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(states)); // Send GPIO states as JSON response
            });
        } else if (req.url.startsWith('/gpioStates/') && req.method === 'GET') {
            // Extract the pin number from the URL
            const pin = req.url.split('/')[2];
            // Corrected function call to readGPIOStatesFromCSV
            readGPIOStatesFromCSV((err, states) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                    return;
                }
                const state = states[pin];
                if (state === undefined) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ pin, state })); // Send GPIO state as JSON response
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
