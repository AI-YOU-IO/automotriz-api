const llamadaRepository = require("../repositories/llamada.repository.js");
const transcripcionRepository = require("../repositories/transcripcion.repository.js");
const logger = require('../config/logger/loggerClient.js');
const s3Service = require('../services/s3.service.js');
const path = require('path');

class LlamadaController {
  async getLlamadas(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const llamadas = await llamadaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: llamadas });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al obtener llamadas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener llamadas" });
    }
  }

  async getLlamadaById(req, res) {
    try {
      const { id } = req.params;
      const llamada = await llamadaRepository.findById(id);

      if (!llamada) {
        return res.status(404).json({ msg: "Llamada no encontrada" });
      }

      return res.status(200).json({ data: llamada });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al obtener llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener llamada" });
    }
  }

  async createLlamada(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const { id_campania, provider_call_id, id_estado_llamada, id_tipificacion_llamada, fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_campania || !provider_call_id || !id_estado_llamada || !fecha_inicio) {
        return res.status(400).json({ msg: "Campaña, provider_call_id, estado de llamada y fecha inicio son requeridos" });
      }

      const llamada = await llamadaRepository.create({
        id_campania, provider_call_id, id_estado_llamada, id_tipificacion_llamada,
        fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio,
        id_empresa: idEmpresa, usuario_registro
      });

      return res.status(201).json({ msg: "Llamada creada exitosamente", data: { id: llamada.id } });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al crear llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear llamada" });
    }
  }

  async updateLlamada(req, res) {
    try {
      const { id } = req.params;
      const { id_campania, provider_call_id, id_estado_llamada, id_tipificacion_llamada, fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [updated] = await llamadaRepository.update(id, {
        id_campania, provider_call_id, id_estado_llamada, id_tipificacion_llamada,
        fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Llamada no encontrada" });
      }

      return res.status(200).json({ msg: "Llamada actualizada exitosamente" });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al actualizar llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar llamada" });
    }
  }

  async getAudioLlamada(req, res) {
    try {
      const { id } = req.params;
      const llamada = await llamadaRepository.findAudioById(id);

      if (!llamada || !llamada.archivo_llamada) {
        return res.status(404).json({ msg: "Audio no encontrado" });
      }

      const buf = llamada.archivo_llamada;
      const isWav = buf.length > 4 && buf.slice(0, 4).toString() === 'RIFF';
      res.set({
        'Content-Type': isWav ? 'audio/wav' : 'audio/mpeg',
        'Content-Length': buf.length,
        'Accept-Ranges': 'bytes'
      });
      return res.send(llamada.archivo_llamada);
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al obtener audio: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener audio" });
    }
  }

  async deleteLlamada(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await llamadaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Llamada no encontrada" });
      }

      return res.status(200).json({ msg: "Llamada eliminada exitosamente" });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al eliminar llamada: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar llamada" });
    }
  }

  /**
   * Sube un archivo de audio de llamada a S3
   * Ruta: {plataforma}/llamadas/{id_empresa}/{fecha}/{archivo}
   */
  async uploadAudio(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: "No se recibió ningún archivo de audio" });
      }

      const { idEmpresa } = req.user || {};
      const { id_llamada, id_ultravox_call } = req.body;

      if (!idEmpresa) {
        return res.status(400).json({ msg: "id_empresa es requerido" });
      }

      // Generar nombre único para el archivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname) || '.wav';
      const filename = `${id_ultravox_call || uniqueSuffix}${ext}`;

      // Subir a S3
      const { url, key } = await s3Service.uploadLlamadaAudio(
        req.file.buffer,
        filename,
        req.file.mimetype,
        idEmpresa
      );

      // Si se proporciona id_llamada, actualizar el registro de la llamada
      if (id_llamada) {
        const usuario_actualizacion = req.user?.userId || null;
        await llamadaRepository.update(id_llamada, {
          url_audio: url,
          id_ultravox_call: id_ultravox_call || null,
          usuario_actualizacion
        });
      }

      logger.info(`[llamada.controller.js] Audio subido exitosamente: ${key}`);

      return res.status(200).json({
        msg: "Audio subido exitosamente",
        data: { url, key, id_llamada: id_llamada || null }
      });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al subir audio: ${error.message}`);
      return res.status(500).json({ msg: "Error al subir archivo de audio" });
    }
  }

  /**
   * GET /llamadas/provider/:providerCallId
   */
  async getByProviderCallId(req, res) {
    try {
      const { providerCallId } = req.params;
      const llamada = await llamadaRepository.findByProviderCallId(providerCallId);

      if (!llamada) {
        return res.status(404).json({ msg: "Llamada no encontrada" });
      }

      return res.status(200).json({ data: llamada });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al obtener llamada por provider_call_id: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener llamada" });
    }
  }

  /**
   * GET /llamadas/ejecucion/:idCampaniaEjecucion
   */
  async getByCampaniaEjecucion(req, res) {
    try {
      const { idCampaniaEjecucion } = req.params;
      const llamadas = await llamadaRepository.findByCampaniaEjecucion(idCampaniaEjecucion);
      return res.status(200).json({ data: llamadas });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al obtener llamadas por ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener llamadas por ejecucion" });
    }
  }

  /**
   * POST /upload-audio (webhook Ultravox)
   * Recibe audio por provider_call_id, sube a S3 y actualiza la llamada
   */
  async uploadAudioWebhook(req, res) {
    try {
      const { provider_call_id } = req.body;

      if (!req.file) {
        return res.status(400).json({ msg: "No se proporcionó ningún archivo de audio" });
      }

      if (!provider_call_id) {
        return res.status(400).json({ msg: "El campo provider_call_id es requerido" });
      }

      const llamada = await llamadaRepository.findByProviderCallId(provider_call_id);

      if (!llamada) {
        return res.status(404).json({ msg: "No se encontró llamada con ese provider_call_id" });
      }

      // Subir audio a S3
      const ext = path.extname(req.file.originalname) || '.wav';
      const filename = `${provider_call_id}${ext}`;
      const { url } = await s3Service.uploadLlamadaAudio(
        req.file.buffer,
        filename,
        req.file.mimetype,
        llamada.id_empresa
      );

      await llamadaRepository.updateAudioByProvider(provider_call_id, { archivo_llamada: url });

      return res.status(200).json({
        msg: "Audio subido exitosamente",
        data: { provider_call_id, id_llamada: llamada.id, archivo_llamada: url }
      });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al subir audio webhook: ${error.message}`);
      return res.status(500).json({ msg: "Error al subir audio de llamada" });
    }
  }

  /**
   * POST /transcripcion (webhook Ultravox)
   * Guarda transcripción y metadata de la llamada
   */
  async guardarTranscripcion(req, res) {
    try {
      const { provider_call_id, id_ultravox_call, metadata_ultravox_call, metadata, transcripcion } = req.body;
      const metadataInput = metadata_ultravox_call || metadata;

      if (!provider_call_id) {
        return res.status(400).json({ msg: "El campo provider_call_id es requerido" });
      }

      const llamada = await llamadaRepository.findByProviderCallId(provider_call_id);

      if (!llamada) {
        return res.status(404).json({ msg: "No se encontró llamada con ese provider_call_id" });
      }

      // Calcular duración
      const fecha_fin = new Date();
      let duracion_seg = null;
      if (llamada.fecha_inicio) {
        duracion_seg = Math.round((fecha_fin - new Date(llamada.fecha_inicio)) / 1000);
        if (duracion_seg < 0) duracion_seg = 0;
      }

      // Serializar metadata
      let metadataString = null;
      if (metadataInput) {
        metadataString = typeof metadataInput === 'string' ? metadataInput : JSON.stringify(metadataInput);
      }

      // Actualizar llamada con metadata Ultravox
      await llamadaRepository.updateMetadataUltravox(llamada.id, {
        id_ultravox_call: id_ultravox_call || null,
        metadata_ultravox_call: metadataString,
        fecha_fin,
        duracion_seg
      });

      // Guardar transcripción
      let transcripcion_count = 0;
      if (transcripcion && Array.isArray(transcripcion) && transcripcion.length > 0) {
        for (const mensaje of transcripcion) {
          let speaker_role = 'sistema';
          if (mensaje.role === 'MESSAGE_ROLE_AGENT' || mensaje.role === 'agent') speaker_role = 'ai';
          else if (mensaje.role === 'MESSAGE_ROLE_USER' || mensaje.role === 'user') speaker_role = 'humano';

          const ordinal = mensaje.ordinal !== undefined
            ? mensaje.ordinal
            : (mensaje.callStageMessageIndex !== undefined ? mensaje.callStageMessageIndex : null);

          await transcripcionRepository.create({
            id_llamada: llamada.id,
            speaker_role,
            texto: mensaje.text || '',
            ordinal
          });
        }
        transcripcion_count = transcripcion.length;
      }

      return res.status(200).json({
        msg: "Transcripción guardada exitosamente",
        data: { provider_call_id, id_llamada: llamada.id, id_ultravox_call, transcripcion_count }
      });
    } catch (error) {
      logger.error(`[llamada.controller.js] Error al guardar transcripción: ${error.message}`);
      return res.status(500).json({ msg: "Error al guardar transcripción", error: error.message });
    }
  }
}

module.exports = new LlamadaController();
