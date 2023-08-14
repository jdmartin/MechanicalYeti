require("dotenv").config();
const fs = require('fs');
const http = require("http");
const net = require('net');
const os = require('os');
const path = require('path');

const socketPath = path.join(os.tmpdir(), 'yeti-socket'); // Construct the socket path using os.tmpdir()

class Heartbeat {
    startPushing() {
        function callURL() {
            const url = process.env.MONITOR_URL;

            http.get(url, (response) => {
            }).on('error', (error) => {
                console.error(`Error calling URL: ${error.message}`);
            });

            console.log("Mechanical Yeti Chasing You!");
        }

        callURL();

        // Call the URL every 300 seconds (3 minutes) using the interval timer
        const interval = 298000; // 298 seconds * 1000 milliseconds
        setInterval(callURL, interval);
    }

    startSocket() {
        // Remove the socket file if it exists
        if (fs.existsSync(socketPath)) {
            fs.unlinkSync(socketPath);
        }

        const unixServer = net.createServer(function (client) {
            //console.log('Client connected!');

            // Sending a message to the connected client
            client.write('RAAR!\n');

            // Handling client disconnection
            //client.on('end', function() {
            //    console.log('Client disconnected');
            //});
        });

        // Start listening on the Unix socket
        unixServer.listen(socketPath, function () {
            console.log('Yeti socket started...');
            console.log("Mechanical Yeti Chasing You!");
        });

        // Graceful shutdown
        process.on('SIGINT', function () {
            console.log('Shutting down server...');

            unixServer.close(function () {
                // Remove the socket file after server is closed
                if (fs.existsSync(socketPath)) {
                    fs.unlinkSync(socketPath);
                }
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
}


module.exports = {
    Heartbeat,
};
