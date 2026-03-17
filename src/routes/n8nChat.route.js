/**
 * Rutas n8n para gestión de Chats
 * Protegidas con API Key
 */

const { Router } = require("express");
const N8nChatController = require("../controllers/n8nChat.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// POST /n8n/chats - Crear chat
router.post("/", N8nChatController.crear);

// GET /n8n/chats/prospecto/:id_prospecto - Obtener por prospecto (debe ir antes de /:id)
router.get("/prospecto/:id_prospecto", N8nChatController.obtenerPorProspecto);

// GET /n8n/chats/:id - Obtener por ID
router.get("/:id", N8nChatController.obtenerPorId);

// PUT /n8n/chats/:id - Actualizar chat
router.put("/:id", N8nChatController.actualizar);

module.exports = router;
