const estadoCitaRepository = require("../repositories/estadoCita.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EstadoCitaController {
  async getEstadosCita(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const estados = await estadoCitaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: estados });
    } catch (error) {
      logger.error(`[estadoCita.controller.js] Error al obtener estados de cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estados de cita" });
    }
  }

  async getEstadoCitaById(req, res) {
    try {
      const { id } = req.params;
      const estado = await estadoCitaRepository.findById(id);

      if (!estado) {
        return res.status(404).json({ msg: "Estado de cita no encontrado" });
      }

      return res.status(200).json({ data: estado });
    } catch (error) {
      logger.error(`[estadoCita.controller.js] Error al obtener estado de cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estado de cita" });
    }
  }

  async createEstadoCita(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, color, orden } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre || orden === undefined) {
        return res.status(400).json({ msg: "El nombre y orden son requeridos" });
      }

      const estado = await estadoCitaRepository.create({
        nombre, color, orden, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Estado de cita creado exitosamente", data: { id: estado.id } });
    } catch (error) {
      logger.error(`[estadoCita.controller.js] Error al crear estado de cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear estado de cita" });
    }
  }

  async updateEstadoCita(req, res) {
    try {
      const { id } = req.params;
      const { nombre, color, orden, id_empresa } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre || orden === undefined) {
        return res.status(400).json({ msg: "El nombre y orden son requeridos" });
      }

      const [updated] = await estadoCitaRepository.update(id, {
        nombre, color, orden, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Estado de cita no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de cita actualizado exitosamente" });
    } catch (error) {
      logger.error(`[estadoCita.controller.js] Error al actualizar estado de cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de cita" });
    }
  }

  async deleteEstadoCita(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await estadoCitaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Estado de cita no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de cita eliminado exitosamente" });
    } catch (error) {
      logger.error(`[estadoCita.controller.js] Error al eliminar estado de cita: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar estado de cita" });
    }
  }
}

module.exports = new EstadoCitaController();
