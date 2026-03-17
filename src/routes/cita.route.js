const { Router } = require("express");
const CitaController = require("../controllers/cita.controller.js");

const router = Router();

router.get("/citas", /* #swagger.tags = ['Cita'] */ CitaController.getCitas);
router.get("/citas/:id", /* #swagger.tags = ['Cita'] */ CitaController.getCitaById);
router.post("/citas", /* #swagger.tags = ['Cita'] */ CitaController.createCita);
router.put("/citas/:id", /* #swagger.tags = ['Cita'] */ CitaController.updateCita);
router.get("/citas/horarios-ocupados", /* #swagger.tags = ['Cita'] */ CitaController.getHorariosOcupados);
router.delete("/citas/:id", /* #swagger.tags = ['Cita'] */ CitaController.deleteCita);

module.exports = router;
