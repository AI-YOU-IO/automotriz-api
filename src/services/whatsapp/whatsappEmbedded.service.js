/**
 * Servicio para WhatsApp Embedded de Maravia
 * Endpoints: ws_whatsapp_embedded.php
 */

const axios = require('axios');
const maraviaApi = require('../maravia/maraviaApi.service.js');
const logger = require('../../config/logger/loggerClient.js');

// Configuración de la App de Facebook (mismas credenciales que Maravia)
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '1132169025568098';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '4c7ac78dcda3619bbbb224c66c1189c3';
const GRAPH_API_VERSION = 'v21.0';

class WhatsappEmbeddedService {
  /**
   * Intercambia un código de autorización por un access_token
   * Necesario para el flujo Coexistence (FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING)
   */
  async exchangeCodeForToken(code) {
    try {
      logger.info('[WhatsappEmbedded] Intercambiando código por access_token...');

      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`;
      const response = await axios.get(url, {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          code: code
        },
        timeout: 30000
      });

      if (response.data && response.data.access_token) {
        logger.info('[WhatsappEmbedded] Código intercambiado exitosamente por access_token');
        return response.data.access_token;
      }

      logger.error('[WhatsappEmbedded] Respuesta inesperada al intercambiar código', response.data);
      throw new Error('No se recibió access_token en la respuesta');
    } catch (error) {
      logger.error(`[WhatsappEmbedded] Error intercambiando código: ${error.response?.data?.error?.message || error.message}`);
      throw new Error(`Error al intercambiar código de autorización: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Procesa el token del Embedded Signup
   * Si es flujo Coexistence, primero intercambia el código por access_token
   */
  async procesarToken(codeOrToken, eventType = 'FINISH', idPlataforma = 7, idEmpresa, usuarioId = null) {
    logger.info(`[WhatsappEmbedded] Procesando token para empresa ${idEmpresa}, eventType: ${eventType}`);

    let accessToken = codeOrToken;

    // Si es flujo Coexistence, el frontend envía un 'code' que debe intercambiarse
    if (eventType === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
      logger.info('[WhatsappEmbedded] Flujo Coexistence detectado, intercambiando código...');
      accessToken = await this.exchangeCodeForToken(codeOrToken);
    }

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'PROCESAR_TOKEN_EMBEDDED',
      access_token: accessToken,
      event: eventType,
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa,
      usuario_id: usuarioId
    });
  }

  /**
   * Obtiene la configuración del Embedded Signup
   */
  async obtenerConfiguracion(idPlataforma = 7, idEmpresa) {
    logger.info(`[WhatsappEmbedded] Obteniendo configuración para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'OBTENER_CONFIGURACION_EMBEDDED',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa
    });
  }

  /**
   * Desconecta el Embedded Signup
   */
  async desconectar(idPlataforma = 7, idEmpresa, usuarioId) {
    logger.info(`[WhatsappEmbedded] Desconectando para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'DESCONECTAR_EMBEDDED',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa,
      usuario_id: usuarioId
    });
  }

  /**
   * Verifica el estado de la conexión
   */
  async verificarEstado(idPlataforma = 7, idEmpresa) {
    logger.info(`[WhatsappEmbedded] Verificando estado para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'VERIFICAR_ESTADO_EMBEDDED',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa
    });
  }

  /**
   * Suscribe el WABA a webhooks
   */
  async suscribirWebhook(idPlataforma = 7, idEmpresa) {
    logger.info(`[WhatsappEmbedded] Suscribiendo webhook para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'SUSCRIBIR_WEBHOOK',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa
    });
  }

  /**
   * Suscribe webhooks para Coexistence
   */
  async suscribirWebhooksCoexistence(idPlataforma = 7, idEmpresa) {
    logger.info(`[WhatsappEmbedded] Suscribiendo webhooks Coexistence para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'SUSCRIBIR_WEBHOOKS_COEXISTENCE',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa
    });
  }

  /**
   * Sincroniza datos SMB (contactos e historial)
   */
  async sincronizarSMBData(idPlataforma = 7, idEmpresa, syncType = 'all') {
    logger.info(`[WhatsappEmbedded] Sincronizando SMB data (${syncType}) para empresa ${idEmpresa}`);

    return maraviaApi.request('ws_whatsapp_embedded.php', {
      codOpe: 'SINCRONIZAR_SMB_DATA',
      id_plataforma: idPlataforma,
      id_empresa: idEmpresa,
      sync_type: syncType
    });
  }
}

module.exports = new WhatsappEmbeddedService();
