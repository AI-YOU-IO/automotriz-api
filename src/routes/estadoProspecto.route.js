const { Router } = require("express");
const EstadoProspectoController = require("../controllers/estadoProspecto.controller.js");

const router = Router();

router.get("/estado-prospectos", /* #swagger.tags = ['EstadoProspecto'] */ EstadoProspectoController.getEstadosProspecto);
router.get("/estado-prospectos/:id", /* #swagger.tags = ['EstadoProspecto'] */ EstadoProspectoController.getEstadoProspectoById);
router.post("/estado-prospectos", /* #swagger.tags = ['EstadoProspecto'] */ EstadoProspectoController.createEstadoProspecto);
router.put("/estado-prospectos/:id", /* #swagger.tags = ['EstadoProspecto'] */ EstadoProspectoController.updateEstadoProspecto);
router.delete("/estado-prospectos/:id", /* #swagger.tags = ['EstadoProspecto'] */ EstadoProspectoController.deleteEstadoProspecto);

module.exports = router;
