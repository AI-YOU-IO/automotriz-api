const { Router } = require("express");
const VersionController = require("../controllers/version.controller.js");

const router = Router();

router.get("/versiones", /* #swagger.tags = ['Version'] */ VersionController.getVersiones);
router.get("/versiones/:id", /* #swagger.tags = ['Version'] */ VersionController.getVersionById);
router.post("/versiones", /* #swagger.tags = ['Version'] */ VersionController.createVersion);
router.put("/versiones/:id", /* #swagger.tags = ['Version'] */ VersionController.updateVersion);
router.delete("/versiones/:id", /* #swagger.tags = ['Version'] */ VersionController.deleteVersion);

module.exports = router;
