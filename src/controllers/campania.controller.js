const campaniaRepository = require("../repositories/campania.repository.js");
const ultravoxService = require("../services/ultravox/ultravox.service.js");
const logger = require('../config/logger/loggerClient.js');
const { Campania, Plantilla, Voz } = require('../models/sequelize');

class CampaniaController {
  // ==================== CAMPANIAS ====================
  async getCampanias(req, res) {
    try {
      const { idEmpresa } = req.user || {};
      const campanias = await campaniaRepository.findAll(idEmpresa);
      return res.status(200).json({ data: campanias });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener campanias: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campanias" });
    }
  }

  async getCampaniaById(req, res) {
    try {
      const { id } = req.params;
      const campania = await campaniaRepository.findById(id);

      if (!campania) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ data: campania });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campania" });
    }
  }

  async createCampania(req, res) {
    try {
      const { nombre, descripcion, id_tipo_campania, id_estado_campania, id_estado_prospecto, id_plantilla, id_plantilla_whatsapp } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      const campania = await campaniaRepository.create({
        id_empresa, nombre, descripcion, id_tipo_campania, id_estado_campania, id_estado_prospecto, id_plantilla, id_plantilla_whatsapp, usuario_registro
      });

      return res.status(201).json({ msg: "Campania creada exitosamente", data: { id: campania.id } });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al crear campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear campania" });
    }
  }

  async updateCampania(req, res) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, id_tipo_campania, id_estado_campania, id_estado_prospecto, id_plantilla, id_plantilla_whatsapp } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!nombre) {
        return res.status(400).json({ msg: "El nombre es requerido" });
      }

      // Verificar si la campaña tiene ejecuciones
      const totalEjecuciones = await campaniaRepository.countEjecuciones(id);
      if (totalEjecuciones > 0) {
        return res.status(400).json({ msg: "No se puede editar una campaña que ya tiene ejecuciones" });
      }

      const [updated] = await campaniaRepository.update(id, {
        nombre, descripcion, id_tipo_campania, id_estado_campania, id_estado_prospecto, id_plantilla, id_plantilla_whatsapp, usuario_actualizacion
      });

      if (!updated) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ msg: "Campania actualizada exitosamente" });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al actualizar campania: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar campania" });
    }
  }

  async deleteCampania(req, res) {
    try {
      const { id } = req.params;
      const [deleted] = await campaniaRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({ msg: "Campania no encontrada" });
      }

      return res.status(200).json({ msg: "Campania eliminada exitosamente" });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al eliminar campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al eliminar campania" });
    }
  }

  // ==================== CONFIGURACION DE LLAMADAS ====================
  async getConfiguracionLlamada(req, res) {
    try {
      const { id } = req.params;
      const configuraciones = await campaniaRepository.findConfiguracionLlamada(id);
      return res.status(200).json({ data: configuraciones });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener configuracion de llamadas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener configuracion de llamadas" });
    }
  }

  async updateConfiguracionLlamada(req, res) {
    try {
      const { id } = req.params;
      const { dias } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      if (!dias || typeof dias !== 'object') {
        return res.status(400).json({ msg: "El campo 'dias' es requerido" });
      }

      const configuraciones = await campaniaRepository.upsertConfiguracionLlamada(id, dias, usuario_actualizacion);

      return res.status(200).json({ msg: "Configuracion de llamadas actualizada exitosamente", data: configuraciones });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al actualizar configuracion de llamadas: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al actualizar configuracion de llamadas" });
    }
  }

  // ==================== CAMPANIA EJECUCION ====================
  async getEjecucionesByCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const { count, rows } = await campaniaRepository.findEjecucionesPaginated(idCampania, page, limit);

      return res.status(200).json({ data: rows, total: count, page, totalPages: Math.ceil(count / limit) });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener ejecuciones: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecuciones" });
    }
  }

  async ejecutarCampania(req, res) {
    try {
      const { id_campania } = req.body;
      const id_empresa = req.user?.idEmpresa || null;
      const usuario_registro = req.user?.userId || null;

      if (!id_campania) {
        return res.status(400).json({ msg: "La campania es requerida" });
      }

      const campania = await Campania.findByPk(id_campania);
      if (!campania) {
        return res.status(404).json({ msg: "Campaña no encontrada" });
      }

      const ejecucion = await campaniaRepository.createEjecucion({
        id_campania, fecha_programada: new Date(), usuario_registro
      });

      return res.status(201).json({
        msg: "Ejecucion creada. Agregue prospectos e inicie las llamadas.",
        data: { id: ejecucion.id }
      });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al crear ejecucion: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al crear ejecucion" });
    }
  }

  async iniciarLlamadas(req, res) {
    try {
      const { id } = req.params;
      const id_empresa = req.user?.idEmpresa || 1;

      const ejecucion = await campaniaRepository.findEjecucionById(id);
      if (!ejecucion) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      if (ejecucion.fecha_inicio) {
        return res.status(400).json({ msg: "Esta ejecucion ya fue iniciada" });
      }

      // Verificar que tenga prospectos
      const prospectos = await campaniaRepository.findProspectosByCampania(ejecucion.id_campania);
      if (!prospectos || prospectos.length === 0) {
        return res.status(400).json({ msg: "Debe agregar prospectos antes de iniciar las llamadas" });
      }

      // Cargar campaña con plantilla y voz
      const campania = await Campania.findByPk(ejecucion.id_campania, {
        include: [
          { model: Plantilla, as: 'plantilla' },
          { model: Voz, as: 'voz' }
        ]
      });

      const plantilla = campania?.plantilla;
      const prompt = plantilla?.prompt_sistema || '';

      const voiceCode = campania?.voz?.voice_code || null;

      // Iniciar llamadas Ultravox en background
      ultravoxService.procesarLlamadasAsync({
        idEjecucion: parseInt(id),
        idCampania: ejecucion.id_campania,
        idEmpresa: id_empresa,
        prompt,
        voiceCode
      }).catch(err => {
        logger.error(`[campania.controller.js] Error en procesarLlamadasAsync: ${err.message}`);
      });

      return res.status(200).json({
        msg: "Llamadas iniciadas",
        data: { id_ejecucion: id, total_prospectos: prospectos.length }
      });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al iniciar llamadas: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al iniciar llamadas" });
    }
  }

  async getEjecucionById(req, res) {
    try {
      const { id } = req.params;
      const ejecucion = await campaniaRepository.findEjecucionById(id);

      if (!ejecucion) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      return res.status(200).json({ data: ejecucion });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener ejecucion" });
    }
  }

  async updateEjecucion(req, res) {
    try {
      const { id } = req.params;
      const { resultado, mensaje_error } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const updateData = { resultado, mensaje_error, usuario_actualizacion };

      const [updated] = await campaniaRepository.updateEjecucion(id, updateData);

      if (!updated) {
        return res.status(404).json({ msg: "Ejecucion no encontrada" });
      }

      return res.status(200).json({ msg: "Ejecucion actualizada" });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al actualizar ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar ejecucion" });
    }
  }

  async cancelarEjecucion(req, res) {
    try {
      const { id } = req.params;
      const { mensaje_error } = req.body;
      const usuario_actualizacion = req.user?.userId || null;

      const [cancelled] = await campaniaRepository.cancelarEjecucion(id, {
        mensaje_error,
        usuario_actualizacion
      });

      if (!cancelled) {
        return res.status(404).json({ msg: "Ejecucion no encontrada o ya finalizada" });
      }

      return res.status(200).json({ msg: "Ejecucion cancelada exitosamente" });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al cancelar ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al cancelar ejecucion" });
    }
  }

  // ==================== LLAMADAS POR EJECUCION ====================
  async getLlamadasByEjecucion(req, res) {
    try {
      const { idEjecucion } = req.params;
      const llamadas = await campaniaRepository.findLlamadasByEjecucion(idEjecucion);
      return res.status(200).json({ data: llamadas });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener llamadas de ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener llamadas de ejecucion" });
    }
  }

  // ==================== ENVIOS WHATSAPP POR EJECUCION ====================
  async getEnviosByEjecucion(req, res) {
    try {
      const { idEjecucion } = req.params;
      const envios = await campaniaRepository.findEnviosByEjecucion(idEjecucion);
      return res.status(200).json({ data: envios });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener envios de ejecucion: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener envios de ejecucion" });
    }
  }

  // ==================== CAMPANIA PROSPECTOS ====================
  async getProspectosByCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const prospectos = await campaniaRepository.findProspectosByCampania(idCampania);
      return res.status(200).json({ data: prospectos });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener prospectos de campania: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener prospectos de campania" });
    }
  }

  async addProspectosToCampania(req, res) {
    try {
      const { idCampania } = req.params;
      const { prospectos_ids } = req.body;
      const usuario_registro = req.user?.userId || null;

      if (!prospectos_ids || !prospectos_ids.length) {
        return res.status(400).json({ msg: "Debe enviar al menos un prospecto" });
      }

      const registros = await campaniaRepository.addProspectosToCampania(idCampania, prospectos_ids, usuario_registro);
      return res.status(201).json({ msg: "Prospectos agregados exitosamente", data: registros });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al agregar prospectos: ${error.message}`);
      return res.status(500).json({ msg: error.message || "Error al agregar prospectos" });
    }
  }

  async removeProspectoFromCampania(req, res) {
    try {
      const { id } = req.params;
      const [removed] = await campaniaRepository.removeProspectoFromCampania(id);

      if (!removed) {
        return res.status(404).json({ msg: "Registro no encontrado" });
      }

      return res.status(200).json({ msg: "Prospecto removido exitosamente" });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al remover prospecto: ${error.message}`);
      return res.status(500).json({ msg: "Error al remover prospecto" });
    }
  }
  // ==================== VOCES ====================
  async getVoces(req, res) {
    try {
      const voces = await Voz.findAll({ where: { estado_registro: 1 } });
      return res.status(200).json({ data: voces });
    } catch (error) {
      logger.error(`[campania.controller.js] Error al obtener voces: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener voces" });
    }
  }
}

module.exports = new CampaniaController();
