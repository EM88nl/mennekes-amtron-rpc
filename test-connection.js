/**
 * Modbus Connection Diagnostic Test
 * Tests different connection methods and parameters
 */

import ModbusRTU from 'modbus-serial';

const config = {
  port: process.env.MODBUS_PORT || '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0',
  baudRate: parseInt(process.env.MODBUS_BAUDRATE) || 57600,
  dataBits: 8,
  stopBits: 2,
  parity: 'none',
  slaveId: 50,
  timeout: 2000 // Increased timeout for testing
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testConnection(useBuffered = false) {
  const client = new ModbusRTU();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${useBuffered ? 'BUFFERED' : 'STANDARD'} RTU connection`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Port: ${config.port}`);
    console.log(`Baud Rate: ${config.baudRate}`);
    console.log(`Slave ID: ${config.slaveId}`);
    console.log(`Timeout: ${config.timeout}ms`);

    // Connect
    if (useBuffered) {
      await client.connectRTUBuffered(config.port, {
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity
      });
    } else {
      await client.connectRTU(config.port, {
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        stopBits: config.stopBits,
        parity: config.parity
      });
    }

    client.setID(config.slaveId);
    client.setTimeout(config.timeout);

    console.log('✓ Connection established');

    // Wait before first communication
    console.log('Waiting 1 second before first read...');
    await delay(1000);

    // Test 1: Read MODBUS_VERSION (address 0x0000, 1 register)
    console.log('\nTest 1: Reading MODBUS_VERSION (0x0000)...');
    try {
      const result = await client.readHoldingRegisters(0x0000, 1);
      console.log(`✓ Success! Value: 0x${result.data[0].toString(16).padStart(4, '0')}`);
      console.log(`  Version: ${(result.data[0] >> 8)}.${(result.data[0] & 0xFF)}`);
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }

    // Test 2: Read EVSE_STATE (address 0x0100, 1 register)
    console.log('\nTest 2: Reading EVSE_STATE (0x0100)...');
    try {
      const result = await client.readHoldingRegisters(0x0100, 1);
      console.log(`✓ Success! Value: ${result.data[0]}`);
      const states = ['Not initialized', 'Idle (A1)', 'EV connected (B1)', 'Preconditions valid', 'Ready to charge (B2)', 'Charging (C2)', 'Error', 'Service Mode'];
      console.log(`  State: ${states[result.data[0]] || 'Unknown'}`);
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }

    // Test 3: Write HEARTBEAT (address 0x0D00, value 0x55AA)
    console.log('\nTest 3: Writing HEARTBEAT (0x0D00 = 0x55AA)...');
    try {
      await client.writeRegister(0x0D00, 0x55AA);
      console.log('✓ Success! Heartbeat sent');
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }

    // Test 4: Read MAX_CURRENT_EVSE (address 0x0306, 2 registers, float)
    console.log('\nTest 4: Reading MAX_CURRENT_EVSE (0x0306, 2 regs)...');
    try {
      const result = await client.readHoldingRegisters(0x0306, 2);
      console.log(`✓ Success! Raw values: [0x${result.data[0].toString(16)}, 0x${result.data[1].toString(16)}]`);

      // Parse as float with LowWord/HighWord order
      const buffer = Buffer.allocUnsafe(4);
      buffer.writeUInt16BE(result.data[1], 0);
      buffer.writeUInt16BE(result.data[0], 2);
      const floatValue = buffer.readFloatBE(0);
      console.log(`  Float value (LH order): ${floatValue}A`);
    } catch (error) {
      console.log(`✗ Failed: ${error.message}`);
    }

    await client.close();
    console.log('\n✓ Connection closed');
    return true;

  } catch (error) {
    console.log(`\n✗ Connection failed: ${error.message}`);
    if (client.isOpen) {
      await client.close();
    }
    return false;
  }
}

async function main() {
  console.log('Mennekes Amtron Modbus Connection Diagnostic');
  console.log(`Current time: ${new Date().toISOString()}`);

  // Test standard RTU first
  const standardWorks = await testConnection(false);

  await delay(2000);

  // Test buffered RTU
  const bufferedWorks = await testConnection(true);

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Standard RTU: ${standardWorks ? '✓ WORKS' : '✗ FAILED'}`);
  console.log(`Buffered RTU: ${bufferedWorks ? '✓ WORKS' : '✗ FAILED'}`);
  console.log(`\nRecommendation: Use ${standardWorks ? 'connectRTU' : bufferedWorks ? 'connectRTUBuffered' : 'NEITHER WORKED - check wiring/config'}`);
}

main().catch(console.error);
