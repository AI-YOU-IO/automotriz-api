const { Router } = require("express");

const handleValidationErrors = require("../middlewares/handleValidation.middleware.js");
const MessageProcessingController = require("../controllers/messageProcessing.controller.js");

const router = Router();

router.post("/message",
    // #swagger.tags = ['Assistant']
    // #swagger.summary = 'Procesar mensaje del asistente IA'
    handleValidationErrors,
    MessageProcessingController.processMessage
);



module.exports = router;