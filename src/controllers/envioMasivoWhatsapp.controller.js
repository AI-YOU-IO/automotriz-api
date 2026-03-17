const envioMasivoWhatsappRepository = require("../repositories/envioMasivoWhatsapp.repository.js");
const enviosProspectosRepository = require("../repositories/enviosProspectos.repository.js");
const whatsappGraphService = require("../services/whatsapp/whatsappGraph.service.js");
const logger = require('../config/logger/loggerClient.js');

class EnvioMasivoWhatsappController {
  async getEnviosMasivos(req, res) {
    try {
      const { idEmpresa } = req.user || {};

      if (!idEmpresa) {
        return res.status(400).json({ msg: "ID de empresa es requerido" });
      }

      const envios = await envioMasivoWhatsappRepository.findAll(idEmpresa);
      return res.status(200).json({ data: envios });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al obtener envíos masivos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener envíos masivos" });
    }
  }

  async getEnvioMasivoById(req, res) {
    try {
      const { id } = req.params;
      const envio = await envioMasivoWhatsappRepository.findById(id);

      if (!envio) {
        return res.status(404).json({ msg: "Envío masivo no encontrado" });
      }

      return res.status(200).json({ data: envio });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al obtener envío masivo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener envío masivo" });
    }
  }

  async createEnvioMasivo(req, res) {
    try {
      const { id_plantilla, titulo, descripcion, prospectos, fecha_envio, envio_instantaneo } = req.body;
      const { idEmpresa, userId } = req.user || {};
      const id_empresa = idEmpresa;
      const usuario_registro = userId || null;

      if (!id_empresa || !id_plantilla) {
        return res.status(400).json({ msg: "ID de empresa y plantilla son requeridos" });
      }

      if (!prospectos || !Array.isArray(prospectos) || prospectos.length === 0) {
        return res.status(400).json({ msg: "Debe seleccionar al menos un prospecto" });
      }

      const envio = await envioMasivoWhatsappRepository.create({
        id_empresa,
        id_plantilla,
        titulo,
        descripcion,
        cantidad: prospectos.length,
        cantidad_exitosos: 0,
        cantidad_fallidos: 0,
        fecha_envio: fecha_envio || null,
        estado_envio: envio_instantaneo ? 'enviado' : 'pendiente',
        usuario_registro
      });

      const enviosProspectosData = prospectos.map(idProspecto => ({
        id_envio_masivo: envio.id,
        id_prospecto: idProspecto,
        estado: 'pendiente',
        usuario_registro
      }));

      await enviosProspectosRepository.bulkCreate(enviosProspectosData);

      return res.status(201).json({ msg: "Envío masivo creado exitosamente", data: { id: envio.id } });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al crear envío masivo: ${error.message}`);
      return res.status(500).json({ msg: "Error al crear envío masivo" });
    }
  }

  async updateEnvioMasivo(req, res) {
    try {
      const { id } = req.params;
      const { id_plantilla, titulo, descripcion, estado_envio, fecha_envio, prospectos } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      // Actualizar datos del envío
      const [updated] = await envioMasivoWhatsappRepository.update(id, {
        id_plantilla,
        titulo,
        descripcion,
        estado_envio,
        fecha_envio: fecha_envio || null,
        cantidad: prospectos ? prospectos.length : undefined,
        usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Envío masivo no encontrado" });
      }

      // Si se enviaron prospectos, actualizar la lista
      if (prospectos && Array.isArray(prospectos)) {
        // Soft delete de todos los registros anteriores para evitar duplicados
        await enviosProspectosRepository.deleteByEnvioId(id);

        // Crear nuevos registros de prospectos
        const enviosProspectosData = prospectos.map(idProspecto => ({
          id_envio_masivo: parseInt(id),
          id_prospecto: idProspecto,
          estado: 'pendiente',
          usuario_registro: usuario_actualizacion
        }));

        await enviosProspectosRepository.bulkCreate(enviosProspectosData);
      }

      return res.status(200).json({ msg: "Envío masivo actualizado exitosamente" });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al actualizar envío masivo: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar envío masivo" });
    }
  }

  async deleteEnvioMasivo(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await envioMasivoWhatsappRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Envío masivo no encontrado" });
      }

      return res.status(200).json({ msg: "Envío masivo eliminado exitosamente" });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al eliminar envío masivo: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar envío masivo" });
    }
  }

  async ejecutarEnvio(req, res) {
    try {
      const { id } = req.params;
      const { idEmpresa } = req.user || {};

      if (!idEmpresa) {
        return res.status(400).json({ msg: "ID de empresa es requerido" });
      }

      // Obtener el envío masivo con prospectos y plantilla
      const envio = await envioMasivoWhatsappRepository.findById(id);

      if (!envio) {
        return res.status(404).json({ msg: "Envío masivo no encontrado" });
      }

      if (!envio.plantilla) {
        return res.status(400).json({ msg: "El envío no tiene una plantilla asociada" });
      }

      const prospectos = envio.enviosProspectos || [];
      if (prospectos.length === 0) {
        return res.status(400).json({ msg: "El envío no tiene prospectos asociados" });
      }

      const templateName = envio.plantilla.name;
      const language = envio.plantilla.language || 'es';

      let cantidadExitosos = 0;
      let cantidadFallidos = 0;

      // Enviar a cada prospecto
      for (const envioProspecto of prospectos) {
        const prospecto = envioProspecto.prospecto;

        if (!prospecto || !prospecto.celular) {
          await enviosProspectosRepository.updateEstado(envioProspecto.id, 'fallido', 'Prospecto sin número de celular');
          cantidadFallidos++;
          continue;
        }

        try {
          await whatsappGraphService.enviarPlantilla(
            idEmpresa,
            prospecto.celular,
            templateName,
            language
          );
          await enviosProspectosRepository.updateEstado(envioProspecto.id, 'completado');
          cantidadExitosos++;
        } catch (error) {
          logger.error(`[envioMasivoWhatsapp.controller.js] Error enviando a ${prospecto.celular}: ${error.message}`);
          await enviosProspectosRepository.updateEstado(envioProspecto.id, 'fallido', error.message);
          cantidadFallidos++;
        }
      }

      // Actualizar contadores y estado del envío masivo
      await envioMasivoWhatsappRepository.update(id, {
        estado_envio: 'completado',
        cantidad_exitosos: cantidadExitosos,
        cantidad_fallidos: cantidadFallidos,
        fecha_envio: new Date().toISOString().split('T')[0]
      });

      return res.status(200).json({
        msg: "Envío masivo ejecutado",
        data: { cantidadExitosos, cantidadFallidos }
      });
    } catch (error) {
      logger.error(`[envioMasivoWhatsapp.controller.js] Error al ejecutar envío masivo: ${error.message}`);
      return res.status(500).json({ msg: "Error al ejecutar envío masivo" });
    }
  }
}

module.exports = new EnvioMasivoWhatsappController();
