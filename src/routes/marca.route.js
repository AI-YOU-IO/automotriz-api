const { Router } = require("express");
const MarcaController = require("../controllers/marca.controller.js");

const router = Router();

router.get("/marcas", /* #swagger.tags = ['Marca'] */ MarcaController.getMarcas);
router.get("/marcas/:id", /* #swagger.tags = ['Marca'] */ MarcaController.getMarcaById);
router.post("/marcas", /* #swagger.tags = ['Marca'] */ MarcaController.createMarca);
router.put("/marcas/:id", /* #swagger.tags = ['Marca'] */ MarcaController.updateMarca);
router.delete("/marcas/:id", /* #swagger.tags = ['Marca'] */ MarcaController.deleteMarca);

module.exports = router;
