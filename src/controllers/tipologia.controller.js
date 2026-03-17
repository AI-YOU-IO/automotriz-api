const tipologiaRepository = require("../repositories/tipologia.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TipologiaController {
  async getTipologias(req, res) {
    try {
      const tipologias = await tipologiaRepository.findAll();
      return res.status(200).json({ data: tipologias });
    } catch (error) {
      logger.error(`[tipologia.controller.js] Error al obtener tipologías: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipologías" });
    }
  }

  async getTipologiaById(req, res) {
    try {
      const { id } = req.params;
      const tipologia = await tipologiaRepository.findById(id);

      if (!tipologia) {
        return res.status(404).json({ msg: "Tipología no encontrada" });
      }

      return res.status(200).json({ data: tipologia });
    } catch (error) {
      logger.error(`[tipologia.controller.js] Error al obtener tipología: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener tipología" });
    }
  }

  async createTipologia(req, res) {
    try {
      const { nombre, area, numero_banios, numero_dormitorios, total_unidades, unidades_disponibles, precio_minimo, sperant_id } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const tipologia = await tipologiaRepository.create({
        nombre, area, numero_banios, numero_dormitorios, total_unidades, unidades_disponibles, precio_minimo, usuario_registro, sperant_id
      });

      return res.status(201).json({ msg: "Tipología creada exitosamente", data: { id: tipologia.id } });
    } catch (error) {
      logger.error(`[tipologia.controller.js] Error al crear tipología: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear tipología" });
    }
  }

  async updateTipologia(req, res) {
    try {
      const { id } = req.params;
      const { nombre, area, numero_banios, numero_dormitorios, total_unidades, unidades_disponibles, precio_minimo } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await tipologiaRepository.update(id, {
        nombre, area, numero_banios, numero_dormitorios, total_unidades, unidades_disponibles, precio_minimo, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Tipología no encontrada" });
      }

      return res.status(200).json({ msg: "Tipología actualizada exitosamente" });
    } catch (error) {
      logger.error(`[tipologia.controller.js] Error al actualizar tipología: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar tipología" });
    }
  }

  async deleteTipologia(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await tipologiaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Tipología no encontrada" });
      }

      return res.status(200).json({ msg: "Tipología eliminada exitosamente" });
    } catch (error) {
      logger.error(`[tipologia.controller.js] Error al eliminar tipología: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar tipología" });
    }
  }
}

module.exports = new TipologiaController();
