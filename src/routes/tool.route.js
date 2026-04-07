const { Router } = require("express");
const ToolController = require("../controllers/tool.controller.js");

const router = Router();

router.get("/tools", /* #swagger.tags = ['Tool'] */ ToolController.getTools);
router.get("/tools/:id/functions", /* #swagger.tags = ['Tool'] */ ToolController.getToolFunctions);
router.get("/tools/:id", /* #swagger.tags = ['Tool'] */ ToolController.getToolById);

module.exports = router;
