const { Router } = require("express");
const CampaniaController = require("../controllers/campania.controller.js");

const router = Router();

// Rutas de Campanias
router.get("/campanias", /* #swagger.tags = ['Campania'] */ CampaniaController.getCampanias);
router.get("/campanias/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.getCampaniaById);
router.post("/campanias", /* #swagger.tags = ['Campania'] */ CampaniaController.createCampania);
router.put("/campanias/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.updateCampania);
router.delete("/campanias/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.deleteCampania);

// Rutas de Configuracion de Llamadas
router.get("/campanias/:id/configuracion-llamada", /* #swagger.tags = ['Campania'] */ CampaniaController.getConfiguracionLlamada);
router.put("/campanias/:id/configuracion-llamada", /* #swagger.tags = ['Campania'] */ CampaniaController.updateConfiguracionLlamada);

// Rutas de Ejecucion de Campania
router.get("/campanias/:idCampania/ejecuciones", /* #swagger.tags = ['Campania'] */ CampaniaController.getEjecucionesByCampania);
router.post("/campania-ejecuciones/ejecutar", /* #swagger.tags = ['Campania'] */ CampaniaController.ejecutarCampania);
router.post("/campania-ejecuciones/:id/iniciar-llamadas", /* #swagger.tags = ['Campania'] */ CampaniaController.iniciarLlamadas);
router.get("/campania-ejecuciones/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.getEjecucionById);
router.patch("/campania-ejecuciones/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.updateEjecucion);
router.patch("/campania-ejecuciones/:id/cancelar", /* #swagger.tags = ['Campania'] */ CampaniaController.cancelarEjecucion);

// Rutas de Llamadas por Ejecucion
router.get("/campania-ejecuciones/:idEjecucion/llamadas", /* #swagger.tags = ['Campania'] */ CampaniaController.getLlamadasByEjecucion);

// Rutas de Envios WhatsApp por Ejecucion
router.get("/campania-ejecuciones/:idEjecucion/envios", /* #swagger.tags = ['Campania'] */ CampaniaController.getEnviosByEjecucion);

// Voces
router.get("/voces", /* #swagger.tags = ['Campania'] */ CampaniaController.getVoces);

// Rutas de Campania Prospectos
router.get("/campanias/:idCampania/prospectos", /* #swagger.tags = ['Campania'] */ CampaniaController.getProspectosByCampania);
router.post("/campanias/:idCampania/prospectos", /* #swagger.tags = ['Campania'] */ CampaniaController.addProspectosToCampania);
router.delete("/campania-prospectos/:id", /* #swagger.tags = ['Campania'] */ CampaniaController.removeProspectoFromCampania);

module.exports = router;
