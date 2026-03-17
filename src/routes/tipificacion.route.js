const { Router } = require("express");
const TipificacionController = require("../controllers/tipificacion.controller.js");

const router = Router();

router.get("/tipificaciones", /* #swagger.tags = ['Tipificacion'] */ TipificacionController.getTipificaciones);
router.get("/tipificaciones/:id", /* #swagger.tags = ['Tipificacion'] */ TipificacionController.getTipificacionById);
router.post("/tipificaciones", /* #swagger.tags = ['Tipificacion'] */ TipificacionController.createTipificacion);
router.put("/tipificaciones/:id", /* #swagger.tags = ['Tipificacion'] */ TipificacionController.updateTipificacion);
router.delete("/tipificaciones/:id", /* #swagger.tags = ['Tipificacion'] */ TipificacionController.deleteTipificacion);

module.exports = router;
