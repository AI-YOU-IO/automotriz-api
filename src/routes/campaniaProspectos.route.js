const { Router } = require("express");
const CampaniaProspectosController = require("../controllers/campaniaProspectos.controller.js");

const router = Router();

router.get("/campania-prospectos", /* #swagger.tags = ['CampaniaProspectos'] */ CampaniaProspectosController.getCampaniaProspectos);
router.get("/campania-prospectos/:id", /* #swagger.tags = ['CampaniaProspectos'] */ CampaniaProspectosController.getCampaniaProspectoById);
router.post("/campania-prospectos", /* #swagger.tags = ['CampaniaProspectos'] */ CampaniaProspectosController.createCampaniaProspecto);
router.put("/campania-prospectos/:id", /* #swagger.tags = ['CampaniaProspectos'] */ CampaniaProspectosController.updateCampaniaProspecto);
router.delete("/campania-prospectos/:id", /* #swagger.tags = ['CampaniaProspectos'] */ CampaniaProspectosController.deleteCampaniaProspecto);

module.exports = router;
