const { sequelize, Chat, Mensaje, MensajeVisto, Prospecto } = require("../models/sequelize");
const { QueryTypes } = require("sequelize");
const logger = require('../config/logger/loggerClient.js');
const whatsappGraphService = require("../services/whatsapp/whatsappGraph.service.js");

const CONTACTS_PER_PAGE = 20;

class ConversacionController {

  /**
   * GET /contactos/:offset
   * Lista contactos (prospectos con chat) con último mensaje, no leídos, estado, tipificación
   */
  async getContactos(req, res) {
    try {
      const { idEmpresa, userId } = req.user || {};
      const offset = parseInt(req.params.offset) || 0;
      const { id_estado, id_tipificacion, id_tipificacion_asesor } = req.query;

      let filters = '';
      const replacements = { id_empresa: idEmpresa, limit: CONTACTS_PER_PAGE, offset, id_usuario: userId };

      if (id_estado) {
        filters += ' AND p.id_estado_prospecto = :id_estado';
        replacements.id_estado = id_estado;
      }
      if (id_tipificacion) {
        filters += ` AND EXISTS (
          SELECT 1 FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.id = :id_tipificacion AND t.estado_registro = 1
        )`;
        replacements.id_tipificacion = id_tipificacion;
      }
      if (id_tipificacion_asesor) {
        filters += ` AND EXISTS (
          SELECT 1 FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.id = :id_tipificacion_asesor AND t.estado_registro = 1
        )`;
        replacements.id_tipificacion_asesor = id_tipificacion_asesor;
      }

      // Contar total
      const [countResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM prospecto p
        INNER JOIN chat c ON c.id_prospecto = p.id AND c.estado_registro = 1
        LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
        WHERE p.id_empresa = :id_empresa
          AND p.estado_registro = 1
          ${filters}
      `, { replacements, type: QueryTypes.SELECT });

      const total = parseInt(countResult.total) || 0;

      // Listar contactos con último mensaje y no leídos
      const contactos = await sequelize.query(`
        SELECT
          p.id,
          p.nombre_completo,
          p.celular,
          p.dni,
          p.direccion,
          p.email,
          p.id_estado_prospecto as id_estado,
          p.id_usuario,
          p.id as id_prospecto,
          c.id as id_chat,
          c.bot_activo,
          ep.nombre as estado_nombre,
          ep.color as estado_color,
          ultimo_msg.fecha_hora as ultimo_mensaje,
          ultimo_msg.contenido as ultimo_mensaje_contenido,
          COALESCE(no_leidos.count, 0)::int as mensajes_no_leidos,
          last_tip.nombre as tipificacion_nombre,
          last_tip.color as tipificacion_color,
          last_tip.id as id_tipificacion_asesor
        FROM prospecto p
        INNER JOIN chat c ON c.id_prospecto = p.id AND c.estado_registro = 1
        LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
        LEFT JOIN LATERAL (
          SELECT m.fecha_hora, m.contenido
          FROM mensaje m
          WHERE m.id_chat = c.id AND m.estado_registro = 1
          ORDER BY m.fecha_hora DESC
          LIMIT 1
        ) ultimo_msg ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as count
          FROM mensaje m
          WHERE m.id_chat = c.id
            AND m.estado_registro = 1
            AND m.direccion = 'in'
            AND NOT EXISTS (
              SELECT 1 FROM mensaje_visto mv
              WHERE mv.id_mensaje = m.id
                AND mv.estado_registro = 1
            )
        ) no_leidos ON true
        LEFT JOIN LATERAL (
          SELECT t.id, t.nombre,
            CASE
              WHEN t.tipo IS NOT NULL THEN '#' || SUBSTRING(MD5(t.tipo), 1, 6)
              ELSE NULL
            END as color
          FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.estado_registro = 1
          ORDER BY t.fecha_registro DESC
          LIMIT 1
        ) last_tip ON true
        WHERE p.id_empresa = :id_empresa
          AND p.estado_registro = 1
          ${filters}
        ORDER BY ultimo_msg.fecha_hora DESC NULLS LAST
        LIMIT :limit OFFSET :offset
      `, { replacements, type: QueryTypes.SELECT });

      return res.status(200).json({ data: contactos, total });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al obtener contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener contactos", error: error.message });
    }
  }

  /**
   * GET /contactos/buscar/:query
   * Buscar contactos por nombre o celular
   */
  async buscarContactos(req, res) {
    try {
      const { idEmpresa, userId } = req.user || {};
      const query = req.params.query;
      const offset = parseInt(req.query.offset) || 0;
      const { id_estado, id_tipificacion, id_tipificacion_asesor } = req.query;

      let filters = '';
      const replacements = {
        id_empresa: idEmpresa,
        limit: CONTACTS_PER_PAGE,
        offset,
        id_usuario: userId,
        search: `%${query}%`
      };

      if (id_estado) {
        filters += ' AND p.id_estado_prospecto = :id_estado';
        replacements.id_estado = id_estado;
      }
      if (id_tipificacion) {
        filters += ` AND EXISTS (
          SELECT 1 FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.id = :id_tipificacion AND t.estado_registro = 1
        )`;
        replacements.id_tipificacion = id_tipificacion;
      }
      if (id_tipificacion_asesor) {
        filters += ` AND EXISTS (
          SELECT 1 FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.id = :id_tipificacion_asesor AND t.estado_registro = 1
        )`;
        replacements.id_tipificacion_asesor = id_tipificacion_asesor;
      }

      // Contar total
      const [countResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM prospecto p
        INNER JOIN chat c ON c.id_prospecto = p.id AND c.estado_registro = 1
        WHERE p.id_empresa = :id_empresa
          AND p.estado_registro = 1
          AND (p.nombre_completo ILIKE :search OR p.celular ILIKE :search)
          ${filters}
      `, { replacements, type: QueryTypes.SELECT });

      const total = parseInt(countResult.total) || 0;

      const contactos = await sequelize.query(`
        SELECT
          p.id,
          p.nombre_completo,
          p.celular,
          p.dni,
          p.direccion,
          p.email,
          p.id_estado_prospecto as id_estado,
          p.id_usuario,
          p.id as id_prospecto,
          c.id as id_chat,
          c.bot_activo,
          ep.nombre as estado_nombre,
          ep.color as estado_color,
          ultimo_msg.fecha_hora as ultimo_mensaje,
          ultimo_msg.contenido as ultimo_mensaje_contenido,
          COALESCE(no_leidos.count, 0)::int as mensajes_no_leidos,
          last_tip.nombre as tipificacion_nombre,
          last_tip.color as tipificacion_color,
          last_tip.id as id_tipificacion_asesor
        FROM prospecto p
        INNER JOIN chat c ON c.id_prospecto = p.id AND c.estado_registro = 1
        LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
        LEFT JOIN LATERAL (
          SELECT m.fecha_hora, m.contenido
          FROM mensaje m
          WHERE m.id_chat = c.id AND m.estado_registro = 1
          ORDER BY m.fecha_hora DESC
          LIMIT 1
        ) ultimo_msg ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as count
          FROM mensaje m
          WHERE m.id_chat = c.id
            AND m.estado_registro = 1
            AND m.direccion = 'in'
            AND NOT EXISTS (
              SELECT 1 FROM mensaje_visto mv
              WHERE mv.id_mensaje = m.id
                AND mv.estado_registro = 1
            )
        ) no_leidos ON true
        LEFT JOIN LATERAL (
          SELECT t.id, t.nombre,
            CASE
              WHEN t.tipo IS NOT NULL THEN '#' || SUBSTRING(MD5(t.tipo), 1, 6)
              ELSE NULL
            END as color
          FROM tipificacion t
          WHERE t.id_prospecto = p.id AND t.estado_registro = 1
          ORDER BY t.fecha_registro DESC
          LIMIT 1
        ) last_tip ON true
        WHERE p.id_empresa = :id_empresa
          AND p.estado_registro = 1
          AND (p.nombre_completo ILIKE :search OR p.celular ILIKE :search)
          ${filters}
        ORDER BY ultimo_msg.fecha_hora DESC NULLS LAST
        LIMIT :limit OFFSET :offset
      `, { replacements, type: QueryTypes.SELECT });

      return res.status(200).json({ data: contactos, total });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al buscar contactos: ${error.message}`);
      return res.status(500).json({ msg: "Error al buscar contactos", error: error.message });
    }
  }

  /**
   * GET /contacto/:id/mensajes
   * Obtener mensajes de un contacto (prospecto)
   */
  async getMensajes(req, res) {
    try {
      const prospectoId = req.params.id;

      const chat = await Chat.findOne({
        where: { id_prospecto: prospectoId, estado_registro: 1 }
      });

      if (!chat) {
        return res.status(200).json({ data: [] });
      }

      const mensajes = await Mensaje.findAll({
        where: { id_chat: chat.id, estado_registro: 1 },
        order: [['fecha_hora', 'ASC']],
        attributes: ['id', 'direccion', 'tipo_mensaje', 'contenido', 'contenido_archivo', 'fecha_hora', 'fecha_registro', 'id_usuario'],
        raw: true
      });

      return res.status(200).json({ data: mensajes });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al obtener mensajes: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener mensajes" });
    }
  }

  /**
   * POST /contacto/:id/mensajes
   * Enviar mensaje (crear mensaje saliente)
   */
  async enviarMensaje(req, res) {
    try {
      const prospectoId = req.params.id;
      const { contenido } = req.body;
      const userId = req.user?.userId || null;

      if (!contenido) {
        return res.status(400).json({ msg: "El contenido es requerido" });
      }

      // Buscar o crear chat
      let chat = await Chat.findOne({
        where: { id_prospecto: prospectoId, estado_registro: 1 }
      });

      if (!chat) {
        chat = await Chat.create({
          id_prospecto: prospectoId,
          usuario_registro: userId
        });
      }

      const mensaje = await Mensaje.create({
        id_chat: chat.id,
        direccion: 'out',
        tipo_mensaje: 'text',
        contenido,
        fecha_hora: new Date(),
        id_usuario: userId,
        usuario_registro: userId
      });

      // Enviar a WhatsApp
      const { idEmpresa } = req.user || {};
      const prospecto = await Prospecto.findByPk(prospectoId, { attributes: ['celular'] });

      logger.info(`[conversacion.controller.js] Enviar WA -> prospectoId: ${prospectoId}, celular: ${prospecto?.celular}, idEmpresa: ${idEmpresa}`);

      if (prospecto?.celular && idEmpresa) {
        try {
          const resultado = await whatsappGraphService.enviarMensajeTexto(idEmpresa, prospecto.celular, contenido);
          logger.info(`[conversacion.controller.js] WA resultado: ${JSON.stringify(resultado)}`);
          if (resultado?.wid_mensaje) {
            await Mensaje.update({ wid_mensaje: resultado.wid_mensaje }, { where: { id: mensaje.id } });
          }
        } catch (waError) {
          logger.error(`[conversacion.controller.js] Error al enviar a WhatsApp: ${waError.message}`);
        }
      } else {
        logger.warn(`[conversacion.controller.js] No se envió a WA: celular=${prospecto?.celular}, idEmpresa=${idEmpresa}`);
      }

      // Marcar prospecto como contactado
      await Prospecto.update(
        { fue_contactado: 1 },
        { where: { id: prospectoId, fue_contactado: 0 } }
      );

      return res.status(201).json({ msg: "Mensaje enviado", data: mensaje });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al enviar mensaje: ${error.message}`);
      return res.status(500).json({ msg: "Error al enviar mensaje" });
    }
  }

  /**
   * POST /contacto/:id/mark-read
   * Marcar mensajes como leídos
   */
  async markRead(req, res) {
    try {
      const prospectoId = req.params.id;
      const { idMensaje } = req.body;
      const userId = req.user?.userId || null;

      if (!idMensaje) {
        return res.status(400).json({ msg: "El idMensaje es requerido" });
      }

      // Buscar chat del prospecto
      const chat = await Chat.findOne({
        where: { id_prospecto: prospectoId, estado_registro: 1 }
      });

      if (!chat) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      // Obtener mensajes entrantes no leídos hasta el idMensaje
      // Solo incluir mensajes con más de 1 hora de antigüedad para evitar marcar conversaciones activas
      const mensajesNoLeidos = await sequelize.query(`
        SELECT m.id
        FROM mensaje m
        WHERE m.id_chat = :id_chat
          AND m.estado_registro = 1
          AND m.direccion = 'in'
          AND m.id <= :id_mensaje
          AND m.fecha_hora < NOW() - INTERVAL '1 hour'
          AND NOT EXISTS (
            SELECT 1 FROM mensaje_visto mv
            WHERE mv.id_mensaje = m.id
              AND mv.estado_registro = 1
          )
      `, {
        replacements: { id_chat: chat.id, id_mensaje: idMensaje },
        type: QueryTypes.SELECT
      });

      // Crear registros de visto para cada mensaje
      if (mensajesNoLeidos.length > 0) {
        const registros = mensajesNoLeidos.map(m => ({
          id_mensaje: m.id,
          fecha_visto: new Date(),
          usuario_registro: userId
        }));

        await MensajeVisto.bulkCreate(registros);
      }

      return res.status(200).json({ msg: "Mensajes marcados como leídos", count: mensajesNoLeidos.length });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al marcar como leído: ${error.message}`);
      return res.status(500).json({ msg: "Error al marcar como leído" });
    }
  }

  /**
   * PATCH /contacto/:id/toggle-bot
   * Activar/desactivar bot para un contacto
   */
  async toggleBot(req, res) {
    try {
      const prospectoId = req.params.id;
      const userId = req.user?.userId || null;

      const chat = await Chat.findOne({
        where: { id_prospecto: prospectoId, estado_registro: 1 }
      });

      if (!chat) {
        return res.status(404).json({ msg: "Chat no encontrado" });
      }

      const newBotActivo = chat.bot_activo === 1 ? 0 : 1;

      await Chat.update(
        { bot_activo: newBotActivo, usuario_actualizacion: userId },
        { where: { id: chat.id } }
      );

      return res.status(200).json({ msg: "Bot actualizado", data: { bot_activo: newBotActivo } });
    } catch (error) {
      logger.error(`[conversacion.controller.js] Error al toggle bot: ${error.message}`);
      return res.status(500).json({ msg: "Error al cambiar estado del bot" });
    }
  }
}

module.exports = new ConversacionController();
