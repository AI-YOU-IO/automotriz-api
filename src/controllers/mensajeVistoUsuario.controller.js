const mensajeVistoRepository = require("../repositories/mensajeVistoUsuario.repository.js");
const logger = require('../config/logger/loggerClient.js');

class MensajeVistoController {
  async getMensajesVistos(req, res) {
    try {
      const mensajesVistos = await mensajeVistoRepository.findAll();
      return res.status(200).json({ data: mensajesVistos });
    } catch (error) {
      logger.error(`[mensajeVisto.controller.js] Error al obtener mensajes vistos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensajes vistos" });
    }
  }

  async getMensajeVistoById(req, res) {
    try {
      const { id } = req.params;
      const mensajeVisto = await mensajeVistoRepository.findById(id);

      if (!mensajeVisto) {
        return res.status(404).json({ msg: "Mensaje visto no encontrado" });
      }

      return res.status(200).json({ data: mensajeVisto });
    } catch (error) {
      logger.error(`[mensajeVisto.controller.js] Error al obtener mensaje visto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensaje visto" });
    }
  }

  async createMensajeVisto(req, res) {
    try {
      const { id_mensaje } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_mensaje) {
        return res.status(400).json({ msg: "El id_mensaje es requerido" });
      }

      // Verificar si ya existe un registro para este mensaje
      const existente = await mensajeVistoRepository.findByMensaje(id_mensaje);
      if (existente) {
        return res.status(200).json({ msg: "El mensaje ya fue marcado como visto", data: { id: existente.id } });
      }

      const mensajeVisto = await mensajeVistoRepository.create({
        id_mensaje,
        fecha_visto: new Date(),
        usuario_registro
      });

      return res.status(201).json({ msg: "Mensaje visto registrado exitosamente", data: { id: mensajeVisto.id } });
    } catch (error) {
      logger.error(`[mensajeVisto.controller.js] Error al crear mensaje visto: ${error.message}`);
      return res.status(500).json({ msg: "Error al registrar mensaje visto" });
    }
  }

  async updateMensajeVisto(req, res) {
    try {
      const { id } = req.params;
      const { id_mensaje } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await mensajeVistoRepository.update(id, {
        id_mensaje,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Mensaje visto no encontrado" });
      }

      return res.status(200).json({ msg: "Mensaje visto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[mensajeVisto.controller.js] Error al actualizar mensaje visto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar mensaje visto" });
    }
  }

  async deleteMensajeVisto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await mensajeVistoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Mensaje visto no encontrado" });
      }

      return res.status(200).json({ msg: "Mensaje visto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[mensajeVisto.controller.js] Error al eliminar mensaje visto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar mensaje visto" });
    }
  }
}

module.exports = new MensajeVistoController();
