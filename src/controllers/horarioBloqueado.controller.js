const horarioBloqueadoRepository = require("../repositories/horarioBloqueado.repository.js");
const logger = require('../config/logger/loggerClient.js');

class HorarioBloqueadoController {
  async getHorarioBloqueado(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      if (!idEmpresa) {
        return res.status(400).json({ msg: "Empresa no identificada" });
      }

      const horario = await horarioBloqueadoRepository.findByEmpresa(idEmpresa);

      if (!horario) {
        return res.status(200).json({ data: null });
      }

      const plain = horario.get({ plain: true });
      return res.status(200).json({
        data: {
          id: plain.id,
          id_empresa: plain.id_empresa,
          horario_lunes: plain.horario_lunes || null,
          horario_martes: plain.horario_martes || null,
          horario_miercoles: plain.horario_miercoles || null,
          horario_jueves: plain.horario_jueves || null,
          horario_viernes: plain.horario_viernes || null,
          horario_sabado: plain.horario_sabado || null,
          horario_domingo: plain.horario_domingo || null
        }
      });
    } catch (error) {
      logger.error(`[horarioBloqueado.controller.js] getHorarioBloqueado Error: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener horario bloqueado", error: error.message });
    }
  }

  async upsertHorarioBloqueado(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const usuario_actualizacion = req.user?.userId || null;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "Empresa no identificada" });
      }

      const body = req.body;
      const DIAS = ['horario_lunes', 'horario_martes', 'horario_miercoles', 'horario_jueves', 'horario_viernes', 'horario_sabado', 'horario_domingo'];

      const data = {};
      for (const dia of DIAS) {
        const val = body[dia];
        if (val && val.activo) {
          data[dia] = { hora_inicio: val.hora_inicio, hora_fin: val.hora_fin };
        } else {
          data[dia] = null;
        }
      }

      const result = await horarioBloqueadoRepository.upsertByEmpresa(idEmpresa, data, usuario_actualizacion);
      return res.status(200).json({ msg: "Horario bloqueado actualizado", data: result });
    } catch (error) {
      logger.error(`[horarioBloqueado.controller.js] upsertHorarioBloqueado Error: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar horario bloqueado", error: error.message });
    }
  }

  async deleteHorarioBloqueado(req, res) {
    try {
      const { id } = req.params;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id) {
        return res.status(400).json({ msg: "ID requerido" });
      }

      const existing = await horarioBloqueadoRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ msg: "Horario bloqueado no encontrado" });
      }

      await horarioBloqueadoRepository.delete(id, usuario_actualizacion);
      return res.status(200).json({ msg: "Horario bloqueado eliminado" });
    } catch (error) {
      logger.error(`[horarioBloqueado.controller.js] deleteHorarioBloqueado Error: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar horario bloqueado", error: error.message });
    }
  }
}

module.exports = new HorarioBloqueadoController();
