const speakerRepository = require("../repositories/speaker.repository.js");
const logger = require('../config/logger/loggerClient.js');

class SpeakerController {
  async getSpeakers(req, res) {
    try {
      const speakers = await speakerRepository.findAll();
      return res.status(200).json({ data: speakers });
    } catch (error) {
      logger.error(`[speaker.controller.js] Error al obtener speakers: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener speakers" });
    }
  }

  async getSpeakerById(req, res) {
    try {
      const { id } = req.params;
      const speaker = await speakerRepository.findById(id);

      if (!speaker) {
        return res.status(404).json({ msg: "Speaker no encontrado" });
      }

      return res.status(200).json({ data: speaker });
    } catch (error) {
      logger.error(`[speaker.controller.js] Error al obtener speaker: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener speaker" });
    }
  }

  async createSpeaker(req, res) {
    try {
      const { nombre } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const speaker = await speakerRepository.create({ nombre, usuario_registro });

      return res.status(201).json({ msg: "Speaker creado exitosamente", data: { id: speaker.id } });
    } catch (error) {
      logger.error(`[speaker.controller.js] Error al crear speaker: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear speaker" });
    }
  }

  async updateSpeaker(req, res) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const [updated] = await speakerRepository.update(id, { nombre, usuario_actualizacion });

      if (!updated) {
        return res.status(404).json({ msg: "Speaker no encontrado" });
      }

      return res.status(200).json({ msg: "Speaker actualizado exitosamente" });
    } catch (error) {
      logger.error(`[speaker.controller.js] Error al actualizar speaker: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar speaker" });
    }
  }

  async deleteSpeaker(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await speakerRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Speaker no encontrado" });
      }

      return res.status(200).json({ msg: "Speaker eliminado exitosamente" });
    } catch (error) {
      logger.error(`[speaker.controller.js] Error al eliminar speaker: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar speaker" });
    }
  }
}

module.exports = new SpeakerController();
