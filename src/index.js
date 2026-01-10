/**
 * Mennekes Amtron RPC Server
 * Entry point for the application
 */

import dotenv from 'dotenv';
import winston from 'winston';
import { ModbusClient } from './modbus-client.js';
import { AmtronController } from './amtron-controller.js';
import { RpcServer } from './rpc-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configuration
const config = {
  modbus: {
    port: process.env.MODBUS_PORT || (process.platform === 'win32' ? 'COM3' : '/dev/ttyUSB0'),
    baudRate: parseInt(process.env.MODBUS_BAUDRATE) || 57600,
    dataBits: parseInt(process.env.MODBUS_DATABITS) || 8,
    stopBits: parseInt(process.env.MODBUS_STOPBITS) || 2,
    parity: process.env.MODBUS_PARITY || 'none',
    slaveId: parseInt(process.env.MODBUS_SLAVE_ID) || 1,
    timeout: parseInt(process.env.MODBUS_TIMEOUT) || 1000,
    reconnectInterval: parseInt(process.env.MODBUS_RECONNECT_INTERVAL) || 5000,
    maxRetries: parseInt(process.env.MODBUS_MAX_RETRIES) || 3
  },
  rpc: {
    port: parseInt(process.env.RPC_PORT) || 8080
  },
  heartbeat: {
    enabled: process.env.HEARTBEAT_ENABLED !== 'false' // Default: true
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/amtron-rpc.log'
  }
};

// Setup logger
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mennekes-amtron-rpc' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Write all logs with level `error` and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Also log to console in non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Global instances
let modbusClient;
let controller;
let rpcServer;

/**
 * Initialize and start the application
 */
async function start() {
  try {
    logger.info('='.repeat(60));
    logger.info('Starting Mennekes Amtron RPC Server');
    logger.info('='.repeat(60));
    logger.info(`Platform: ${process.platform}`);
    logger.info(`Node version: ${process.version}`);
    logger.info('Configuration:');
    logger.info(`  Modbus Port: ${config.modbus.port}`);
    logger.info(`  Modbus Baud Rate: ${config.modbus.baudRate}`);
    logger.info(`  Modbus Slave ID: ${config.modbus.slaveId}`);
    logger.info(`  RPC Server Port: ${config.rpc.port}`);
    logger.info(`  Heartbeat Enabled: ${config.heartbeat.enabled}`);
    logger.info('='.repeat(60));

    // Create Modbus client
    logger.info('Creating Modbus client...');
    modbusClient = new ModbusClient(config.modbus, logger);

    // Setup event listeners
    modbusClient.on('connected', () => {
      logger.info('Modbus client connected');
    });

    modbusClient.on('disconnected', () => {
      logger.warn('Modbus client disconnected');
    });

    modbusClient.on('connectionLost', () => {
      logger.error('Modbus connection lost, attempting to reconnect...');
    });

    modbusClient.on('error', (error) => {
      logger.error(`Modbus error: ${error.message}`);
    });

    // Connect to Modbus device
    logger.info('Connecting to Modbus device...');
    await modbusClient.connect();

    // Start heartbeat if enabled
    if (config.heartbeat.enabled) {
      logger.info('Starting heartbeat...');
      modbusClient.startHeartbeat();
    }

    // Create controller
    logger.info('Creating Amtron controller...');
    controller = new AmtronController(modbusClient, logger);

    // Get device info
    try {
      const deviceInfo = await controller.getDeviceInfo();
      logger.info('Device Information:');
      logger.info(`  Modbus Version: ${deviceInfo.modbusVersion}`);
      logger.info(`  Firmware Version: ${deviceInfo.firmwareVersion}`);
      logger.info(`  Serial Number: ${deviceInfo.serialNumber}`);
      logger.info(`  Max Current EVSE: ${deviceInfo.maxCurrentEVSE}A`);
    } catch (error) {
      logger.warn(`Could not read device info: ${error.message}`);
    }

    // Create and start RPC server
    logger.info('Creating RPC server...');
    rpcServer = new RpcServer(controller, config.rpc, logger);

    logger.info('Starting RPC server...');
    await rpcServer.start();

    logger.info('='.repeat(60));
    logger.info('Mennekes Amtron RPC Server is running');
    logger.info(`JSON-RPC endpoint: http://localhost:${config.rpc.port}`);
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  logger.info(`\n${signal} received, shutting down gracefully...`);

  try {
    // Stop RPC server
    if (rpcServer) {
      logger.info('Stopping RPC server...');
      await rpcServer.stop();
    }

    // Stop heartbeat
    if (modbusClient) {
      logger.info('Stopping heartbeat...');
      modbusClient.stopHeartbeat();
    }

    // Disconnect Modbus
    if (modbusClient) {
      logger.info('Disconnecting Modbus client...');
      await modbusClient.disconnect();
    }

    logger.info('Shutdown complete');
    process.exit(0);

  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

// Start the application
start();
