const estadoProspectoRepository = require("../repositories/estadoProspecto.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EstadoProspectoController {
  async getEstadosProspecto(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const estados = await estadoProspectoRepository.findAll(idEmpresa);
      return res.status(200).json({ data: estados });
    } catch (error) {
      logger.error(`[estadoProspecto.controller.js] Error al obtener estados de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estados de prospecto" });
    }
  }

  async getEstadoProspectoById(req, res) {
    try {
      const { id } = req.params;
      const estado = await estadoProspectoRepository.findById(id);

      if (!estado) {
        return res.status(404).json({ msg: "Estado de prospecto no encontrado" });
      }

      return res.status(200).json({ data: estado });
    } catch (error) {
      logger.error(`[estadoProspecto.controller.js] Error al obtener estado de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estado de prospecto" });
    }
  }

  async createEstadoProspecto(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, descripcion, color, orden } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre || orden === undefined) {
        return res.status(400).json({ msg: "El nombre y orden son requeridos" });
      }

      const estado = await estadoProspectoRepository.create({
        nombre, descripcion, color, orden, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Estado de prospecto creado exitosamente", data: { id: estado.id } });
    } catch (error) {
      logger.error(`[estadoProspecto.controller.js] Error al crear estado de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear estado de prospecto" });
    }
  }

  async updateEstadoProspecto(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, color, orden, id_empresa } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre || orden === undefined) {
        return res.status(400).json({ msg: "El nombre y orden son requeridos" });
      }

      const [updated] = await estadoProspectoRepository.update(id, {
        nombre, descripcion, color, orden, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Estado de prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de prospecto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[estadoProspecto.controller.js] Error al actualizar estado de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de prospecto" });
    }
  }

  async deleteEstadoProspecto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await estadoProspectoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Estado de prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de prospecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[estadoProspecto.controller.js] Error al eliminar estado de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar estado de prospecto" });
    }
  }
}

module.exports = new EstadoProspectoController();
