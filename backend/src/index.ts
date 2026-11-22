import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, async () => {
  try {
    await prisma.$connect();
    console.log(`🚀 [Backend] Course Registration API running on http://localhost:${env.PORT}`);
    console.log(`🔌 [Database] Connected successfully to PostgreSQL via Prisma`);
    console.log(`🌐 [CORS] Configured origin: ${env.FRONTEND_URL}`);
  } catch (error) {
    console.error('❌ [Database] Failed to connect on startup:', error);
  }
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 [Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 [Server] Closed remaining active HTTP connections.');
    try {
      await prisma.$disconnect();
      console.log('🔌 [Database] Prisma disconnected.');
    } catch (err) {
      console.error('Error disconnecting Prisma:', err);
    }
    process.exit(0);
  });

  // Force close after 10s if hanging
  setTimeout(() => {
    console.error('⚠️ [Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('❌ [Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [Server] Uncaught Exception:', error);
  process.exit(1);
});
