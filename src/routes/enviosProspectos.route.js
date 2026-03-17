const { Router } = require("express");
const EnviosProspectosController = require("../controllers/enviosProspectos.controller.js");

const router = Router();

router.get("/envios-prospectos", /* #swagger.tags = ['EnviosProspectos'] */ EnviosProspectosController.getEnviosProspectos);
router.get("/envios-prospectos/:id", /* #swagger.tags = ['EnviosProspectos'] */ EnviosProspectosController.getEnvioProspectoById);
router.post("/envios-prospectos", /* #swagger.tags = ['EnviosProspectos'] */ EnviosProspectosController.createEnvioProspecto);
router.put("/envios-prospectos/:id", /* #swagger.tags = ['EnviosProspectos'] */ EnviosProspectosController.updateEstadoEnvio);
router.delete("/envios-prospectos/:id", /* #swagger.tags = ['EnviosProspectos'] */ EnviosProspectosController.deleteEnvioProspecto);

module.exports = router;
