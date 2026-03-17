const enviosProspectosRepository = require("../repositories/enviosProspectos.repository.js");
const envioMasivoWhatsappRepository = require("../repositories/envioMasivoWhatsapp.repository.js");
const logger = require('../config/logger/loggerClient.js');

class EnviosProspectosController {
  async getEnviosProspectos(req, res) {
    try {
      const { id_envio_masivo } = req.query;

      if (!id_envio_masivo) {
        return res.status(400).json({ msg: "ID de envío masivo es requerido" });
      }

      const envios = await enviosProspectosRepository.findAll(id_envio_masivo);
      return res.status(200).json({ data: envios });
    } catch (error) {
      logger.error(`[enviosProspectos.controller.js] Error al obtener envíos prospectos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener envíos prospectos" });
    }
  }

  async getEnvioProspectoById(req, res) {
    try {
      const { id } = req.params;
      const envio = await enviosProspectosRepository.findById(id);

      if (!envio) {
        return res.status(404).json({ msg: "Envío prospecto no encontrado" });
      }

      return res.status(200).json({ data: envio });
    } catch (error) {
      logger.error(`[enviosProspectos.controller.js] Error al obtener envío prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener envío prospecto" });
    }
  }

  async createEnvioProspecto(req, res) {
    try {
      const { id_envio_masivo, id_prospecto } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!id_envio_masivo || !id_prospecto) {
        return res.status(400).json({ msg: "ID de envío masivo y prospecto son requeridos" });
      }

      const exists = await enviosProspectosRepository.findByEnvioAndProspecto(id_envio_masivo, id_prospecto);
      if (exists) {
        return res.status(400).json({ msg: "El prospecto ya está asignado a este envío" });
      }

      const envio = await enviosProspectosRepository.create({
        id_envio_masivo,
        id_prospecto,
        estado: 'pendiente',
        usuario_registro
      });

      return res.status(201).json({ msg: "Envío prospecto creado exitosamente", data: { id: envio.id } });
    } catch (error) {
      logger.error(`[enviosProspectos.controller.js] Error al crear envío prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear envío prospecto" });
    }
  }

  async updateEstadoEnvio(req, res) {
    try {
      const { id } = req.params;
      const { estado, error_mensaje } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!estado) {
        return res.status(400).json({ msg: "Estado es requerido" });
      }

      const [updated] = await enviosProspectosRepository.update(id, {
        estado,
        error_mensaje,
        fecha_envio: new Date(),
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Envío prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Estado actualizado exitosamente" });
    } catch (error) {
      logger.error(`[enviosProspectos.controller.js] Error al actualizar estado: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar estado" });
    }
  }

  async deleteEnvioProspecto(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await enviosProspectosRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Envío prospecto no encontrado" });
      }

      return res.status(200).json({ msg: "Envío prospecto eliminado exitosamente" });
    } catch (error) {
      logger.error(`[enviosProspectos.controller.js] Error al eliminar envío prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar envío prospecto" });
    }
  }
}

module.exports = new EnviosProspectosController();
