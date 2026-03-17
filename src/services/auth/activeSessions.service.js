/**
 * Servicio para control de sesiones activas únicas (Solo Redis)
 *
 * Regla: Solo se permite una sesión activa por usuario.
 * - Si ya hay una sesión activa desde OTRO dispositivo, se cierra la anterior y se permite el nuevo login.
 * - El deviceId debe ser proporcionado por el frontend (generado y almacenado en localStorage).
 * - Cada nueva sesión genera un sessionId único que se incluye en el JWT.
 * - En cada petición se verifica que el sessionId del JWT coincida con Redis.
 */

const { redisClient } = require('../../config/redis');
const logger = require('../../config/logger/loggerClient');
const crypto = require('crypto');

// Configuración
const CONFIG = {
  SESSION_DURATION_SECONDS: 30 * 60, // 30 minutos (debe coincidir con NextAuth)
  REDIS_PREFIX: 'active_session:'
};

/**
 * Genera la clave de Redis para sesión activa de un usuario
 */
const getRedisKey = (userId) => {
  return `${CONFIG.REDIS_PREFIX}${userId}`;
};

/**
 * Genera un ID de sesión único
 */
const generateSessionId = () => {
  return crypto.randomUUID();
};

/**
 * Verifica si el usuario ya tiene una sesión activa
 * @param {number} userId - ID del usuario
 * @param {string} deviceId - ID único del dispositivo (proporcionado por el frontend)
 * @returns {Object} { hasActiveSession, sessionInfo, isSameDevice }
 */
const hasActiveSession = async (userId, deviceId) => {
  try {
    if (!redisClient.isOpen) {
      logger.warn('[activeSessions.service] Redis no disponible, permitiendo login');
      return { hasActiveSession: false };
    }

    const redisKey = getRedisKey(userId);
    const sessionData = await redisClient.get(redisKey);

    if (sessionData) {
      const session = JSON.parse(sessionData);
      const ttl = await redisClient.ttl(redisKey);

      // Comparar con el deviceId de la sesión existente
      const isSameDevice = session.deviceId === deviceId;

      logger.info(`[activeSessions.service] Sesión activa encontrada para usuario ${userId}. Mismo dispositivo: ${isSameDevice}`);

      return {
        hasActiveSession: true,
        isSameDevice,
        sessionInfo: {
          ...session,
          remainingSeconds: ttl > 0 ? ttl : 0
        }
      };
    }

    return { hasActiveSession: false, isSameDevice: false };
  } catch (error) {
    logger.error(`[activeSessions.service] Error verificando sesión activa: ${error.message}`);
    return { hasActiveSession: false, isSameDevice: false };
  }
};

/**
 * Registra una nueva sesión activa para el usuario (con operación atómica)
 * Siempre cierra la sesión anterior si existe y crea una nueva.
 * @param {number} userId - ID del usuario
 * @param {string} deviceId - ID único del dispositivo (proporcionado por el frontend)
 * @param {Object} extraInfo - Información adicional { ip, userAgent }
 * @returns {Object} { sessionId, previousSession }
 */
const registerSession = async (userId, deviceId, extraInfo = {}) => {
  try {
    if (!redisClient.isOpen) {
      logger.warn('[activeSessions.service] Redis no disponible, sesión no registrada');
      return { sessionId: null };
    }

    const redisKey = getRedisKey(userId);
    const sessionId = generateSessionId();
    const now = new Date();

    // Obtener sesión anterior si existe (para logging/notificaciones)
    const previousSessionData = await redisClient.get(redisKey);
    let previousSession = null;

    if (previousSessionData) {
      previousSession = JSON.parse(previousSessionData);
      logger.info(`[activeSessions.service] Cerrando sesión anterior para usuario ${userId} (device: ${previousSession.deviceId})`);
    }

    const sessionData = {
      sessionId,
      userId,
      deviceId,
      ip: extraInfo.ip || 'unknown',
      userAgent: extraInfo.userAgent || 'unknown',
      loginTime: now.toISOString()
    };

    // Usar SET con EX para establecer la sesión (operación atómica)
    await redisClient.setEx(
      redisKey,
      CONFIG.SESSION_DURATION_SECONDS,
      JSON.stringify(sessionData)
    );

    logger.info(`[activeSessions.service] Nueva sesión registrada para usuario ${userId}: ${sessionId} (device: ${deviceId})`);

    return {
      sessionId,
      deviceId,
      durationSeconds: CONFIG.SESSION_DURATION_SECONDS,
      previousSession
    };
  } catch (error) {
    logger.error(`[activeSessions.service] Error registrando sesión: ${error.message}`);
    return { sessionId: null };
  }
};

/**
 * Valida que el sessionId del token coincida con la sesión activa en Redis
 * @param {number} userId - ID del usuario
 * @param {string} sessionId - ID de sesión del JWT
 * @returns {Object} { valid, reason }
 */
const validateSession = async (userId, sessionId) => {
  try {
    if (!redisClient.isOpen) {
      logger.warn('[activeSessions.service] Redis no disponible, permitiendo acceso');
      return { valid: true };
    }

    const redisKey = getRedisKey(userId);
    const sessionData = await redisClient.get(redisKey);

    if (!sessionData) {
      return { valid: false, reason: 'NO_ACTIVE_SESSION' };
    }

    const session = JSON.parse(sessionData);

    if (session.sessionId !== sessionId) {
      logger.warn(`[activeSessions.service] SessionId no coincide para usuario ${userId}. Token: ${sessionId}, Redis: ${session.sessionId}`);
      return { valid: false, reason: 'SESSION_REPLACED' };
    }

    return { valid: true };
  } catch (error) {
    logger.error(`[activeSessions.service] Error validando sesión: ${error.message}`);
    return { valid: true }; // En caso de error, permitir acceso
  }
};

/**
 * Renueva el TTL de la sesión activa (para mantener sesión mientras está activo)
 * @param {number} userId - ID del usuario
 */
const renewSession = async (userId) => {
  try {
    if (!redisClient.isOpen) return;

    const redisKey = getRedisKey(userId);
    await redisClient.expire(redisKey, CONFIG.SESSION_DURATION_SECONDS);
  } catch (error) {
    logger.error(`[activeSessions.service] Error renovando sesión: ${error.message}`);
  }
};

/**
 * Cierra/invalida la sesión de un usuario (logout)
 */
const closeSession = async (userId) => {
  try {
    if (!redisClient.isOpen) {
      logger.warn('[activeSessions.service] Redis no disponible');
      return { closed: false };
    }

    const redisKey = getRedisKey(userId);
    await redisClient.del(redisKey);

    logger.info(`[activeSessions.service] Sesión cerrada para usuario ${userId}`);

    return { closed: true };
  } catch (error) {
    logger.error(`[activeSessions.service] Error cerrando sesión: ${error.message}`);
    return { closed: false };
  }
};

module.exports = {
  hasActiveSession,
  registerSession,
  validateSession,
  renewSession,
  closeSession,
  CONFIG
};
