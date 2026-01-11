/**
 * Modbus RTU Client for Mennekes Amtron Compact
 * Handles low-level Modbus communication with error handling and reconnection logic
 */

import ModbusRTU from 'modbus-serial';
import { EventEmitter } from 'events';
import { REGISTERS, getRegisterByAddress } from './registers.js';

export class ModbusClient extends EventEmitter {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.port - Serial port path (e.g., 'COM3' or '/dev/ttyUSB0')
   * @param {number} config.baudRate - Baud rate (default: 57600)
   * @param {number} config.dataBits - Data bits (default: 8)
   * @param {number} config.stopBits - Stop bits (default: 2)
   * @param {string} config.parity - Parity ('none', 'even', 'odd') (default: 'none')
   * @param {number} config.slaveId - Modbus slave ID (default: 1)
   * @param {number} config.timeout - Response timeout in ms (default: 1000)
   * @param {number} config.reconnectInterval - Reconnection interval in ms (default: 5000)
   * @param {number} config.maxRetries - Maximum number of retries for failed operations (default: 3)
   * @param {Object} logger - Winston logger instance
   */
  constructor(config, logger) {
    super();

    this.config = {
      port: config.port || 'COM3',
      baudRate: config.baudRate || 57600,
      dataBits: config.dataBits || 8,
      stopBits: config.stopBits || 2,
      parity: config.parity || 'none',
      slaveId: config.slaveId || 1,
      timeout: config.timeout || 1000,
      reconnectInterval: config.reconnectInterval || 5000,
      maxRetries: config.maxRetries || 3
    };

    this.logger = logger;
    this.client = new ModbusRTU();
    this.isConnected = false;
    this.reconnecting = false;
    this.heartbeatInterval = null;
    this.connectionCheckInterval = null;
  }

  /**
   * Connect to the Modbus device
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      this.logger.info(`Connecting to Modbus RTU on ${this.config.port}...`);

      await this.client.connectRTU(this.config.port, {
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits,
        stopBits: this.config.stopBits,
        parity: this.config.parity
      });

      this.client.setID(this.config.slaveId);
      this.client.setTimeout(this.config.timeout);

      this.isConnected = true;
      this.reconnecting = false;

      this.logger.info('Successfully connected to Modbus RTU device');
      this.emit('connected');

      // Start connection monitoring
      this.startConnectionMonitoring();

    } catch (error) {
      this.logger.error(`Failed to connect to Modbus RTU: ${error.message}`);
      this.isConnected = false;
      this.emit('error', error);

      // Schedule reconnection
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Disconnect from the Modbus device
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.logger.info('Disconnecting from Modbus RTU device...');

    // Stop heartbeat and connection monitoring
    this.stopHeartbeat();
    this.stopConnectionMonitoring();

    if (this.client.isOpen) {
      await this.client.close();
    }

    this.isConnected = false;
    this.emit('disconnected');
    this.logger.info('Disconnected from Modbus RTU device');
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;
    this.logger.info(`Scheduling reconnection in ${this.config.reconnectInterval}ms...`);

    setTimeout(() => {
      this.connect().catch(err => {
        this.logger.error(`Reconnection failed: ${err.message}`);
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    // Check connection status every 30 seconds
    this.connectionCheckInterval = setInterval(async () => {
      try {
        // Try to read a simple register to check connection
        await this.readRegister('EVSE_STATE');
      } catch (error) {
        this.logger.warn('Connection check failed, attempting reconnection...');
        this.isConnected = false;
        this.emit('connectionLost');
        this.scheduleReconnect();
      }
    }, 30000);
  }

  /**
   * Stop connection monitoring
   */
  stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Read a register by name
   * @param {string} registerName - Register name from REGISTERS
   * @param {number} retryCount - Current retry count (internal use)
   * @returns {Promise<any>} - Parsed register value
   */
  async readRegister(registerName, retryCount = 0) {
    const register = REGISTERS[registerName];

    if (!register) {
      throw new Error(`Unknown register: ${registerName}`);
    }

    if (!register.access.includes('R')) {
      throw new Error(`Register ${registerName} is not readable`);
    }

    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Modbus device');
      }

      // Use function code 0x03 (Read Holding Registers)
      const data = await this.client.readHoldingRegisters(register.address, register.length);

