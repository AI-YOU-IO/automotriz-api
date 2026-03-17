/**
 * Controlador n8n para gestión de Mensajes
 *
 * Endpoints:
 * - POST /n8n/mensajes - Insertar mensaje (in/out)
 * - GET /n8n/mensajes/chat/:id_chat - Obtener mensajes de un chat
 * - POST /n8n/mensajes/enviar-plantilla - Enviar plantilla y registrar
 */

const { Mensaje, Chat, Prospecto, PlantillaWhatsapp, Usuario } = require('../models/sequelize');
const whatsappGraphService = require('../services/whatsapp/whatsappGraph.service');
const logger = require('../config/logger/loggerClient');

class N8nMensajeController {

  /**
   * POST /n8n/mensajes
   * Insertar mensaje entrante (in) o saliente (out)
   */
  async insertar(req, res) {
    try {
      const {
        id_chat,
        direccion,
        tipo_mensaje = 'texto',
        contenido,
        wid_mensaje = null,
        contenido_archivo = null,
        id_usuario = null,
        id_plantilla_whatsapp = null,
        fecha_hora = new Date()
      } = req.body;

      // Validaciones
      if (!id_chat) {
        return res.status(400).json({
          success: false,
          error: 'id_chat es requerido'
        });
      }

      if (!direccion || !['in', 'out'].includes(direccion)) {
        return res.status(400).json({
          success: false,
          error: 'direccion es requerido y debe ser "in" o "out"'
        });
      }

      if (!contenido) {
        return res.status(400).json({
          success: false,
          error: 'contenido es requerido'
        });
      }

      // Verificar que el chat existe
      const chat = await Chat.findByPk(id_chat);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado'
        });
      }

      // Crear mensaje
      const mensaje = await Mensaje.create({
        id_chat,
        direccion,
        tipo_mensaje,
        contenido,
        wid_mensaje,
        contenido_archivo,
        id_usuario,
        id_plantilla_whatsapp,
        fecha_hora: new Date(fecha_hora),
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nMensaje] Insertado: ${mensaje.id} - ${direccion} - Chat: ${id_chat}`);

      return res.json({
        success: true,
        mensaje: {
          id: mensaje.id,
          id_chat: mensaje.id_chat,
          direccion: mensaje.direccion,
          tipo_mensaje: mensaje.tipo_mensaje,
          contenido: mensaje.contenido,
          wid_mensaje: mensaje.wid_mensaje,
          contenido_archivo: mensaje.contenido_archivo,
          id_usuario: mensaje.id_usuario,
          id_plantilla_whatsapp: mensaje.id_plantilla_whatsapp,
          fecha_hora: mensaje.fecha_hora
        }
      });

    } catch (error) {
      logger.error(`[n8nMensaje] Error insertar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/mensajes/chat/:id_chat
   * Obtener mensajes de un chat
   */
  async obtenerPorChat(req, res) {
    try {
      const { id_chat } = req.params;
      const { limite = 50, direccion } = req.query;

      if (!id_chat) {
        return res.status(400).json({
          success: false,
          error: 'id_chat es requerido'
        });
      }

      const whereClause = {
        id_chat: parseInt(id_chat),
        estado_registro: 1
      };

      if (direccion && ['in', 'out'].includes(direccion)) {
        whereClause.direccion = direccion;
      }

      const mensajes = await Mensaje.findAll({
        where: whereClause,
        order: [['fecha_hora', 'DESC']],
        limit: parseInt(limite),
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'] },
          { model: PlantillaWhatsapp, as: 'plantillaWhatsapp', attributes: ['id', 'name'] }
        ]
      });

      return res.json({
        success: true,
        mensajes: mensajes.reverse().map(m => ({
          id: m.id,
          direccion: m.direccion,
          tipo_mensaje: m.tipo_mensaje,
          contenido: m.contenido,
          wid_mensaje: m.wid_mensaje,
          contenido_archivo: m.contenido_archivo,
          fecha_hora: m.fecha_hora,
          id_usuario: m.id_usuario,
          usuario: m.usuario?.usuario || null,
          id_plantilla_whatsapp: m.id_plantilla_whatsapp,
          plantilla: m.plantillaWhatsapp?.name || null
        })),
        total: mensajes.length
      });

    } catch (error) {
      logger.error(`[n8nMensaje] Error obtenerPorChat: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /n8n/mensajes/enviar-plantilla
   * Enviar plantilla WhatsApp y registrar mensaje saliente
   */
  async enviarPlantilla(req, res) {
    try {
      const {
        id_chat,
        id_empresa,
        telefono,
        template_name,
        language = 'es',
        components = [],
        id_usuario = null
      } = req.body;

      if (!id_chat || !id_empresa || !telefono || !template_name) {
        return res.status(400).json({
          success: false,
          error: 'id_chat, id_empresa, telefono y template_name son requeridos'
        });
      }

      // Verificar que el chat existe
      const chat = await Chat.findByPk(id_chat);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado'
        });
      }

      // Buscar plantilla en BD
      logger.info(`[n8nMensaje] Buscando plantilla: ${template_name} para empresa: ${id_empresa}`);
      const plantilla = await PlantillaWhatsapp.findOne({
        where: {
          name: template_name,
          id_empresa,
          estado_registro: 1
        }
      });
      logger.info(`[n8nMensaje] Plantilla en BD: ${plantilla ? `ID ${plantilla.id}` : 'NO ENCONTRADA'}`);

      // Enviar plantilla via WhatsApp
      let wid_mensaje = null;
      let envio_exitoso = false;
      let whatsapp_response = null;

      try {
        logger.info(`[n8nMensaje] Iniciando envío de plantilla...`);
        logger.info(`[n8nMensaje] Params: id_empresa=${id_empresa}, telefono=${telefono}, template=${template_name}, lang=${language}`);

        const resultado = await whatsappGraphService.enviarPlantilla(
          id_empresa,
          telefono,
          template_name,
          language,
          components
        );

        logger.info(`[n8nMensaje] Resultado WhatsApp: ${JSON.stringify(resultado)}`);
        wid_mensaje = resultado?.wid_mensaje || resultado?.response?.messages?.[0]?.id || null;
        envio_exitoso = true;
        whatsapp_response = resultado;
        logger.info(`[n8nMensaje] Plantilla enviada OK: ${template_name} a ${telefono}, wid: ${wid_mensaje}`);
      } catch (envioError) {
        logger.error(`[n8nMensaje] ========== ERROR ENVIANDO PLANTILLA ==========`);
        logger.error(`[n8nMensaje] Mensaje: ${envioError.message}`);
        logger.error(`[n8nMensaje] Status HTTP: ${envioError.response?.status || 'N/A'}`);
        logger.error(`[n8nMensaje] Status Text: ${envioError.response?.statusText || 'N/A'}`);
        logger.error(`[n8nMensaje] Response Data: ${JSON.stringify(envioError.response?.data || {})}`);
        logger.error(`[n8nMensaje] Request URL: ${envioError.config?.url || 'N/A'}`);
        logger.error(`[n8nMensaje] ===============================================`);

        whatsapp_response = {
          error: envioError.message,
          status: envioError.response?.status || null,
          meta_error: envioError.response?.data?.error || null
        };
      }

      // Registrar mensaje saliente
      const mensaje = await Mensaje.create({
        id_chat,
        direccion: 'out',
        tipo_mensaje: 'plantilla',
        contenido: `[Plantilla: ${template_name}]`,
        wid_mensaje,
        contenido_archivo: null,
        id_usuario,
        id_plantilla_whatsapp: plantilla?.id || null,
        fecha_hora: new Date(),
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nMensaje] Mensaje plantilla registrado: ${mensaje.id}`);

      return res.json({
        success: true,
        envio_exitoso,
        mensaje: {
          id: mensaje.id,
          id_chat: mensaje.id_chat,
          wid_mensaje: mensaje.wid_mensaje,
          template_name,
          id_plantilla_whatsapp: mensaje.id_plantilla_whatsapp
        },
        whatsapp_response
      });

    } catch (error) {
      logger.error(`[n8nMensaje] Error enviarPlantilla: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nMensajeController();
