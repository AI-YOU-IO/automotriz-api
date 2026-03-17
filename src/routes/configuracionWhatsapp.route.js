const { Router } = require("express");
const ConfiguracionWhatsappController = require("../controllers/configuracionWhatsapp.controller.js");

const router = Router();

router.get("/configuracion-whatsapp", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.getConfiguraciones);
router.get("/configuracion-whatsapp/:id", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.getConfiguracionById);
router.get("/configuracion-whatsapp/empresa/:empresaId", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.getConfiguracionByEmpresa);
router.post("/configuracion-whatsapp", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.createConfiguracion);
router.post("/configuracion-whatsapp/save", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.saveConfiguracion);
router.put("/configuracion-whatsapp/:id", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.updateConfiguracion);
router.delete("/configuracion-whatsapp/:id", /* #swagger.tags = ['ConfiguracionWhatsapp'] */ ConfiguracionWhatsappController.deleteConfiguracion);

module.exports = router;
