const net = require('net');

const HOST = '0.0.0.0';
const PORT = 3000; // The port your GPS devices are configured to send data to

// A simple in-memory store for client buffers
const clientBuffers = new Map();

// The main function to parse a complete packet buffer
const parsePacket = (packet) => {
    const protocolNumber = packet.readUInt8(3);
    let response;

    switch (protocolNumber) {
        case 0x01: { // Login Packet
            const imei = packet.slice(4, 12).toString('hex');
            console.log(`[+] Login from IMEI: ${imei}`);
            // Prepare the server's response to the login request
            response = Buffer.from('787805010001d9dc0d0a', 'hex'); // A standard login response
            break;
        }
        case 0x12: { // Location Data Packet (GPS)
            console.log(`[+] Received Location Data Packet`);
            // NOTE: Parsing logic below is a common representation.
            // You may need to adjust based on your device's specific GT06 variant.
            const year = packet.readUInt8(4);
            const month = packet.readUInt8(5);
            const day = packet.readUInt8(6);
            const hours = packet.readUInt8(7);
            const minutes = packet.readUInt8(8);
            const seconds = packet.readUInt8(9);
            const dateTime = new Date(Date.UTC(2000 + year, month - 1, day, hours, minutes, seconds));

            const lat = packet.readUInt32BE(11);
            const lon = packet.readUInt32BE(15);
            const speed = packet.readUInt8(19);
            const course = packet.readUInt16BE(20);

            console.log(`  [-] Timestamp: ${dateTime.toISOString()}`);
            console.log(`  [-] Coordinates: ${lat / 1800000}, ${lon / 1800000}`);
            console.log(`  [-] Speed: ${speed} km/h`);
            break;
        }
        case 0x13: { // Heartbeat Packet
            const terminalInfo = packet.readUInt8(4);
            console.log(`[+] Received Heartbeat. Status: 0x${terminalInfo.toString(16)}`);
            // Prepare the server's response to the heartbeat
            const serial = packet.readUInt16BE(packet.length - 6);
            response = Buffer.from('78780513' + serial.toString(16).padStart(4, '0') + 'XXXX0d0a', 'hex'); // CRC needs calculation, but often trackers don't check it
            break;
        }
        case 0x16: { // Alarm Packet (LBS extension data)
             console.log('[+] Received Alarm/LBS Packet. Skipping detailed parse.');
             break;
        }
        default:
            console.log(`[!] Unhandled protocol number: 0x${protocolNumber.toString(16)}`);
    }

    if (response) {
        return response;
    }
    return null;
};

const server = net.createServer((socket) => {
    const clientKey = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`✅ Accepted connection from ${clientKey}`);
    
    // Initialize a buffer for this new client
    clientBuffers.set(clientKey, Buffer.alloc(0));

    socket.on('data', (data) => {
        console.log(`\n<-- Received raw chunk of size ${data.length}: ${data.toString('hex')}`);
        
        // Get the existing buffer and append the new data
        let buffer = clientBuffers.get(clientKey);
        buffer = Buffer.concat([buffer, data]);

        // Loop as long as there might be a full packet in the buffer
        while (buffer.length >= 4) { // Minimum possible packet size
            // Find the start of the next valid packet ('7878')
            const startIndex = buffer.indexOf('7878', 0, 'hex');
            if (startIndex === -1) {
                // No start bits found, discard the buffer and wait for new data
                console.log('  [!] No valid start bits found. Clearing buffer.');
                buffer = Buffer.alloc(0);
                break;
            }

            // If there's garbage data before the start bits, discard it
            if (startIndex > 0) {
                 console.log(`  [!] Discarding ${startIndex} bytes of garbage data.`);
                 buffer = buffer.slice(startIndex);
            }

            // Check for minimum length to read the packet length field
            if (buffer.length < 4) {
                break; // Not enough data to determine packet length, wait for more
            }
            
            const packetLength = buffer.readUInt8(2);
            const totalPacketLength = packetLength + 5; // Start(2) + Length(1) + ... + End(2)

            if (buffer.length >= totalPacketLength) {
                const completePacket = buffer.slice(0, totalPacketLength);
                
                console.log('  [+] Found complete packet:', completePacket.toString('hex'));
                const response = parsePacket(completePacket);
                if (response) {
                    socket.write(response);
                    console.log('  --> Sent response:', response.toString('hex'));
                }
                
                // CRUCIAL: Remove the processed packet from the buffer
                buffer = buffer.slice(totalPacketLength);
            } else {
                // We have a start bit but not the full packet yet.
                // Break the loop and wait for more data to arrive.
                console.log(`  [-] Incomplete packet. Waiting for more data. Have ${buffer.length}, need ${totalPacketLength}.`);
                break;
            }
        }
        
        // Store the remaining part of the buffer
        clientBuffers.set(clientKey, buffer);
    });

    socket.on('close', () => {
        console.log(`❌ Connection closed from ${clientKey}`);
        clientBuffers.delete(clientKey); // Clean up the buffer
    });

    socket.on('error', (err) => {
        console.error(`Socket Error from ${clientKey}:`, err);
        clientBuffers.delete(clientKey); // Clean up the buffer
    });
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 TCP Server for GPS Trackers listening on ${HOST}:${PORT}`);
});