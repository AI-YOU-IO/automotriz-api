const { Router } = require("express");
const TipologiaController = require("../controllers/tipologia.controller.js");

const router = Router();

router.get("/tipologias", /* #swagger.tags = ['Tipologia'] */ TipologiaController.getTipologias);
router.get("/tipologias/:id", /* #swagger.tags = ['Tipologia'] */ TipologiaController.getTipologiaById);
router.post("/tipologias", /* #swagger.tags = ['Tipologia'] */ TipologiaController.createTipologia);
router.put("/tipologias/:id", /* #swagger.tags = ['Tipologia'] */ TipologiaController.updateTipologia);
router.delete("/tipologias/:id", /* #swagger.tags = ['Tipologia'] */ TipologiaController.deleteTipologia);

module.exports = router;
