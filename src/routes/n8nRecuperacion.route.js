/**
 * Rutas n8n para gestión de Recuperación de conversaciones
 * Protegidas con API Key
 *
 * WORKFLOW 1 - Marcar como visto:
 *   POST /n8n/recuperacion/marcar-visto-masivo
 *
 * WORKFLOW 2 - Envío de plantillas de recuperación:
 *   GET  /n8n/recuperacion/candidatos-recuperacion?tipo_recuperacion=1h
 *   POST /n8n/recuperacion/registrar-envio
 *
 * Utilidades:
 *   GET /n8n/recuperacion/chats-sin-respuesta
 */

const { Router } = require("express");
const N8nRecuperacionController = require("../controllers/n8nRecuperacion.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// ============================================
// NUEVOS ENDPOINTS
// ============================================

// GET /n8n/recuperacion/chats-sin-respuesta - Chats donde el BOT envió el último mensaje y el cliente no respondió
router.get("/chats-sin-respuesta", N8nRecuperacionController.getChatsSinRespuesta);

// POST /n8n/recuperacion/marcar-visto-masivo - WORKFLOW 1: Marcar como visto mensajes sin respuesta
router.post("/marcar-visto-masivo", N8nRecuperacionController.marcarVistoMasivo);

// GET /n8n/recuperacion/candidatos-recuperacion - WORKFLOW 2: Obtener candidatos para plantillas de recuperación
router.get("/candidatos-recuperacion", N8nRecuperacionController.getCandidatosRecuperacion);

// POST /n8n/recuperacion/registrar-envio - Registrar envío de plantilla de recuperación
router.post("/registrar-envio", N8nRecuperacionController.registrarEnvio);

// ============================================
// ENDPOINTS LEGACY (compatibilidad)
// ============================================

// @deprecated - Usar /chats-sin-respuesta
router.get("/chats-pendientes", N8nRecuperacionController.getChatsPendientes);

// @deprecated - Usar /marcar-visto-masivo
router.post("/marcar-visto", N8nRecuperacionController.marcarVisto);

module.exports = router;
