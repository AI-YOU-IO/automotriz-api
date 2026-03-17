const { Router } = require('express');
const whatsappMensajeController = require('../controllers/whatsappMensaje.controller');

const router = Router();

// POST /api/whatsapp-mensaje/enviar
// Endpoint público para enviar mensajes de WhatsApp
router.post('/enviar', /* #swagger.tags = ['WhatsApp Mensaje'] */ whatsappMensajeController.enviarMensaje);

module.exports = router;
