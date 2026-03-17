const periodicidadRecordatorioRepository = require("../repositories/periodicidadRecordatorio.repository.js");
const logger = require('../config/logger/loggerClient.js');

class PeriodicidadRecordatorioController {
  async getPeriodicidadesRecordatorio(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const periodicidades = await periodicidadRecordatorioRepository.findAll(idEmpresa);
      return res.status(200).json({ data: periodicidades });
    } catch (error) {
      logger.error(`[periodicidadRecordatorio.controller.js] Error al obtener periodicidades de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener periodicidades de recordatorio" });
    }
  }

  async getPeriodicidadRecordatorioById(req, res) {
    try {
      const { id } = req.params;
      const periodicidad = await periodicidadRecordatorioRepository.findById(id);

      if (!periodicidad) {
        return res.status(404).json({ msg: "Periodicidad de recordatorio no encontrada" });
      }

      return res.status(200).json({ data: periodicidad });
    } catch (error) {
      logger.error(`[periodicidadRecordatorio.controller.js] Error al obtener periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener periodicidad de recordatorio" });
    }
  }

  async createPeriodicidadRecordatorio(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, cada_horas } = req.body;

      if (!nombre || !cada_horas) {
        return res.status(400).json({ msg: "El nombre y cada_horas son requeridos" });
      }

      const usuario_registro = req.user?.userId || null;
      const periodicidad = await periodicidadRecordatorioRepository.create({
        nombre, cada_horas, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Periodicidad de recordatorio creada exitosamente", data: { id: periodicidad.id } });
    } catch (error) {
      logger.error(`[periodicidadRecordatorio.controller.js] Error al crear periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear periodicidad de recordatorio" });
    }
  }

  async updatePeriodicidadRecordatorio(req, res) {
    try {
      const { id } = req.params;
      const { nombre, cada_horas } = req.body;

      if (!nombre || !cada_horas) {
        return res.status(400).json({ msg: "El nombre y cada_horas son requeridos" });
      }

      const usuario_actualizacion = req.user?.userId || null;
      await periodicidadRecordatorioRepository.update(id, { nombre, cada_horas, usuario_actualizacion });

      return res.status(200).json({ msg: "Periodicidad de recordatorio actualizada exitosamente" });
    } catch (error) {
      logger.error(`[periodicidadRecordatorio.controller.js] Error al actualizar periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar periodicidad de recordatorio" });
    }
  }

  async deletePeriodicidadRecordatorio(req, res) {
    try {
      const { id } = req.params;
      await periodicidadRecordatorioRepository.delete(id);
      return res.status(200).json({ msg: "Periodicidad de recordatorio eliminada exitosamente" });
    } catch (error) {
      logger.error(`[periodicidadRecordatorio.controller.js] Error al eliminar periodicidad de recordatorio: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar periodicidad de recordatorio" });
    }
  }
}

module.exports = new PeriodicidadRecordatorioController();
