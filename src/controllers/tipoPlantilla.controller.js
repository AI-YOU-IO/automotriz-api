const tipoPlantillaRepository = require("../repositories/tipoPlantilla.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TipoPlantillaController {
  async getTiposPlantilla(req, res) {
    try {
      const tipos = await tipoPlantillaRepository.findAll();
      return res.status(200).json({ data: tipos });
    } catch (error) {
      logger.error(`[tipoPlantilla.controller.js] Error al obtener tipos de plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipos de plantilla" });
    }
  }

  async getTipoPlantillaById(req, res) {
    try {
      const { id } = req.params;
      const tipo = await tipoPlantillaRepository.findById(id);

      if (!tipo) {
        return res.status(404).json({ msg: "Tipo de plantilla no encontrado" });
      }

      return res.status(200).json({ data: tipo });
    } catch (error) {
      logger.error(`[tipoPlantilla.controller.js] Error al obtener tipo de plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipo de plantilla" });
    }
  }

  async createTipoPlantilla(req, res) {
    try {
      const { nombre } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipo = await tipoPlantillaRepository.create({ nombre, usuario_registro });

      return res.status(201).json({ msg: "Tipo de plantilla creado exitosamente", data: { id: tipo.id } });
    } catch (error) {
      logger.error(`[tipoPlantilla.controller.js] Error al crear tipo de plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipo de plantilla" });
    }
  }

  async updateTipoPlantilla(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await tipoPlantillaRepository.update(id, { nombre, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Tipo de plantilla no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de plantilla actualizado exitosamente" });
    } catch (error) {
      logger.error(`[tipoPlantilla.controller.js] Error al actualizar tipo de plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipo de plantilla" });
    }
  }

  async deleteTipoPlantilla(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await tipoPlantillaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Tipo de plantilla no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de plantilla eliminado exitosamente" });
    } catch (error) {
      logger.error(`[tipoPlantilla.controller.js] Error al eliminar tipo de plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipo de plantilla" });
    }
  }
}

module.exports = new TipoPlantillaController();