      return this.parseRegisterValue(register, data.buffer);

    } catch (error) {
      this.logger.error(`Error reading register ${registerName}: ${error.message}`);

      // Retry logic
      if (retryCount < this.config.maxRetries) {
        this.logger.warn(`Retrying read operation (${retryCount + 1}/${this.config.maxRetries})...`);
        await this.delay(500); // Wait 500ms before retry
        return this.readRegister(registerName, retryCount + 1);
      }

      // Connection might be lost
      if (error.message.includes('Port Not Open') || error.message.includes('Timed Out')) {
        this.isConnected = false;
        this.emit('connectionLost');
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  /**
   * Write a register by name
   * @param {string} registerName - Register name from REGISTERS
   * @param {any} value - Value to write
   * @param {number} retryCount - Current retry count (internal use)
   * @returns {Promise<void>}
   */
  async writeRegister(registerName, value, retryCount = 0) {
    const register = REGISTERS[registerName];

    if (!register) {
      throw new Error(`Unknown register: ${registerName}`);
    }

    if (!register.access.includes('W')) {
      throw new Error(`Register ${registerName} is not writable`);
    }

    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Modbus device');
      }

      const buffer = this.encodeRegisterValue(register, value);

      if (register.length === 1) {
        // Use function code 0x06 (Write Single Register)
        await this.client.writeRegister(register.address, buffer[0]);
      } else {
        // Use function code 0x10 (Write Multiple Registers)
        await this.client.writeRegisters(register.address, buffer);
      }

      this.logger.debug(`Successfully wrote ${value} to register ${registerName}`);

    } catch (error) {
      this.logger.error(`Error writing register ${registerName}: ${error.message}`);

      // Retry logic
      if (retryCount < this.config.maxRetries) {
        this.logger.warn(`Retrying write operation (${retryCount + 1}/${this.config.maxRetries})...`);
        await this.delay(500);
        return this.writeRegister(registerName, value, retryCount + 1);
      }

      // Connection might be lost
      if (error.message.includes('Port Not Open') || error.message.includes('Timed Out')) {
        this.isConnected = false;
        this.emit('connectionLost');
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  /**
   * Read multiple registers at once
   * @param {Array<string>} registerNames - Array of register names
   * @returns {Promise<Object>} - Object with register names as keys and values
   */
  async readMultipleRegisters(registerNames) {
    const results = {};

    for (const name of registerNames) {
      try {
        results[name] = await this.readRegister(name);
      } catch (error) {
        this.logger.error(`Failed to read ${name}: ${error.message}`);
        results[name] = null;
      }
    }

    return results;
  }

  /**
   * Parse register value from buffer based on register type
   * @param {Object} register - Register definition
   * @param {Buffer} buffer - Raw buffer from Modbus
   * @returns {any} - Parsed value
   */
  parseRegisterValue(register, buffer) {
    try {
      switch (register.type) {
        case 'uint16':
          return buffer.readUInt16BE(0);

        case 'uint32':
          // LowWord/HighWord order
          return (buffer.readUInt16BE(2) << 16) | buffer.readUInt16BE(0);

        case 'int16':
          return buffer.readInt16BE(0);

        case 'int32':
          // LowWord/HighWord order
          return (buffer.readInt16BE(2) << 16) | buffer.readInt16BE(0);

        case 'float':
          // IEEE 754 float32 with big-endian byte order (ABCD)
          const tempBuffer = Buffer.allocUnsafe(4);
          tempBuffer.writeUInt16BE(buffer.readUInt16BE(0), 0);
          tempBuffer.writeUInt16BE(buffer.readUInt16BE(2), 2);
          return tempBuffer.readFloatBE(0);

        case 'ascii':
          // For ASCII in Modbus, we need to swap bytes within each register
          // Each register is 16 bits (2 bytes), but bytes might be reversed
          const swappedBuffer = Buffer.allocUnsafe(buffer.length);
          for (let i = 0; i < buffer.length; i += 2) {
            // Swap bytes within each 16-bit register
            swappedBuffer[i] = buffer[i + 1];
            swappedBuffer[i + 1] = buffer[i];
          }
          // Convert buffer to ASCII string, removing null bytes and trim
          return swappedBuffer.toString('ascii').replace(/\0/g, '').trim();

        default:
          throw new Error(`Unknown register type: ${register.type}`);
      }
    } catch (error) {
      this.logger.error(`Error parsing register value: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encode value to buffer based on register type
   * @param {Object} register - Register definition
   * @param {any} value - Value to encode
   * @returns {Array<number>} - Array of 16-bit register values
   */
  encodeRegisterValue(register, value) {
    const buffer = Buffer.allocUnsafe(register.length * 2);

    try {
      switch (register.type) {
        case 'uint16':
          buffer.writeUInt16BE(value, 0);
          return [buffer.readUInt16BE(0)];

        case 'uint32':
          // Write as LowWord/HighWord order
          buffer.writeUInt16BE(value & 0xFFFF, 0);
          buffer.writeUInt16BE((value >> 16) & 0xFFFF, 2);
          return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];

        case 'int16':
          buffer.writeInt16BE(value, 0);
          return [buffer.readUInt16BE(0)];

        case 'int32':
          // Write as LowWord/HighWord order
          buffer.writeInt16BE(value & 0xFFFF, 0);
          buffer.writeInt16BE((value >> 16) & 0xFFFF, 2);
          return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];

        case 'float':
          // Write IEEE 754 float32 with big-endian byte order (ABCD)
          const tempBuffer = Buffer.allocUnsafe(4);
          tempBuffer.writeFloatBE(value, 0);
          buffer.writeUInt16BE(tempBuffer.readUInt16BE(0), 0);
          buffer.writeUInt16BE(tempBuffer.readUInt16BE(2), 2);
          return [buffer.readUInt16BE(0), buffer.readUInt16BE(2)];

        default:
          throw new Error(`Cannot encode type: ${register.type}`);
      }
    } catch (error) {
      this.logger.error(`Error encoding register value: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start heartbeat transmission (required for Amtron)
   * Must send 0x55AA to register 0x0D00 every 10 seconds
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      return; // Already running
    }

    this.logger.info('Starting heartbeat transmission (0x55AA every 10s)...');

    // Wait 2 seconds before sending first heartbeat to avoid collision with device info reads
    setTimeout(() => {
      this.sendHeartbeat();
    }, 2000);

    // Then send every 9 seconds (slightly faster than 10s requirement for safety)
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 9000);
  }

  /**
   * Stop heartbeat transmission
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.logger.info('Stopped heartbeat transmission');
    }
  }

  /**
   * Send a single heartbeat
   */
  async sendHeartbeat() {
    try {
      await this.writeRegister('HEARTBEAT_EM', 0x55AA);
      this.logger.debug('Heartbeat sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send heartbeat: ${error.message}`);
    }
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default ModbusClient;
