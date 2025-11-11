const logger = require('../config/logger');
const config = require('../config/environment');

/**
 * GPS Protocol Parser for GT06 devices
 */
class GPSProtocolParser {
  constructor() {
    this.startMarker = Buffer.from('7878', 'hex');
    this.endMarker = Buffer.from('0d0a', 'hex');
    this.protocolTypes = {
      LOGIN: 0x01,
      LOCATION: 0x12,
      HEARTBEAT: 0x13,
      ALARM: 0x16,
      GPS_LBS: 0x22,
    };
  }

  /**
   * Parse a complete GPS packet
   */
  parsePacket(packet) {
    try {
      // Validate packet structure
      if (!this.isValidPacket(packet)) {
        logger.warn('Invalid packet structure received');
        return { response: null, data: null };
      }

      const protocolNumber = packet.readUInt8(3);
      
      switch (protocolNumber) {
        case this.protocolTypes.LOGIN:
          return this.parseLoginPacket(packet);
        case this.protocolTypes.LOCATION:
          return this.parseLocationPacket(packet);
        case this.protocolTypes.HEARTBEAT:
          return this.parseHeartbeatPacket(packet);
        case this.protocolTypes.ALARM:
          return this.parseAlarmPacket(packet);
        default:
          logger.warn(`Unhandled protocol number: 0x${protocolNumber.toString(16)}`);
          return { response: null, data: null };
      }
    } catch (error) {
      logger.error('Error parsing GPS packet:', error);
      return { response: null, data: null };
    }
  }

  /**
   * Validate packet structure
   */
  isValidPacket(packet) {
    if (packet.length < 10) return false;
    
    // Check start marker
    const startMarker = packet.slice(0, 2);
    if (!startMarker.equals(this.startMarker)) return false;
    
    // Check end marker
    const endMarker = packet.slice(-2);
    if (!endMarker.equals(this.endMarker)) return false;
    
    // Check packet length
    const declaredLength = packet.readUInt8(2);
    const actualLength = packet.length - 5; // Excluding start, length, and end markers
    
    return declaredLength === actualLength;
  }

  /**
   * Parse login packet (0x01)
   */
  parseLoginPacket(packet) {
    const imei = packet.slice(4, 12).toString('hex');
    logger.info(`[GPS] Login from IMEI: ${imei}`);

    // Standard login response for GT06
    const response = Buffer.from('787805010001d9dc0d0a', 'hex');

    return {
      response,
      data: {
        type: 'login',
        imei,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Parse location packet (0x12)
   */
  parseLocationPacket(packet) {
    try {
      // Extract date and time
      const year = packet.readUInt8(4);
      const month = packet.readUInt8(5);
      const day = packet.readUInt8(6);
      const hours = packet.readUInt8(7);
      const minutes = packet.readUInt8(8);
      const seconds = packet.readUInt8(9);
      
      const timestamp = new Date(Date.UTC(
        2000 + year,
        month - 1,
        day,
        hours,
        minutes,
        seconds
      ));

      // Extract GPS coordinates
      const latitude = packet.readInt32BE(11) / config.gps.coordinateDivisor;
      const longitude = packet.readInt32BE(15) / config.gps.coordinateDivisor;
      const speed = packet.readUInt8(19);
      const courseStatus = packet.readUInt16BE(20);
      
      // Extract course and GPS status from courseStatus
      const course = courseStatus & 0x3FF; // Lower 10 bits
      const gpsStatus = (courseStatus & 0x1000) ? 'valid' : 'invalid'; // Bit 12

      logger.info(`[GPS] Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Speed: ${speed} km/h`);

      return {
        response: null, // Location packets typically don't require a response
        data: {
          type: 'location',
          latitude,
          longitude,
          speed,
          course,
          timestamp,
          gpsStatus,
        },
      };
    } catch (error) {
      logger.error('Error parsing location packet:', error);
      return { response: null, data: null };
    }
  }

  /**
   * Parse heartbeat packet (0x13)
   */
  parseHeartbeatPacket(packet) {
    const terminalInfo = packet.readUInt8(4);
    const serial = packet.readUInt16BE(packet.length - 6);
    
    logger.debug(`[GPS] Heartbeat received. Status: 0x${terminalInfo.toString(16)}`);

    // Generate heartbeat response with original serial number
    const baseResponse = `78780513${serial.toString(16).padStart(4, '0')}`;
    const response = Buffer.from(baseResponse + '00000d0a', 'hex');

    return {
      response,
      data: {
        type: 'heartbeat',
        status: terminalInfo,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Parse alarm packet (0x16)
   */
  parseAlarmPacket(packet) {
    logger.info('[GPS] Alarm packet received');
    
    // Parse similar to location but with alarm type
    const alarmType = packet.readUInt8(4);
    
    return {
      response: null,
      data: {
        type: 'alarm',
        alarmType,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Find complete packets in buffer
   */
  extractPackets(buffer) {
    const packets = [];
    let offset = 0;

    while (offset < buffer.length) {
      // Find start marker
      const startIndex = buffer.indexOf(this.startMarker, offset);
      if (startIndex === -1) break;

      // Check if we have enough data to read packet length
      if (startIndex + 3 > buffer.length) break;

      const packetLength = buffer.readUInt8(startIndex + 2);
      const totalPacketLength = packetLength + 5; // Including markers

      // Check if we have the complete packet
      if (startIndex + totalPacketLength > buffer.length) break;

      const packet = buffer.slice(startIndex, startIndex + totalPacketLength);
      packets.push(packet);
      offset = startIndex + totalPacketLength;
    }

    return {
      packets,
      remainingBuffer: offset < buffer.length ? buffer.slice(offset) : Buffer.alloc(0),
    };
  }
}

module.exports = new GPSProtocolParser();
