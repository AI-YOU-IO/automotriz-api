const { Router } = require("express");
const DistritoController = require("../controllers/distrito.controller.js");

const router = Router();

router.get("/distritos", /* #swagger.tags = ['Distrito'] */ DistritoController.getDistritos);
router.get("/distritos/:id", /* #swagger.tags = ['Distrito'] */ DistritoController.getDistritoById);

module.exports = router;
