/**
 * Rutas n8n para gestión de Citas
 * Protegidas con API Key
 */

const { Router } = require("express");
const N8nCitaController = require("../controllers/n8nCita.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// POST /n8n/citas - Crear cita
router.post("/", N8nCitaController.crear);

// GET /n8n/citas/prospecto/:id_prospecto - Obtener por prospecto (debe ir antes de /:id)
router.get("/prospecto/:id_prospecto", N8nCitaController.obtenerPorProspecto);

// GET /n8n/citas/:id - Obtener por ID
router.get("/:id", N8nCitaController.obtenerPorId);

// PUT /n8n/citas/:id - Actualizar cita
router.put("/:id", N8nCitaController.actualizar);

// DELETE /n8n/citas/:id - Eliminar cita
router.delete("/:id", N8nCitaController.eliminar);

module.exports = router;
