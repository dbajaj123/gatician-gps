const net = require('net');
const logger = require('../config/logger');
const config = require('../config/environment');
const gpsParser = require('../utils/gpsParser');
const { Device, Location } = require('../models');

class GPSTCPServer {
  constructor() {
    this.server = null;
    this.clients = new Map(); // Store client connections and buffers
  }

  /**
   * Start the TCP server
   */
  start() {
    this.server = net.createServer((socket) => this.handleConnection(socket));

    this.server.listen(config.tcpPort, config.gps.host, () => {
      logger.info(`🚀 GPS TCP Server listening on ${config.gps.host}:${config.tcpPort}`);
    });

    this.server.on('error', (error) => {
      logger.error('GPS TCP Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.tcpPort} is already in use`);
        process.exit(1);
      }
    });

    return this.server;
  }

  /**
   * Handle new client connection
   */
  handleConnection(socket) {
    const clientKey = `${socket.remoteAddress}:${socket.remotePort}`;
    
    logger.info(`✅ GPS device connected: ${clientKey}`);

    // Initialize client data
    this.clients.set(clientKey, {
      buffer: Buffer.alloc(0),
      imei: null,
      lastActivity: Date.now(),
      socket,
    });

    // Set socket timeout (5 minutes of inactivity)
    socket.setTimeout(5 * 60 * 1000);

    socket.on('data', (data) => this.handleData(clientKey, data));
    socket.on('close', () => this.handleClose(clientKey));
    socket.on('error', (error) => this.handleError(clientKey, error));
    socket.on('timeout', () => this.handleTimeout(clientKey));
  }

  /**
   * Handle incoming data from GPS device
   */
  async handleData(clientKey, data) {
    try {
      const client = this.clients.get(clientKey);
      if (!client) return;

      // Update last activity
      client.lastActivity = Date.now();

      // Check for HTTP requests on TCP port
      const dataStr = data.toString('ascii', 0, Math.min(data.length, 16));
      if (this.isHttpRequest(dataStr)) {
        logger.warn(`HTTP request detected on GPS TCP port from ${clientKey}`);
        this.sendHttpRedirect(client.socket);
        client.socket.end();
        return;
      }

      // Append data to buffer
      client.buffer = Buffer.concat([client.buffer, data]);

      // Extract and process complete packets
      const { packets, remainingBuffer } = gpsParser.extractPackets(client.buffer);
      client.buffer = remainingBuffer;

      // Process each packet
      for (const packet of packets) {
        await this.processPacket(clientKey, packet);
      }

      // Prevent buffer overflow
      if (client.buffer.length > 10000) {
        logger.warn(`Buffer overflow for ${clientKey}. Clearing buffer.`);
        client.buffer = Buffer.alloc(0);
      }
    } catch (error) {
      logger.error(`Error handling data from ${clientKey}:`, error);
    }
  }

  /**
   * Process a complete GPS packet
   */
  async processPacket(clientKey, packet) {
    try {
      const client = this.clients.get(clientKey);
      if (!client) return;

      const { response, data } = gpsParser.parsePacket(packet);

      // Send response if required
      if (response) {
        client.socket.write(response);
        logger.debug(`Sent response to ${clientKey}: ${response.toString('hex')}`);
      }

      // Process packet data
      if (data) {
        await this.handlePacketData(clientKey, data);
      }
    } catch (error) {
      logger.error(`Error processing packet for ${clientKey}:`, error);
    }
  }

  /**
   * Handle parsed packet data
   */
  async handlePacketData(clientKey, data) {
    const client = this.clients.get(clientKey);
    if (!client) return;

    try {
      switch (data.type) {
        case 'login':
          await this.handleLogin(clientKey, data.imei);
          break;

        case 'location':
          await this.handleLocation(clientKey, data);
          break;

        case 'heartbeat':
          logger.debug(`Heartbeat from ${clientKey}`);
          await this.updateDeviceConnection(client.imei);
          break;

        case 'alarm':
          logger.warn(`Alarm received from ${clientKey}: Type ${data.alarmType}`);
          break;

        default:
          logger.debug(`Unhandled packet type: ${data.type}`);
      }
    } catch (error) {
      logger.error(`Error handling packet data for ${clientKey}:`, error);
    }
  }

