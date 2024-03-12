const http = require('http');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Gpio } = require('onoff');

const gpioStatesFile = 'gpios_state.csv';

// Function to initialize CSV file with GPIO states or read existing states from the file

function initializeOrReadCSVFile() {
    if (fs.existsSync(gpioStatesFile)) {
        const data = fs.readFileSync(gpioStatesFile, 'utf8');
        const lines = data.split('\n');
        lines.forEach(line => {
            const [pin, pinState] = line.trim().split(',');
            console.log(`Pin ${pin} has a state of ${pinState}`);
            if (pinState === 'ON') {
                console.log(`Activating pin ${pin}`);
                sendPOSTRequest(`/toggle-gpio/${pin}/ON`);
            }
        });
        console.log('GPIO states read from CSV file.');
    } else {
        console.log('CSV file not found.');
    }
}


// Function to send a POST request

function sendPOSTRequest(endpoint) {
    const options = {
        hostname: 'localhost', // Change this to your server's hostname or IP address
        port: 8080, // Change this to your server's port
        path: endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Request to ${endpoint} sent`);
    });

    req.on('error', (error) => {
        console.error(`Error sending request to ${endpoint}:`, error);
    });

    req.end();
}


// Define GPIO pins

const gpioPins = [
    { number: 5, state: null },
    { number: 6, state: null },
    { number: 12, state: null },
    { number: 13, state: null },
    { number: 16, state: null },
    { number: 17, state: null },
    { number: 18, state: null },
    { number: 19, state: null },
    { number: 20, state: null },
    { number: 21, state: null },
    { number: 22, state: null },
    { number: 23, state: null },
    { number: 24, state: null },
    { number: 25, state: null },
    { number: 26, state: null },
    { number: 27, state: null }
];


// Initialize CSV file with GPIO states or read existing states from the file

initializeOrReadCSVFile();

// Create Gpio instances for each GPIO pin

const gpioInstances = gpioPins.map(pin => new Gpio(pin.number, 'out'));


// Function to write GPIO state to CSV file

function writeGPIOStateToCSV(pinNumber, newState) {
    const pinIndex = gpioPins.findIndex(pin => pin.number === pinNumber);
    if (pinIndex !== -1) {
        gpioPins[pinIndex].state = newState;
        const csvData = gpioPins.map(({ number, state }) => `${number},${state}`).join('\n');
        fs.writeFile(gpioStatesFile, csvData, (err) => {
            if (err) {
                console.error('Error writing GPIO state to CSV:', err);
            } else {
                console.log(`GPIO ${pinNumber} state updated to ${newState}`);
                const message = `GPIO ${pinNumber} state updated to ${newState}`;
                logConsoleMessageToCSV(message); // Call logConsoleMessageToCSV with the appropriate message
            }
        });
    }
}

const consoleLogFile = 'console_messages.csv';

// Function to log console message to CSV file

function logConsoleMessageToCSV(message) {
    // Get current date and time
    const dateTime = new Date().toLocaleString();

    // Construct CSV data with date, time, and console message
    const csvData = `${dateTime},${message}\n`;

    // Append the CSV data to the file
    fs.appendFile(consoleLogFile, csvData, (err) => {
        if (err) {
            console.error('Error writing console log to CSV:', err);
        } else {
            console.log(`Console log saved to ${consoleLogFile}`);
        }
    });
}


// Create server

const server = http.createServer((req, res) => {
    // Handle GPIO pin interrupts
    gpioInstances.forEach((gpio, index) => {
        gpio.watch((err, value) => {
            if (err) {
                console.error('GPIO watch error:', err);
            } else {
                const pinNumber = gpioPins[index].number;
                const state = value === 1 ? 'HIGH' : 'LOW';
                writeGPIOStateToCSV(pinNumber, state);
            }
        });
    });

// Handle POST requests to toggle GPIO pins on or off

    if (req.method === 'POST' && req.url.startsWith('/toggle-gpio')) {
        const [_, __, pin, state] = req.url.split('/'); // Extract pin number and state from URL
        const pinNumber = parseInt(pin);
        const gpioIndex = gpioPins.findIndex(pin => pin.number === pinNumber);
        if (gpioIndex !== -1) {
            const gpioInstance = gpioInstances[gpioIndex];
            if (state.toUpperCase() === 'ON' || state.toUpperCase() === 'OFF') {
                const newState = state.toUpperCase() === 'ON' ? 1 : 0;
                gpioInstance.writeSync(newState);
                writeGPIOStateToCSV(pinNumber, state.toUpperCase());
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(`GPIO ${pinNumber} turned ${state.toUpperCase()}`);
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid GPIO state');
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('GPIO not found');
        }
    } 

// Serve index.html
    
     else if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                console.error('Error loading index.html:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } 

// Serve dacian.html

else if (req.url === '/' || req.url === '/dacian.html') {
    fs.readFile(path.join(__dirname, 'dacian.html'), (err, data) => {
        if (err) {
            console.error('Error loading dacian.html:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
} 


// Serve styles.css

    else if (req.url === '/styles.css') {
        fs.readFile(path.join(__dirname, 'styles.css'), (err, data) => {
            if (err) {
                console.error('Error loading styles.css:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            }
        });
    }

// Serve Bootstrap CSS

else if (req.url === '/bootstrap.min.css') {
    fs.readFile(path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'), (err, data) => {
        if (err) {
            console.error('Error loading Bootstrap CSS:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        }
    });
}

// Serve Bootstrap JavaScript

else if (req.url === '/bootstrap.bundle.min.js') {
    fs.readFile(path.join(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'), (err, data) => {
        if (err) {
            console.error('Error loading Bootstrap JavaScript:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(data);
        }
    });
}


// Handle 404 Not Found

    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Console.log OUT

server.listen(8080, () => {
    console.log('Server running at http://192.168.1.10:8080/');
});
