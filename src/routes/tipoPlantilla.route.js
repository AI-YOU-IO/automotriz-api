const { Router } = require("express");
const TipoPlantillaController = require("../controllers/tipoPlantilla.controller.js");

const router = Router();

router.get("/tipo-plantillas", /* #swagger.tags = ['TipoPlantilla'] */ TipoPlantillaController.getTiposPlantilla);
router.get("/tipo-plantillas/:id", /* #swagger.tags = ['TipoPlantilla'] */ TipoPlantillaController.getTipoPlantillaById);
router.post("/tipo-plantillas", /* #swagger.tags = ['TipoPlantilla'] */ TipoPlantillaController.createTipoPlantilla);
router.put("/tipo-plantillas/:id", /* #swagger.tags = ['TipoPlantilla'] */ TipoPlantillaController.updateTipoPlantilla);
router.delete("/tipo-plantillas/:id", /* #swagger.tags = ['TipoPlantilla'] */ TipoPlantillaController.deleteTipoPlantilla);

module.exports = router;
