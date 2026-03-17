const formatoRepository = require("../repositories/formato.repository.js");
const logger = require('../config/logger/loggerClient.js');

class FormatoController {
  async getFormatos(req, res) {
    try {
      const formatos = await formatoRepository.findAll();
      return res.status(200).json({ data: formatos });
    } catch (error) {
      logger.error(`[formato.controller.js] Error al obtener formatos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener formatos" });
    }
  }

  async getFormatoById(req, res) {
    try {
      const { id } = req.params;
      const formato = await formatoRepository.findById(id);
      if (!formato) {
        return res.status(404).json({ msg: "Formato no encontrado" });
      }
      return res.status(200).json({ data: formato });
    } catch (error) {
      logger.error(`[formato.controller.js] Error al obtener formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener formato" });
    }
  }

  async createFormato(req, res) {
    try {
      const { nombre } = req.body;
      const usuario_registro = req.user?.userId || null;
      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }
      const formato = await formatoRepository.create({ nombre, usuario_registro });
      return res.status(201).json({ msg: "Formato creado exitosamente", data: { id: formato.id } });
    } catch (error) {
      logger.error(`[formato.controller.js] Error al crear formato: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear formato" });
    }
  }

  async updateFormato(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const usuario_actualizacion = req.user?.userId || null;
      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }
      const [updated] = await formatoRepository.update(id, { nombre, usuario_actualizacion });
      if (!updated) {
        return res.status(404).json({ msg: "Formato no encontrado" });
      }
      return res.status(200).json({ msg: "Formato actualizado exitosamente" });
    } catch (error) {
      logger.error(`[formato.controller.js] Error al actualizar formato: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar formato" });
    }
  }

  async deleteFormato(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await formatoRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({ msg: "Formato no encontrado" });
      }
      return res.status(200).json({ msg: "Formato eliminado exitosamente" });
    } catch (error) {
      logger.error(`[formato.controller.js] Error al eliminar formato: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar formato" });
    }
  }
}

module.exports = new FormatoController();
