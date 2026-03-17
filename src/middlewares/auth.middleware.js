const JWTService = require('../services/crm/jwt.service');
const logger = require('../config/logger/loggerClient');
const activeSessionsService = require('../services/auth/activeSessions.service');

/**
 * Middleware para verificar JWT token y validar sesión activa en Redis
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.clientError(401, 'Token no proporcionado');
    }

    // Formato: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.clientError(401, 'Formato de token inválido');
    }

    const token = parts[1];

    // Verificar token
    try {
      const decoded = JWTService.verify(token);

      // Agregar datos del usuario al request
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        rolId: decoded.rolId,
        rolNombre: decoded.rolNombre,
        idEmpresa: decoded.idEmpresa || null,
        sessionId: decoded.jti || null
      };

      // Si el token tiene sessionId (jti), validar contra Redis
      // Los tokens antiguos sin jti son permitidos
      if (decoded.jti) {
        const sessionValidation = await activeSessionsService.validateSession(decoded.userId, decoded.jti);

        if (!sessionValidation.valid) {
          logger.warn(`[authMiddleware] Sesión inválida para usuario ${decoded.userId}: ${sessionValidation.reason}`);

          // Mensaje específico según la razón
          const message = sessionValidation.reason === 'SESSION_REPLACED'
            ? 'Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo'
            : 'Sesión expirada. Por favor inicia sesión nuevamente';

          return res.clientError(401, message);
        }

        // Renovar TTL de la sesión
        await activeSessionsService.renewSession(decoded.userId);
      }

      next();
    } catch (error) {
      logger.warn(`[authMiddleware] Token inválido: ${error.message}`);
      return res.clientError(401, error.message || 'Token inválido');
    }

  } catch (error) {
    logger.error(`[authMiddleware] ${error.message}`);
    return res.serverError(500, 'Error al verificar autenticación');
  }
};

module.exports = authMiddleware;
