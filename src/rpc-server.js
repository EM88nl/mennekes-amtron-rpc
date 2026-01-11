/**
 * JSON-RPC Server for Amtron Controller
 * Provides remote procedure calls for controlling and monitoring the Amtron charger
 */

import jayson from 'jayson/promise/index.js';
import http from 'http';

export class RpcServer {
  /**
   * @param {AmtronController} controller - Amtron controller instance
   * @param {Object} config - Server configuration
   * @param {number} config.port - Server port (default: 8080)
   * @param {Object} logger - Winston logger instance
   */
  constructor(controller, config, logger) {
    this.controller = controller;
    this.config = config;
    this.logger = logger;
    this.server = null;
    this.httpServer = null;

    // Create Jayson server with methods
    this.server = jayson.Server({
      // Health check
      ping: this.handlePing.bind(this),
      health: this.handleHealth.bind(this),

      // Device information
      getDeviceInfo: this.wrapMethod(this.controller.getDeviceInfo.bind(this.controller)),

      // Status methods
      getStatus: this.wrapMethod(this.controller.getStatus.bind(this.controller)),

      // Measurement methods
      getVoltage: this.wrapMethod(this.controller.getVoltage.bind(this.controller)),
      getCurrent: this.wrapMethod(this.controller.getCurrent.bind(this.controller)),
      getPower: this.wrapMethod(this.controller.getPower.bind(this.controller)),
      getChargingPower: this.wrapMethod(this.controller.getChargingPower.bind(this.controller)),
      getTemperature: this.wrapMethod(this.controller.getTemperature.bind(this.controller)),

      // Energy and session methods
      getEnergy: this.wrapMethod(this.controller.getEnergy.bind(this.controller)),
      getSessionData: this.wrapMethod(this.controller.getSessionData.bind(this.controller)),
      getStatistics: this.wrapMethod(this.controller.getStatistics.bind(this.controller)),

      // Control methods
      setChargingCurrent: this.wrapMethod(this.handleSetChargingCurrent.bind(this)),
      startCharging: this.wrapMethod(this.handleStartCharging.bind(this)),
      stopCharging: this.wrapMethod(this.controller.stopCharging.bind(this.controller)),
      pauseCharging: this.wrapMethod(this.controller.pauseCharging.bind(this.controller)),
      resumeCharging: this.wrapMethod(this.handleResumeCharging.bind(this)),
      setRequestedPhases: this.wrapMethod(this.handleSetRequestedPhases.bind(this)),
      setLock: this.wrapMethod(this.handleSetLock.bind(this)),

      // Diagnostic methods
      getDiagnostics: this.wrapMethod(this.controller.getDiagnostics.bind(this.controller)),
      getConfiguration: this.wrapMethod(this.controller.getConfiguration.bind(this.controller))
    });
  }

  /**
   * Wrap controller methods with error handling
   * @param {Function} method - Controller method
   * @returns {Function} Wrapped method
   */
  wrapMethod(method) {
    return async (args) => {
      try {
        const result = await method(args);
        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        this.logger.error(`RPC method error: ${error.message}`);
        throw this.server.error(-32000, error.message);
      }
    };
  }

  /**
   * Handle ping request
   */
  async handlePing() {
    return {
      success: true,
      message: 'pong',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle health check request
   */
  async handleHealth() {
    const isConnected = this.controller.client.getConnectionStatus();
    return {
      success: true,
      data: {
        status: isConnected ? 'healthy' : 'disconnected',
        modbusConnected: isConnected,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle setChargingCurrent with parameter validation
   */
  async handleSetChargingCurrent(params) {
    if (!params || typeof params.ampere !== 'number') {
      throw new Error('Parameter "ampere" is required and must be a number');
    }
    await this.controller.setChargingCurrent(params.ampere);
    return { message: `Charging current set to ${params.ampere}A` };
  }

  /**
   * Handle startCharging with optional current parameter
   */
  async handleStartCharging(params) {
    const current = params?.current || 6;
    await this.controller.startCharging(current);
    return { message: `Charging started with ${current}A` };
  }

  /**
   * Handle resumeCharging with optional current parameter
   */
  async handleResumeCharging(params) {
    const current = params?.current || 6;
    await this.controller.resumeCharging(current);
    return { message: `Charging resumed with ${current}A` };
  }

  /**
   * Handle setRequestedPhases with parameter validation
   */
  async handleSetRequestedPhases(params) {
    if (!params || (params.phases !== 0 && params.phases !== 1)) {
      throw new Error('Parameter "phases" is required and must be 0 (all) or 1 (single)');
    }
    await this.controller.setRequestedPhases(params.phases);
    return { message: `Requested phases set to ${params.phases === 0 ? 'all' : 'single'}` };
  }

  /**
   * Handle setLock with parameter validation
   */
  async handleSetLock(params) {
    if (!params || typeof params.lock !== 'boolean') {
      throw new Error('Parameter "lock" is required and must be a boolean');
    }
    await this.controller.setLock(params.lock);
    return { message: `EVSE ${params.lock ? 'locked' : 'unlocked'}` };
  }

  /**
   * Start the RPC server
   * @returns {Promise<void>}
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        // Use jayson's built-in HTTP server
        this.httpServer = this.server.http();

        this.httpServer.listen(this.config.port, () => {
          this.logger.info(`JSON-RPC server started on port ${this.config.port}`);
          resolve();
        });

        this.httpServer.on('error', (error) => {
          this.logger.error(`HTTP server error: ${error.message}`);
          reject(error);
        });

      } catch (error) {
        this.logger.error(`Failed to start RPC server: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Stop the RPC server
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          this.logger.info('JSON-RPC server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default RpcServer;
