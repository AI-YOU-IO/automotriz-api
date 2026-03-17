const { Router } = require("express");
const EnvioMasivoWhatsappController = require("../controllers/envioMasivoWhatsapp.controller.js");

const router = Router();

router.get("/envios-masivos-whatsapp", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.getEnviosMasivos);
router.get("/envios-masivos-whatsapp/:id", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.getEnvioMasivoById);
router.post("/envios-masivos-whatsapp", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.createEnvioMasivo);
router.post("/envios-masivos-whatsapp/:id/enviar", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.ejecutarEnvio);
router.put("/envios-masivos-whatsapp/:id", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.updateEnvioMasivo);
router.delete("/envios-masivos-whatsapp/:id", /* #swagger.tags = ['EnvioMasivoWhatsapp'] */ EnvioMasivoWhatsappController.deleteEnvioMasivo);

module.exports = router;
