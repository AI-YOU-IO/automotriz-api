const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

class JWTService {

  /**
   * Generar token JWT con sessionId opcional para control de sesión única
   * @param {Object} payload - Datos del usuario
   * @param {string} sessionId - ID de sesión único (opcional, de activeSessions.service)
   */
  generate(payload, sessionId = null) {
    try {
      const tokenPayload = {
        ...payload,
        // jti (JWT ID) identifica la sesión - solo se incluye si se proporciona
        ...(sessionId && { jti: sessionId })
      };

      return jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION
      });
    } catch (error) {
      throw new Error(`[JWTService.generate] ${error.message}`);
    }
  }

  /**
   * Verificar y decodificar token
   */
  verify(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw new Error(`[JWTService.verify] ${error.message}`);
    }
  }

  /**
   * Decodificar token sin verificar (solo para debug)
   */
  decode(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`[JWTService.decode] ${error.message}`);
    }
  }
}

module.exports = new JWTService();
