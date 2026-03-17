const plantillaRepository = require("../repositories/plantilla.repository.js");
const logger = require('../config/logger/loggerClient.js');

class PlantillaController {
  async getPlantillas(req, res) {
    try {
      const idEmpresa = req.user?.idEmpresa || null;
      const plantillas = await plantillaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: plantillas });
    } catch (error) {
      logger.error(`[plantilla.controller.js] Error al obtener plantillas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantillas" });
    }
  }

  async getPlantillaById(req, res) {
    try {
      const { id } = req.params;
      const plantilla = await plantillaRepository.findById(id);

      if (!plantilla) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ data: plantilla });
    } catch (error) {
      logger.error(`[plantilla.controller.js] Error al obtener plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantilla" });
    }
  }

  async createPlantilla(req, res) {
    try {
      const { id_formato, nombre, descripcion, prompt_sistema, prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!id_formato || !nombre) {
        return res.status(400).json({ msg: "El formato y nombre son requeridos" });
      }

      const plantilla = await plantillaRepository.create({
        id_empresa, id_formato, nombre, descripcion, prompt_sistema,
        prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado, usuario_registro
      });

      return res.status(201).json({ msg: "Plantilla creada exitosamente", data: { id: plantilla.id } });
    } catch (error) {
      logger.error(`[plantilla.controller.js] Error al crear plantilla: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear plantilla" });
    }
  }

  async updatePlantilla(req, res) {
    try {
      const { id } = req.params;
      const { id_formato, nombre, descripcion, prompt_sistema, prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_formato || !nombre) {
        return res.status(400).json({ msg: "El formato y nombre son requeridos" });
      }

      const [updated] = await plantillaRepository.update(id, {
        id_formato, nombre, descripcion, prompt_sistema,
        prompt_inicio, prompt_flujo, prompt_cierre, prompt_resultado, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ msg: "Plantilla actualizada exitosamente" });
    } catch (error) {
      logger.error(`[plantilla.controller.js] Error al actualizar plantilla: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar plantilla" });
    }
  }

  async deletePlantilla(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await plantillaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ msg: "Plantilla eliminada exitosamente" });
    } catch (error) {
      logger.error(`[plantilla.controller.js] Error al eliminar plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar plantilla" });
    }
  }
}

module.exports = new PlantillaController();
