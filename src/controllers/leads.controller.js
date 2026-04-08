const { Prospecto, Usuario, EstadoProspecto, Tipificacion, sequelize } = require("../models/sequelize/index.js");
const { Op, QueryTypes } = require("sequelize");
const logger = require('../config/logger/loggerClient.js');
const sperantService = require('../services/crm/sperant.service.js');

class LeadsController {
  async getLeads(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};

      logger.info(`[leads.controller.js] getLeads - userId: ${userId}, rolId: ${rolId}, idEmpresa: ${idEmpresa}`);

      const rolIdNum = parseInt(rolId, 10);
      let whereClause = { estado_registro: 1 };

      if (idEmpresa) {
        whereClause.id_empresa = idEmpresa;
      }

      // Filtrar por tipo de usuario
      if (rolIdNum === 2) {
        // Asesor: solo sus prospectos asignados
        whereClause.id_usuario = userId;
      }
      // Rol 1 (admin): ve todos de su empresa (sin filtro adicional)

      const leads = await Prospecto.findAll({
        where: whereClause,
        include: [
          { model: EstadoProspecto, as: 'estadoProspecto', attributes: ['id', 'nombre', 'color'], required: false },
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'], required: false }
        ],
        order: [['fecha_registro', 'DESC']]
      });

      // Obtener última tipificación de cada prospecto
      const prospIds = leads.map(l => l.id);
      let tipifMap = {};
      if (prospIds.length > 0) {
        const tipifs = await sequelize.query(`
          SELECT DISTINCT ON (id_prospecto) id, nombre, tipo, id_prospecto, usuario_registro, fecha_registro
          FROM tipificacion
          WHERE estado_registro = 1 AND id_prospecto IN (:ids)
          ORDER BY id_prospecto, fecha_registro DESC
        `, { replacements: { ids: prospIds }, type: QueryTypes.SELECT });
        tipifs.forEach(t => { tipifMap[t.id_prospecto] = t; });
      }

      // Mapear a campos planos que espera el frontend
      const leadsPlain = leads.map(lead => {
        const l = lead.toJSON();
        l.estado_nombre = l.estadoProspecto?.nombre || null;
        l.estado_color = l.estadoProspecto?.color || null;
        l.asesor_nombre = l.usuario?.usuario || null;
        const tipif = tipifMap[l.id] || null;
        l.tipificacion_nombre = tipif?.nombre || null;
        l.tipificacion_color = tipif?.tipo === 'consulta' ? '#3B82F6' : tipif?.tipo === 'cita' ? '#8B5CF6' : tipif?.tipo === 'cotizacion' ? '#06B6D4' : tipif?.tipo === 'postventa' ? '#10B981' : tipif?.tipo === 'desistimiento' ? '#EF4444' : '#6B7280';
        return l;
      });

