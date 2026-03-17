const prospectoRecordatorioRepository = require("../repositories/prospectoRecordatorio.repository.js");
const logger = require('../config/logger/loggerClient.js');

class ProspectoRecordatorioController {
  async getProspectoRecordatorios(req, res) {
    try {
      const recordatorios = await prospectoRecordatorioRepository.findAll();
      return res.status(200).json({ data: recordatorios });
    } catch (error) {
      logger.error(`[prospectoRecordatorio.controller.js] Error al obtener recordatorios de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener recordatorios de prospecto" });
    }
  }

  async getProspectoRecordatorioById(req, res) {
    try {
      const { id } = req.params;
      const recordatorio = await prospectoRecordatorioRepository.findById(id);

      if (!recordatorio) {
        return res.status(404).json({ msg: "Recordatorio de prospecto no encontrado" });
      }

      return res.status(200).json({ data: recordatorio });
    } catch (error) {
      logger.error(`[prospectoRecordatorio.controller.js] Error al obtener recordatorio de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener recordatorio de prospecto" });
    }
  }

  async createProspectoRecordatorio(req, res) {
    try {
      const { id_prospecto, cantidad, limite } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_prospecto || cantidad === undefined || limite === undefined) {
        return res.status(400).json({ msg: "El prospecto, cantidad y límite son requeridos" });
      }

      const recordatorio = await prospectoRecordatorioRepository.create({
        id_prospecto, cantidad, limite, usuario_registro
      });

      return res.status(201).json({ msg: "Recordatorio de prospecto creado exitosamente", data: { id: recordatorio.id } });
    } catch (error) {
      logger.error(`[prospectoRecordatorio.controller.js] Error al crear recordatorio de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear recordatorio de prospecto" });
    }
  }

  async updateProspectoRecordatorio(req, res) {
    try {
      const { id } = req.params;
      const { id_prospecto, cantidad, limite } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_prospecto || cantidad === undefined || limite === undefined) {
        return res.status(400).json({ msg: "El prospecto, cantidad y límite son requeridos" });
      }

      const [updated] = await prospectoRecordatorioRepository.update(id, {
        id_prospecto, cantidad, limite, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Recordatorio de prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Recordatorio de prospecto actualizado exitosamente" });
    } catch (error) {
      logger.error(`[prospectoRecordatorio.controller.js] Error al actualizar recordatorio de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar recordatorio de prospecto" });
    }
  }

  async deleteProspectoRecordatorio(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await prospectoRecordatorioRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Recordatorio de prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Recordatorio de prospecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[prospectoRecordatorio.controller.js] Error al eliminar recordatorio de prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar recordatorio de prospecto" });
    }
  }
}

module.exports = new ProspectoRecordatorioController();
