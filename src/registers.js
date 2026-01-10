/**
 * Modbus Register Definitions for Mennekes Amtron Compact 2.0s
 * Based on Modbus RTU Specification v2.0 (March 21, 2024)
 * Modbus Register Layout Version: 1.0.3
 */

/**
 * @typedef {Object} RegisterDefinition
 * @property {number} address - Modbus register address
 * @property {number} length - Number of registers (16-bit words)
 * @property {string} type - Data type (uint16, uint32, int16, int32, float, ascii)
 * @property {string} access - Access type ('R' for read-only, 'W' for write-only, 'RW' for read-write)
 * @property {string} name - Register name
 * @property {string} description - Register description
 * @property {string} [unit] - Unit of measurement
 * @property {number} [scale] - Scaling factor
 * @property {Object} [values] - Enumeration values for discrete registers
 * @property {Array} [range] - Valid range [min, max]
 * @property {string} version - Modbus version when register was introduced
 */

export const REGISTERS = {
  // ==========================================
  // GENERAL INFORMATION (0x0000 - 0x00FF)
  // ==========================================
  MODBUS_VERSION: {
    address: 0x0000,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Modbus Version',
    description: 'Internal Modbus Register Layout Version (V1.0.0 = 0x100, V1.0.3 = 0x103)',
    range: [0, 65535],
    version: 'v01.00'
  },
  FIRMWARE_VERSION: {
    address: 0x0001,
    length: 8,
    type: 'ascii',
    access: 'R',
    name: 'Firmware Version',
    description: 'Firmware Version',
    version: 'v01.00'
  },
  SERIAL_NUMBER: {
    address: 0x0013,
    length: 8,
    type: 'ascii',
    access: 'R',
    name: 'Serial Number',
    description: 'Serial Number',
    version: 'v01.02'
  },

  // ==========================================
  // STATUS (0x0100 - 0x02FF)
  // ==========================================
  EVSE_STATE: {
    address: 0x0100,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'EVSE State',
    description: 'Status of the charging station',
    values: {
      0: 'Not initialized',
      1: 'Idle (A1)',
      2: 'EV connected (B1)',
      3: 'Preconditions valid but not charging yet',
      4: 'Ready to charge (B2)',
      5: 'Charging (C2)',
      6: 'Error',
      7: 'Service Mode'
    },
    range: [0, 7],
    version: 'v01.00'
  },
  AUTHORIZATION_STATUS: {
    address: 0x0101,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Authorization Status',
    description: 'Authorization Status (RFID & Energy Manager)',
    values: {
      0: 'Not used (IDLE)',
      1: 'Authorized (charging released)',
      2: 'Not authorized (charging not released)'
    },
    range: [0, 2],
    version: 'v01.00'
  },
  DOWNGRADE: {
    address: 0x0102,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Downgrade',
    description: 'Status of the Downgrade',
    values: {
      0: 'Not relevant (no EV connected)',
      1: 'Charging current not downgraded',
      2: 'Charging current downgraded'
    },
    range: [0, 2],
    version: 'v01.00'
  },
  PHASE_ROTATION: {
    address: 0x0103,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Phase Rotation',
    description: 'Order of the connected phases (relevant for load management)',
    values: {
      0: 'L1 - L2 - L3',
      1: 'L2 - L3 - L1',
      2: 'L3 - L1 - L2'
    },
    range: [0, 2],
    version: 'v01.00'
  },
  CP_STATE: {
    address: 0x0108,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'CP State',
    description: 'State of the CP communication EVSE-EV',
    values: {
      0: 'Init',
      10: 'A1 (no EV)',
      11: 'B1 (EV connected)',
      12: 'C1 (EV ready to charge)',
      13: 'D1',
      14: 'E (Error)',
      15: 'F (Error)',
      26: 'A2 (EV disconnected)',
      27: 'B2 (EVSE ready to charge)',
      28: 'C2 (charging)',
      29: 'D2'
    },
    range: [0, 29],
    version: 'v01.02'
  },
  SIGNALED_CURRENT: {
    address: 0x0114,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Signaled Current',
    description: 'Signaled Current to the EV',
    unit: 'A',
    version: 'v01.03'
  },

  // ==========================================
  // CONFIGURATION (0x0300 - 0x04FF)
  // ==========================================
  DOWNGRADE_CURRENT: {
    address: 0x0300,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Downgrade Current',
    description: 'Charging current limitation while downgrade is active',
    unit: 'A',
    version: 'v01.00'
  },
  CHARGING_CURRENT_EM: {
    address: 0x0302,
    length: 2,
    type: 'float',
    access: 'RW',
    name: 'Charging Current Energy Manager',
    description: 'Charging current limitation by energy manager. 0 = no limitation, 0.01-5.99 = invalid (signals 0A), 6-x = valid limit',
    unit: 'A',
    range: [0, 32],
    version: 'v01.00'
  },
  MAX_CURRENT_HOUSE: {
    address: 0x0304,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Max Current House (DIP)',
    description: 'Maximal installation current, configured from DIP-Switch',
    unit: 'A',
    version: 'v01.00'
  },
  MAX_CURRENT_EVSE: {
    address: 0x0306,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Max Current EVSE',
    description: 'Maximal current of the EVSE as configured during the installation',
    unit: 'A',
    version: 'v01.00'
  },
  PHASE_SWITCHING_MODE: {
    address: 0x030A,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Phase Switching Mode',
    description: 'Phase usage while using the solar algorithm',
    values: {
      0: 'Solar only 1 phase',
      1: 'Solar only 3 phases',
      2: 'Solar dynamic 1 or 3 phases'
    },
    range: [0, 2],
    version: 'v01.00'
  },
  PHASE_OPTIONS_HW: {
    address: 0x030C,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Phase Options HW',
    description: 'Phase options regarding the hardware',
    values: {
      0: 'HW only 1 phase',
      1: 'HW only 3 phases',
      2: 'HW 1 or 3 phases'
    },
    range: [0, 2],
    version: 'v01.01'
  },
  CABLE_LOCK_CONFIG: {
    address: 0x030D,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Cable Lock',
    description: 'Permanent cable lock configuration',
    values: {
      0: 'Not enabled or unavailable',
      1: 'Enabled'
    },
    range: [0, 1],
    version: 'v01.02'
  },
  MASTER_LOST_FALLBACK_CURRENT: {
    address: 0x030E,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Master Lost Fallback Current',
    description: 'Fallback behaviour if Master (energy manager) is unavailable. 0 = disabled, 1 = pause, 6-32 = continue with value',
    unit: 'A',
    range: [0, 32],
    version: 'v01.02'
  },
  GRID_IMBALANCE: {
    address: 0x030F,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Grid Imbalance',
    description: 'Grid Imbalance setting',
    values: {
      0: 'Disabled',
      1: 'Enabled'
    },
    range: [0, 1],
    version: 'v01.02'
  },
  GRID_IMBALANCE_THRESHOLD: {
    address: 0x0310,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Grid Imbalance Threshold',
    description: 'Grid Imbalance Threshold',
    unit: 'A',
    range: [10, 30],
    version: 'v01.02'
  },
  GRID_PHASES_CONNECTED: {
    address: 0x0311,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Grid Phases Connected',
    description: 'Setting of the number of grid phases connected to the EVSE',
    values: {
      0: 'L1',
      2: 'L1, L2 and L3'
    },
    range: [0, 2],
    version: 'v01.02'
  },
  AUTHORIZATION: {
    address: 0x0312,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Authorization',
    description: 'Authorization setting',
    values: {
      0: 'Disabled',
      1: 'Enabled'
    },
    range: [0, 1],
    version: 'v01.02'
  },
  SOLAR_SUPPORTED_CHARGING_CURRENT: {
    address: 0x0313,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Solar Supported Charging Current',
    description: 'Minimal charging current in Solar supported charging (Sunshine+) mode',
    unit: 'A',
    range: [6, 32],
    version: 'v01.02'
  },
  PHASE_SWITCHING_PAUSE: {
    address: 0x0314,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Phase Switching Pause',
    description: 'Duration of the pause during a dynamic phase switch',
    unit: 's',
    range: [0, 1200],
    version: 'v01.02'
  },

  // ==========================================
  // OUTPUT MEASUREMENTS (AC) (0x0500 - 0x06FF)
  // ==========================================
  CURRENT_L1: {
    address: 0x0500,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Current L1',
    description: 'RMS output current of phase L1',
    unit: 'A',
    version: 'v01.00'
  },
  CURRENT_L2: {
    address: 0x0502,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Current L2',
    description: 'RMS output current of phase L2',
    unit: 'A',
    version: 'v01.00'
  },
  CURRENT_L3: {
    address: 0x0504,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Current L3',
    description: 'RMS output current of phase L3',
    unit: 'A',
    version: 'v01.00'
  },
  VOLTAGE_L1: {
    address: 0x0506,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Voltage L1',
    description: 'RMS output voltage of phase L1',
    unit: 'V',
    version: 'v01.00'
  },
  VOLTAGE_L2: {
    address: 0x0508,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Voltage L2',
    description: 'RMS output voltage of phase L2',
    unit: 'V',
    version: 'v01.00'
  },
  VOLTAGE_L3: {
    address: 0x050A,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Voltage L3',
    description: 'RMS output voltage of phase L3',
    unit: 'V',
    version: 'v01.00'
  },
  POWER_L1: {
    address: 0x050C,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Power L1',
    description: 'Actual Power on phase L1',
    unit: 'W',
    version: 'v01.00'
  },
  POWER_L2: {
    address: 0x050E,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Power L2',
    description: 'Actual Power on phase L2',
    unit: 'W',
    version: 'v01.00'
  },
  POWER_L3: {
    address: 0x0510,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Power L3',
    description: 'Actual Power on phase L3',
    unit: 'W',
    version: 'v01.00'
  },
  POWER_OVERALL: {
    address: 0x0512,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Power Overall',
    description: 'Actual overall Power on all phases',
    unit: 'W',
    version: 'v01.00'
  },

  // ==========================================
  // SETTINGS (0x0700 - 0x08FF)
  // ==========================================
  MAXIMAL_EVSE_CURRENT: {
    address: 0x0706,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Maximal EVSE Current',
    description: 'Maximal current of the wallbox',
    values: {
      0: '32A (22kW) / 16A (11kW)',
      1: '25A (22kW) / 16A (11kW)',
      2: '20A (22kW) / 16A (11kW)',
      3: '16A',
      4: '13A',
      5: '10A',
      6: '6A'
    },
    range: [0, 6],
    version: 'v01.03'
  },
  PHASE_ROTATION_SETTING: {
    address: 0x070A,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Phase Rotation',
    description: 'Phase rotation on grid side',
    values: {
      0: 'L1=L1, L2=L2, L3=L3 (no rotation)',
      1: 'L1=L2, L2=L3, L3=L1',
      2: 'L1=L3, L2=L1, L3=L2'
    },
    range: [0, 2],
    version: 'v01.03'
  },
  CONNECTED_PHASES: {
    address: 0x0710,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Connected Phases',
    description: 'Number of connected phases to the grid',
    values: {
      0: 'L1 is connected',
      2: 'L1, L2, L3 are connected'
    },
    range: [0, 2],
    version: 'v01.03'
  },
  PHASE_USAGE_SOLAR_CHARGING: {
    address: 0x071A,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Phase Usage Solar Charging',
    description: 'Used Phases in Solar Charging',
    values: {
      0: '1ph for 7.4kW, 3ph for 11/22kW',
      1: 'Use always one phase',
      2: 'Use always three phases',
      3: 'Dynamic phase switch'
    },
    range: [0, 3],
    version: 'v01.03'
  },
  FALLBACK_CURRENT_MASTER_LOST: {
    address: 0x073A,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Fallback Current Master Lost',
    description: 'Fallback behaviour when the heartbeat of the Master is not available. 0 = disabled, 1 = pause, 6-32 = fallback current',
    unit: 'A',
    range: [0, 32],
    version: 'v01.03'
  },
  SOLAR_CHARGING_ACTIVE: {
    address: 0x073C,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Solar Charging Active',
    description: 'Internal Solar Modes can be indicated with the help of the Solar LEDs',
    values: {
      0: 'Solar Modes not active (DIP7 OFF)',
      1: 'Solar Modes active (DIP7 ON)'
    },
    range: [0, 1],
    version: 'v01.03'
  },
  PHASE_SWITCHING_PAUSE_SETTING: {
    address: 0x078C,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Phase Switching Pause',
    description: 'Time between a phase switch from 1 to 3 phase and vice versa',
    unit: 's',
    range: [0, 1200],
    version: 'v01.03'
  },

  // ==========================================
  // INPUT MEASUREMENTS (0x0900 - 0x0AFF)
  // ==========================================
  TEMPERATURE: {
    address: 0x0900,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Temperature',
    description: 'Temperature inside the EVSE',
    unit: '°C',
    version: 'v01.02'
  },

  // ==========================================
  // CHARGING SESSION (0x0B00 - 0x0CFF)
  // ==========================================
  MAX_CURRENT_SESSION: {
    address: 0x0B00,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Max Current Session',
    description: 'Max charging current, evaluated out of all sources that could restrict the maximal allowed current',
    unit: 'A',
    version: 'v01.00'
  },
  CHARGED_ENERGY_SESSION: {
    address: 0x0B02,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Charged Energy Session',
    description: 'Energy transferred within the current charging session',
    unit: 'kWh',
    version: 'v01.00'
  },
  DURATION_SESSION: {
    address: 0x0B04,
    length: 2,
    type: 'uint32',
    access: 'R',
    name: 'Duration Session',
    description: 'Duration of the current charging session',
    unit: 's',
    version: 'v01.00'
  },
  DETECTED_EV_PHASES: {
    address: 0x0B06,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Detected EV Phases',
    description: 'Maximum number of the detected phases of the EV during a charging session',
    values: {
      0: 'Not initialized',
      1: '1 phase detected',
      2: '2 phases detected',
      3: '3 phases detected'
    },
    range: [0, 3],
    version: 'v01.02'
  },

  // ==========================================
  // FUNCTIONS (0x0D00 - 0x0DFF)
  // ==========================================
  HEARTBEAT_EM: {
    address: 0x0D00,
    length: 1,
    type: 'uint16',
    access: 'W',
    name: 'Heartbeat Energy Manager',
    description: 'Master heartbeat with value 0x55AA (21930) must be sent at least every 10s',
    writeValue: 0x55AA,
    version: 'v01.00'
  },
  CABLE_LOCK_STATUS: {
    address: 0x0D02,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Cable Lock',
    description: 'Locking status of the cable',
    values: {
      0: 'Cable locking unknown',
      1: 'Cable unlocked',
      2: 'Cable locked',
      3: 'EVSE with fixed cable'
    },
    range: [0, 3],
    version: 'v01.00'
  },
  SOLAR_CHARGING_MODE: {
    address: 0x0D03,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Solar Charging Mode',
    description: 'Active charge mode',
    values: {
      0: 'Solar charging mode not active',
      1: 'Fast charging (Standard) Mode',
      2: 'Solar charging (Sunshine) Mode',
      3: 'Solar supported charging (Sunshine+) Mode'
    },
    range: [0, 3],
    version: 'v01.00'
  },
  REQUESTED_PHASES: {
    address: 0x0D04,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Requested Phases',
    description: 'Requested phases when using dynamic phase usage. EVSE must support this technically.',
    values: {
      0: 'Regular charging on all available phases',
      1: 'Force charging on 1 phase only'
    },
    range: [0, 1],
    version: 'v01.00'
  },
  CHARGING_RELEASE_EM: {
    address: 0x0D05,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Charging Release Energy Manager',
    description: 'Charging Release by Energy Manager',
    values: {
      0: 'Charging not allowed (relays opened)',
      1: 'Charging allowed (relays closed)'
    },
    range: [0, 1],
    version: 'v01.00'
  },
  LOCK_EVSE: {
    address: 0x0D06,
    length: 1,
    type: 'uint16',
    access: 'RW',
    name: 'Lock EVSE',
    description: 'Lock charging station (prevent charging)',
    values: {
      0: 'EVSE not locked',
      1: 'EVSE locked'
    },
    range: [0, 1],
    version: 'v01.00'
  },
  SYSTEM_RESTART: {
    address: 0x0D19,
    length: 1,
    type: 'uint16',
    access: 'W',
    name: 'System Restart',
    description: 'Trigger a system restart by sending 0xBB once. Only use when system is in IDLE state.',
    writeValue: 0x00BB,
    version: 'v01.03'
  },

  // ==========================================
  // DIAGNOSTIC (0x0E00 - 0x0FFF)
  // ==========================================
  ACTIVE_ERROR_CODE: {
    address: 0x0E00,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Active Error Code',
    description: 'Error code in case of an active error. 0 = no error active',
    version: 'v01.00'
  },
  MASTER_LOST_FALLBACK_STATE: {
    address: 0x0E01,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Master Lost Fallback State',
    description: 'Master lost fallback state',
    values: {
      0: 'Not active',
      1: 'Active (energy manager unavailable)'
    },
    range: [0, 1],
    version: 'v01.02'
  },
  SWITCHED_PHASES: {
    address: 0x0E02,
    length: 1,
    type: 'uint16',
    access: 'R',
    name: 'Switched Phases',
    description: 'Information what phase is used or will be used if the EVSE will close the charging relay',
    values: {
      0: 'Regular charging on all available phases',
      1: 'Only 1 phase charging'
    },
    range: [0, 1],
    version: 'v01.02'
  },

  // ==========================================
  // STATISTICS (0x1000 - 0x1FFF)
  // ==========================================
  CHARGED_ENERGY_TOTAL: {
    address: 0x1000,
    length: 2,
    type: 'float',
    access: 'R',
    name: 'Charged Energy Total',
    description: 'Cumulated charged energy on the AC-Port of the EVSE of all time. Not useable for billing.',
    unit: 'kWh',
    version: 'v01.02'
  },
  CHARGING_SESSIONS_TOTAL: {
    address: 0x1002,
    length: 2,
    type: 'uint32',
    access: 'R',
    name: 'Charging Sessions Total',
    description: 'Total number of the charging sessions',
    version: 'v01.02'
  }
};

