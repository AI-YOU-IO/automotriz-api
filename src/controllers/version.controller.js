const versionRepository = require('../repositories/version.repository.js');
const logger = require('../config/logger/loggerClient.js');

class VersionController {
  async getVersiones(req, res) {
    try {
      const { id_modelo } = req.query;
      const versiones = await versionRepository.findAll(id_modelo);
      return res.status(200).json({ data: versiones });
    } catch (error) {
      logger.error(`[version.controller.js] Error al obtener versiones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener versiones" });
    }
  }

  async getVersionById(req, res) {
    try {
      const { id } = req.params;
      const version = await versionRepository.findById(id);
      if (!version) return res.status(404).json({ msg: "Versión no encontrada" });
      return res.status(200).json({ data: version });
    } catch (error) {
      logger.error(`[version.controller.js] Error al obtener versión: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener versión" });
    }
  }

  async createVersion(req, res) {
    try {
      const { nombre, descripcion, id_modelo, anio } = req.body;
      if (!nombre || !id_modelo) return res.status(400).json({ msg: "Nombre y modelo son requeridos" });

      const usuario_registro = req.user?.userId || null;
      const version = await versionRepository.create({ nombre, descripcion, id_modelo, anio, usuario_registro });
      return res.status(201).json({ msg: "Versión creada exitosamente", data: { id: version.id } });
    } catch (error) {
      logger.error(`[version.controller.js] Error al crear versión: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear versión" });
    }
  }

  async updateVersion(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, id_modelo, anio } = req.body;
      if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });

      const usuario_actualizacion = req.user?.userId || null;
      await versionRepository.update(id, { nombre, descripcion, id_modelo, anio, usuario_actualizacion });
      return res.status(200).json({ msg: "Versión actualizada exitosamente" });
    } catch (error) {
      logger.error(`[version.controller.js] Error al actualizar versión: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar versión" });
    }
  }

  async deleteVersion(req, res) {
    try {
      const { id } = req.params;
      await versionRepository.delete(id);
      return res.status(200).json({ msg: "Versión eliminada exitosamente" });
    } catch (error) {
      logger.error(`[version.controller.js] Error al eliminar versión: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar versión" });
    }
  }
}

module.exports = new VersionController();
