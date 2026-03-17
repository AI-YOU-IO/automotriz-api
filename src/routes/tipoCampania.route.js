const { Router } = require("express");
const TipoCampaniaController = require("../controllers/tipoCampania.controller.js");

const router = Router();

router.get("/tipos-campania", /* #swagger.tags = ['TipoCampania'] */ TipoCampaniaController.getTiposCampania);
router.get("/tipos-campania/:id", /* #swagger.tags = ['TipoCampania'] */ TipoCampaniaController.getTipoCampaniaById);
router.post("/tipos-campania", /* #swagger.tags = ['TipoCampania'] */ TipoCampaniaController.createTipoCampania);
router.put("/tipos-campania/:id", /* #swagger.tags = ['TipoCampania'] */ TipoCampaniaController.updateTipoCampania);
router.delete("/tipos-campania/:id", /* #swagger.tags = ['TipoCampania'] */ TipoCampaniaController.deleteTipoCampania);

module.exports = router;
