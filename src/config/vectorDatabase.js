const { Pool } = require('pg');
const logger = require('./logger/loggerClient');

const vectorPool = new Pool({
  host: process.env.VECTOR_DB_HOST,
  user: process.env.VECTOR_DB_USER,
  password: process.env.VECTOR_DB_PASSWORD,
  database: process.env.VECTOR_DB_NAME,
  port: parseInt(process.env.VECTOR_DB_PORT) || 5433,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

vectorPool.on('error', (err) => {
  logger.error(`[vectorDatabase.js] Error en pool: ${err.message}`);
});

const testVectorConnection = async () => {
  const client = await vectorPool.connect();
  try {
    await client.query('SELECT 1');
    logger.info(`[vectorDatabase.js] Conexion a Vector DB verificada. BD: ${process.env.VECTOR_DB_NAME}`);
  } finally {
    client.release();
  }
};

module.exports = { vectorPool, testVectorConnection };