  /**
   * Handle device login
   */
  async handleLogin(clientKey, imei) {
    const client = this.clients.get(clientKey);
    if (!client) return;

    logger.info(`Device logged in: IMEI ${imei}`);
    client.imei = imei;

    try {
      // Find or create device
      let device = await Device.findOne({ imei });
      
      if (!device) {
        device = new Device({
          imei,
          name: `Device ${imei.substring(0, 8)}`,
          isActive: true,
        });
        await device.save();
        logger.info(`New device registered: ${imei}`);
      }

      // Update connection status
      device.lastConnection = new Date();
      device.connectionStatus = 'online';
      await device.save();
    } catch (error) {
      logger.error(`Error handling login for IMEI ${imei}:`, error);
    }
  }

  /**
   * Handle location data
   */
  async handleLocation(clientKey, locationData) {
    const client = this.clients.get(clientKey);
    if (!client || !client.imei) {
      logger.warn(`Received location data but no IMEI associated with ${clientKey}`);
      return;
    }

    try {
      // Validate coordinates
      if (!this.isValidCoordinate(locationData.latitude, locationData.longitude)) {
        logger.warn(`Invalid coordinates from ${client.imei}: ${locationData.latitude}, ${locationData.longitude}`);
        return;
      }

      // Save location to database
      const location = new Location({
        imei: client.imei,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed || 0,
        course: locationData.course,
        timestamp: locationData.timestamp,
        gpsStatus: locationData.gpsStatus || 'unknown',
      });

      await location.save();
      
      logger.info(`Location saved for ${client.imei}: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`);

      // Update device connection
      await this.updateDeviceConnection(client.imei);
    } catch (error) {
      logger.error(`Error saving location for ${client.imei}:`, error);
    }
  }

  /**
   * Update device connection status
   */
  async updateDeviceConnection(imei) {
    if (!imei) return;

    try {
      await Device.findOneAndUpdate(
        { imei },
        {
          lastConnection: new Date(),
          connectionStatus: 'online',
        }
      );
    } catch (error) {
      logger.error(`Error updating device connection for ${imei}:`, error);
    }
  }

  /**
   * Validate coordinates
   */
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !(latitude === 0 && longitude === 0) // Reject null island
    );
  }

  /**
   * Check if data is an HTTP request
   */
  isHttpRequest(dataStr) {
    return (
      dataStr.startsWith('GET ') ||
      dataStr.startsWith('POST ') ||
      dataStr.startsWith('PUT ') ||
      dataStr.startsWith('DELETE ') ||
      dataStr.startsWith('HEAD ')
    );
  }

  /**
   * Send HTTP redirect response
   */
  sendHttpRedirect(socket) {
    const response = `HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nThis is a GPS tracker TCP server. For HTTP API, use port ${config.port}\r\n`;
    socket.write(response);
  }

  /**
   * Handle client disconnection
   */
  handleClose(clientKey) {
    const client = this.clients.get(clientKey);
    
    logger.info(`❌ GPS device disconnected: ${clientKey}`);

    // Update device status
    if (client && client.imei) {
      Device.findOneAndUpdate(
        { imei: client.imei },
        { connectionStatus: 'offline' }
      ).catch((error) => {
        logger.error(`Error updating device status for ${client.imei}:`, error);
      });
    }

    this.clients.delete(clientKey);
  }

  /**
   * Handle socket errors
   */
  handleError(clientKey, error) {
    logger.error(`Socket error for ${clientKey}:`, error.message);
    const client = this.clients.get(clientKey);
    if (client && client.socket) {
      client.socket.destroy();
    }
    this.clients.delete(clientKey);
  }

  /**
   * Handle socket timeout
   */
  handleTimeout(clientKey) {
    logger.warn(`Socket timeout for ${clientKey}`);
    const client = this.clients.get(clientKey);
    if (client && client.socket) {
      client.socket.end();
    }
  }

  /**
   * Get connected devices count
   */
  getConnectedDevicesCount() {
    return this.clients.size;
  }

  /**
   * Get connected devices info
   */
  getConnectedDevices() {
    const devices = [];
    
    for (const [clientKey, client] of this.clients.entries()) {
      devices.push({
        clientKey,
        imei: client.imei,
        lastActivity: new Date(client.lastActivity),
        connected: true,
      });
    }
    
    return devices;
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      // Close all client connections
      for (const [clientKey, client] of this.clients.entries()) {
        if (client.socket) {
          client.socket.end();
        }
      }
      this.clients.clear();

      // Close server
      this.server.close(() => {
        logger.info('GPS TCP Server stopped');
      });
    }
  }
}

module.exports = new GPSTCPServer();