      return res.status(200).json({ data: leadsPlain });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener leads: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener leads" });
    }
  }

  async getLeadById(req, res) {
    try {
      const { id } = req.params;

      const lead = await Prospecto.findByPk(id, {
        include: [
          { model: EstadoProspecto, as: 'estadoProspecto', attributes: ['id', 'nombre', 'color'], required: false },
          { model: Usuario, as: 'usuario', attributes: ['id', 'usuario'], required: false }
        ]
      });

      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      const leadPlain = lead.toJSON();
      leadPlain.estado_nombre = leadPlain.estadoProspecto?.nombre || null;
      leadPlain.estado_color = leadPlain.estadoProspecto?.color || null;
      leadPlain.asesor_nombre = leadPlain.usuario?.usuario || null;

      return res.status(200).json({ data: leadPlain });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener lead" });
    }
  }

  async getInteracciones(req, res) {
    try {
      const { id } = req.params;

      const interacciones = await sequelize.query(`
        SELECT
          i.id,
          i.satisfactorio,
          i.observaciones,
          i.fecha_registro,
          m.nombre AS marca,
          u.usuario AS asesor,
          mo.nombre AS modelo,
          pr.nombre_completo AS prospecto
        FROM interaccion i
        LEFT JOIN marca m ON m.id = i.id_marca
        LEFT JOIN usuario u ON u.id = i.id_usuario
        LEFT JOIN modelo mo ON mo.id = i.id_modelo
        LEFT JOIN prospecto pr ON pr.id = i.id_prospecto
        WHERE i.id_prospecto = :id
          AND i.estado_registro = 1
        ORDER BY i.fecha_registro DESC
      `, { replacements: { id }, type: QueryTypes.SELECT });

      return res.status(200).json(interacciones);
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener interacciones: ${error.message}`);
      return res.status(500).json({ msg: 'Error al obtener interacciones' });
    }
  }

  async assignAsesor(req, res) {
    try {
      const { id } = req.params;
      const { id_asesor } = req.body;

      const lead = await Prospecto.findByPk(id);
      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      await lead.update({ id_usuario: id_asesor });
      return res.status(200).json({ msg: "Asesor asignado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al asignar asesor: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesor" });
    }
  }

  async getAsesores(req, res) {
    try {
      const { userId, rolId, idEmpresa } = req.user || {};
      const rolIdNum = parseInt(rolId, 10);

      logger.info(`[leads.controller.js] getAsesores - userId: ${userId}, rolId: ${rolId}, rolIdNum: ${rolIdNum}, idEmpresa: ${idEmpresa}`);

      let whereClause = { id_rol: 2, estado_registro: 1 };

      if (rolIdNum === 1) {
        // Rol 1 (admin): ver todos los asesores de su empresa
        if (idEmpresa) {
          whereClause.id_empresa = idEmpresa;
        }
      } else {
        // Asesores no pueden ver otros asesores
        return res.status(200).json({ data: [] });
      }

      const asesores = await Usuario.findAll({
        where: whereClause,
        attributes: ['id', 'usuario', 'email']
      });

      logger.info(`[leads.controller.js] getAsesores - Asesores encontrados: ${asesores.length}`);
      return res.status(200).json({ data: asesores });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener asesores: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener asesores" });
    }
  }

  async bulkAssignAsesor(req, res) {
    try {
      const { lead_ids, id_asesor } = req.body;

      if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
        return res.status(400).json({ msg: "Debe seleccionar al menos un lead" });
      }

      if (!id_asesor) {
        return res.status(400).json({ msg: "Debe seleccionar un asesor" });
      }

      await Prospecto.update(
        { id_usuario: id_asesor },
        { where: { id: { [Op.in]: lead_ids } } }
      );

      logger.info(`[leads.controller.js] Asignación masiva: ${lead_ids.length} leads asignados al asesor ${id_asesor}`);
      return res.status(200).json({ msg: `${lead_ids.length} leads asignados correctamente` });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en asignación masiva: ${error.message}`);
      return res.status(500).json({ msg: "Error al asignar asesores" });
    }
  }

  async updateLead(req, res) {
    try {
      const { id } = req.params;

      const lead = await Prospecto.findByPk(id);
      if (!lead) {
        return res.status(404).json({ msg: "Lead no encontrado" });
      }

      const body = req.body;
      logger.info(`[leads.controller.js] updateLead body: ${JSON.stringify(body)}`);

      // Mapear campos del frontend a campos de la BD
      const updateData = {};
      if (body.nombre_completo !== undefined) updateData.nombre_completo = body.nombre_completo;
      if (body.dni !== undefined) updateData.dni = body.dni || null;
      if (body.celular !== undefined) updateData.celular = body.celular;
      if (body.direccion !== undefined) updateData.direccion = body.direccion || null;
      if (body.email !== undefined) updateData.email = body.email || null;
      if (body.id_estado !== undefined) updateData.id_estado_prospecto = body.id_estado;
      if (body.id_estado_prospecto !== undefined) updateData.id_estado_prospecto = body.id_estado_prospecto;
      if (body.id_asesor !== undefined) updateData.id_usuario = body.id_asesor || null;
      if (body.calificacion_lead !== undefined) updateData.calificacion_lead = body.calificacion_lead;
      if (body.perfilamiento !== undefined) updateData.perfilamiento = body.perfilamiento;
      if (body.puntaje !== undefined) updateData.puntaje = body.puntaje;
      if (body.fue_contactado !== undefined) updateData.fue_contactado = body.fue_contactado;

      logger.info(`[leads.controller.js] updateLead mapped: ${JSON.stringify(updateData)}`);
      await lead.update(updateData);
      logger.info(`[leads.controller.js] Lead ${id} actualizado correctamente`);

      return res.status(200).json({ msg: "Lead actualizado correctamente" });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al actualizar lead: ${error.message}`);
      return res.status(500).json({ msg: "Error al actualizar lead" });
    }
  }

  async getCatalogo(req, res) {
    // TODO: Crear modelo Catalogo cuando se necesite
    return res.status(200).json({ data: [] });
  }




  async syncFromSperant(req, res) {
    try {
      const { userId, idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sync clientes desde Sperant solicitado por usuario ${userId}`);

      const result = await sperantService.syncClients(idEmpresa || null, userId);

      return res.status(200).json({
        msg: `Sincronización completada: ${result.created} creados, ${result.updated} actualizados`,
        data: result
      });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al sincronizar clientes desde Sperant: ${error.message}`);
      logger.error(`[leads.controller.js] DEBUG - Stack: ${error.stack}`);
      return res.status(500).json({ msg: "Error al sincronizar desde Sperant", debug: error.message });
    }
  }

  async syncAllFromSperant(req, res) {
    try {
      const { userId, idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sync completo desde Sperant solicitado por usuario ${userId}`);

      const result = await sperantService.syncAll(idEmpresa || null, userId);

      return res.status(200).json({
        msg: `Sync completo: Clientes ${result.clients.created} creados/${result.clients.updated} actualizados`,
        data: result
      });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en sync completo desde Sperant: ${error.message}`);
      return res.status(500).json({ msg: "Error en sync completo desde Sperant", debug: error.message });
    }
  }
}

module.exports = new LeadsController();
