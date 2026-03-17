const { Router } = require("express");
const DiaDescansoController = require("../controllers/diaDescanso.controller.js");

const router = Router();

router.get("/dias-descanso", /* #swagger.tags = ['DiaDescanso'] */ DiaDescansoController.getByUsuarioAndDay);
router.get("/dias-descanso/usuario/:id_usuario", /* #swagger.tags = ['DiaDescanso'] */ DiaDescansoController.getByUsuario);
router.put("/dias-descanso/usuario/:id_usuario", /* #swagger.tags = ['DiaDescanso'] */ DiaDescansoController.syncByUsuario);

module.exports = router;
