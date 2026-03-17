const mensajeRepository = require("../repositories/mensaje.repository.js");
const logger = require('../config/logger/loggerClient.js');

class MensajeController {
  async getMensajes(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const mensajes = await mensajeRepository.findAll(idEmpresa);
      return res.status(200).json({ data: mensajes });
    } catch (error) {
      logger.error(`[mensaje.controller.js] Error al obtener mensajes: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensajes" });
    }
  }

  async getMensajeById(req, res) {
    try {
      const { id } = req.params;
      const mensaje = await mensajeRepository.findById(id);

      if (!mensaje) {
        return res.status(404).json({ msg: "Mensaje no encontrado" });
      }

      return res.status(200).json({ data: mensaje });
    } catch (error) {
      logger.error(`[mensaje.controller.js] Error al obtener mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensaje" });
    }
  }

  async createMensaje(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { id_chat, direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo, fecha_hora, id_usuario, id_prospecto } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_chat || !direccion || !tipo_mensaje || !wid_mensaje || !contenido || !fecha_hora || !id_prospecto) {
        return res.status(400).json({ msg: "Chat, dirección, tipo de mensaje, WID, contenido, fecha hora y prospecto son requeridos" });
      }

      const mensaje = await mensajeRepository.create({
        id_chat, direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo,
        fecha_hora, id_usuario, id_prospecto, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Mensaje creado exitosamente", data: { id: mensaje.id } });
    } catch (error) {
      logger.error(`[mensaje.controller.js] Error al crear mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear mensaje" });
    }
  }

  async updateMensaje(req, res) {
    try {
      const { id } = req.params;
      const { id_chat, direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo, fecha_hora, id_usuario, id_prospecto } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await mensajeRepository.update(id, {
        id_chat, direccion, tipo_mensaje, wid_mensaje, contenido, contenido_archivo,
        fecha_hora, id_usuario, id_prospecto, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Mensaje no encontrado" });
      }

      return res.status(200).json({ msg: "Mensaje actualizado exitosamente" });
    } catch (error) {
      logger.error(`[mensaje.controller.js] Error al actualizar mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar mensaje" });
    }
  }

  async deleteMensaje(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await mensajeRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Mensaje no encontrado" });
      }

      return res.status(200).json({ msg: "Mensaje eliminado exitosamente" });
    } catch (error) {
      logger.error(`[mensaje.controller.js] Error al eliminar mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar mensaje" });
    }
  }
}

module.exports = new MensajeController();
