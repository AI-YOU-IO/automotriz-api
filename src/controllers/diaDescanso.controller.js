const diaDescansoRepository = require("../repositories/diaDescanso.repository.js");
const logger = require('../config/logger/loggerClient.js');

class DiaDescansoController {
  async getByUsuarioAndDay(req, res) {
    try {
      const { id_usuario, fecha_descanso } = req.query;

      if (!id_usuario || !fecha_descanso) {
        return res.status(400).json({ msg: "id_usuario y fecha_descanso son requeridos" });
      }

      const dias = await diaDescansoRepository.findByUsuarioAndDay(id_usuario, fecha_descanso);
      return res.status(200).json({ data: dias });
    } catch (error) {
      logger.error(`[diaDescanso.controller.js] Error al obtener días de descanso por usuario y día: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener días de descanso por usuario y día" });
    }
  }

  async getByUsuario(req, res) {
    try {
      const { id_usuario } = req.params;
      const dias = await diaDescansoRepository.findByUsuario(id_usuario);
      return res.status(200).json({ data: dias });
    } catch (error) {
      logger.error(`[diaDescanso.controller.js] Error al obtener días de descanso: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener días de descanso" });
    }
  }

  async syncByUsuario(req, res) {
    try {
      const { id_usuario } = req.params;
      const { fechas } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!Array.isArray(fechas)) {
        return res.status(400).json({ msg: "fechas debe ser un array de strings 'YYYY-MM-DD'" });
      }

      await diaDescansoRepository.syncByUsuario(id_usuario, fechas, usuario_registro);
      return res.status(200).json({ msg: "Días de descanso actualizados exitosamente" });
    } catch (error) {
      logger.error(`[diaDescanso.controller.js] Error al sincronizar días de descanso: ${error.message}`);
      return res.status(500).json({ msg: "Error al sincronizar días de descanso" });
    }
  }
}

module.exports = new DiaDescansoController();