/**
 * Get register definition by name
 * @param {string} name - Register name
 * @returns {RegisterDefinition|null}
 */
export function getRegisterByName(name) {
  return REGISTERS[name] || null;
}

/**
 * Get register definition by address
 * @param {number} address - Register address
 * @returns {RegisterDefinition|null}
 */
export function getRegisterByAddress(address) {
  return Object.values(REGISTERS).find(reg => reg.address === address) || null;
}

/**
 * Get all readable registers
 * @returns {Array<RegisterDefinition>}
 */
export function getReadableRegisters() {
  return Object.values(REGISTERS).filter(reg => reg.access.includes('R'));
}

/**
 * Get all writable registers
 * @returns {Array<RegisterDefinition>}
 */
export function getWritableRegisters() {
  return Object.values(REGISTERS).filter(reg => reg.access.includes('W'));
}

/**
 * Modbus communication constants
 */
export const MODBUS_CONFIG = {
  DEFAULT_BAUDRATE: 57600,
  OPTIONAL_BAUDRATES: [9600, 14400, 19200, 28800, 38400, 56000, 57600],
  DATA_BITS: 8,
  STOP_BITS: 2,
  PARITY: 'none',
  DEFAULT_SLAVE_ID: 1,
  BYTE_ORDER: 'BE', // Big Endian
  WORD_ORDER: 'LE', // LowWord / HighWord
  HEARTBEAT_INTERVAL: 10000, // 10 seconds in milliseconds
  HEARTBEAT_VALUE: 0x55AA,
  MIN_CHARGING_CURRENT: 6, // Minimum 6A to start charging
  MAX_CHARGING_CURRENT: 32, // Maximum 32A
  RECOMMENDED_CURRENT_CHANGE_INTERVAL: 5000 // 5 seconds in milliseconds
};

export default REGISTERS;
