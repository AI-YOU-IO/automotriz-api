const { Router } = require("express");
const TranscripcionController = require("../controllers/transcripcion.controller.js");

const router = Router();

router.get("/transcripciones", /* #swagger.tags = ['Transcripcion'] */ TranscripcionController.getTranscripciones);
router.get("/transcripciones/:id", /* #swagger.tags = ['Transcripcion'] */ TranscripcionController.getTranscripcionById);
router.post("/transcripciones", /* #swagger.tags = ['Transcripcion'] */ TranscripcionController.createTranscripcion);
router.put("/transcripciones/:id", /* #swagger.tags = ['Transcripcion'] */ TranscripcionController.updateTranscripcion);
router.delete("/transcripciones/:id", /* #swagger.tags = ['Transcripcion'] */ TranscripcionController.deleteTranscripcion);

module.exports = router;
