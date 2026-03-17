const { Router } = require("express");
const MensajeVistoUsuarioController = require("../controllers/mensajeVistoUsuario.controller.js");

const router = Router();

router.get("/mensaje-visto-usuarios", /* #swagger.tags = ['MensajeVistoUsuario'] */ MensajeVistoUsuarioController.getMensajesVistos);
router.get("/mensaje-visto-usuarios/:id", /* #swagger.tags = ['MensajeVistoUsuario'] */ MensajeVistoUsuarioController.getMensajeVistoById);
router.post("/mensaje-visto-usuarios", /* #swagger.tags = ['MensajeVistoUsuario'] */ MensajeVistoUsuarioController.createMensajeVisto);
router.put("/mensaje-visto-usuarios/:id", /* #swagger.tags = ['MensajeVistoUsuario'] */ MensajeVistoUsuarioController.updateMensajeVisto);
router.delete("/mensaje-visto-usuarios/:id", /* #swagger.tags = ['MensajeVistoUsuario'] */ MensajeVistoUsuarioController.deleteMensajeVisto);

module.exports = router;
