const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const { authUltravoxToken } = require("../middlewares/ultravoxAuth.middleware.js");
const LlamadaController = require("../controllers/llamada.controller.js");

const router = Router();

// Multer para subida de audios de llamadas
const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|ogg|m4a|webm|mpeg|audio/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten archivos de audio (mp3, wav, ogg, m4a, webm)"));
  }
});

// Webhook: upload de audio por provider_call_id
router.post("/upload-audio", authUltravoxToken, uploadAudio.single('audio'), LlamadaController.uploadAudioWebhook);

// Webhook: guardar transcripción
router.post("/transcripcion", authUltravoxToken, LlamadaController.guardarTranscripcion);

module.exports = router;
