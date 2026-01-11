# Mennekes Amtron RPC Server

Node.js JSON-RPC server for controlling and monitoring Mennekes Amtron Compact EV chargers via Modbus RTU over RS485-USB adapter.

## Features

- **Complete Modbus RTU Implementation**: All registers from the official Mennekes documentation (v2.0)
- **JSON-RPC API**: Easy-to-use remote procedure calls for all charger functions
- **Robust Error Handling**: Automatic retry and reconnection logic
- **Heartbeat Management**: Automatic heartbeat transmission required by Amtron
- **Cross-Platform**: Works on Windows and Linux
- **Production-Ready**: Comprehensive logging, graceful shutdown, and connection monitoring
- **Well-Documented**: Full JSDoc annotations and detailed register definitions

## Table of Contents

- [Hardware Requirements](#hardware-requirements)
- [Installation](#installation)
  - [Windows](#windows)
  - [Linux](#linux)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available RPC Methods](#available-rpc-methods)
- [Modbus Register Reference](#modbus-register-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Hardware Requirements

- **EV Charger**: Mennekes Amtron Compact 2.0s (or compatible models: Amtron 4You 300, Amtron Start 2.0s)
- **Interface**: RS485-USB adapter (e.g., USB-to-RS485 converter)
- **Connection**: RS485 A/B terminals on the Amtron charger

### Wiring

Connect your RS485-USB adapter to the Amtron charger:
- **A+** → Terminal A on Amtron
- **B-** → Terminal B on Amtron
- **GND** → Common ground (if available)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- RS485-USB adapter drivers installed

### Windows

```bash
# Clone or create the project directory
cd mennekes-amtron-rpc

# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Edit .env and set your COM port (e.g., COM3, COM4)
notepad .env

# Start the server
npm start
```

### Linux

```bash
# Clone or create the project directory
cd mennekes-amtron-rpc

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and set your USB serial device (e.g., /dev/ttyUSB0)
nano .env

# Give user permission to access serial port
sudo usermod -a -G dialout $USER
# Log out and log back in for changes to take effect

# Start the server
npm start
```

### Running as a Service (Linux)

Create a systemd service file `/etc/systemd/system/amtron-rpc.service`:

```ini
[Unit]
Description=Mennekes Amtron RPC Server
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/mennekes-amtron-rpc
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:

```bash
sudo systemctl enable amtron-rpc
sudo systemctl start amtron-rpc
sudo systemctl status amtron-rpc
```

## Configuration

Configuration is done via environment variables in the `.env` file:

### Modbus Configuration

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `MODBUS_PORT` | Serial port path | `COM3` (Windows)<br>`/dev/ttyUSB0` (Linux) | COM1-9 (Windows)<br>/dev/ttyUSB* (Linux) |
| `MODBUS_BAUDRATE` | Baud rate | `57600` | 9600, 14400, 19200, 28800, 38400, 56000, 57600 |
| `MODBUS_DATABITS` | Data bits | `8` | 8 |
| `MODBUS_STOPBITS` | Stop bits | `2` | 1, 2 |
| `MODBUS_PARITY` | Parity | `none` | none, even, odd |
| `MODBUS_SLAVE_ID` | Modbus slave ID | `1` | 1-50 (default: 1, satellite: 50) |
| `MODBUS_TIMEOUT` | Response timeout (ms) | `1000` | 500-5000 |
| `MODBUS_RECONNECT_INTERVAL` | Reconnect interval (ms) | `5000` | 1000-60000 |
| `MODBUS_MAX_RETRIES` | Max retry attempts | `3` | 1-10 |

### RPC Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_PORT` | JSON-RPC server port | `8080` |

### Other Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `HEARTBEAT_ENABLED` | Enable heartbeat (required!) | `true` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FILE` | Log file path | `logs/amtron-rpc.log` |

## Usage

### Starting the Server

```bash
npm start
```

The server will:
1. Connect to the Modbus device
2. Start sending heartbeat signals (required for charging)
3. Start the JSON-RPC server on the configured port
4. Log all activities to console and file

### Using the RPC Client

Run the example client to test all functions:

```bash
npm run example
```

Or create your own client (see [Examples](#examples) below).

## Available RPC Methods

All RPC methods return a response in the following format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

### Health and Status

#### `ping()`
Simple ping/pong test.

**Returns:**
```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

#### `health()`
Get health status of the server.

**Returns:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "modbusConnected": true,
    "uptime": 1234.56,
    "timestamp": "2024-01-10T12:00:00.000Z"
  }
}
```

### Device Information

#### `getDeviceInfo()`
Get device information (firmware version, serial number, etc.).

**Returns:**
```json
{
  "modbusVersion": "1.0.3",
  "firmwareVersion": "2.0",
  "serialNumber": "ABC123456",
  "maxCurrentEVSE": 32.0,
  "maxCurrentHouse": 32.0
}
```

### Status Methods

#### `getStatus()`
Get current charging status.

**Returns:**
```json
{
  "evseState": 5,
  "evseStateText": "Charging (C2)",
  "cpState": 28,
  "cpStateText": "C2 (charging)",
  "authorizationStatus": 1,
  "authorizationText": "Authorized (charging released)",
  "downgrade": 1,
  "downgradeText": "Charging current not downgraded",
  "phaseRotation": 0,
  "signaledCurrent": 16.0
}
```

### Measurement Methods

#### `getVoltage()`
Get voltage measurements for all phases.

**Returns:**
```json
{
  "l1": 230.5,
  "l2": 231.0,
  "l3": 229.8,
  "unit": "V"
}
```

#### `getCurrent()`
Get current measurements for all phases.

**Returns:**
```json
{
  "l1": 15.2,
  "l2": 15.1,
  "l3": 15.3,
  "unit": "A"
}
```

#### `getPower()`
Get power measurements for all phases.

**Returns:**
```json
{
  "l1": 3502.6,
  "l2": 3488.1,
  "l3": 3511.9,
  "total": 10502.6,
  "unit": "W"
}
```

#### `getChargingPower()`
Get total charging power in kW.

**Returns:**
```json
10.5
```

#### `getTemperature()`
Get EVSE internal temperature in °C.

**Returns:**
```json
42.5
```

### Energy and Session Methods

#### `getEnergy()`
Get energy data (session and total).

**Returns:**
```json
{
  "session": 5.234,
  "total": 1234.567,
  "unit": "kWh"
}
```

#### `getSessionData()`
Get current charging session data.

**Returns:**
```json
{
  "maxCurrent": 16.0,
  "chargedEnergy": 5.234,
  "duration": 1823,
  "durationFormatted": "0h 30m 23s",
  "detectedPhases": 3,
  "unit": {
    "current": "A",
    "energy": "kWh",
    "duration": "s"
  }
}
```

#### `getStatistics()`
Get lifetime statistics.

**Returns:**
```json
{
  "totalEnergy": 1234.567,
  "totalSessions": 156,
  "unit": {
    "energy": "kWh"
  }
}
```

### Control Methods

#### `setChargingCurrent(params)`
Set the charging current limit.

**Parameters:**
```json
{
  "ampere": 16
}
```

**Valid range:** 6-32A
**Returns:** Success message

**Important:**
- Do not change current faster than every 5 seconds
- Minimum charging current is 6A

#### `startCharging(params)`
Start charging with specified current.

**Parameters:**
```json
{
  "current": 6
}
```

**Returns:** Success message

**Requirements:**
- Heartbeat must be running
- Current must be >= 6A
- Charging release will be enabled

#### `stopCharging()`
Stop charging (disable charging release).

**Returns:** Success message

#### `pauseCharging()`
Temporarily pause charging without releasing.

**Returns:** Success message

#### `resumeCharging(params)`
Resume charging after pause.

**Parameters:**
```json
{
  "current": 10
}
```

**Returns:** Success message

#### `setRequestedPhases(params)`
Set requested phases for dynamic phase switching.

**Parameters:**
```json
{
  "phases": 0
}
```

**Values:**
- `0`: All available phases
- `1`: Single phase only

**Note:** Only works if hardware supports dynamic phase switching.

#### `setLock(params)`
Lock or unlock the EVSE.

**Parameters:**
```json
{
  "lock": true
}
```

**Returns:** Success message

### Diagnostic Methods

#### `getDiagnostics()`
Get diagnostic information.

**Returns:**
```json
{
  "activeErrorCode": 0,
  "hasError": false,
  "masterLostFallback": false,
  "switchedPhases": 0,
  "temperature": 42.5
}
```

#### `getConfiguration()`
Get configuration settings.

**Returns:**
```json
{
  "maxCurrentHouse": 32.0,
  "maxCurrentEvse": 32.0,
  "phaseSwitchingMode": 2,
  "phaseOptionsHw": 2,
  "cableLock": false,
  "masterLostFallbackCurrent": 0,
  "gridImbalance": false,
  "gridPhasesConnected": 2,
  "authorization": false
}
```

## Modbus Register Reference

### Register Categories

| Address Range | Category | Description |
|---------------|----------|-------------|
| 0x0000-0x00FF | General Information | Device info, firmware version, serial number |
| 0x0100-0x02FF | Status | EVSE state, authorization, CP state, etc. |
| 0x0300-0x04FF | Configuration | Current limits, phase settings (read-only) |
| 0x0500-0x06FF | Output Measurements | Current, voltage, power per phase |
| 0x0700-0x08FF | Settings | Writable configuration settings |
| 0x0900-0x0AFF | Input Measurements | Temperature |
| 0x0B00-0x0CFF | Charging Session | Session energy, duration, detected phases |
| 0x0D00-0x0DFF | Functions | Control registers (heartbeat, charging release) |
| 0x0E00-0x0FFF | Diagnostic | Error codes, fallback state |
| 0x1000-0x1FFF | Statistics | Total energy, total sessions |

### Important Registers

| Register Name | Address | Type | R/W | Description |
|---------------|---------|------|-----|-------------|
| EVSE_STATE | 0x0100 | uint16 | R | Charging station status (0-7) |
| CURRENT_L1/L2/L3 | 0x0500-0x0505 | float | R | RMS current per phase (A) |
| VOLTAGE_L1/L2/L3 | 0x0506-0x050B | float | R | RMS voltage per phase (V) |
| POWER_OVERALL | 0x0512 | float | R | Total power (W) |
| CHARGED_ENERGY_SESSION | 0x0B02 | float | R | Session energy (kWh) |
| CHARGED_ENERGY_TOTAL | 0x1000 | float | R | Total energy (kWh) |
| HEARTBEAT_EM | 0x0D00 | uint16 | W | Heartbeat (must send 0x55AA every 10s) |
| CHARGING_CURRENT_EM | 0x0302 | float | RW | Charging current limit (A) |
| CHARGING_RELEASE_EM | 0x0D05 | uint16 | RW | Charging release (0=off, 1=on) |

### EVSE States

| Value | State | Description |
|-------|-------|-------------|
| 0 | Not initialized | System starting up |
| 1 | Idle (A1) | No EV connected |
| 2 | EV connected (B1) | EV plugged in |
| 3 | Preconditions valid | Not charging yet |
| 4 | Ready to charge (B2) | Ready to start |
| 5 | Charging (C2) | Actively charging |
| 6 | Error | Error state |
| 7 | Service Mode | Maintenance mode |

## Examples

### JavaScript/Node.js Client

```javascript
import jayson from 'jayson/promise/index.js';

const client = jayson.Client.http({
  port: 8080,
  hostname: 'localhost'
});

// Get current status
const status = await client.request('getStatus', {});
console.log(status.result.data);

// Start charging with 10A
await client.request('startCharging', { current: 10 });

// Wait 5 seconds, then increase to 16A
await new Promise(resolve => setTimeout(resolve, 5000));
await client.request('setChargingCurrent', { ampere: 16 });

// Get current power
const power = await client.request('getChargingPower', {});
console.log(`Charging power: ${power.result.data} kW`);

// Stop charging
await client.request('stopCharging', {});
```

### Python Client

```python
import requests
import json

url = 'http://localhost:8080'

def call_rpc(method, params=None):
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params or {},
        "id": 1
    }
    response = requests.post(url, json=payload)
    return response.json()

# Get status
status = call_rpc('getStatus')
print(status['result']['data'])

# Start charging
call_rpc('startCharging', {'current': 10})

# Get power
power = call_rpc('getChargingPower')
print(f"Charging power: {power['result']['data']} kW")
```

### curl Example

```bash
# Get status
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getStatus","params":{},"id":1}'

# Start charging
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"startCharging","params":{"current":10},"id":1}'

# Set charging current
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"setChargingCurrent","params":{"ampere":16},"id":1}'
```

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to Modbus device

**Solutions:**
1. Check COM port / serial device path in `.env`
2. Verify RS485 wiring (A+ and B- terminals)
3. Check baud rate matches charger configuration (default: 57600)
4. On Linux, ensure user has permission: `sudo usermod -a -G dialout $USER`
5. Check if another program is using the serial port
6. Verify RS485-USB adapter drivers are installed

### Charging Not Starting

**Problem:** Charging doesn't start even after calling `startCharging()`

**Solutions:**
1. Ensure heartbeat is enabled (`HEARTBEAT_ENABLED=true`)
2. Check that current is >= 6A (minimum requirement)
3. Verify EV is properly connected (check `getStatus()` for EVSE state)
4. Check authorization status (may need RFID if enabled)
5. Verify no error codes with `getDiagnostics()`

### Heartbeat Issues

**Problem:** Master lost fallback activated

**Solutions:**
1. Ensure server is running continuously
2. Check heartbeat interval (should be < 10 seconds)
3. Verify no network/connectivity interruptions
4. Check logs for connection errors

### Current Limit Not Applied

**Problem:** Charging current doesn't change

**Solutions:**
1. Wait at least 5 seconds between current changes (recommended by Mennekes)
2. Verify current is within valid range (6-32A)
3. Check `getConfiguration()` for max current limits
4. Ensure charging is active (state = 5)

### Linux Serial Port Access

**Problem:** Permission denied on /dev/ttyUSB0

**Solutions:**
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER

# Log out and log back in, or:
newgrp dialout

# Verify permissions
ls -l /dev/ttyUSB0

# Should show: crw-rw---- 1 root dialout
```

### Logs

Check logs for detailed error information:
- **Log file:** `logs/amtron-rpc.log`
- **Error log:** `logs/error.log`

Enable debug logging:
```bash
# In .env file
LOG_LEVEL=debug
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 0 | No error | Normal operation |
| -32000 | Server error | Check server logs |
| -32600 | Invalid request | Check RPC call format |
| -32601 | Method not found | Verify method name |
| -32602 | Invalid params | Check parameters |

## Important Notes

1. **Heartbeat is mandatory**: The charger requires a heartbeat signal (0x55AA) every 10 seconds to maintain communication. The server handles this automatically.

2. **Minimum charging current**: 6A minimum. Values below 6A will pause charging.

3. **Current change interval**: Wait at least 5 seconds between current changes to ensure EV compatibility.

4. **Dynamic phase switching**: Only available on 11kW devices configured appropriately. Not all EVs support this feature.

5. **Energy meter accuracy**: The energy values are not suitable for billing purposes (as per Mennekes documentation).

6. **Satellite mode**: If configured as satellite (DIP switches), default address is 50 instead of 1.

## Project Structure

```
mennekes-amtron-rpc/
├── src/
│   ├── index.js              # Entry point
│   ├── modbus-client.js      # Modbus RTU communication
│   ├── amtron-controller.js  # High-level control logic
│   ├── rpc-server.js         # JSON-RPC server
│   └── registers.js          # Modbus register definitions
├── config/
│   └── default.json          # Default configuration
├── examples/
│   └── client-example.js     # Example RPC client
├── logs/                     # Log files (created automatically)
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── README.md
```

## License

MIT

## Credits

Based on the official Mennekes Modbus RTU Specification v2.0 (March 21, 2024) for:
- AMTRON 4You 300
- AMTRON Compact 2.0s
- AMTRON Start 2.0s

## Support

For issues related to:
- **This software**: Open an issue on GitHub
- **Amtron charger**: Contact Mennekes support or your installer
- **Hardware/wiring**: Consult a qualified electrician

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always follow proper electrical safety procedures and consult with qualified professionals when working with EV charging equipment.
