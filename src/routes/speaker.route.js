const { Router } = require("express");
const SpeakerController = require("../controllers/speaker.controller.js");

const router = Router();

router.get("/speakers", /* #swagger.tags = ['Speaker'] */ SpeakerController.getSpeakers);
router.get("/speakers/:id", /* #swagger.tags = ['Speaker'] */ SpeakerController.getSpeakerById);
router.post("/speakers", /* #swagger.tags = ['Speaker'] */ SpeakerController.createSpeaker);
router.put("/speakers/:id", /* #swagger.tags = ['Speaker'] */ SpeakerController.updateSpeaker);
router.delete("/speakers/:id", /* #swagger.tags = ['Speaker'] */ SpeakerController.deleteSpeaker);

module.exports = router;
