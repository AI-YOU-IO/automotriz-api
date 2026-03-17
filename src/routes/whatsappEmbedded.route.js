/**
 * Routes para WhatsApp Embedded (Maravia)
 */

const { Router } = require('express');
const WhatsappEmbeddedController = require('../controllers/whatsappEmbedded.controller.js');

const router = Router();

// Procesar token del Embedded Signup
router.post(
  '/whatsapp-embedded/procesar-token',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Procesa el token obtenido del Embedded Signup de Facebook' */
  WhatsappEmbeddedController.procesarToken
);

// Obtener configuración
router.get(
  '/whatsapp-embedded/configuracion',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Obtiene la configuración actual del WhatsApp Embedded' */
  WhatsappEmbeddedController.obtenerConfiguracion
);

// Desconectar
router.post(
  '/whatsapp-embedded/desconectar',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Desconecta la configuración del WhatsApp Embedded' */
  WhatsappEmbeddedController.desconectar
);

// Verificar estado
router.get(
  '/whatsapp-embedded/estado',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Verifica el estado de la conexión' */
  WhatsappEmbeddedController.verificarEstado
);

// Suscribir webhook
router.post(
  '/whatsapp-embedded/suscribir-webhook',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Suscribe el WABA a los webhooks de Maravia' */
  WhatsappEmbeddedController.suscribirWebhook
);

// Suscribir webhooks Coexistence
router.post(
  '/whatsapp-embedded/suscribir-coexistence',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Suscribe webhooks específicos para modo Coexistence' */
  WhatsappEmbeddedController.suscribirWebhooksCoexistence
);

// Sincronizar SMB data
router.post(
  '/whatsapp-embedded/sincronizar-smb',
  /* #swagger.tags = ['WhatsApp Embedded'] */
  /* #swagger.description = 'Sincroniza contactos e historial para modo Coexistence' */
  WhatsappEmbeddedController.sincronizarSMBData
);

module.exports = router;
