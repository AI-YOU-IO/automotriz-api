/**
 * Servicio para control de intentos de login
 *
 * Solo usa Redis con TTL corto para que los intentos expiren automáticamente.
 * Al cerrar el navegador y volver después de unos minutos, los intentos se reinician.
 *
 * NO persiste en BD para evitar acumulación de intentos antiguos.
 */

const { redisClient } = require('../../config/redis');
const logger = require('../../config/logger/loggerClient');

// Configuración
const CONFIG = {
  MAX_ATTEMPTS: 5,             // Máximo de intentos permitidos
  BLOCK_DURATION_SECONDS: 180, // 3 minutos de bloqueo cuando se alcanza el máximo
  ATTEMPTS_TTL_SECONDS: 300,   // 5 minutos - los intentos expiran después de inactividad
  REDIS_PREFIX: 'login_attempts:'
};

/**
 * Genera la clave de Redis para un usuario
 */
const getRedisKey = (username) => {
  return `${CONFIG.REDIS_PREFIX}${username.toLowerCase()}`;
};

/**
 * Verifica si un usuario está bloqueado
 * Solo usa Redis - los intentos expiran automáticamente después de ATTEMPTS_TTL_SECONDS
 */
const isBlocked = async (username, Usuario) => {
  try {
    const redisKey = getRedisKey(username);

    // Verificar en Redis
    if (redisClient.isOpen) {
      const attempts = await redisClient.get(redisKey);
      if (attempts && parseInt(attempts) >= CONFIG.MAX_ATTEMPTS) {
        const ttl = await redisClient.ttl(redisKey);
        return {
          blocked: true,
          source: 'redis',
          remainingSeconds: ttl > 0 ? ttl : CONFIG.BLOCK_DURATION_SECONDS,
          attempts: parseInt(attempts)
        };
      }
    }

    return { blocked: false };
  } catch (error) {
    logger.error(`[loginAttempts.service] Error verificando bloqueo: ${error.message}`);
    return { blocked: false }; // En caso de error, permitir intento
  }
};

/**
 * Registra un intento fallido de login
 * Solo usa Redis - no persiste en BD para evitar acumulación
 */
const registerFailedAttempt = async (username, Usuario) => {
  try {
    const redisKey = getRedisKey(username);
    let currentAttempts = 1;

    // Incrementar en Redis
    if (redisClient.isOpen) {
      currentAttempts = await redisClient.incr(redisKey);

      // Si alcanzó el máximo de intentos, aplicar TTL de bloqueo
      // Si no, aplicar TTL de expiración de intentos (más largo)
      const shouldBlock = currentAttempts >= CONFIG.MAX_ATTEMPTS;
      const ttl = shouldBlock ? CONFIG.BLOCK_DURATION_SECONDS : CONFIG.ATTEMPTS_TTL_SECONDS;
      await redisClient.expire(redisKey, ttl);
    }

    const shouldBlock = currentAttempts >= CONFIG.MAX_ATTEMPTS;

    logger.info(`[loginAttempts.service] Intento fallido para ${username}. Total: ${currentAttempts}/${CONFIG.MAX_ATTEMPTS}`);

    return {
      attempts: currentAttempts,
      maxAttempts: CONFIG.MAX_ATTEMPTS,
      shouldBlock,
      remainingAttempts: Math.max(0, CONFIG.MAX_ATTEMPTS - currentAttempts),
      blockDurationSeconds: shouldBlock ? CONFIG.BLOCK_DURATION_SECONDS : 0
    };
  } catch (error) {
    logger.error(`[loginAttempts.service] Error registrando intento fallido: ${error.message}`);
    return {
      attempts: 0,
      maxAttempts: CONFIG.MAX_ATTEMPTS,
      shouldBlock: false,
      remainingAttempts: CONFIG.MAX_ATTEMPTS
    };
  }
};

/**
 * Limpia los intentos fallidos después de un login exitoso
 * Solo limpia Redis - la BD ya no se usa para esto
 */
const clearAttempts = async (username, Usuario) => {
  try {
    const redisKey = getRedisKey(username);

    // Limpiar en Redis
    if (redisClient.isOpen) {
      await redisClient.del(redisKey);
    }

    logger.info(`[loginAttempts.service] Intentos limpiados para ${username}`);
  } catch (error) {
    logger.error(`[loginAttempts.service] Error limpiando intentos: ${error.message}`);
  }
};

module.exports = {
  isBlocked,
  registerFailedAttempt,
  clearAttempts,
  CONFIG
};
