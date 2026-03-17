const campaniaEjecucionRepository = require("../repositories/campaniaEjecucion.repository.js");
const logger = require('../config/logger/loggerClient.js');

class CampaniaEjecucionController {
  async getCampaniaEjecuciones(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const ejecuciones = await campaniaEjecucionRepository.findAll(idEmpresa);
      return res.status(200).json({ data: ejecuciones });
    } catch (error) {
      logger.error(`[campaniaEjecucion.controller.js] Error al obtener ejecuciones de campaña: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecuciones de campaña" });
    }
  }

  async getCampaniaEjecucionById(req, res) {
    try {
      const { id } = req.params;
      const ejecucion = await campaniaEjecucionRepository.findById(id);

      if (!ejecucion) {
        return res.status(404).json({ msg: "Ejecución de campaña no encontrada" });
      }

      return res.status(200).json({ data: ejecucion });
    } catch (error) {
      logger.error(`[campaniaEjecucion.controller.js] Error al obtener ejecución de campaña: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecución de campaña" });
    }
  }

  async createCampaniaEjecucion(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { fecha_programada, fecha_inicio, fecha_fin, estado_ejecucion, resultado, mensaje_error } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!fecha_programada || !estado_ejecucion) {
        return res.status(400).json({ msg: "La fecha programada y estado de ejecución son requeridos" });
      }

      const ejecucion = await campaniaEjecucionRepository.create({
        fecha_programada, fecha_inicio, fecha_fin, estado_ejecucion, resultado, mensaje_error,
        id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Ejecución de campaña creada exitosamente", data: { id: ejecucion.id } });
    } catch (error) {
      logger.error(`[campaniaEjecucion.controller.js] Error al crear ejecución de campaña: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear ejecución de campaña" });
    }
  }

  async updateCampaniaEjecucion(req, res) {
    try {
      const { id } = req.params;
      const { fecha_programada, fecha_inicio, fecha_fin, estado_ejecucion, resultado, mensaje_error, id_empresa } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await campaniaEjecucionRepository.update(id, {
        fecha_programada, fecha_inicio, fecha_fin, estado_ejecucion, resultado, mensaje_error, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Ejecución de campaña no encontrada" });
      }

      return res.status(200).json({ msg: "Ejecución de campaña actualizada exitosamente" });
    } catch (error) {
      logger.error(`[campaniaEjecucion.controller.js] Error al actualizar ejecución de campaña: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar ejecución de campaña" });
    }
  }

  async deleteCampaniaEjecucion(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await campaniaEjecucionRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Ejecución de campaña no encontrada" });
      }

      return res.status(200).json({ msg: "Ejecución de campaña eliminada exitosamente" });
    } catch (error) {
      logger.error(`[campaniaEjecucion.controller.js] Error al eliminar ejecución de campaña: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar ejecución de campaña" });
    }
  }
}

module.exports = new CampaniaEjecucionController();
