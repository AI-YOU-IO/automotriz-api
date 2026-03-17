const { Router } = require("express");
const ProspectoRecordatorioController = require("../controllers/prospectoRecordatorio.controller.js");

const router = Router();

router.get("/prospecto-recordatorios", /* #swagger.tags = ['ProspectoRecordatorio'] */ ProspectoRecordatorioController.getProspectoRecordatorios);
router.get("/prospecto-recordatorios/:id", /* #swagger.tags = ['ProspectoRecordatorio'] */ ProspectoRecordatorioController.getProspectoRecordatorioById);
router.post("/prospecto-recordatorios", /* #swagger.tags = ['ProspectoRecordatorio'] */ ProspectoRecordatorioController.createProspectoRecordatorio);
router.put("/prospecto-recordatorios/:id", /* #swagger.tags = ['ProspectoRecordatorio'] */ ProspectoRecordatorioController.updateProspectoRecordatorio);
router.delete("/prospecto-recordatorios/:id", /* #swagger.tags = ['ProspectoRecordatorio'] */ ProspectoRecordatorioController.deleteProspectoRecordatorio);

module.exports = router;
