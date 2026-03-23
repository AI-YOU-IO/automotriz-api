const { Sequelize } = require('sequelize');
const logger = require('./logger/loggerClient');

const dbHost = process.env.DB_HOST || 'localhost';
const isLocalDb = dbHost === 'localhost' || dbHost === '127.0.0.1';
const useSsl = process.env.DB_SSL
  ? process.env.DB_SSL === 'true'
  : !isLocalDb;
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'chatbot_ai_core',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: dbHost,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: useSsl
      ? {
        ssl: {
          require: true,
          rejectUnauthorized
        }
      }
      : {},
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    timezone: '-05:00',
    pool: {
      max: 100,
      min: 10,
      acquire: 60000,
      idle: 10000,
      evict: 1000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      createdAt: 'fecha_registro',
      updatedAt: 'fecha_actualizacion'
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`[database.js] Conexion a PostgreSQL verificada. BD: ${process.env.DB_NAME}`);
    return true;
  } catch (error) {
    logger.error(`[database.js] Error verificando conexion a PostgreSQL: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection
};
