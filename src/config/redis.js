const { createClient } = require('redis');
const logger = require('./logger/loggerClient');

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger.error('[redis.js] Máximo de reintentos alcanzado. Redis no disponible.');
                return false;
            }
            const delay = Math.min(retries * 1000, 10000);
            logger.info(`[redis.js] Reintentando conexión Redis en ${delay / 1000}s (intento ${retries}/10)`);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    if (!redisClient._errorLogged) {
        logger.error(`[redis.js] Error de conexión Redis: ${err.message}`);
        redisClient._errorLogged = true;
    }
});

redisClient.on('connect', () => {
    redisClient._errorLogged = false;
    logger.info('[redis.js] Conexión a Redis establecida');
});

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        logger.error(`[redis.js] No se pudo conectar a Redis: ${err.message}`);
    }
};

module.exports = { redisClient, connectRedis };
