const { Router } = require("express");
const UsuarioController = require("../controllers/usuario.controller.js");

const router = Router();

router.get("/usuarios", /* #swagger.tags = ['Usuario'] */ UsuarioController.getUsuarios);
router.get("/usuarios/rol/:idRol", /* #swagger.tags = ['Usuario'] */ UsuarioController.getUsuariosByRol);
router.get("/usuarios/:id", /* #swagger.tags = ['Usuario'] */ UsuarioController.getUsuarioById);
router.post("/usuarios", /* #swagger.tags = ['Usuario'] */ UsuarioController.createUsuario);
router.put("/usuarios/:id", /* #swagger.tags = ['Usuario'] */ UsuarioController.updateUsuario);
router.put("/usuarios/:id/password", /* #swagger.tags = ['Usuario'] */ UsuarioController.changePassword);
router.delete("/usuarios/:id", /* #swagger.tags = ['Usuario'] */ UsuarioController.deleteUsuario);

module.exports = router;