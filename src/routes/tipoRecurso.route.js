const { Router } = require("express");
const TipoRecursoController = require("../controllers/tipoRecurso.controller.js");

const router = Router();

router.get("/tipo-recursos", /* #swagger.tags = ['TipoRecurso'] */ TipoRecursoController.getTipoRecursos);
router.get("/tipo-recursos/:id", /* #swagger.tags = ['TipoRecurso'] */ TipoRecursoController.getTipoRecursoById);
router.post("/tipo-recursos", /* #swagger.tags = ['TipoRecurso'] */ TipoRecursoController.createTipoRecurso);
router.put("/tipo-recursos/:id", /* #swagger.tags = ['TipoRecurso'] */ TipoRecursoController.updateTipoRecurso);
router.delete("/tipo-recursos/:id", /* #swagger.tags = ['TipoRecurso'] */ TipoRecursoController.deleteTipoRecurso);

module.exports = router;
