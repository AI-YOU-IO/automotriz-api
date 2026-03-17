const { Router } = require("express");
const PlantillaController = require("../controllers/plantilla.controller.js");

const router = Router();

router.get("/plantillas", /* #swagger.tags = ['Plantilla'] */ PlantillaController.getPlantillas);
router.get("/plantillas/:id", /* #swagger.tags = ['Plantilla'] */ PlantillaController.getPlantillaById);
router.post("/plantillas", /* #swagger.tags = ['Plantilla'] */ PlantillaController.createPlantilla);
router.put("/plantillas/:id", /* #swagger.tags = ['Plantilla'] */ PlantillaController.updatePlantilla);
router.delete("/plantillas/:id", /* #swagger.tags = ['Plantilla'] */ PlantillaController.deletePlantilla);

module.exports = router;
