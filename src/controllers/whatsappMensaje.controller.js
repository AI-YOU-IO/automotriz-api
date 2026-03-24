const whatsappGraphService = require('../services/whatsapp/whatsappGraph.service');
const mensajeRepository = require('../repositories/mensaje.repository');
const { Chat, Prospecto } = require('../models/sequelize');
const logger = require('../config/logger/loggerClient');

class WhatsappMensajeController {

  async enviarMensaje(req, res) {
    try {
      const {
        phone_number_id,
        phone,
        type = 'text',
        message,
        id_chat,
        image_url,
        document_url,
        filename,
        audio_url,
        video_url
      } = req.body;

      // Validar campos requeridos
      if (!phone_number_id) {
        return res.status(400).json({
          success: false,
          error: 'phone_number_id es requerido'
        });
      }

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'phone es requerido'
        });
      }

      if (!id_chat) {
        return res.status(400).json({
          success: false,
          error: 'id_chat es requerido'
        });
      }

      // Validaciones específicas por tipo
      if (type === 'text' && !message) {
        return res.status(400).json({
          success: false,
          error: 'message es requerido para tipo texto'
        });
      }

      if (type === 'image' && !image_url) {
        return res.status(400).json({
          success: false,
          error: 'image_url es requerido para tipo imagen'
        });
      }

      if (type === 'document' && (!document_url || !filename)) {
        return res.status(400).json({
          success: false,
          error: 'document_url y filename son requeridos para tipo documento'
        });
      }

      if (type === 'audio' && !audio_url) {
        return res.status(400).json({
          success: false,
          error: 'audio_url es requerido para tipo audio'
        });
      }

      if (type === 'video' && !video_url) {
        return res.status(400).json({
          success: false,
          error: 'video_url es requerido para tipo video'
        });
      }

      // Enviar mensaje según tipo
      let resultado;
      let contenido = message || '';
      let contenido_archivo = null;

      switch (type) {
        case 'text':
          resultado = await whatsappGraphService.enviarMensajeTexto(id_empresa, phone, message);
          break;

        case 'image':
          resultado = await whatsappGraphService.enviarImagen(id_empresa, phone, image_url, message);
          contenido_archivo = image_url;
          break;

        case 'document':
          resultado = await whatsappGraphService.enviarDocumento(id_empresa, phone, document_url, filename, message);
          contenido_archivo = document_url;
          break;

        case 'audio':
          resultado = await whatsappGraphService.enviarAudio(id_empresa, phone, audio_url);
          contenido_archivo = audio_url;
          break;

        case 'video':
          resultado = await whatsappGraphService.enviarVideo(id_empresa, phone, video_url, message);
          contenido_archivo = video_url;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: 'Tipo de mensaje no válido. Use: text, image, document, audio, video'
          });
      }

      // Guardar mensaje en BD
      const mensajeGuardado = await mensajeRepository.create({
        id_chat,
        contenido,
        contenido_archivo,
        direccion: 'out',
        tipo_mensaje: type === 'text' ? 'texto' : type,
        wid_mensaje: resultado.wid_mensaje,
        fecha_hora: new Date(),
        usuario_registro: null
      });

      // Marcar prospecto como contactado
      const chat = await Chat.findByPk(id_chat);
      if (chat?.id_prospecto) {
        await Prospecto.update(
          { fue_contactado: 1 },
          { where: { id: chat.id_prospecto, fue_contactado: 0 } }
        );
      }

      logger.info(`[WhatsappMensaje] Mensaje enviado y guardado - wid: ${resultado.wid_mensaje}, id_bd: ${mensajeGuardado.id}`);

      return res.status(200).json({
        success: true,
        message: 'Mensaje enviado correctamente',
        data: {
          wid_mensaje: resultado.wid_mensaje,
          id_mensaje_bd: mensajeGuardado.id
        }
      });

    } catch (error) {
      logger.error(`[WhatsappMensaje] Error: ${error.message}`);

      // Si es error de credenciales
      if (error.message.includes('No se encontraron credenciales')) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron credenciales de WhatsApp para la empresa',
          details: error.message
        });
      }

      // Si es error de WhatsApp API
      if (error.response?.data) {
        return res.status(error.response.status || 500).json({
          success: false,
          error: 'Error al enviar mensaje a WhatsApp',
          details: error.response.data
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  }
}

module.exports = new WhatsappMensajeController();
