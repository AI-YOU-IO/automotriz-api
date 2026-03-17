const { Router } = require("express");
const InteraccionController = require("../controllers/interaccion.controller.js");

const router = Router();

router.get("/interacciones", /* #swagger.tags = ['Interaccion'] */ InteraccionController.getInteracciones);
router.get("/interacciones/:id", /* #swagger.tags = ['Interaccion'] */ InteraccionController.getInteraccionById);
router.post("/interacciones", /* #swagger.tags = ['Interaccion'] */ InteraccionController.createInteraccion);
router.put("/interacciones/:id", /* #swagger.tags = ['Interaccion'] */ InteraccionController.updateInteraccion);
router.delete("/interacciones/:id", /* #swagger.tags = ['Interaccion'] */ InteraccionController.deleteInteraccion);

module.exports = router;
