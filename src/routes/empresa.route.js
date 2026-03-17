const { Router } = require("express");
const EmpresaController = require("../controllers/empresa.controller.js");

const router = Router();

router.get("/empresas", /* #swagger.tags = ['Empresa'] */ EmpresaController.getEmpresas);
router.get("/empresas/:id", /* #swagger.tags = ['Empresa'] */ EmpresaController.getEmpresaById);
router.post("/empresas", /* #swagger.tags = ['Empresa'] */ EmpresaController.createEmpresa);
router.put("/empresas/:id", /* #swagger.tags = ['Empresa'] */ EmpresaController.updateEmpresa);
router.delete("/empresas/:id", /* #swagger.tags = ['Empresa'] */ EmpresaController.deleteEmpresa);

module.exports = router;
