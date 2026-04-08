const whatsappGraphService = require('../services/whatsapp/whatsappGraph.service.js');
const logger = require('../config/logger/loggerClient.js');

const TEMPLATE_NAME = 'primer_mensaje_bitrix';
const TEMPLATE_LANGUAGE = 'es';
const ID_EMPRESA = 1;

class N8nPlantillaBitrixController {
  /**
   * POST /n8n/plantilla-bitrix/enviar
   *
   * Envía la plantilla "primer_mensaje_bitrix" a un número de WhatsApp.
   *
   * Body:
   *  - phone: string (requerido) — número del destinatario
   *  - nombre: string (requerido) — {{1}} nombre del prospecto
   *  - marca_modelo: string (requerido) — {{2}} marca y modelo del vehículo
   *  - mensaje_adicional: string (requerido) — {{3}} mensaje adicional
   */
  async enviar(req, res) {
    try {
      const { phone, nombre, marca_modelo, mensaje_adicional } = req.body;

      if (!phone || !nombre || !marca_modelo || !mensaje_adicional) {
        return res.status(400).json({
          success: false,
          error: 'Campos requeridos: phone, nombre, marca_modelo, mensaje_adicional'
        });
      }

      logger.info(`[n8nPlantillaBitrix] Enviando ${TEMPLATE_NAME} a ${phone} — nombre: ${nombre}, marca_modelo: ${marca_modelo}`);

      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: nombre },
            { type: 'text', text: marca_modelo },
            { type: 'text', text: mensaje_adicional }
          ]
        }
      ];

      const result = await whatsappGraphService.enviarPlantilla(
        ID_EMPRESA,
        phone,
        TEMPLATE_NAME,
        TEMPLATE_LANGUAGE,
        components
      );

      const wid = result?.response?.messages?.[0]?.id || null;
      logger.info(`[n8nPlantillaBitrix] Enviado OK — wid: ${wid}, phone: ${phone}`);

      return res.status(200).json({
        success: true,
        msg: 'Plantilla enviada correctamente',
        data: { wid, phone, template: TEMPLATE_NAME }
      });
    } catch (error) {
      const metaErr = error.response?.data?.error || {};
      logger.error(`[n8nPlantillaBitrix] Error enviando plantilla a ${req.body?.phone || 'N/A'}`);
      logger.error(`[n8nPlantillaBitrix] Status: ${error.response?.status || 'N/A'}, Meta code: ${metaErr.code || 'N/A'}, message: ${metaErr.message || error.message}`);
      return res.status(500).json({
        success: false,
        error: metaErr.message || error.message
      });
    }
  }
}

module.exports = new N8nPlantillaBitrixController();
