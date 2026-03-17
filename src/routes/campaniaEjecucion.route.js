const { Router } = require("express");
const CampaniaEjecucionController = require("../controllers/campaniaEjecucion.controller.js");

const router = Router();

router.get("/campania-ejecuciones", /* #swagger.tags = ['CampaniaEjecucion'] */ CampaniaEjecucionController.getCampaniaEjecuciones);
router.get("/campania-ejecuciones/:id", /* #swagger.tags = ['CampaniaEjecucion'] */ CampaniaEjecucionController.getCampaniaEjecucionById);
router.post("/campania-ejecuciones", /* #swagger.tags = ['CampaniaEjecucion'] */ CampaniaEjecucionController.createCampaniaEjecucion);
router.put("/campania-ejecuciones/:id", /* #swagger.tags = ['CampaniaEjecucion'] */ CampaniaEjecucionController.updateCampaniaEjecucion);
router.delete("/campania-ejecuciones/:id", /* #swagger.tags = ['CampaniaEjecucion'] */ CampaniaEjecucionController.deleteCampaniaEjecucion);

module.exports = router;
