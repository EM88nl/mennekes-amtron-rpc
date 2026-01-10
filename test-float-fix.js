/**
 * Test script to verify float byte order fix
 * Reads MAX_CURRENT_EVSE and checks if it returns the correct value (20.0A)
 */

import { ModbusClient } from './src/modbus-client.js';
import winston from 'winston';

// Create a simple console logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

const config = {
  port: process.env.MODBUS_PORT || '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0',
  baudRate: parseInt(process.env.MODBUS_BAUDRATE) || 57600,
  dataBits: 8,
  stopBits: 2,
  parity: 'none',
  slaveId: 50,
  timeout: 2000,
  reconnectInterval: 5000,
  maxRetries: 3
};

async function testFloatParsing() {
  const client = new ModbusClient(config, logger);

  try {
    console.log('Testing float parsing fix...');
    console.log('Connecting to Modbus device...');

    await client.connect();

    // Wait a bit after connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\nReading MAX_CURRENT_EVSE (should be ~20.0A)...');
    const maxCurrent = await client.readRegister('MAX_CURRENT_EVSE');

    console.log(`Result: ${maxCurrent}A`);

    if (Math.abs(maxCurrent - 20.0) < 0.1) {
      console.log('✓ SUCCESS! Float parsing is correct.');
    } else {
      console.log('✗ FAILED! Expected ~20.0A, got', maxCurrent);
    }

    console.log('\nReading other device info...');
    const modbusVersion = await client.readRegister('MODBUS_VERSION');
    const evseState = await client.readRegister('EVSE_STATE');

    console.log(`Modbus Version: 0x${modbusVersion.toString(16)}`);
    console.log(`EVSE State: ${evseState}`);

    await client.disconnect();
    console.log('\n✓ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error(`\n✗ Test failed: ${error.message}`);
    if (client.isConnected) {
      await client.disconnect();
    }
    process.exit(1);
  }
}

testFloatParsing();
