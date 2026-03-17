const { Router } = require("express");
const RolModuloController = require("../controllers/rolModulo.controller.js");

const router = Router();

router.get("/rol-modulos", /* #swagger.tags = ['RolModulo'] */ RolModuloController.getRolModulos);
router.get("/rol-modulos/:id", /* #swagger.tags = ['RolModulo'] */ RolModuloController.getRolModuloById);
router.post("/rol-modulos", /* #swagger.tags = ['RolModulo'] */ RolModuloController.createRolModulo);
router.put("/rol-modulos/:id", /* #swagger.tags = ['RolModulo'] */ RolModuloController.updateRolModulo);
router.delete("/rol-modulos/:id", /* #swagger.tags = ['RolModulo'] */ RolModuloController.deleteRolModulo);

module.exports = router;
