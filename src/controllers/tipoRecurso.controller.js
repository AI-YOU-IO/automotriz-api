const tipoRecursoRepository = require("../repositories/tipoRecurso.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TipoRecursoController {
  async getTipoRecursos(req, res) {
    try {
      const tipoRecursos = await tipoRecursoRepository.findAll();
      return res.status(200).json({ data: tipoRecursos });
    } catch (error) {
      logger.error(`[tipoRecurso.controller.js] Error al obtener tipos de recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipos de recurso" });
    }
  }

  async getTipoRecursoById(req, res) {
    try {
      const { id } = req.params;
      const tipoRecurso = await tipoRecursoRepository.findById(id);

      if (!tipoRecurso) {
        return res.status(404).json({ msg: "Tipo de recurso no encontrado" });
      }

      return res.status(200).json({ data: tipoRecurso });
    } catch (error) {
      logger.error(`[tipoRecurso.controller.js] Error al obtener tipo de recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipo de recurso" });
    }
  }

  async createTipoRecurso(req, res) {
    try {
      const { nombre } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipoRecurso = await tipoRecursoRepository.create({
        nombre, usuario_registro, usuario_actualizacion: usuario_registro
      });

      return res.status(201).json({ msg: "Tipo de recurso creado exitosamente", data: { id: tipoRecurso.id } });
    } catch (error) {
      logger.error(`[tipoRecurso.controller.js] Error al crear tipo de recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipo de recurso" });
    }
  }

  async updateTipoRecurso(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await tipoRecursoRepository.update(id, { nombre, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Tipo de recurso no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de recurso actualizado exitosamente" });
    } catch (error) {
      logger.error(`[tipoRecurso.controller.js] Error al actualizar tipo de recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipo de recurso" });
    }
  }

  async deleteTipoRecurso(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await tipoRecursoRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Tipo de recurso no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de recurso eliminado exitosamente" });
    } catch (error) {
      logger.error(`[tipoRecurso.controller.js] Error al eliminar tipo de recurso: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipo de recurso" });
    }
  }
}

module.exports = new TipoRecursoController();
