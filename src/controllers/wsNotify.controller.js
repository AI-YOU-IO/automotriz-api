const axios = require('axios');
const logger = require('../config/logger/loggerClient.js');

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:8080';

class WsNotifyController {
  /**
   * POST /ws-notify/mensaje-entrante
   *
   * Notifica al WebSocket server que llegó un mensaje entrante (del cliente).
   * Llamar desde el agente IA u otro servicio externo después de guardar el mensaje en BD.
   *
   * Body:
   *  - id_contacto: number (requerido)
   *  - mensaje: object (requerido) — { id, id_contacto, contenido, direccion, tipo_mensaje, fecha_hora, contenido_archivo }
   */
  async notificarMensajeEntrante(req, res) {
    try {
      const { id_contacto, mensaje } = req.body;

      if (!id_contacto || !mensaje) {
        return res.status(400).json({ success: false, error: 'id_contacto y mensaje son requeridos' });
      }

      logger.info(`[wsNotify] Notificando mensaje entrante para contacto ${id_contacto}`);

      const response = await axios.post(`${WS_SERVER_URL}/webhook/mensaje-entrante`, {
        id_contacto,
        mensaje
      }, { timeout: 5000 });

      return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      logger.error(`[wsNotify] Error notificando mensaje entrante: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /ws-notify/mensaje-saliente
   *
   * Notifica al WebSocket server que se envió un mensaje saliente (del bot/agente IA).
   * Llamar desde el agente IA u otro servicio externo después de enviar y guardar el mensaje.
   *
   * Body:
   *  - id_contacto: number (requerido)
   *  - mensaje: object (requerido) — { id, id_contacto, contenido, direccion, tipo_mensaje, fecha_hora, contenido_archivo }
   */
  async notificarMensajeSaliente(req, res) {
    try {
      const { id_contacto, mensaje } = req.body;

      if (!id_contacto || !mensaje) {
        return res.status(400).json({ success: false, error: 'id_contacto y mensaje son requeridos' });
      }

      logger.info(`[wsNotify] Notificando mensaje saliente para contacto ${id_contacto}`);

      const response = await axios.post(`${WS_SERVER_URL}/webhook/mensaje-saliente`, {
        id_contacto,
        mensaje
      }, { timeout: 5000 });

      return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      logger.error(`[wsNotify] Error notificando mensaje saliente: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new WsNotifyController();
