const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const RecursoController = require("../controllers/recurso.controller.js");

// Usar memoryStorage para subir a S3
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.get("/recursos", /* #swagger.tags = ['Recurso'] */ RecursoController.getRecursos);
router.get("/recursos/:id", /* #swagger.tags = ['Recurso'] */ RecursoController.getRecursoById);
router.post("/recursos/upload", /* #swagger.tags = ['Recurso'] */ upload.single('file'), RecursoController.uploadRecurso);
router.post("/recursos", /* #swagger.tags = ['Recurso'] */ RecursoController.createRecurso);
router.put("/recursos/:id", /* #swagger.tags = ['Recurso'] */ RecursoController.updateRecurso);
router.delete("/recursos/:id", /* #swagger.tags = ['Recurso'] */ RecursoController.deleteRecurso);

module.exports = router;
