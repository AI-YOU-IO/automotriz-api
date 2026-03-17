const { Router } = require("express");
const UnidadController = require("../controllers/unidad.controller.js");

const router = Router();

router.get("/unidades", /* #swagger.tags = ['Unidad'] */ UnidadController.getUnidades);
router.get("/unidades/:id", /* #swagger.tags = ['Unidad'] */ UnidadController.getUnidadById);
router.post("/unidades", /* #swagger.tags = ['Unidad'] */ UnidadController.createUnidad);
router.put("/unidades/:id", /* #swagger.tags = ['Unidad'] */ UnidadController.updateUnidad);
router.delete("/unidades/:id", /* #swagger.tags = ['Unidad'] */ UnidadController.deleteUnidad);

router.get("/tool/unidades", /* #swagger.tags = ['Unidad'] */ UnidadController.getUnidadesByProyecto);
router.get("/tool/unidades/dormitorios", /* #swagger.tags = ['Unidad'] */ UnidadController.getUnidadesByDormitorios);

module.exports = router;
