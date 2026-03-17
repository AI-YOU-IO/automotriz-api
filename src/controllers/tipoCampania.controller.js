const tipoCampaniaRepository = require("../repositories/tipoCampania.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TipoCampaniaController {
  async getTiposCampania(req, res) {
    try {
      const tiposCampania = await tipoCampaniaRepository.findAll();
      return res.status(200).json({ data: tiposCampania });
    } catch (error) {
      logger.error(`[tipoCampania.controller.js] Error al obtener tipos de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipos de campania" });
    }
  }

  async getTipoCampaniaById(req, res) {
    try {
      const { id } = req.params;
      const tipoCampania = await tipoCampaniaRepository.findById(id);

      if (!tipoCampania) {
        return res.status(404).json({ msg: "Tipo de campania no encontrado" });
      }

      return res.status(200).json({ data: tipoCampania });
    } catch (error) {
      logger.error(`[tipoCampania.controller.js] Error al obtener tipo de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipo de campania" });
    }
  }

  async createTipoCampania(req, res) {
    try {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipoCampania = await tipoCampaniaRepository.create({
        nombre,
        usuario_registro: req.user?.userId || null,
        usuario_actualizacion: req.user?.userId || null
      });

      return res.status(201).json({ msg: "Tipo de campania creado exitosamente", data: { id: tipoCampania.id } });
    } catch (error) {
      logger.error(`[tipoCampania.controller.js] Error al crear tipo de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipo de campania" });
    }
  }

  async updateTipoCampania(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await tipoCampaniaRepository.update(id, {
        nombre,
        usuario_actualizacion: req.user?.userId || null
      });

      if (!updated) {
        return res.status(404).json({ msg: "Tipo de campania no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de campania actualizado exitosamente" });
    } catch (error) {
      logger.error(`[tipoCampania.controller.js] Error al actualizar tipo de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipo de campania" });
    }
  }

  async deleteTipoCampania(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await tipoCampaniaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Tipo de campania no encontrado" });
      }

      return res.status(200).json({ msg: "Tipo de campania eliminado exitosamente" });
    } catch (error) {
      logger.error(`[tipoCampania.controller.js] Error al eliminar tipo de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipo de campania" });
    }
  }
}

module.exports = new TipoCampaniaController();
