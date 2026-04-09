require('dotenv/config');

const app = require('./app.js');

// Conexión PostgreSQL con Sequelize
const db = require('./models/sequelize');
const { connectRedis } = require('./config/redis');
const { testVectorConnection } = require('./config/vectorDatabase');

const logger = require('./config/logger/loggerClient');
const { initAbandonedConversationsCron } = require('./cron/abandonedConversations.cron.js');
const { initSpeechAnalysisChatCron } = require('./cron/speechAnalysisChat.cron.js');

const PORT = process.env.PORT || 3020;

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a PostgreSQL con Sequelize
  try {
    await db.testConnection();
    logger.info(`[server.js] PostgreSQL (Sequelize) verificado`);
  } catch (error) {
    logger.error(`[server.js] PostgreSQL no disponible: ${error.message}`);
  }

  // Probar conexión a Vector DB
  try {
    await testVectorConnection();
    logger.info(`[server.js] Vector DB verificada`);
  } catch (error) {
    logger.error(`[server.js] Vector DB no disponible: ${error.message}`);
  }

  // Conectar a Redis
  try {
    await connectRedis();
    logger.info(`[server.js] Redis verificado`);
  } catch (error) {
    logger.error(`[server.js] Redis no disponible: ${error.message}`);
  }

  // Iniciar cron jobs
  initAbandonedConversationsCron();
  initSpeechAnalysisChatCron();

  // Iniciar servidor aunque falle la conexión
  app.listen(PORT, () => {
    logger.info(`[server.js] Server running on http://localhost:${PORT}`);
  });
};

startServer();
