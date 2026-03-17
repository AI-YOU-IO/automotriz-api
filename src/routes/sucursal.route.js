const { Router } = require("express");
const SucursalController = require("../controllers/sucursal.controller.js");

const router = Router();

router.get("/sucursales", /* #swagger.tags = ['Sucursal'] */ SucursalController.getSucursales);
router.get("/sucursales/:id", /* #swagger.tags = ['Sucursal'] */ SucursalController.getSucursalById);
router.post("/sucursales", /* #swagger.tags = ['Sucursal'] */ SucursalController.createSucursal);
router.put("/sucursales/:id", /* #swagger.tags = ['Sucursal'] */ SucursalController.updateSucursal);
router.delete("/sucursales/:id", /* #swagger.tags = ['Sucursal'] */ SucursalController.deleteSucursal);

module.exports = router;
