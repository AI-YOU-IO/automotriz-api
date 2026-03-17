const { Router } = require("express");
const EstadoCampaniaController = require("../controllers/estadoCampania.controller.js");

const router = Router();

router.get("/estados-campania", /* #swagger.tags = ['EstadoCampania'] */ EstadoCampaniaController.getEstadosCampania);
router.get("/estados-campania/:id", /* #swagger.tags = ['EstadoCampania'] */ EstadoCampaniaController.getEstadoCampaniaById);
router.post("/estados-campania", /* #swagger.tags = ['EstadoCampania'] */ EstadoCampaniaController.createEstadoCampania);
router.put("/estados-campania/:id", /* #swagger.tags = ['EstadoCampania'] */ EstadoCampaniaController.updateEstadoCampania);
router.delete("/estados-campania/:id", /* #swagger.tags = ['EstadoCampania'] */ EstadoCampaniaController.deleteEstadoCampania);

module.exports = router;
