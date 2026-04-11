const { Router } = require('express');
const CampoSistemaController = require('../controllers/campoSistema.controller.js');

const router = Router();

router.get('/campos-sistema', /* #swagger.tags = ['Campo Sistema'] */ CampoSistemaController.getCamposSistema);

module.exports = router;
