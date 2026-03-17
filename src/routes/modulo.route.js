const { Router } = require("express");
const ModuloController = require("../controllers/modulo.controller.js");

const router = Router();

router.get("/modulos", /* #swagger.tags = ['Modulo'] */ ModuloController.getModulos);
router.get("/modulos/:id", /* #swagger.tags = ['Modulo'] */ ModuloController.getModuloById);
router.post("/modulos", /* #swagger.tags = ['Modulo'] */ ModuloController.createModulo);
router.put("/modulos/:id", /* #swagger.tags = ['Modulo'] */ ModuloController.updateModulo);
router.delete("/modulos/:id", /* #swagger.tags = ['Modulo'] */ ModuloController.deleteModulo);

module.exports = router;
