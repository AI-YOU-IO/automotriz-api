const horarioAtencionRepository = require("../repositories/horarioAtencion.repository.js");
const logger = require('../config/logger/loggerClient.js');

class HorarioAtencionController {
  async getHorarios(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      if (!idEmpresa) {
        return res.status(400).json({ msg: "Empresa no identificada" });
      }
      const horarios = await horarioAtencionRepository.findByEmpresa(idEmpresa);
      return res.status(200).json({ data: horarios });
    } catch (error) {
      logger.error(`[horarioAtencion.controller.js] Error al obtener horarios: ${error.message} | Stack: ${error.stack}`);
      return res.status(500).json({ msg: "Error al obtener horarios de atención", error: error.message });
    }
  }

  async updateHorarios(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const usuario_actualizacion = req.user?.userId || null;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "Empresa no identificada" });
      }

      const { horarios } = req.body;
      if (!horarios || !Array.isArray(horarios)) {
        return res.status(400).json({ msg: "Se requiere un array de horarios" });
      }

      for (const h of horarios) {
        if (h.dia_semana === undefined || h.dia_semana < 0 || h.dia_semana > 6) {
          return res.status(400).json({ msg: "dia_semana debe ser un número entre 0 (Domingo) y 6 (Sábado)" });
        }
        if (!h.hora_inicio || !h.hora_fin) {
          return res.status(400).json({ msg: "hora_inicio y hora_fin son requeridos para cada día" });
        }
        if (h.activo && h.hora_inicio >= h.hora_fin) {
          return res.status(400).json({ msg: "La hora de inicio no puede ser mayor o igual a la hora fin" });
        }
      }

      await horarioAtencionRepository.updateByEmpresa(idEmpresa, horarios, usuario_actualizacion);
      const updated = await horarioAtencionRepository.findByEmpresa(idEmpresa);

      return res.status(200).json({ msg: "Horarios actualizados exitosamente", data: updated });
    } catch (error) {
      logger.error(`[horarioAtencion.controller.js] Error al actualizar horarios: ${error.message} | Stack: ${error.stack}`);
      return res.status(500).json({ msg: "Error al actualizar horarios de atención", error: error.message });
    }
  }
}

module.exports = new HorarioAtencionController();
