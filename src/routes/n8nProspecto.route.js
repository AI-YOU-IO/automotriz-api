/**
 * Rutas n8n para gestión de Prospectos
 * Protegidas con API Key
 */

const { Router } = require("express");
const N8nProspectoController = require("../controllers/n8nProspecto.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// POST /n8n/prospectos - Crear prospecto
router.post("/", N8nProspectoController.crear);

// GET /n8n/prospectos/sperant/:sperant_uuid - Buscar por sperant_uuid (debe ir antes de /:telefono)
router.get("/sperant/:sperant_uuid", N8nProspectoController.buscarPorSperantUuid);

// GET /n8n/prospectos/:telefono - Buscar por teléfono
router.get("/:telefono", N8nProspectoController.buscarPorTelefono);

// PUT /n8n/prospectos/:id - Actualizar prospecto
router.put("/:id", N8nProspectoController.actualizar);

module.exports = router;
