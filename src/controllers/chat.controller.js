const chatRepository = require("../repositories/chat.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ChatController {
  async getChats(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const chats = await chatRepository.findAll(idEmpresa);
      return res.status(200).json({ data: chats });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al obtener chats: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener chats" });
    }
  }

  async getChatById(req, res) {
    try {
      const { id } = req.params;
      const chat = await chatRepository.findById(id);

      if (!chat) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      return res.status(200).json({ data: chat });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al obtener chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener chat" });
    }
  }

  async createChat(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { id_prospecto } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_prospecto) {
        return res.status(400).json({ msg: "El prospecto es requerido" });
      }

      const chat = await chatRepository.create({
        id_prospecto, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Chat creado exitosamente", data: { id: chat.id } });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al crear chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear chat" });
    }
  }

  async updateChat(req, res) {
    try {
      const { id } = req.params;
      const { id_prospecto } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await chatRepository.update(id, { id_prospecto, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      return res.status(200).json({ msg: "Chat actualizado exitosamente" });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al actualizar chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar chat" });
    }
  }

  async deleteChat(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await chatRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      return res.status(200).json({ msg: "Chat eliminado exitosamente" });
    } catch (error) {
      logger.error(`[chat.controller.js] Error al eliminar chat: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar chat" });
    }
  }
}

module.exports = new ChatController();
