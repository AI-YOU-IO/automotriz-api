const { Router } = require("express");
const HorarioAtencionController = require("../controllers/horarioAtencion.controller.js");

const router = Router();

router.get("/horario-atencion", /* #swagger.tags = ['HorarioAtencion'] */ HorarioAtencionController.getHorarios);
router.put("/horario-atencion", /* #swagger.tags = ['HorarioAtencion'] */ HorarioAtencionController.updateHorarios);

module.exports = router;
