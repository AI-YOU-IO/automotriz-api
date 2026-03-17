/**
 * Controlador n8n para gestión de Chats
 *
 * Endpoints:
 * - POST /n8n/chats - Crear chat
 * - GET /n8n/chats/:id - Obtener chat por ID
 * - GET /n8n/chats/prospecto/:id_prospecto - Obtener chat por prospecto
 * - PUT /n8n/chats/:id - Actualizar chat
 */

const { Chat, Prospecto, Mensaje } = require('../models/sequelize');
const logger = require('../config/logger/loggerClient');

class N8nChatController {

  /**
   * POST /n8n/chats
   * Crear nuevo chat (o retorna existente si ya existe para el prospecto)
   */
  async crear(req, res) {
    try {
      const { id_prospecto } = req.body;

      if (!id_prospecto) {
        return res.status(400).json({
          success: false,
          error: 'id_prospecto es requerido'
        });
      }

      // Verificar que el prospecto existe
      const prospecto = await Prospecto.findByPk(id_prospecto);
      if (!prospecto) {
        return res.status(404).json({
          success: false,
          error: 'Prospecto no encontrado'
        });
      }

      // Verificar si ya existe un chat para este prospecto
      let chat = await Chat.findOne({
        where: { id_prospecto }
      });

      if (chat) {
        return res.json({
          success: true,
          creado: false,
          chat: {
            id: chat.id,
            id_prospecto: chat.id_prospecto
          },
          prospecto: {
            id: prospecto.id,
            nombre_completo: prospecto.nombre_completo,
            celular: prospecto.celular
          }
        });
      }

      // Crear chat
      chat = await Chat.create({
        id_prospecto,
        usuario_registro: null,
        estado_registro: 1
      });

      logger.info(`[n8nChat] Creado: ${chat.id} para prospecto ${id_prospecto}`);

      return res.json({
        success: true,
        creado: true,
        chat: {
          id: chat.id,
          id_prospecto: chat.id_prospecto
        },
        prospecto: {
          id: prospecto.id,
          nombre_completo: prospecto.nombre_completo,
          celular: prospecto.celular
        }
      });

    } catch (error) {
      logger.error(`[n8nChat] Error crear: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/chats/:id
   * Obtener chat por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const chat = await Chat.findByPk(id, {
        include: [
          { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'id_empresa'] }
        ]
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado'
        });
      }

      // Contar mensajes
      const totalMensajes = await Mensaje.count({
        where: { id_chat: id, estado_registro: 1 }
      });

      return res.json({
        success: true,
        chat: {
          id: chat.id,
          id_prospecto: chat.id_prospecto,
          total_mensajes: totalMensajes,
          prospecto: chat.prospecto ? {
            id: chat.prospecto.id,
            nombre_completo: chat.prospecto.nombre_completo,
            celular: chat.prospecto.celular,
            id_empresa: chat.prospecto.id_empresa
          } : null
        }
      });

    } catch (error) {
      logger.error(`[n8nChat] Error obtenerPorId: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/chats/prospecto/:id_prospecto
   * Obtener chat por prospecto
   */
  async obtenerPorProspecto(req, res) {
    try {
      const { id_prospecto } = req.params;

      const chat = await Chat.findOne({
        where: { id_prospecto },
        include: [
          { model: Prospecto, as: 'prospecto', attributes: ['id', 'nombre_completo', 'celular', 'id_empresa'] }
        ]
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado para el prospecto'
        });
      }

      // Contar mensajes
      const totalMensajes = await Mensaje.count({
        where: { id_chat: chat.id, estado_registro: 1 }
      });

      return res.json({
        success: true,
        chat: {
          id: chat.id,
          id_prospecto: chat.id_prospecto,
          total_mensajes: totalMensajes,
          prospecto: chat.prospecto ? {
            id: chat.prospecto.id,
            nombre_completo: chat.prospecto.nombre_completo,
            celular: chat.prospecto.celular,
            id_empresa: chat.prospecto.id_empresa
          } : null
        }
      });

    } catch (error) {
      logger.error(`[n8nChat] Error obtenerPorProspecto: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /n8n/chats/:id
   * Actualizar chat
   */
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const { estado_registro } = req.body;

      const chat = await Chat.findByPk(id);
      if (!chat) {
        return res.status(404).json({
          success: false,
          error: 'Chat no encontrado'
        });
      }

      const datosActualizar = {};
      if (estado_registro !== undefined) datosActualizar.estado_registro = estado_registro;

      await Chat.update(datosActualizar, { where: { id } });

      const chatActualizado = await Chat.findByPk(id);

      logger.info(`[n8nChat] Actualizado: ${id}`);

      return res.json({
        success: true,
        chat: {
          id: chatActualizado.id,
          id_prospecto: chatActualizado.id_prospecto,
          estado_registro: chatActualizado.estado_registro
        }
      });

    } catch (error) {
      logger.error(`[n8nChat] Error actualizar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nChatController();
