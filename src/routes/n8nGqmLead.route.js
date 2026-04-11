const { Router } = require("express");
const N8nGqmLeadController = require("../controllers/n8nGqmLead.controller.js");
const { validateN8nApiKey } = require("../middlewares/n8nAuth.middleware.js");

const router = Router();

router.use(validateN8nApiKey);

router.post("/", N8nGqmLeadController.crear);

module.exports = router;
