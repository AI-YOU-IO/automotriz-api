const { Router } = require('express');
const N8nPlantillaBitrixController = require('../controllers/n8nPlantillaBitrix.controller.js');
const { validateN8nApiKey } = require('../middlewares/n8nAuth.middleware.js');

const router = Router();

router.use(validateN8nApiKey);

// POST /n8n/plantilla-bitrix/enviar
router.post('/enviar', /* #swagger.tags = ['N8N Plantilla Bitrix'] */ N8nPlantillaBitrixController.enviar);

module.exports = router;
