const { Router } = require("express");
const HorarioBloqueadoController = require("../controllers/horarioBloqueado.controller.js");

const router = Router();

router.get("/horario-bloqueado", /* #swagger.tags = ['HorarioBloqueado'] */ HorarioBloqueadoController.getHorarioBloqueado);
router.put("/horario-bloqueado", /* #swagger.tags = ['HorarioBloqueado'] */ HorarioBloqueadoController.upsertHorarioBloqueado);
router.delete("/horario-bloqueado/:id", /* #swagger.tags = ['HorarioBloqueado'] */ HorarioBloqueadoController.deleteHorarioBloqueado);

module.exports = router;
