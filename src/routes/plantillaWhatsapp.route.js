const { Router } = require("express");
const PlantillaWhatsappController = require("../controllers/plantillaWhatsapp.controller.js");
const { uploadPlantillaMiddleware } = require("../middlewares/upload.middleware.js");

const router = Router();

router.get("/plantillas-whatsapp", /* #swagger.tags = ['Plantilla WhatsApp'] */ PlantillaWhatsappController.getPlantillas);
router.get("/plantillas-whatsapp/:id", /* #swagger.tags = ['Plantilla WhatsApp'] */ PlantillaWhatsappController.getPlantillaById);
router.post("/plantillas-whatsapp", /* #swagger.tags = ['Plantilla WhatsApp'] */ uploadPlantillaMiddleware, PlantillaWhatsappController.createPlantilla);
router.put("/plantillas-whatsapp/:id", /* #swagger.tags = ['Plantilla WhatsApp'] */ uploadPlantillaMiddleware, PlantillaWhatsappController.updatePlantilla);
router.delete("/plantillas-whatsapp/:id", /* #swagger.tags = ['Plantilla WhatsApp'] */ PlantillaWhatsappController.deletePlantilla);
router.post("/plantillas-whatsapp/enviar", /* #swagger.tags = ['Plantilla WhatsApp'] */ PlantillaWhatsappController.enviarPlantilla);
router.post("/plantillas-whatsapp/sincronizar-meta", /* #swagger.tags = ['Plantilla WhatsApp'] */ PlantillaWhatsappController.sincronizarMeta);

module.exports = router;
