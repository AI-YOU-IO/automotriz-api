const { Router } = require("express");
const multer = require("multer");
const LlamadaController = require("../controllers/llamada.controller.js");

// Usar memoryStorage para subir a S3
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB para archivos de audio
  fileFilter: (req, file, cb) => {
    // Aceptar archivos de audio
    const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/x-wav'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio (wav, mp3, ogg, webm)'), false);
    }
  }
});

const router = Router();

router.get("/llamadas", /* #swagger.tags = ['Llamada'] */ LlamadaController.getLlamadas);
router.get("/llamadas/provider/:providerCallId", /* #swagger.tags = ['Llamada'] */ LlamadaController.getByProviderCallId);
router.get("/llamadas/ejecucion/:idCampaniaEjecucion", /* #swagger.tags = ['Llamada'] */ LlamadaController.getByCampaniaEjecucion);
router.get("/llamadas/:id", /* #swagger.tags = ['Llamada'] */ LlamadaController.getLlamadaById);
router.get("/llamadas/:id/audio", /* #swagger.tags = ['Llamada'] */ LlamadaController.getAudioLlamada);
router.post("/llamadas", /* #swagger.tags = ['Llamada'] */ LlamadaController.createLlamada);
router.post("/llamadas/upload-audio", /* #swagger.tags = ['Llamada'] */ upload.single('audio'), LlamadaController.uploadAudio);
router.put("/llamadas/:id", /* #swagger.tags = ['Llamada'] */ LlamadaController.updateLlamada);
router.delete("/llamadas/:id", /* #swagger.tags = ['Llamada'] */ LlamadaController.deleteLlamada);

module.exports = router;
