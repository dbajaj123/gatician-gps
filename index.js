const net = require('net');
const express = require('express');

const HOST = '0.0.0.0';
const PORT = 3000; // The port your GPS devices send data to
const HTTP_PORT = 3001; // Port for the HTTP API

// A Map to store a data buffer for each connected client
const clientBuffers = new Map();
// A Map to store last-known device info by IMEI
// Structure: { imei: { imei, latitude, longitude, speed, timestamp } }
const devices = new Map();

/**
 * Parses a complete data packet from a GPS device.
 * @param {Buffer} packet The raw buffer of a single, complete packet.
 * @returns {Buffer|null} A buffer to send back as a response, or null if no response is needed.
 */
// parsePacket now returns an object { response, imei, coords }
const parsePacket = (packet) => {
    // The protocol number determines the packet type (Login, GPS, Heartbeat, etc.)
    const protocolNumber = packet.readUInt8(3);
    let response = null;
    let imei = null;
    let coords = null;

    switch (protocolNumber) {
        case 0x01: { // Login Packet
            imei = packet.slice(4, 12).toString('hex');
            console.log(`[+] Login from IMEI: ${imei}`);

            // A device expects a response to its login request to confirm connection.
            // This is a standard, fixed response for the GT06 protocol.
            response = Buffer.from('787805010001d9dc0d0a', 'hex');
            break;
        }

        case 0x12: { // Location Data Packet
            console.log(`[+] Received GPS Location Data`);
            
            // --- Date and Time ---
            const year = packet.readUInt8(4);
            const month = packet.readUInt8(5);
            const day = packet.readUInt8(6);
            const hours = packet.readUInt8(7);
            const minutes = packet.readUInt8(8);
            const seconds = packet.readUInt8(9);
            // The date is sent in UTC. We create a Date object from it.
            const dateTime = new Date(Date.UTC(2000 + year, month - 1, day, hours, minutes, seconds));

            // --- GPS Information ---
            // The protocol stores coordinates as large integers. We must divide by 1,800,000 to get decimal degrees.
            const latitude = packet.readInt32BE(11) / 1800000;
            const longitude = packet.readInt32BE(15) / 1800000;
            const speed = packet.readUInt8(19);
            const courseStatus = packet.readUInt16BE(20); // Contains course, GPS positioning status, etc.

            console.log(`  [-] Timestamp: ${dateTime.toISOString()}`);
            console.log(`  [-] Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            console.log(`  [-] Speed: ${speed} km/h`);
            console.log(`  [-] Course & Status: ${courseStatus}`);
            // Try to extract IMEI if embedded in packet (some devices include it)
            try {
                // Some GT06 variants include IMEI in preceding login or in additional bytes; we don't assume it's here.
            } catch (e) {
                // ignore
            }

            // Populate coords object to let caller store it if IMEI is known from session
            coords = { latitude, longitude, speed, timestamp: dateTime.toISOString() };
            break;
        }

        case 0x13: { // Heartbeat Packet
            const terminalInfo = packet.readUInt8(4);
            console.log(`[+] Received Heartbeat. Status Byte: 0x${terminalInfo.toString(16)}`);
            
            // The device expects a response to its heartbeat. We must include its original serial number.
            const serial = packet.readUInt16BE(packet.length - 6);
            const baseResponse = `78780513${serial.toString(16).padStart(4, '0')}`;
            // We use a placeholder CRC (0000) as most devices don't validate it, but the field is required.
            response = Buffer.from(baseResponse + "00000d0a", 'hex');
            break;
        }

        default:
            console.log(`[!] Unhandled protocol number: 0x${protocolNumber.toString(16)}`);
    }

    return { response, imei, coords };
};


// --- The Main TCP Server Logic ---
const server = net.createServer((socket) => {
    const clientKey = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`✅ Accepted connection from ${clientKey}`);

    // Initialize a buffer for this new client
    clientBuffers.set(clientKey, Buffer.alloc(0));

    socket.on('data', (data) => {
        console.log(`\n<-- Received raw chunk of size ${data.length}: ${data.toString('hex')}`);

        // Check if this looks like an HTTP request
        const dataStr = data.toString('ascii', 0, Math.min(data.length, 16));
        if (dataStr.startsWith('GET ') || dataStr.startsWith('POST ') || dataStr.startsWith('PUT ') || dataStr.startsWith('DELETE ')) {
            console.log('  [!] HTTP request detected on GPS TCP port. Sending redirect response.');
            const httpResponse = `HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nThis is a GPS tracker TCP server. For HTTP API, use port ${HTTP_PORT}\r\nTry: http://localhost:${HTTP_PORT}/coordinates\r\n`;
            socket.write(httpResponse);
            socket.end();
            return;
        }

        let buffer = clientBuffers.get(clientKey);
        buffer = Buffer.concat([buffer, data]);

        // This loop ensures we process all complete packets in a single data chunk
        while (buffer.length >= 4) {
              const startIndex = buffer.indexOf('7878', 0, 'hex');
            if (startIndex === -1) {
                console.log('  [!] No valid start bits found. Clearing buffer.');
                buffer = Buffer.alloc(0);
                break;
            }

            if (startIndex > 0) {
                 console.log(`  [!] Discarding ${startIndex} bytes of invalid data from buffer start.`);
                 buffer = buffer.slice(startIndex);
            }

            if (buffer.length < 4) {
                break; // Not enough data to read the packet length field
            }
            
            // Packet Length is the 3rd byte, indicating length from Protocol Number to CRC
            const packetLength = buffer.readUInt8(2);
            // Total length is the payload length + 5 fixed bytes (Start, Length, CRC, End)
            const totalPacketLength = packetLength + 5;

            if (buffer.length >= totalPacketLength) {
                const completePacket = buffer.slice(0, totalPacketLength);
                
                console.log('  [+] Found complete packet:', completePacket.toString('hex'));
                const { response, imei, coords } = parsePacket(completePacket);
                if (response) {
                    socket.write(response);
                    console.log('  --> Sent response:', response.toString('hex'));
                }

                // If we got an IMEI from a login packet, store it in the clientBuffers map for this session
                if (imei) {
                    const meta = { imei };
                    clientBuffers.set(clientKey, { buffer: Buffer.alloc(0), meta });
                    devices.set(imei, { imei, lastSeen: new Date().toISOString() });
                }

                // If we received coordinates, try to associate them with the IMEI from session meta
                if (coords) {
                    const existing = clientBuffers.get(clientKey);
                    const sessionMeta = existing && existing.meta;
                    const sessionImei = sessionMeta && sessionMeta.imei;
                    if (sessionImei) {
                        devices.set(sessionImei, { imei: sessionImei, ...coords });
                        console.log(`  [*] Stored coords for IMEI ${sessionImei}`);
                    } else {
                        // If no session IMEI, optionally log and ignore. We could try to extract IMEI from packet but not implemented.
                        console.log('  [!] Received coords but no IMEI associated with this session. Ignoring storage.');
                    }
                }
                
                // CRUCIAL: Remove the processed packet from the start of the buffer
                buffer = buffer.slice(totalPacketLength);
            } else {
                console.log(`  [-] Incomplete packet. Waiting for more data. Have ${buffer.length}, need ${totalPacketLength}.`);
                break;
            }
        }
        
        // Save the remaining part of the buffer for the next data event
        // If this client has session meta object, preserve it.
        const existing = clientBuffers.get(clientKey);
        if (existing && existing.meta) {
            clientBuffers.set(clientKey, { buffer, meta: existing.meta });
        } else {
            clientBuffers.set(clientKey, buffer);
        }
    });

    socket.on('close', () => {
        console.log(`❌ Connection closed from ${clientKey}`);
        clientBuffers.delete(clientKey); // Clean up memory
    });

    socket.on('error', (err) => {
        console.error(`Socket Error from ${clientKey}:`, err.message);
        clientBuffers.delete(clientKey); // Clean up memory
    });
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 TCP Server for GPS Trackers listening on ${HOST}:${PORT}`);
});

// --- Simple HTTP API to read current coordinates ---
const app = express();

// Serve static files from frontend directory
app.use(express.static('frontend'));

// Return all devices with last-known positions
app.get('/coordinates', (req, res) => {
    const all = Array.from(devices.values());
    res.json(all);
});

// Return last-known position for a specific IMEI
app.get('/coordinates/:imei', (req, res) => {
    const imei = req.params.imei;
    if (!devices.has(imei)) {
        return res.status(404).json({ error: 'IMEI not found' });
    }
    res.json(devices.get(imei));
});

app.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP API listening on http://localhost:${HTTP_PORT}`);
});