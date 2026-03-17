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
      if (rolIdNum === 3) {
        // Asesor: solo sus prospectos asignados
        whereClause.id_usuario = userId;
      } else if (rolIdNum === 2) {
        // Supervisor: prospectos de sus asesores subordinados
        const subordinados = await Usuario.findAll({
          where: { id_padre: userId, estado_registro: 1 },
          attributes: ['id']
        });
        const subordinadoIds = subordinados.map(s => s.id);
        subordinadoIds.push(userId);
        whereClause.id_usuario = { [Op.in]: subordinadoIds };
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

      // Mapear a campos planos que espera el frontend
      const leadsPlain = leads.map(lead => {
        const l = lead.toJSON();
        l.estado_nombre = l.estadoProspecto?.nombre || null;
        l.estado_color = l.estadoProspecto?.color || null;
        l.asesor_nombre = l.usuario?.usuario || null;
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
          p.nombre AS proyecto,
          u.usuario AS asesor,
          un.nombre AS unidad,
          pr.nombre_completo AS prospecto
        FROM interaccion i
        LEFT JOIN proyecto p ON p.id = i.id_proyecto
        LEFT JOIN usuario u ON u.id = i.id_usuario
        LEFT JOIN unidad un ON un.id = i.id_unidad
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

      let whereClause = { id_rol: 3, estado_registro: 1 };

      if (rolIdNum === 1) {
        // Rol 1 (admin): ver todos los asesores de su empresa
        if (idEmpresa) {
          whereClause.id_empresa = idEmpresa;
        }
      } else if (rolIdNum === 2) {
        // Rol 2 (supervisor): ver solo asesores con id_padre = userId
        whereClause.id_padre = userId;
        if (idEmpresa) {
          whereClause.id_empresa = idEmpresa;
        }
      } else {
        // Otros roles no pueden ver asesores
        logger.info(`[leads.controller.js] getAsesores - Rol ${rolIdNum} no tiene permisos para ver asesores`);
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

      const updateData = { ...req.body };
      // Mapear id_estado a id_estado_prospecto si viene del frontend
      if (updateData.id_estado !== undefined) {
        updateData.id_estado_prospecto = updateData.id_estado;
        delete updateData.id_estado;
      }
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

  async getPerfilamiento(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await sequelize.query(`
        SELECT
          pp.pregunta,
          ppp.respuesta
        FROM prospecto_pregunta_perfilamiento ppp
        INNER JOIN pregunta_perfilamiento pp ON pp.id = ppp.id_pregunta
        WHERE ppp.id_prospecto = :id
        ORDER BY pp.orden ASC
      `, {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      });

      return res.status(200).json({ data: rows || [] });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al obtener perfilamiento: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener perfilamiento" });
    }
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

  async syncProjectsFromSperant(req, res) {
    try {
      const { userId, idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sync proyectos desde Sperant solicitado por usuario ${userId}`);

      const result = await sperantService.syncProjects(idEmpresa || null, userId);

      return res.status(200).json({
        msg: `Proyectos: ${result.projects.created} creados, ${result.projects.updated} actualizados. Tipologías: ${result.typologies.created} creadas, ${result.typologies.updated} actualizadas`,
        data: result
      });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al sincronizar proyectos desde Sperant: ${error.message}`);
      return res.status(500).json({ msg: "Error al sincronizar proyectos desde Sperant", debug: error.message });
    }
  }

  async syncUnitsFromSperant(req, res) {
    try {
      const { userId, idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sync unidades desde Sperant solicitado por usuario ${userId}`);

      const result = await sperantService.syncUnits(idEmpresa || null, userId);

      return res.status(200).json({
        msg: `Unidades: ${result.created} creadas, ${result.updated} actualizadas, ${result.errors} errores`,
        data: result
      });
    } catch (error) {
      logger.error(`[leads.controller.js] Error al sincronizar unidades desde Sperant: ${error.message}`);
      return res.status(500).json({ msg: "Error al sincronizar unidades desde Sperant", debug: error.message });
    }
  }

  async syncAllFromSperant(req, res) {
    try {
      const { userId, idEmpresa } = req.user || {};
      logger.info(`[leads.controller.js] Sync completo desde Sperant solicitado por usuario ${userId}`);

      const result = await sperantService.syncAll(idEmpresa || null, userId);

      return res.status(200).json({
        msg: `Sync completo: Clientes ${result.clients.created} creados/${result.clients.updated} actualizados, Proyectos ${result.projects.created} creados/${result.projects.updated} actualizados, Tipologías ${result.typologies.created} creadas/${result.typologies.updated} actualizadas, Unidades ${result.units.created} creadas/${result.units.updated} actualizadas`,
        data: result
      });
    } catch (error) {
      logger.error(`[leads.controller.js] Error en sync completo desde Sperant: ${error.message}`);
      return res.status(500).json({ msg: "Error en sync completo desde Sperant", debug: error.message });
    }
  }
}

module.exports = new LeadsController();
