/**
 * Rutas n8n para gestión de Empresas
 * Protegidas con API Key
 *
 * Endpoints:
 * - GET /n8n/empresa/listar - Listar empresas activas
 * - GET /n8n/empresa/estadisticas-recuperacion - Estadísticas de recuperación por empresa
 * - GET /n8n/empresa/resumen-pendientes - Resumen de empresas con pendientes
 */

const { Router } = require("express");
const N8nEmpresaController = require("../controllers/n8nEmpresa.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// GET /n8n/empresa/listar - Listar empresas activas
router.get("/listar", N8nEmpresaController.listar);

// GET /n8n/empresa/estadisticas-recuperacion - Estadísticas detalladas por empresa
router.get("/estadisticas-recuperacion", N8nEmpresaController.estadisticasRecuperacion);

// GET /n8n/empresa/resumen-pendientes - Solo empresas con pendientes (para iterar en n8n)
router.get("/resumen-pendientes", N8nEmpresaController.resumenPendientes);

module.exports = router;
