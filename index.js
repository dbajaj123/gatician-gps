const net = require('net');

const HOST = '0.0.0.0';
const PORT = 3000; // The port your GPS devices send data to

// A Map to store a data buffer for each connected client
const clientBuffers = new Map();

/**
 * Parses a complete data packet from a GPS device.
 * @param {Buffer} packet The raw buffer of a single, complete packet.
 * @returns {Buffer|null} A buffer to send back as a response, or null if no response is needed.
 */
const parsePacket = (packet) => {
    // The protocol number determines the packet type (Login, GPS, Heartbeat, etc.)
    const protocolNumber = packet.readUInt8(3);
    let response = null;

    switch (protocolNumber) {
        case 0x01: { // Login Packet
            const imei = packet.slice(4, 12).toString('hex');
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
            // No response is typically sent for location packets.
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

    return response;
};


// --- The Main TCP Server Logic ---
const server = net.createServer((socket) => {
    const clientKey = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`✅ Accepted connection from ${clientKey}`);

    // Initialize a buffer for this new client
    clientBuffers.set(clientKey, Buffer.alloc(0));

    socket.on('data', (data) => {
        console.log(`\n<-- Received raw chunk of size ${data.length}: ${data.toString('hex')}`);

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
                const response = parsePacket(completePacket);
                if (response) {
                    socket.write(response);
                    console.log('  --> Sent response:', response.toString('hex'));
                }
                
                // CRUCIAL: Remove the processed packet from the start of the buffer
                buffer = buffer.slice(totalPacketLength);
            } else {
                console.log(`  [-] Incomplete packet. Waiting for more data. Have ${buffer.length}, need ${totalPacketLength}.`);
                break;
            }
        }
        
        // Save the remaining part of the buffer for the next data event
        clientBuffers.set(clientKey, buffer);
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