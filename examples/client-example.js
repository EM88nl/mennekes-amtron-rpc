/**
 * Example RPC Client for Mennekes Amtron
 * Demonstrates how to use the JSON-RPC API
 */

import jayson from 'jayson/promise/index.js';

// Create RPC client
const client = jayson.Client.http({
  port: 8080,
  hostname: 'localhost'
});

/**
 * Helper function to make RPC calls
 */
async function call(method, params = {}) {
  try {
    console.log(`\n📡 Calling ${method}...`);
    const response = await client.request(method, params);

    if (response.error) {
      console.error(`❌ Error: ${response.error.message}`);
      return null;
    }

    console.log(`✅ Success:`, JSON.stringify(response.result, null, 2));
    return response.result;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return null;
  }
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main example function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Mennekes Amtron RPC Client Example');
  console.log('='.repeat(60));

  // 1. Health Check
  console.log('\n' + '='.repeat(60));
  console.log('1. HEALTH CHECK');
  console.log('='.repeat(60));
  await call('ping');
  await call('health');

  // 2. Device Information
  console.log('\n' + '='.repeat(60));
  console.log('2. DEVICE INFORMATION');
  console.log('='.repeat(60));
  await call('getDeviceInfo');

  // 3. Current Status
  console.log('\n' + '='.repeat(60));
  console.log('3. CURRENT STATUS');
  console.log('='.repeat(60));
  await call('getStatus');

  // 4. Measurements
  console.log('\n' + '='.repeat(60));
  console.log('4. MEASUREMENTS');
  console.log('='.repeat(60));
  await call('getVoltage');
  await call('getCurrent');
  await call('getPower');
  await call('getChargingPower');
  await call('getTemperature');

  // 5. Energy and Session Data
  console.log('\n' + '='.repeat(60));
  console.log('5. ENERGY AND SESSION DATA');
  console.log('='.repeat(60));
  await call('getEnergy');
  await call('getSessionData');
  await call('getStatistics');

  // 6. Diagnostics and Configuration
  console.log('\n' + '='.repeat(60));
  console.log('6. DIAGNOSTICS AND CONFIGURATION');
  console.log('='.repeat(60));
  await call('getDiagnostics');
  await call('getConfiguration');

  // 7. Get All Data at Once
  console.log('\n' + '='.repeat(60));
  console.log('7. GET ALL DATA');
  console.log('='.repeat(60));
  await call('getAllData');

  // 8. Control Examples (COMMENTED OUT FOR SAFETY)
  console.log('\n' + '='.repeat(60));
  console.log('8. CONTROL EXAMPLES (COMMENTED OUT FOR SAFETY)');
  console.log('='.repeat(60));
  console.log(`
⚠️  The following control commands are commented out for safety.
   Uncomment and modify them carefully when you're ready to control the charger.

   // Set charging current to 10A
   // await call('setChargingCurrent', { ampere: 10 });

   // Start charging with 6A (minimum)
   // await call('startCharging', { current: 6 });

   // Wait 5 seconds
   // await delay(5000);

   // Increase charging current to 16A
   // await call('setChargingCurrent', { ampere: 16 });

   // Wait 5 seconds
   // await delay(5000);

   // Pause charging
   // await call('pauseCharging');

   // Wait 5 seconds
   // await delay(5000);

   // Resume charging with 10A
   // await call('resumeCharging', { current: 10 });

   // Wait 5 seconds
   // await delay(5000);

   // Stop charging
   // await call('stopCharging');

   // Set requested phases to single phase (for dynamic phase switching)
   // await call('setRequestedPhases', { phases: 1 });

   // Set requested phases to all phases
   // await call('setRequestedPhases', { phases: 0 });

   // Lock EVSE
   // await call('setLock', { lock: true });

   // Unlock EVSE
   // await call('setLock', { lock: false });
  `);

  console.log('\n' + '='.repeat(60));
  console.log('Example completed!');
  console.log('='.repeat(60));
}

// Run the example
main().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});
