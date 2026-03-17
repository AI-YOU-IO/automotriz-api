const { Router } = require("express");
const RolController = require("../controllers/rol.controller.js");

const router = Router();

router.get("/roles", /* #swagger.tags = ['Rol'] */ RolController.getRoles);
router.get("/roles/:id", /* #swagger.tags = ['Rol'] */ RolController.getRolById);
router.post("/roles", /* #swagger.tags = ['Rol'] */ RolController.createRol);
router.put("/roles/:id", /* #swagger.tags = ['Rol'] */ RolController.updateRol);
router.delete("/roles/:id", /* #swagger.tags = ['Rol'] */ RolController.deleteRol);

module.exports = router;
