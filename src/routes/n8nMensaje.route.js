/**
 * Rutas n8n para gestión de Mensajes
 * Protegidas con API Key
 */

const { Router } = require("express");
const N8nMensajeController = require("../controllers/n8nMensaje.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// POST /n8n/mensajes - Insertar mensaje (in/out)
router.post("/", N8nMensajeController.insertar);

// GET /n8n/mensajes/chat/:id_chat - Obtener mensajes de un chat
router.get("/chat/:id_chat", N8nMensajeController.obtenerPorChat);

// POST /n8n/mensajes/enviar-plantilla - Enviar plantilla y registrar
router.post("/enviar-plantilla", N8nMensajeController.enviarPlantilla);

module.exports = router;
