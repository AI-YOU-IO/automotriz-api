/**
 * Rutas n8n para gestión de Proyectos
 * Protegidas con API Key
 */

const { Router } = require("express");
const N8nProyectoController = require("../controllers/n8nProyecto.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

// Aplicar middleware de autenticación n8n
router.use(validateN8nApiKey);

// GET /n8n/proyectos/buscar/nombre - Buscar por nombre (debe ir antes de /:id)
router.get("/buscar/nombre", N8nProyectoController.buscarPorNombre);

// GET /n8n/proyectos/buscar/distrito - Buscar por distrito
router.get("/buscar/distrito", N8nProyectoController.buscarPorDistrito);

// GET /n8n/proyectos/sperant/:sperant_id - Buscar por sperant_id
router.get("/sperant/:sperant_id", N8nProyectoController.buscarPorSperantId);

// GET /n8n/proyectos - Listar todos los proyectos
router.get("/", N8nProyectoController.listar);

// GET /n8n/proyectos/:id - Obtener proyecto por ID
router.get("/:id", N8nProyectoController.obtenerPorId);

module.exports = router;
