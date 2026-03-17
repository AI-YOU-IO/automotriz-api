const { Router } = require("express");
const usuarioRepository = require("../repositories/usuario.repository.js");
const logger = require('../config/logger/loggerClient.js');
const JWTService = require('../services/crm/jwt.service.js');
const bcrypt = require('bcrypt');
const loginAttemptsService = require('../services/auth/loginAttempts.service.js');
const activeSessionsService = require('../services/auth/activeSessions.service.js');
const { Usuario } = require('../models/sequelize');

const router = Router();

router.post("/login",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Iniciar sesión'
  // #swagger.description = 'Autenticación de usuario con control de sesión única por dispositivo'
  async (req, res) => {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Body:', req.body);
    try {
      const { usuario, password, deviceId } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ msg: "Usuario y contraseña son requeridos" });
      }

      // 1. Verificar si el usuario está bloqueado
      const blockStatus = await loginAttemptsService.isBlocked(usuario, Usuario);
      if (blockStatus.blocked) {
        return res.status(429).json({
          msg: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(blockStatus.remainingSeconds / 60)} minuto(s).`,
          blocked: true,
          remainingSeconds: blockStatus.remainingSeconds,
          attempts: blockStatus.attempts
        });
      }

      const user = await usuarioRepository.findByUsername(usuario);

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          // Registrar intento fallido
          const attemptResult = await loginAttemptsService.registerFailedAttempt(usuario, Usuario);

          if (attemptResult.shouldBlock) {
            return res.status(429).json({
              msg: `Has excedido el número máximo de intentos. Tu cuenta está bloqueada por ${Math.ceil(attemptResult.blockDurationSeconds / 60)} minutos.`,
              blocked: true,
              remainingSeconds: attemptResult.blockDurationSeconds,
              attempts: attemptResult.attempts
            });
          }

          return res.status(401).json({
            msg: "El usuario o contraseña no coincide. Por favor vuelva a intentar",
            remainingAttempts: attemptResult.remainingAttempts
          });
        }

        // Login exitoso - limpiar intentos fallidos
        await loginAttemptsService.clearAttempts(usuario, Usuario);

        const usuarioData = user.toJSON();

        // Usuarios exentos del control de sesión única (pueden tener múltiples sesiones)
        const exemptUserIds = [1, 8];
        let sessionId = null;

        // Solo aplicar control de sesión única a usuarios no exentos
        if (!exemptUserIds.includes(usuarioData.id)) {
          // deviceId es requerido para usuarios no exentos
          if (!deviceId) {
            return res.status(400).json({ msg: "deviceId es requerido" });
          }

          // Información adicional del dispositivo (para logs)
          const extraInfo = {
            ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown'
          };

          // Verificar si hay sesión activa previa
          const sessionCheck = await activeSessionsService.hasActiveSession(usuarioData.id, deviceId);

          if (sessionCheck.hasActiveSession && !sessionCheck.isSameDevice) {
            // Hay sesión en otro dispositivo - la cerramos y permitimos el nuevo login
            logger.info(`[auth.route.js] Cerrando sesión anterior en otro dispositivo para usuario ${usuarioData.id}`);
          }

          // Registrar nueva sesión (siempre reemplaza la anterior si existe)
          const sessionResult = await activeSessionsService.registerSession(usuarioData.id, deviceId, extraInfo);
          sessionId = sessionResult.sessionId;

          if (sessionResult.previousSession && sessionResult.previousSession.deviceId !== deviceId) {
            logger.info(`[auth.route.js] Sesión anterior cerrada para usuario ${usuarioData.id}, dispositivo anterior: ${sessionResult.previousSession.deviceId}`);
          }
        }

        // Generar token (con sessionId solo para usuarios no exentos)
        const token = JWTService.generate({
          userId: usuarioData.id,
          username: usuarioData.usuario,
          rolId: usuarioData.id_rol,
          rolNombre: usuarioData.rol?.nombre || '',
          idEmpresa: usuarioData.id_empresa || null
        }, sessionId);

        // Obtener módulos del rol del usuario
        const modulos = await usuarioRepository.findModulosByRol(usuarioData.id_rol);

        usuarioData.password = "";
        usuarioData.rol_nombre = usuarioData.rol?.nombre || '';

        return res.status(200).json({ user: usuarioData, token, modulos });
      }
      else {
        // Usuario no existe - registrar intento fallido igualmente
        const attemptResult = await loginAttemptsService.registerFailedAttempt(usuario, Usuario);

        if (attemptResult.shouldBlock) {
          return res.status(429).json({
            msg: `Has excedido el número máximo de intentos. Intenta de nuevo en ${Math.ceil(attemptResult.blockDurationSeconds / 60)} minutos.`,
            blocked: true,
            remainingSeconds: attemptResult.blockDurationSeconds
          });
        }

        return res.status(401).json({
          msg: "El usuario o contraseña no coincide. Por favor vuelva a intentar",
          remainingAttempts: attemptResult.remainingAttempts
        });
      }
    }
    catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('===================');
      logger.error(`[auth.route.js] Error al procesar login: ${error.message}`);
      return res.status(500).json({ msg: "Error al verificar usuario" });
    }
  });

router.post("/logout",
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Cerrar sesión'
  // #swagger.description = 'Cierra la sesión activa del usuario'
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ msg: "userId es requerido" });
      }

      const result = await activeSessionsService.closeSession(userId);

      if (result.closed) {
        logger.info(`[auth.route.js] Sesión cerrada para usuario ${userId}`);
        return res.status(200).json({ msg: "Sesión cerrada exitosamente" });
      } else {
        return res.status(500).json({ msg: "Error al cerrar sesión" });
      }
    } catch (error) {
      logger.error(`[auth.route.js] Error en logout: ${error.message}`);
      return res.status(500).json({ msg: "Error al cerrar sesión" });
    }
  });

module.exports = router;