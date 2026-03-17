const plantillaWhatsappRepository = require("../repositories/plantillaWhatsapp.repository.js");
const whatsappGraphService = require("../services/whatsapp/whatsappGraph.service.js");
const logger = require('../config/logger/loggerClient.js');
const fs = require('fs');
const path = require('path');

class PlantillaWhatsappController {
  /**
   * Obtiene plantillas desde Meta Graph API
   * El listado siempre viene de Meta para tener datos actualizados (status, quality_score, etc)
   */
  async getPlantillas(req, res) {
    try {
      const idEmpresa = req.user?.idEmpresa || null;
      const { status, limit } = req.query;

      logger.info(`[plantillaWhatsapp.controller] ========== GET PLANTILLAS ==========`);
      logger.info(`[plantillaWhatsapp.controller] idEmpresa: ${idEmpresa}, status: ${status}, limit: ${limit}`);
      logger.info(`[plantillaWhatsapp.controller] user: ${JSON.stringify(req.user || {})}`);

      if (!idEmpresa) {
        logger.error(`[plantillaWhatsapp.controller] ID de empresa no encontrado en req.user`);
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      // Obtener plantillas desde Meta
      logger.info(`[plantillaWhatsapp.controller] Llamando a whatsappGraphService.listarPlantillas...`);
      const result = await whatsappGraphService.listarPlantillas(idEmpresa, { status, limit });
      logger.info(`[plantillaWhatsapp.controller] Resultado de Meta - templates: ${result.templates?.length || 0}, waba_id: ${result.waba_id}`);

      // Obtener datos locales para enriquecer (id local, url media, etc)
      const plantillasLocales = await plantillaWhatsappRepository.findAll(idEmpresa);
      logger.info(`[plantillaWhatsapp.controller] Plantillas locales encontradas: ${plantillasLocales?.length || 0}`);

      const mapaLocal = {};
      for (const p of plantillasLocales) {
        mapaLocal[p.name] = {
          id_local: p.id,
          url_imagen: p.url_imagen,
          header_type: p.header_type,
          meta_template_id: p.meta_template_id
        };
      }

      // Enriquecer plantillas de Meta con datos locales
      const templatesEnriquecidos = result.templates.map(template => {
        const local = mapaLocal[template.name];
        if (local) {
          return {
            ...template,
            id_local: local.id_local,
            url_imagen: local.url_imagen,
            header_type_local: local.header_type,
            meta_template_id: local.meta_template_id || template.id
          };
        }
        return template;
      });

      logger.info(`[plantillaWhatsapp.controller] Templates enriquecidos: ${templatesEnriquecidos.length}`);
      logger.info(`[plantillaWhatsapp.controller] ========== FIN GET PLANTILLAS ==========`);

      return res.status(200).json({
        success: true,
        data: {
          templates: templatesEnriquecidos,
          total: result.total,
          waba_id: result.waba_id
        }
      });
    } catch (error) {
      logger.error(`[plantillaWhatsapp.controller] Error al obtener plantillas: ${error.message}`);
      logger.error(`[plantillaWhatsapp.controller] Stack: ${error.stack}`);
      return res.status(500).json({ msg: "Error al obtener plantillas", error: error.message });
    }
  }

  async getPlantillaById(req, res) {
    try {
      const { id } = req.params;
      const idEmpresa = req.user?.idEmpresa || null;
      const MAX_INTEGER = 2147483647;

      let plantilla = null;

      // Si el ID es mayor que el máximo de INTEGER, buscar por meta_template_id
      if (Number(id) > MAX_INTEGER) {
        plantilla = await plantillaWhatsappRepository.findByMetaTemplateId(id, idEmpresa);
      } else {
        plantilla = await plantillaWhatsappRepository.findById(id);
      }

      if (!plantilla) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      return res.status(200).json({ data: plantilla });
    } catch (error) {
      logger.error(`[plantillaWhatsapp.controller.js] Error al obtener plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener plantilla" });
    }
  }

  /**
   * Crea plantilla: primero en Meta, luego en BD si es exitoso
   * Soporta subida de archivos (imagen, video, documento) según header_type
   */
  async createPlantilla(req, res) {
    try {
      const { name, category, language, header_type, header_text, body, footer, buttons } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!id_empresa) {
        // Si hay archivo subido, eliminarlo
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      if (!name || !body) {
        // Si hay archivo subido, eliminarlo
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ msg: "El nombre y contenido son requeridos" });
      }

      // Validar que si header_type es IMAGE, VIDEO o DOCUMENT, se haya subido un archivo
      const mediaHeaderTypes = ['IMAGE', 'VIDEO', 'DOCUMENT'];
      if (mediaHeaderTypes.includes(header_type?.toUpperCase()) && !req.file) {
        return res.status(400).json({
          msg: `Se requiere un archivo para header_type: ${header_type}`
        });
      }

      const nombreFormateado = name.toLowerCase().replace(/\s+/g, '_');

      // Construir URL del archivo si existe
      let url_imagen = null;
      let mediaHandle = null;

      // Si hay archivo, subirlo a Meta primero para obtener el media_handle
      if (req.file) {
        url_imagen = `/uploads/plantillas/${req.file.filename}`;

        // Solo subir a Meta si es tipo media
        if (mediaHeaderTypes.includes(header_type?.toUpperCase())) {
          try {
            mediaHandle = await whatsappGraphService.subirMediaParaPlantilla(
              id_empresa,
              req.file.path,
              req.file.mimetype
            );
            logger.info(`[plantillaWhatsapp.controller.js] Media subida a Meta, handle: ${mediaHandle}`);
          } catch (uploadError) {
            logger.error(`[plantillaWhatsapp.controller.js] Error subiendo media a Meta: ${uploadError.message}`);
            // Continuar sin media handle - Meta rechazará la plantilla si es requerido
          }
        }
      }

      // Construir componentes para Meta (pasando el media handle si existe)
      const components = whatsappGraphService.convertirDatosAComponentes({
        header_type,
        header_text,
        body,
        footer,
        buttons
      }, mediaHandle);

      // 1. Crear en Meta
      const resultMeta = await whatsappGraphService.crearPlantilla(
        id_empresa,
        nombreFormateado,
        category || 'MARKETING',
        language || 'es',
        components
      );

      // 2. Si Meta fue exitoso, guardar en BD con la URL del archivo y el meta_template_id
      const plantilla = await plantillaWhatsappRepository.create({
        name: nombreFormateado,
        status: resultMeta.status || 'PENDING',
        category: category || 'MARKETING',
        language: language || 'es',
        header_type,
        header_text,
        body,
        footer,
        buttons: buttons || [],
        url_imagen,
        meta_template_id: resultMeta.id || null,
        id_empresa,
        usuario_registro
      });

      logger.info(`[plantillaWhatsapp.controller.js] Plantilla creada en Meta y BD: ${nombreFormateado}, url_imagen: ${url_imagen}`);

      return res.status(201).json({
        success: true,
        msg: "Plantilla creada exitosamente. Pendiente de aprobación por Meta.",
        data: {
          id: plantilla.id,
          meta_id: resultMeta.id,
          status: resultMeta.status,
          category: resultMeta.category,
          url_imagen
        }
      });
    } catch (error) {
      // Si hay error y se subió archivo, eliminarlo
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          logger.error(`[plantillaWhatsapp.controller.js] Error eliminando archivo: ${unlinkErr.message}`);
        }
      }

      logger.error(`[plantillaWhatsapp.controller.js] Error al crear plantilla: ${error.message}`);

      // Extraer mensaje de error de Meta si existe
      const errorMsg = error.response?.data?.error?.message || error.message || "Error al crear plantilla";
      return res.status(500).json({ success: false, msg: errorMsg });
    }
  }

  /**
   * Actualiza plantilla: primero en Meta, luego en BD si es exitoso
   * NOTA: Solo se pueden editar plantillas APPROVED o REJECTED en Meta
   * NOTA: El nombre de la plantilla NO se puede cambiar en Meta (es inmutable)
   * Soporta subida de archivos (imagen, video, documento) según header_type
   */
  async updatePlantilla(req, res) {
    try {
      const { id } = req.params;
      const { name, category, language, header_type, header_text, body, footer, buttons, meta_template_id } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_actualizacion = req.user?.userId || null;
      const MAX_INTEGER = 2147483647;

      // Función helper para limpiar archivo subido en caso de error
      const limpiarArchivo = () => {
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) { /* ignorar */ }
        }
      };

      if (!id_empresa) {
        limpiarArchivo();
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      if (!name || !body) {
        limpiarArchivo();
        return res.status(400).json({ msg: "El nombre y contenido son requeridos" });
      }

      // Obtener plantilla actual - si el ID es mayor que MAX_INTEGER, buscar por meta_template_id
      let plantillaActual = null;
      if (Number(id) > MAX_INTEGER) {
        plantillaActual = await plantillaWhatsappRepository.findByMetaTemplateId(id, id_empresa);
      } else {
        plantillaActual = await plantillaWhatsappRepository.findById(id);
      }

      if (!plantillaActual) {
        limpiarArchivo();
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      // Formatear el nombre nuevo para comparar
      const nombreNuevoFormateado = name.toLowerCase().replace(/\s+/g, '_');

      // VALIDACIÓN: El nombre de la plantilla NO se puede cambiar en Meta
      if (plantillaActual.name && plantillaActual.name !== nombreNuevoFormateado) {
        limpiarArchivo();
        return res.status(400).json({
          success: false,
          msg: "No se puede cambiar el nombre de una plantilla en Meta. El nombre es inmutable una vez creada. Si necesita otro nombre, debe eliminar esta plantilla y crear una nueva."
        });
      }

      // Construir URL del archivo si existe
      let url_imagen = plantillaActual.url_imagen;
      let mediaHandle = null;
      const mediaHeaderTypes = ['IMAGE', 'VIDEO', 'DOCUMENT'];

      if (req.file) {
        // Eliminar archivo anterior si existe
        if (plantillaActual.url_imagen) {
          const oldFilePath = path.join(__dirname, '..', '..', plantillaActual.url_imagen);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (err) {
              logger.error(`[plantillaWhatsapp.controller.js] Error eliminando archivo anterior: ${err.message}`);
            }
          }
        }
        url_imagen = `/uploads/plantillas/${req.file.filename}`;

        // Subir nuevo archivo a Meta si es tipo media
        if (mediaHeaderTypes.includes(header_type?.toUpperCase())) {
          try {
            mediaHandle = await whatsappGraphService.subirMediaParaPlantilla(
              id_empresa,
              req.file.path,
              req.file.mimetype
            );
            logger.info(`[plantillaWhatsapp.controller.js] Media actualizada en Meta, handle: ${mediaHandle}`);
          } catch (uploadError) {
            logger.error(`[plantillaWhatsapp.controller.js] Error subiendo media a Meta: ${uploadError.message}`);
          }
        }
      }

      // Construir componentes para Meta (pasando el media handle si existe)
      const components = whatsappGraphService.convertirDatosAComponentes({
        header_type,
        header_text,
        body,
        footer,
        buttons
      }, mediaHandle);

      // 1. Editar en Meta (usar meta_template_id del body o de la BD)
      const metaTemplateIdToUse = meta_template_id || plantillaActual.meta_template_id;

      // Obtener el status actual de Meta para validar si se puede editar
      let statusActualMeta = null;
      let plantillaEnMeta = null;

      if (metaTemplateIdToUse) {
        try {
          const plantillasMeta = await whatsappGraphService.listarPlantillas(id_empresa, {});
          plantillaEnMeta = plantillasMeta.templates.find(t => t.id === metaTemplateIdToUse || t.name === plantillaActual.name);

          if (plantillaEnMeta) {
            statusActualMeta = plantillaEnMeta.status;
            logger.info(`[plantillaWhatsapp.controller.js] Status actual en Meta: ${statusActualMeta}`);

            // Sincronizar status en BD si es diferente
            if (statusActualMeta && statusActualMeta !== plantillaActual.status) {
              await plantillaWhatsappRepository.update(plantillaActual.id, { status: statusActualMeta });
            }
          }
        } catch (err) {
          logger.warn(`[plantillaWhatsapp.controller.js] No se pudo obtener status de Meta: ${err.message}`);
        }

        // Validar que no esté PENDING
        if (statusActualMeta === 'PENDING') {
          limpiarArchivo();
          return res.status(400).json({
            success: false,
            msg: "No se puede editar una plantilla en estado PENDING. Espere a que sea aprobada o rechazada por Meta."
          });
        }

        // Validar que los componentes tengan contenido válido antes de enviar a Meta
        if (!components || components.length === 0) {
          limpiarArchivo();
          return res.status(400).json({
            success: false,
            msg: "Los componentes de la plantilla no son válidos. Asegúrese de enviar al menos el contenido del cuerpo (body)."
          });
        }

        try {
          await whatsappGraphService.editarPlantilla(id_empresa, metaTemplateIdToUse, components);
          logger.info(`[plantillaWhatsapp.controller.js] Plantilla editada en Meta: ${metaTemplateIdToUse}`);

          // Después de editar en Meta, la plantilla puede volver a PENDING para re-revisión
          // Avisar al usuario
          if (statusActualMeta === 'APPROVED') {
            logger.info(`[plantillaWhatsapp.controller.js] La plantilla estaba APPROVED, puede volver a PENDING para re-revisión por Meta`);
          }
        } catch (metaError) {
          limpiarArchivo();
          const errorMsg = metaError.response?.data?.error?.message || metaError.message;
          logger.error(`[plantillaWhatsapp.controller.js] Error editando en Meta: ${errorMsg}`);
          return res.status(400).json({
            success: false,
            msg: `Error al editar plantilla en Meta: ${errorMsg}`
          });
        }
      } else {
        logger.warn(`[plantillaWhatsapp.controller.js] No se encontró meta_template_id para la plantilla ${id}, solo se actualizará en BD`);
      }

      // 2. Actualizar en BD
      const updateData = {
        category,
        language,
        header_type,
        header_text,
        body,
        footer,
        buttons: buttons || [],
        url_imagen,
        usuario_actualizacion
      };

      // Si viene meta_template_id y la plantilla no lo tenía, guardarlo
      if (meta_template_id && !plantillaActual.meta_template_id) {
        updateData.meta_template_id = meta_template_id;
      }

      const [updated] = await plantillaWhatsappRepository.update(plantillaActual.id, updateData);

      if (!updated) {
        limpiarArchivo();
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      logger.info(`[plantillaWhatsapp.controller.js] Plantilla actualizada: ${plantillaActual.id}`);

      // Mensaje de respuesta según el estado
      let mensaje = "Plantilla actualizada exitosamente";
      if (metaTemplateIdToUse && statusActualMeta === 'APPROVED') {
        mensaje = "Plantilla actualizada. Los cambios serán revisados por Meta antes de aplicarse.";
      }

      return res.status(200).json({
        success: true,
        msg: mensaje,
        data: { url_imagen }
      });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) { /* ignorar */ }
      }
      logger.error(`[plantillaWhatsapp.controller.js] Error al actualizar plantilla: ${error.message}`);
      const errorMsg = error.response?.data?.error?.message || error.message || "Error al actualizar plantilla";
      return res.status(500).json({ success: false, msg: errorMsg });
    }
  }

  /**
   * Elimina plantilla: primero en Meta, luego en BD si es exitoso
   */
  async deletePlantilla(req, res) {
    try {
      const { id } = req.params;
      const id_empresa = req.user?.idEmpresa || null;
      const MAX_INTEGER = 2147483647;

      if (!id_empresa) {
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      // Obtener plantilla - si el ID es mayor que MAX_INTEGER, buscar por meta_template_id
      let plantilla = null;
      if (Number(id) > MAX_INTEGER) {
        plantilla = await plantillaWhatsappRepository.findByMetaTemplateId(id, id_empresa);
      } else {
        plantilla = await plantillaWhatsappRepository.findById(id);
      }

      if (!plantilla) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      // 1. Eliminar en Meta
      try {
        await whatsappGraphService.eliminarPlantilla(id_empresa, plantilla.name);
      } catch (metaError) {
        logger.error(`[plantillaWhatsapp.controller.js] Error eliminando en Meta: ${metaError.message}`);
        // Si falla en Meta, igual eliminamos de BD (puede que ya no exista en Meta)
      }

      // 2. Eliminar en BD (soft delete) usando el ID local
      const [deleted] = await plantillaWhatsappRepository.delete(plantilla.id);

      if (!deleted) {
        return res.status(404).json({ msg: "Plantilla no encontrada" });
      }

      logger.info(`[plantillaWhatsapp.controller.js] Plantilla eliminada: ${plantilla.name}`);

      return res.status(200).json({
        success: true,
        msg: "Plantilla eliminada exitosamente"
      });
    } catch (error) {
      logger.error(`[plantillaWhatsapp.controller.js] Error al eliminar plantilla: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar plantilla" });
    }
  }

  /**
   * Envía una plantilla a un número de teléfono
   */
  async enviarPlantilla(req, res) {
    try {
      const { phone, template_name, language, components } = req.body;
      const id_empresa = req.user?.idEmpresa || null;

      if (!id_empresa) {
        return res.status(400).json({ msg: "ID de empresa requerido" });
      }

      if (!phone || !template_name) {
        return res.status(400).json({ msg: "El teléfono y nombre de plantilla son requeridos" });
      }

      const result = await whatsappGraphService.enviarPlantilla(
        id_empresa,
        phone,
        template_name,
        language || 'es',
        components || []
      );

      return res.status(200).json({
        success: true,
        msg: "Plantilla enviada correctamente",
        data: result.response
      });
    } catch (error) {
      logger.error(`[plantillaWhatsapp.controller.js] Error al enviar plantilla: ${error.message}`);
      const errorMsg = error.response?.data?.error?.message || error.message || "Error al enviar plantilla";
      return res.status(500).json({ success: false, msg: errorMsg });
    }
  }
}

module.exports = new PlantillaWhatsappController();
