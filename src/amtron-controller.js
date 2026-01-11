/**
 * Amtron Controller
 * High-level control logic for Mennekes Amtron Compact EV Charger
 */

import { MODBUS_CONFIG } from './registers.js';

export class AmtronController {
  /**
   * @param {ModbusClient} modbusClient - Modbus client instance
   * @param {Object} logger - Winston logger instance
   */
  constructor(modbusClient, logger) {
    this.client = modbusClient;
    this.logger = logger;
  }

  // ==========================================
  // DEVICE INFORMATION METHODS
  // ==========================================

  /**
   * Get device information
   * @returns {Promise<Object>} Device information
   */
  async getDeviceInfo() {
    try {
      const info = await this.client.readMultipleRegisters([
        'MODBUS_VERSION',
        'FIRMWARE_VERSION',
        'SERIAL_NUMBER',
        'MAX_CURRENT_EVSE',
        'MAX_CURRENT_HOUSE'
      ]);

      return {
        modbusVersion: this.formatModbusVersion(info.MODBUS_VERSION),
        firmwareVersion: info.FIRMWARE_VERSION,
        serialNumber: info.SERIAL_NUMBER,
        maxCurrentEVSE: info.MAX_CURRENT_EVSE,
        maxCurrentHouse: info.MAX_CURRENT_HOUSE
      };
    } catch (error) {
      this.logger.error(`Error getting device info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format Modbus version from number to string (e.g., 0x103 -> "1.0.3")
   * @param {number} version - Version number
   * @returns {string} Formatted version string
   */
  formatModbusVersion(version) {
    const major = (version >> 8) & 0xFF;
    const minor = (version >> 4) & 0x0F;
    const patch = version & 0x0F;
    return `${major}.${minor}.${patch}`;
  }

  // ==========================================
  // STATUS METHODS
  // ==========================================

  /**
   * Get current charging status
   * @returns {Promise<Object>} Status information
   */
  async getStatus() {
    try {
      const status = await this.client.readMultipleRegisters([
        'EVSE_STATE',
        'CP_STATE',
        'AUTHORIZATION_STATUS',
        'DOWNGRADE',
        'PHASE_ROTATION',
        'SIGNALED_CURRENT'
      ]);

      return {
        evseState: status.EVSE_STATE,
        evseStateText: this.getEvseStateText(status.EVSE_STATE),
        cpState: status.CP_STATE,
        cpStateText: this.getCpStateText(status.CP_STATE),
        authorizationStatus: status.AUTHORIZATION_STATUS,
        authorizationText: this.getAuthorizationText(status.AUTHORIZATION_STATUS),
        downgrade: status.DOWNGRADE,
        downgradeText: this.getDowngradeText(status.DOWNGRADE),
        phaseRotation: status.PHASE_ROTATION,
        signaledCurrent: status.SIGNALED_CURRENT
      };
    } catch (error) {
      this.logger.error(`Error getting status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get EVSE state as human-readable text
   */
  getEvseStateText(state) {
    const states = {
      0: 'Not initialized',
      1: 'Idle (A1)',
      2: 'EV connected (B1)',
      3: 'Preconditions valid but not charging yet',
      4: 'Ready to charge (B2)',
      5: 'Charging (C2)',
      6: 'Error',
      7: 'Service Mode'
    };
    return states[state] || 'Unknown';
  }

  /**
   * Get CP state as human-readable text
   */
  getCpStateText(state) {
    const states = {
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
    };
    return states[state] || 'Unknown';
  }

  /**
   * Get authorization status as human-readable text
   */
  getAuthorizationText(status) {
    const texts = {
      0: 'Not used (IDLE)',
      1: 'Authorized (charging released)',
      2: 'Not authorized (charging not released)'
    };
    return texts[status] || 'Unknown';
  }

  /**
   * Get downgrade status as human-readable text
   */
  getDowngradeText(status) {
    const texts = {
      0: 'Not relevant (no EV connected)',
      1: 'Charging current not downgraded',
      2: 'Charging current downgraded'
    };
    return texts[status] || 'Unknown';
  }

  // ==========================================
  // MEASUREMENT METHODS
  // ==========================================

  /**
   * Get voltage measurements for all phases
   * @returns {Promise<Object>} Voltage data
   */
  async getVoltage() {
    try {
      const voltage = await this.client.readMultipleRegisters([
        'VOLTAGE_L1',
        'VOLTAGE_L2',
        'VOLTAGE_L3'
      ]);

      return {
        l1: voltage.VOLTAGE_L1,
        l2: voltage.VOLTAGE_L2,
        l3: voltage.VOLTAGE_L3,
        unit: 'V'
      };
    } catch (error) {
      this.logger.error(`Error getting voltage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current measurements for all phases
   * @returns {Promise<Object>} Current data
   */
  async getCurrent() {
    try {
      const current = await this.client.readMultipleRegisters([
        'CURRENT_L1',
        'CURRENT_L2',
        'CURRENT_L3'
      ]);

      return {
        l1: current.CURRENT_L1,
        l2: current.CURRENT_L2,
        l3: current.CURRENT_L3,
        unit: 'A'
      };
    } catch (error) {
      this.logger.error(`Error getting current: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get power measurements for all phases
   * @returns {Promise<Object>} Power data
   */
  async getPower() {
    try {
      const power = await this.client.readMultipleRegisters([
        'POWER_L1',
        'POWER_L2',
        'POWER_L3',
        'POWER_OVERALL'
      ]);

      return {
        l1: power.POWER_L1,
        l2: power.POWER_L2,
        l3: power.POWER_L3,
        total: power.POWER_OVERALL,
        unit: 'W'
      };
    } catch (error) {
      this.logger.error(`Error getting power: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get charging power in kW
   * @returns {Promise<number>} Power in kW
   */
  async getChargingPower() {
    try {
      const powerOverall = await this.client.readRegister('POWER_OVERALL');
      return powerOverall / 1000; // Convert W to kW
    } catch (error) {
      this.logger.error(`Error getting charging power: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get temperature
   * @returns {Promise<number>} Temperature in °C
   */
  async getTemperature() {
    try {
      return await this.client.readRegister('TEMPERATURE');
    } catch (error) {
      this.logger.error(`Error getting temperature: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // ENERGY AND SESSION METHODS
  // ==========================================

  /**
   * Get energy data
   * @returns {Promise<Object>} Energy data
   */
  async getEnergy() {
    try {
      const energy = await this.client.readMultipleRegisters([
        'CHARGED_ENERGY_SESSION',
        'CHARGED_ENERGY_TOTAL'
      ]);

      return {
        session: energy.CHARGED_ENERGY_SESSION,
        total: energy.CHARGED_ENERGY_TOTAL,
        unit: 'kWh'
      };
    } catch (error) {
      this.logger.error(`Error getting energy: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current session data
   * @returns {Promise<Object>} Session data
   */
  async getSessionData() {
    try {
      const session = await this.client.readMultipleRegisters([
        'MAX_CURRENT_SESSION',
        'CHARGED_ENERGY_SESSION',
        'DURATION_SESSION',
        'DETECTED_EV_PHASES'
      ]);

      return {
        maxCurrent: session.MAX_CURRENT_SESSION,
        chargedEnergy: session.CHARGED_ENERGY_SESSION,
        duration: session.DURATION_SESSION,
        durationFormatted: this.formatDuration(session.DURATION_SESSION),
        detectedPhases: session.DETECTED_EV_PHASES,
        unit: {
          current: 'A',
          energy: 'kWh',
          duration: 's'
        }
      };
    } catch (error) {
      this.logger.error(`Error getting session data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics() {
    try {
      const stats = await this.client.readMultipleRegisters([
        'CHARGED_ENERGY_TOTAL',
        'CHARGING_SESSIONS_TOTAL'
      ]);

      return {
        totalEnergy: stats.CHARGED_ENERGY_TOTAL,
        totalSessions: stats.CHARGING_SESSIONS_TOTAL,
        unit: {
          energy: 'kWh'
        }
      };
    } catch (error) {
      this.logger.error(`Error getting statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format duration from seconds to human-readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  // ==========================================
  // CONTROL METHODS
  // ==========================================

  /**
   * Set charging current limit
   * @param {number} ampere - Current limit in amperes (6-32A)
   * @returns {Promise<void>}
   */
  async setChargingCurrent(ampere) {
    try {
      // Validate current value
      if (ampere < MODBUS_CONFIG.MIN_CHARGING_CURRENT || ampere > MODBUS_CONFIG.MAX_CHARGING_CURRENT) {
        throw new Error(`Current must be between ${MODBUS_CONFIG.MIN_CHARGING_CURRENT}A and ${MODBUS_CONFIG.MAX_CHARGING_CURRENT}A`);
      }

      this.logger.info(`Setting charging current to ${ampere}A`);
      await this.client.writeRegister('CHARGING_CURRENT_EM', ampere);
      this.logger.info(`Successfully set charging current to ${ampere}A`);
    } catch (error) {
      this.logger.error(`Error setting charging current: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start charging (enable charging release)
   * @param {number} current - Initial charging current (default: 6A)
   * @returns {Promise<void>}
   */
  async startCharging(current = 6) {
    try {
      this.logger.info(`Starting charging with ${current}A...`);

      // Set charging current first
      await this.setChargingCurrent(current);

      // Wait a bit
      await this.delay(100);

      // Enable charging release
      await this.client.writeRegister('CHARGING_RELEASE_EM', 1);

      this.logger.info('Charging started successfully');
    } catch (error) {
      this.logger.error(`Error starting charging: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop charging (disable charging release)
   * @returns {Promise<void>}
   */
  async stopCharging() {
    try {
      this.logger.info('Stopping charging...');

      // Disable charging release
      await this.client.writeRegister('CHARGING_RELEASE_EM', 0);

      this.logger.info('Charging stopped successfully');
    } catch (error) {
      this.logger.error(`Error stopping charging: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pause charging temporarily
   * @returns {Promise<void>}
   */
  async pauseCharging() {
    try {
      this.logger.info('Pausing charging...');

      // Set current to 0 to pause without releasing
      await this.client.writeRegister('CHARGING_CURRENT_EM', 0);

      this.logger.info('Charging paused');
    } catch (error) {
      this.logger.error(`Error pausing charging: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resume charging after pause
   * @param {number} current - Charging current to resume with (default: 6A)
   * @returns {Promise<void>}
   */
  async resumeCharging(current = 6) {
    try {
      this.logger.info(`Resuming charging with ${current}A...`);

      await this.setChargingCurrent(current);

      this.logger.info('Charging resumed');
    } catch (error) {
      this.logger.error(`Error resuming charging: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set requested phases for dynamic phase switching
   * @param {number} phases - 0 for all phases, 1 for single phase
   * @returns {Promise<void>}
   */
  async setRequestedPhases(phases) {
    try {
      if (phases !== 0 && phases !== 1) {
        throw new Error('Phases must be 0 (all phases) or 1 (single phase)');
      }

      this.logger.info(`Setting requested phases to ${phases === 0 ? 'all' : 'single'}...`);
      await this.client.writeRegister('REQUESTED_PHASES', phases);
      this.logger.info('Requested phases set successfully');
    } catch (error) {
      this.logger.error(`Error setting requested phases: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lock/unlock EVSE
   * @param {boolean} lock - true to lock, false to unlock
   * @returns {Promise<void>}
   */
  async setLock(lock) {
    try {
      this.logger.info(`${lock ? 'Locking' : 'Unlocking'} EVSE...`);
      await this.client.writeRegister('LOCK_EVSE', lock ? 1 : 0);
      this.logger.info(`EVSE ${lock ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      this.logger.error(`Error setting lock: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // DIAGNOSTIC METHODS
  // ==========================================

  /**
   * Get diagnostic information
   * @returns {Promise<Object>} Diagnostic data
   */
  async getDiagnostics() {
    try {
      const diag = await this.client.readMultipleRegisters([
        'ACTIVE_ERROR_CODE',
        'MASTER_LOST_FALLBACK_STATE',
        'SWITCHED_PHASES',
        'TEMPERATURE'
      ]);

      return {
        activeErrorCode: diag.ACTIVE_ERROR_CODE,
        hasError: diag.ACTIVE_ERROR_CODE !== 0,
        masterLostFallback: diag.MASTER_LOST_FALLBACK_STATE === 1,
        switchedPhases: diag.SWITCHED_PHASES,
        temperature: diag.TEMPERATURE
      };
    } catch (error) {
      this.logger.error(`Error getting diagnostics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get configuration information
   * @returns {Promise<Object>} Configuration data
   */
  async getConfiguration() {
    try {
      const config = await this.client.readMultipleRegisters([
        'MAX_CURRENT_HOUSE',
        'MAX_CURRENT_EVSE',
        'PHASE_SWITCHING_MODE',
        'PHASE_OPTIONS_HW',
        'CABLE_LOCK_CONFIG',
        'MASTER_LOST_FALLBACK_CURRENT',
        'GRID_IMBALANCE',
        'GRID_PHASES_CONNECTED',
        'AUTHORIZATION'
      ]);

      return {
        maxCurrentHouse: config.MAX_CURRENT_HOUSE,
        maxCurrentEvse: config.MAX_CURRENT_EVSE,
        phaseSwitchingMode: config.PHASE_SWITCHING_MODE,
        phaseOptionsHw: config.PHASE_OPTIONS_HW,
        cableLock: config.CABLE_LOCK_CONFIG === 1,
        masterLostFallbackCurrent: config.MASTER_LOST_FALLBACK_CURRENT,
        gridImbalance: config.GRID_IMBALANCE === 1,
        gridPhasesConnected: config.GRID_PHASES_CONNECTED,
        authorization: config.AUTHORIZATION === 1
      };
    } catch (error) {
      this.logger.error(`Error getting configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all data at once
   * NOTE: Executes sequentially to avoid overwhelming the Modbus RTU serial connection
   * @returns {Promise<Object>} All available data
   */
  async getAllData() {
    try {
      // Execute sequentially to avoid Modbus RTU timeouts
      // Modbus RTU is a serial protocol and cannot handle concurrent requests
      const deviceInfo = await this.getDeviceInfo();
      const status = await this.getStatus();
      const voltage = await this.getVoltage();
      const current = await this.getCurrent();
      const power = await this.getPower();
      const energy = await this.getEnergy();
      const session = await this.getSessionData();
      const diagnostics = await this.getDiagnostics();
      const config = await this.getConfiguration();

      return {
        deviceInfo,
        status,
        measurements: {
          voltage,
          current,
          power
        },
        energy,
        session,
        diagnostics,
        configuration: config,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error getting all data: ${error.message}`);
      throw error;
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
}

export default AmtronController;
