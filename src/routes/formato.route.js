const { Router } = require("express");
const FormatoController = require("../controllers/formato.controller.js");
const FormatoCampoController = require("../controllers/formatoCampo.controller.js");

const router = Router();

// Formatos (antes tipo-plantillas)
router.get("/tipo-plantillas", /* #swagger.tags = ['Formato'] */ FormatoController.getFormatos);
router.get("/tipo-plantillas/:id", /* #swagger.tags = ['Formato'] */ FormatoController.getFormatoById);
router.post("/tipo-plantillas", /* #swagger.tags = ['Formato'] */ FormatoController.createFormato);
router.put("/tipo-plantillas/:id", /* #swagger.tags = ['Formato'] */ FormatoController.updateFormato);
router.delete("/tipo-plantillas/:id", /* #swagger.tags = ['Formato'] */ FormatoController.deleteFormato);

// Formato Campos
router.get("/formato-campos/:idFormato", /* #swagger.tags = ['FormatoCampo'] */ FormatoCampoController.getFormatoCampos);
router.get("/formato-campos/detalle/:id", /* #swagger.tags = ['FormatoCampo'] */ FormatoCampoController.getFormatoCampoById);
router.post("/formato-campos", /* #swagger.tags = ['FormatoCampo'] */ FormatoCampoController.createFormatoCampo);
router.put("/formato-campos/:id", /* #swagger.tags = ['FormatoCampo'] */ FormatoCampoController.updateFormatoCampo);
router.delete("/formato-campos/:id", /* #swagger.tags = ['FormatoCampo'] */ FormatoCampoController.deleteFormatoCampo);

module.exports = router;
