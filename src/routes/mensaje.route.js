const { Router } = require("express");
const MensajeController = require("../controllers/mensaje.controller.js");

const router = Router();

router.get("/mensajes", /* #swagger.tags = ['Mensaje'] */ MensajeController.getMensajes);
router.get("/mensajes/:id", /* #swagger.tags = ['Mensaje'] */ MensajeController.getMensajeById);
router.post("/mensajes", /* #swagger.tags = ['Mensaje'] */ MensajeController.createMensaje);
router.put("/mensajes/:id", /* #swagger.tags = ['Mensaje'] */ MensajeController.updateMensaje);
router.delete("/mensajes/:id", /* #swagger.tags = ['Mensaje'] */ MensajeController.deleteMensaje);

module.exports = router;
