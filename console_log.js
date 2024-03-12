const express = require('express');
const fs = require('fs');
const cors = require('cors');

const consoleLogFile = 'console_messages.csv';
const app = express();

// Enable CORS middleware
app.use(cors());

// Function to read console messages from CSV file
function readConsoleMessagesFromCSV(callback) {
    fs.readFile(consoleLogFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading console messages from CSV:', err);
            callback(err, null);
            return;
        }
        // Split the CSV data into lines
        const lines = data.trim().split('\n');
        // Parse each line to extract date, time, and message
        const messages = lines.map(line => {
            const [dateTime, time, message] = line.split(/[,;]/); // Split by comma or semicolon
            return { dateTime, time, message };
        });
        callback(null, messages);
    });
}

// Endpoint to retrieve console messages
app.get('/consoleMessages', (req, res) => {
    readConsoleMessagesFromCSV((err, messages) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.status(200).json(messages);
    });
});

// Endpoint to retrieve console messages filtered by GPIO ID
app.get('/consoleMessages/:gpioID', (req, res) => {
    const gpioID = req.params.gpioID;
    readConsoleMessagesFromCSV((err, messages) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        const filteredMessages = messages.filter(message => message.message.includes(`GPIO ${gpioID}`));
        res.status(200).json(filteredMessages);
    });
});

// Start the server
const port = 8082;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
