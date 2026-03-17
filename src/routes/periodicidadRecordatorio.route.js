const { Router } = require("express");
const PeriodicidadRecordatorioController = require("../controllers/periodicidadRecordatorio.controller.js");

const router = Router();

router.get("/periodicidades-recordatorio", /* #swagger.tags = ['Recordatorio'] */ PeriodicidadRecordatorioController.getPeriodicidadesRecordatorio);
router.get("/periodicidades-recordatorio/:id", /* #swagger.tags = ['Recordatorio'] */ PeriodicidadRecordatorioController.getPeriodicidadRecordatorioById);
router.post("/periodicidades-recordatorio", /* #swagger.tags = ['Recordatorio'] */ PeriodicidadRecordatorioController.createPeriodicidadRecordatorio);
router.put("/periodicidades-recordatorio/:id", /* #swagger.tags = ['Recordatorio'] */ PeriodicidadRecordatorioController.updatePeriodicidadRecordatorio);
router.delete("/periodicidades-recordatorio/:id", /* #swagger.tags = ['Recordatorio'] */ PeriodicidadRecordatorioController.deletePeriodicidadRecordatorio);

module.exports = router;
