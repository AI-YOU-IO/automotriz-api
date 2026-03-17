const { Router } = require("express");
const PromptAsistenteController = require("../controllers/promptAsistente.controller.js");

const router = Router();

router.get("/prompt-asistente", /* #swagger.tags = ['PromptAsistente'] */ PromptAsistenteController.getPrompt);
router.post("/prompt-asistente", /* #swagger.tags = ['PromptAsistente'] */ PromptAsistenteController.savePrompt);

module.exports = router;
