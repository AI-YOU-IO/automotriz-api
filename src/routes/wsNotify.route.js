const { Router } = require('express');
const WsNotifyController = require('../controllers/wsNotify.controller.js');

const router = Router();

// POST /ws-notify/mensaje-entrante — Servicio externo notifica mensaje entrante
router.post('/mensaje-entrante', /* #swagger.tags = ['WS Notify'] */ WsNotifyController.notificarMensajeEntrante);

// POST /ws-notify/mensaje-saliente — Servicio externo notifica mensaje saliente
router.post('/mensaje-saliente', /* #swagger.tags = ['WS Notify'] */ WsNotifyController.notificarMensajeSaliente);

module.exports = router;
