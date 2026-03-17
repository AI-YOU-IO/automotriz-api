const { Router } = require("express");
const ProspectoController = require("../controllers/prospecto.controller.js");

const router = Router();

router.get("/prospectos", /* #swagger.tags = ['Prospecto'] */ ProspectoController.getProspectos);
router.get("/prospectos/:id", /* #swagger.tags = ['Prospecto'] */ ProspectoController.getProspectoById);
router.post("/prospectos", /* #swagger.tags = ['Prospecto'] */ ProspectoController.createProspecto);
router.put("/prospectos/:id", /* #swagger.tags = ['Prospecto'] */ ProspectoController.updateProspecto);
router.delete("/prospectos/:id", /* #swagger.tags = ['Prospecto'] */ ProspectoController.deleteProspecto);

module.exports = router;
