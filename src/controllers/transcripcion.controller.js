const transcripcionRepository = require("../repositories/transcripcion.repository.js");
const logger = require('../config/logger/loggerClient.js');

class TranscripcionController {
  async getTranscripciones(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const transcripciones = await transcripcionRepository.findAll(idEmpresa);
      return res.status(200).json({ data: transcripciones });
    } catch (error) {
      logger.error(`[transcripcion.controller.js] Error al obtener transcripciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener transcripciones" });
    }
  }

  async getTranscripcionById(req, res) {
    try {
      const { id } = req.params;
      const transcripcion = await transcripcionRepository.findById(id);

      if (!transcripcion) {
        return res.status(404).json({ msg: "Transcripción no encontrada" });
      }

      return res.status(200).json({ data: transcripcion });
    } catch (error) {
      logger.error(`[transcripcion.controller.js] Error al obtener transcripción: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener transcripción" });
    }
  }

  async createTranscripcion(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { id_llamada, id_speaker, texto } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_llamada || !id_speaker || !texto) {
        return res.status(400).json({ msg: "La llamada, speaker y texto son requeridos" });
      }

      const transcripcion = await transcripcionRepository.create({
        id_llamada, id_speaker, texto, id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Transcripción creada exitosamente", data: { id: transcripcion.id } });
    } catch (error) {
      logger.error(`[transcripcion.controller.js] Error al crear transcripción: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear transcripción" });
    }
  }

  async updateTranscripcion(req, res) {
    try {
      const { id } = req.params;
      const { id_llamada, id_speaker, texto } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!id_llamada || !id_speaker || !texto) {
        return res.status(400).json({ msg: "La llamada, speaker y texto son requeridos" });
      }

      const [updated] = await transcripcionRepository.update(id, {
        id_llamada, id_speaker, texto, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Transcripción no encontrada" });
      }

      return res.status(200).json({ msg: "Transcripción actualizada exitosamente" });
    } catch (error) {
      logger.error(`[transcripcion.controller.js] Error al actualizar transcripción: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar transcripción" });
    }
  }

  async deleteTranscripcion(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await transcripcionRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Transcripción no encontrada" });
      }

      return res.status(200).json({ msg: "Transcripción eliminada exitosamente" });
    } catch (error) {
      logger.error(`[transcripcion.controller.js] Error al eliminar transcripción: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar transcripción" });
    }
  }
}

module.exports = new TranscripcionController();
