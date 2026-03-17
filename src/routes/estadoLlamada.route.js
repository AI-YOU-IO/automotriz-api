const { Router } = require("express");
const EstadoLlamadaController = require("../controllers/estadoLlamada.controller.js");

const router = Router();

router.get("/estado-llamadas", /* #swagger.tags = ['EstadoLlamada'] */ EstadoLlamadaController.getEstadosLlamada);
router.get("/estado-llamadas/:id", /* #swagger.tags = ['EstadoLlamada'] */ EstadoLlamadaController.getEstadoLlamadaById);
router.post("/estado-llamadas", /* #swagger.tags = ['EstadoLlamada'] */ EstadoLlamadaController.createEstadoLlamada);
router.put("/estado-llamadas/:id", /* #swagger.tags = ['EstadoLlamada'] */ EstadoLlamadaController.updateEstadoLlamada);
router.delete("/estado-llamadas/:id", /* #swagger.tags = ['EstadoLlamada'] */ EstadoLlamadaController.deleteEstadoLlamada);

module.exports = router;
