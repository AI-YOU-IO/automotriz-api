const { Router } = require("express");
const ModeloController = require("../controllers/modelo.controller.js");

const router = Router();

router.get("/modelos", /* #swagger.tags = ['Modelo'] */ ModeloController.getModelos);
router.get("/modelos/:id", /* #swagger.tags = ['Modelo'] */ ModeloController.getModeloById);
router.post("/modelos", /* #swagger.tags = ['Modelo'] */ ModeloController.createModelo);
router.put("/modelos/:id", /* #swagger.tags = ['Modelo'] */ ModeloController.updateModelo);
router.delete("/modelos/:id", /* #swagger.tags = ['Modelo'] */ ModeloController.deleteModelo);

module.exports = router;
