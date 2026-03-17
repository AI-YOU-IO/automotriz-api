const { Router } = require("express");
const EstadoCitaController = require("../controllers/estadoCita.controller.js");

const router = Router();

router.get("/estado-citas", /* #swagger.tags = ['EstadoCita'] */ EstadoCitaController.getEstadosCita);
router.get("/estado-citas/:id", /* #swagger.tags = ['EstadoCita'] */ EstadoCitaController.getEstadoCitaById);
router.post("/estado-citas", /* #swagger.tags = ['EstadoCita'] */ EstadoCitaController.createEstadoCita);
router.put("/estado-citas/:id", /* #swagger.tags = ['EstadoCita'] */ EstadoCitaController.updateEstadoCita);
router.delete("/estado-citas/:id", /* #swagger.tags = ['EstadoCita'] */ EstadoCitaController.deleteEstadoCita);

module.exports = router;
