#!/usr/bin/env node

/**
 * Production Server for Warung Telegram Bot
 *
 * This server provides:
 * - Environment-based configuration
 * - Graceful shutdown handling
 * - Production logging
 * - Health checks
 * - Error handling
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductionServer {
  constructor() {
    this.app = null;
    this.isShuttingDown = false;
    this.setupEnvironment();
    this.setupSignalHandlers();
  }

  setupEnvironment() {
    // Set default production environment
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';

    // Validate required environment variables
    const requiredVars = ['TELEGRAM_BOT_TOKEN', 'DATABASE_URL'];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach((varName) => {
        console.error(`   - ${varName}`);
      });
      console.error(
        '\nPlease set these environment variables before starting the server.',
      );
      process.exit(1);
    }

    // Set default port
    process.env.PORT = process.env.PORT || '3000';

    console.log('✅ Environment configuration validated');
    console.log(`🚀 Starting in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Port: ${process.env.PORT}`);
  }

  setupSignalHandlers() {
    // Handle graceful shutdown
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  async start() {
    try {
      console.log('🔧 Starting Warung Telegram Bot Server...');

      // Check if dist/src/main.js exists
      const mainPath = join(__dirname, 'dist', 'src', 'main.js');

      // Start the NestJS application
      this.app = spawn('node', [mainPath], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=512',
        },
      });

      this.app.on('error', (error) => {
        console.error('💥 Failed to start application:', error);
        process.exit(1);
      });

      this.app.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          console.error(
            `💥 Application exited unexpectedly with code ${code} and signal ${signal}`,
          );
          process.exit(code || 1);
        }
      });

      console.log('✅ Server started successfully');
      console.log(`🌐 Application available on port ${process.env.PORT}`);
      console.log('📱 Telegram bot is ready to receive messages');

      // Keep the process alive
      process.stdin.resume();
    } catch (error) {
      console.error('💥 Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown(exitCode = 0) {
    if (this.isShuttingDown) {
      console.log('⚠️  Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log('🛑 Shutting down server...');

    try {
      if (this.app) {
        console.log('📱 Stopping Telegram bot...');

        // Send SIGTERM to the child process
        this.app.kill('SIGTERM');

        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('⚠️  Forcing shutdown...');
            this.app.kill('SIGKILL');
            resolve();
          }, 10000); // 10 second timeout

          this.app.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      console.log('✅ Server shutdown complete');
      process.exit(exitCode);
    } catch (error) {
      console.error('💥 Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Health check endpoint (for monitoring)
  async healthCheck() {
    try {
      // You can add custom health checks here
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version || '0.0.1',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ProductionServer();

  // Add health check route if needed
  if (process.argv.includes('--health')) {
    server.healthCheck().then((health) => {
      console.log(JSON.stringify(health, null, 2));
      process.exit(health.status === 'healthy' ? 0 : 1);
    });
  } else {
    server.start().catch((error) => {
      console.error('💥 Server startup failed:', error);
      process.exit(1);
    });
  }
}

export default ProductionServer;
