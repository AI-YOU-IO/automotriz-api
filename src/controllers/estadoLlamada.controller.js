const estadoLlamadaRepository = require("../repositories/estadoLlamada.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EstadoLlamadaController {
  async getEstadosLlamada(req, res) {
    try {
      const estados = await estadoLlamadaRepository.findAll();
      return res.status(200).json({ data: estados });
    } catch (error) {
      logger.error(`[estadoLlamada.controller.js] Error al obtener estados de llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estados de llamada" });
    }
  }

  async getEstadoLlamadaById(req, res) {
    try {
      const { id } = req.params;
      const estado = await estadoLlamadaRepository.findById(id);

      if (!estado) {
        return res.status(404).json({ msg: "Estado de llamada no encontrado" });
      }

      return res.status(200).json({ data: estado });
    } catch (error) {
      logger.error(`[estadoLlamada.controller.js] Error al obtener estado de llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estado de llamada" });
    }
  }

  async createEstadoLlamada(req, res) {
    try {
      const { nombre } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const estado = await estadoLlamadaRepository.create({ nombre, usuario_registro });

      return res.status(201).json({ msg: "Estado de llamada creado exitosamente", data: { id: estado.id } });
    } catch (error) {
      logger.error(`[estadoLlamada.controller.js] Error al crear estado de llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear estado de llamada" });
    }
  }

  async updateEstadoLlamada(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await estadoLlamadaRepository.update(id, { nombre, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Estado de llamada no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de llamada actualizado exitosamente" });
    } catch (error) {
      logger.error(`[estadoLlamada.controller.js] Error al actualizar estado de llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de llamada" });
    }
  }

  async deleteEstadoLlamada(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await estadoLlamadaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Estado de llamada no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de llamada eliminado exitosamente" });
    } catch (error) {
      logger.error(`[estadoLlamada.controller.js] Error al eliminar estado de llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar estado de llamada" });
    }
  }
}

module.exports = new EstadoLlamadaController();
