const estadoCampaniaRepository = require("../repositories/estadoCampania.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EstadoCampaniaController {
  async getEstadosCampania(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const estadosCampania = await estadoCampaniaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: estadosCampania });
    } catch (error) {
      logger.error(`[estadoCampania.controller.js] Error al obtener estados de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estados de campania" });
    }
  }

  async getEstadoCampaniaById(req, res) {
    try {
      const { id } = req.params;
      const estadoCampania = await estadoCampaniaRepository.findById(id);

      if (!estadoCampania) {
        return res.status(404).json({ msg: "Estado de campania no encontrado" });
      }

      return res.status(200).json({ data: estadoCampania });
    } catch (error) {
      logger.error(`[estadoCampania.controller.js] Error al obtener estado de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estado de campania" });
    }
  }

  async createEstadoCampania(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { nombre, color } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const estadoCampania = await estadoCampaniaRepository.create({
        nombre,
        color,
        id_empresa: idEmpresa,
        usuario_registro: req.user?.userId || null,
        usuario_actualizacion: req.user?.userId || null
      });

      return res.status(201).json({ msg: "Estado de campania creado exitosamente", data: { id: estadoCampania.id } });
    } catch (error) {
      logger.error(`[estadoCampania.controller.js] Error al crear estado de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear estado de campania" });
    }
  }

  async updateEstadoCampania(req, res) {
    try {
      const { id } = req.params;
      const { nombre, color } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await estadoCampaniaRepository.update(id, {
        nombre,
        color,
        usuario_actualizacion: req.user?.userId || null
      });

      if (!updated) {
        return res.status(404).json({ msg: "Estado de campania no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de campania actualizado exitosamente" });
    } catch (error) {
      logger.error(`[estadoCampania.controller.js] Error al actualizar estado de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado de campania" });
    }
  }

  async deleteEstadoCampania(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await estadoCampaniaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Estado de campania no encontrado" });
      }

      return res.status(200).json({ msg: "Estado de campania eliminado exitosamente" });
    } catch (error) {
      logger.error(`[estadoCampania.controller.js] Error al eliminar estado de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar estado de campania" });
    }
  }
}

module.exports = new EstadoCampaniaController();
