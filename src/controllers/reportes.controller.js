const { sequelize } = require("../models/sequelize/index.js");
const { QueryTypes } = require("sequelize");
const logger = require('../config/logger/loggerClient.js');

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function fechaLabelEs(fechaStr) {
  const d = new Date(fechaStr);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${dia} ${MESES_CORTO[d.getUTCMonth()]}`;
}

function mesLabelEs(fechaStr) {
  const d = new Date(fechaStr);
  return `${MESES_LARGO[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

class ReportesCrmController {
  async getFunnelData(req, res) {
    try {
      const { dateFrom, dateTo, idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';
      let dateFilter = '';

      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      if (dateFrom && dateTo) {
        dateFilter = "AND p.fecha_registro >= :dateFrom AND p.fecha_registro <= :dateTo";
        replacements.dateFrom = dateFrom + ' 00:00:00';
        replacements.dateTo = dateTo + ' 23:59:59';
      } else if (dateFrom) {
        dateFilter = "AND p.fecha_registro >= :dateFrom";
        replacements.dateFrom = dateFrom + ' 00:00:00';
      } else if (dateTo) {
        dateFilter = "AND p.fecha_registro <= :dateTo";
        replacements.dateTo = dateTo + ' 23:59:59';
      }

      const [totalResult, contactadosResult, interesadosResult] = await Promise.all([
        // 1. Total de leads
        sequelize.query(`
          SELECT COUNT(*) as total FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter} ${dateFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 2. Contactados (fue_contactado = 1)
        sequelize.query(`
          SELECT COUNT(*) as total FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter} ${dateFilter}
          AND p.fue_contactado = 1
        `, { replacements, type: QueryTypes.SELECT }),

        // 3. Interesados (calificacion_lead tibio o caliente)
        sequelize.query(`
          SELECT COUNT(*) as total FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter} ${dateFilter}
          AND p.calificacion_lead IN ('tibio', 'caliente')
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      const totalLeads = parseInt(totalResult[0]?.total || 0);
      const contactados = parseInt(contactadosResult[0]?.total || 0);
      const interesados = parseInt(interesadosResult[0]?.total || 0);

      const funnelData = {
        totalLeads: {
          nombre: 'Total Leads',
          valor: totalLeads,
          porcentaje: 100
        },
        contactados: {
          nombre: 'Contactados',
          valor: contactados,
          porcentaje: totalLeads > 0 ? Math.round((contactados / totalLeads) * 100) : 0
        },
        interesados: {
          nombre: 'Interesados',
          valor: interesados,
          porcentaje: totalLeads > 0 ? Math.round((interesados / totalLeads) * 100) : 0
        }
      };

      return res.status(200).json({ data: funnelData });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener datos del embudo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos del embudo" });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';

      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      const [totalLeadsResult, interesadosResult, leadsSemanaResult, contactadosResult, pipelineResult] = await Promise.all([
        // 1. Total de leads
        sequelize.query(`
          SELECT COUNT(*) as total
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 2. Interesados (calificacion_lead tibio o caliente)
        sequelize.query(`
          SELECT COUNT(*) as total
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter}
          AND p.calificacion_lead IN ('tibio', 'caliente')
        `, { replacements, type: QueryTypes.SELECT }),

        // 3. Leads nuevos esta semana
        sequelize.query(`
          SELECT COUNT(*) as total
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter}
          AND p.fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
        `, { replacements, type: QueryTypes.SELECT }),

        // 4. Contactados (fue_contactado = 1)
        sequelize.query(`
          SELECT COUNT(*) as total
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter}
          AND p.fue_contactado = 1
        `, { replacements, type: QueryTypes.SELECT }),

        // 5. Pipeline por estado_prospecto
        sequelize.query(`
          SELECT ep.nombre, ep.color, COUNT(p.id) as total
          FROM estado_prospecto ep
          LEFT JOIN prospecto p ON p.id_estado_prospecto = ep.id AND p.estado_registro = 1
            ${idEmpresa ? 'AND p.id_empresa = :idEmpresa' : ''}
          WHERE ep.estado_registro = 1
            ${idEmpresa ? 'AND ep.id_empresa = :idEmpresa' : ''}
          GROUP BY ep.id, ep.nombre, ep.color, ep.orden
          ORDER BY ep.orden
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      const totalLeads = parseInt(totalLeadsResult[0]?.total || 0);
      const interesados = parseInt(interesadosResult[0]?.total || 0);
      const leadsSemana = parseInt(leadsSemanaResult[0]?.total || 0);
      const contactados = parseInt(contactadosResult[0]?.total || 0);
      const tasaConversion = totalLeads > 0 ? Math.round((interesados / totalLeads) * 100) : 0;

      const dashboardStats = {
        totalLeads,
        interesados,
        leadsSemana,
        contactados,
        tasaConversion,
        pipeline: pipelineResult
      };

      return res.status(200).json({ data: dashboardStats });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener estadisticas del dashboard: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener estadisticas del dashboard" });
    }
  }

  async getWhatsappDashboard(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};

      let empresaFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      // CTE: chats validos = chats que tienen al menos 1 mensaje con id_plantilla_whatsapp
      const chatValidoCTE = `
        WITH chats_validos AS (
          SELECT DISTINCT m.id_chat
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE m.id_plantilla_whatsapp IS NOT NULL
          AND m.estado_registro = 1
          ${empresaFilter}
        )
      `;

      // 1. Total conversaciones activas (chats validos)
      const [totalChatsResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(*) as total FROM chats_validos
      `, { replacements, type: QueryTypes.SELECT });
      const totalChats = parseInt(totalChatsResult?.total || 0);

      // 2. Mensajes enviados (salida) en chats validos
      const [enviadosResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(*) as total
        FROM mensaje m
        INNER JOIN chats_validos cv ON cv.id_chat = m.id_chat
        WHERE m.estado_registro = 1 AND m.direccion = 'out'
      `, { replacements, type: QueryTypes.SELECT });
      const mensajesEnviados = parseInt(enviadosResult?.total || 0);

      // 3. Mensajes recibidos (entrada) en chats validos
      const [recibidosResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(*) as total
        FROM mensaje m
        INNER JOIN chats_validos cv ON cv.id_chat = m.id_chat
        WHERE m.estado_registro = 1 AND m.direccion = 'in'
      `, { replacements, type: QueryTypes.SELECT });
      const mensajesRecibidos = parseInt(recibidosResult?.total || 0);

      // 4. Tasa de respuesta: chats validos que tienen al menos 1 mensaje de entrada / total chats validos
      const [chatsConRespuestaResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(DISTINCT m.id_chat) as total
        FROM mensaje m
        INNER JOIN chats_validos cv ON cv.id_chat = m.id_chat
        WHERE m.estado_registro = 1 AND m.direccion = 'in'
      `, { replacements, type: QueryTypes.SELECT });
      const chatsConRespuesta = parseInt(chatsConRespuestaResult?.total || 0);
      const tasaRespuesta = totalChats > 0 ? Math.round((chatsConRespuesta / totalChats) * 100) : 0;

      // 5. Leads nuevos esta semana (chats validos creados en ultimos 7 dias)
      const [leadsSemanaResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(*) as total
        FROM chats_validos cv
        INNER JOIN chat c ON c.id = cv.id_chat
        WHERE c.fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
      `, { replacements, type: QueryTypes.SELECT });
      const leadsSemana = parseInt(leadsSemanaResult?.total || 0);

      // 6. Pipeline por estado_prospecto (solo prospectos con chats validos)
      const pipelineResult = await sequelize.query(`
        ${chatValidoCTE}
        SELECT ep.id, ep.nombre, ep.color, COUNT(DISTINCT p.id) as total
        FROM estado_prospecto ep
        LEFT JOIN prospecto p ON p.id_estado_prospecto = ep.id
          AND p.estado_registro = 1
          ${empresaFilter}
          AND EXISTS (
            SELECT 1 FROM chat c
            INNER JOIN chats_validos cv ON cv.id_chat = c.id
            WHERE c.id_prospecto = p.id
          )
        WHERE ep.estado_registro = 1
        ${idEmpresa ? 'AND ep.id_empresa = :idEmpresa' : ''}
        GROUP BY ep.id, ep.nombre, ep.color
        ORDER BY ep.orden
      `, { replacements, type: QueryTypes.SELECT });

      // 7. Conversaciones recientes (ultimos 4 chats validos con info)
      const conversacionesRecientes = await sequelize.query(`
        ${chatValidoCTE}
        SELECT
          c.id as chat_id,
          p.nombre_completo,
          p.celular,
          ep.nombre as estado,
          ep.color as estado_color,
          ultimo_msg.contenido as ultimo_mensaje,
          ultimo_msg.fecha_hora as ultima_fecha,
          ultimo_msg.direccion as ultima_direccion
        FROM chats_validos cv
        INNER JOIN chat c ON c.id = cv.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
        LEFT JOIN LATERAL (
          SELECT m.contenido, m.fecha_hora, m.direccion
          FROM mensaje m
          WHERE m.id_chat = c.id AND m.estado_registro = 1
          ORDER BY m.fecha_hora DESC
          LIMIT 1
        ) ultimo_msg ON true
        WHERE p.estado_registro = 1
        ${empresaFilter}
        ORDER BY ultimo_msg.fecha_hora DESC NULLS LAST
        LIMIT 4
      `, { replacements, type: QueryTypes.SELECT });

      // 8. Evolucion de mensajes por dia (ultimos 7 dias) en chats validos
      const evolucionDiaria = await sequelize.query(`
        ${chatValidoCTE}
        SELECT
          TO_CHAR(m.fecha_hora, 'DD Mon') as fecha,
          COUNT(*) FILTER (WHERE m.direccion = 'out') as enviados,
          COUNT(*) FILTER (WHERE m.direccion = 'in') as respondidos
        FROM mensaje m
        INNER JOIN chats_validos cv ON cv.id_chat = m.id_chat
        WHERE m.estado_registro = 1
        AND m.fecha_hora >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(m.fecha_hora), TO_CHAR(m.fecha_hora, 'DD Mon')
        ORDER BY DATE(m.fecha_hora)
      `, { replacements, type: QueryTypes.SELECT });

      // 9. Rendimiento por plantilla (top 5 plantillas con mas mensajes)
      const rendimientoPlantillas = await sequelize.query(`
        SELECT
          pw.name as nombre,
          COUNT(m.id) as enviados,
          COUNT(m.id) FILTER (WHERE EXISTS (
            SELECT 1 FROM mensaje m2
            WHERE m2.id_chat = m.id_chat AND m2.direccion = 'in' AND m2.estado_registro = 1
            AND m2.fecha_hora > m.fecha_hora
          )) as respondidos
        FROM plantilla_whatsapp pw
        INNER JOIN mensaje m ON m.id_plantilla_whatsapp = pw.id AND m.estado_registro = 1
        INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
        INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
        WHERE pw.estado_registro = 1
        ${idEmpresa ? 'AND pw.id_empresa = :idEmpresa' : ''}
        GROUP BY pw.id, pw.name
        ORDER BY enviados DESC
        LIMIT 5
      `, { replacements, type: QueryTypes.SELECT });

      // 10. Campanas recientes con stats
      const campanasRecientes = await sequelize.query(`
        SELECT
          ca.id,
          ca.nombre,
          CASE
            WHEN ce.fecha_fin IS NOT NULL THEN 'FINALIZADA'
            WHEN ce.fecha_inicio IS NOT NULL AND ce.fecha_fin IS NULL THEN 'ACTIVA'
            WHEN ce.fecha_programada >= NOW() THEN 'PROGRAMADA'
            ELSE 'PENDIENTE'
          END as estado,
          (SELECT COUNT(*) FROM campania_prospectos cp WHERE cp.id_campania = ca.id AND cp.estado_registro = 1) as enviados
        FROM campania ca
        INNER JOIN campania_ejecucion ce ON ce.id_campania = ca.id AND ce.estado_registro = 1
        WHERE ca.estado_registro = 1
        AND ca.id_plantilla_whatsapp IS NOT NULL
        ${idEmpresa ? 'AND ca.id_empresa = :idEmpresa' : ''}
        ORDER BY ce.fecha_programada DESC
        LIMIT 4
      `, { replacements, type: QueryTypes.SELECT });

      // 11. Plantillas activas count
      const [plantillasActivasResult] = await sequelize.query(`
        SELECT COUNT(*) as total
        FROM plantilla_whatsapp
        WHERE estado_registro = 1
        ${idEmpresa ? 'AND id_empresa = :idEmpresa' : ''}
      `, { replacements, type: QueryTypes.SELECT });
      const plantillasActivas = parseInt(plantillasActivasResult?.total || 0);

      // 12. Campanas en curso count
      const [campanasEnCursoResult] = await sequelize.query(`
        SELECT COUNT(DISTINCT ca.id) as total
        FROM campania ca
        INNER JOIN campania_ejecucion ce ON ce.id_campania = ca.id AND ce.estado_registro = 1
        WHERE ca.estado_registro = 1
        AND ca.id_plantilla_whatsapp IS NOT NULL
        AND ce.fecha_inicio IS NOT NULL AND ce.fecha_fin IS NULL
        ${idEmpresa ? 'AND ca.id_empresa = :idEmpresa' : ''}
      `, { replacements, type: QueryTypes.SELECT });
      const campanasEnCurso = parseInt(campanasEnCursoResult?.total || 0);

      // 13. Contactos alcanzados (prospectos unicos en chats validos)
      const [contactosResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT COUNT(DISTINCT p.id) as total
        FROM chats_validos cv
        INNER JOIN chat c ON c.id = cv.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
      `, { replacements, type: QueryTypes.SELECT });
      const contactosAlcanzados = parseInt(contactosResult?.total || 0);

      // 14. Tiempo promedio de respuesta (diferencia entre msg out y primera respuesta in)
      const [tiempoPromedioResult] = await sequelize.query(`
        ${chatValidoCTE}
        SELECT AVG(tiempo_respuesta) as promedio_minutos
        FROM (
          SELECT
            m_out.id_chat,
            m_out.fecha_hora as fecha_out,
            MIN(m_in.fecha_hora) as fecha_in,
            EXTRACT(EPOCH FROM (MIN(m_in.fecha_hora) - m_out.fecha_hora)) / 60 as tiempo_respuesta
          FROM mensaje m_out
          INNER JOIN chats_validos cv ON cv.id_chat = m_out.id_chat
          INNER JOIN mensaje m_in ON m_in.id_chat = m_out.id_chat
            AND m_in.direccion = 'in'
            AND m_in.estado_registro = 1
            AND m_in.fecha_hora > m_out.fecha_hora
          WHERE m_out.direccion = 'out'
          AND m_out.estado_registro = 1
          GROUP BY m_out.id, m_out.id_chat, m_out.fecha_hora
        ) sub
        WHERE tiempo_respuesta > 0
      `, { replacements, type: QueryTypes.SELECT });

      const promedioMinutos = parseFloat(tiempoPromedioResult?.promedio_minutos || 0);
      let tiempoPromedioRespuesta = '-';
      if (promedioMinutos > 0) {
        const horas = Math.floor(promedioMinutos / 60);
        const minutos = Math.round(promedioMinutos % 60);
        tiempoPromedioRespuesta = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
      }

      const data = {
        totalChats,
        mensajesEnviados,
        mensajesRecibidos,
        tasaRespuesta,
        leadsSemana,
        pipeline: pipelineResult,
        conversacionesRecientes,
        evolucionDiaria,
        rendimientoPlantillas: rendimientoPlantillas.map(rp => ({
          ...rp,
          enviados: parseInt(rp.enviados || 0),
          respondidos: parseInt(rp.respondidos || 0),
          tasa: parseInt(rp.enviados) > 0 ? Math.round((parseInt(rp.respondidos) / parseInt(rp.enviados)) * 100 * 10) / 10 : 0
        })),
        campanasRecientes: campanasRecientes.map(c => ({
          ...c,
          enviados: parseInt(c.enviados || 0)
        })),
        plantillasActivas,
        campanasEnCurso,
        contactosAlcanzados,
        tiempoPromedioRespuesta
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener dashboard WhatsApp: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener dashboard de WhatsApp" });
    }
  }

  async getResumen(req, res) {
    try {
      const { idEmpresa, dateFrom, dateTo } = req.query;
      const replacements = {};

      let empresaFilter = '';
      let dateFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }
      if (dateFrom && dateTo) {
        dateFilter = 'AND p.fecha_registro >= :dateFrom AND p.fecha_registro <= :dateTo';
        replacements.dateFrom = dateFrom + ' 00:00:00';
        replacements.dateTo = dateTo + ' 23:59:59';
      } else if (dateFrom) {
        dateFilter = 'AND p.fecha_registro >= :dateFrom';
        replacements.dateFrom = dateFrom + ' 00:00:00';
      } else if (dateTo) {
        dateFilter = 'AND p.fecha_registro <= :dateTo';
        replacements.dateTo = dateTo + ' 23:59:59';
      }

      // Ejecutar todas las queries en paralelo
      const [
        kpisResult,
        funnelResult,
        citadosResult,
        scoringResult,
        abandonadosResult,
        utilidadResult,
        asistenciaResult,
        tipoConvResult,
        heatmapSemanaResult,
        heatmapMesResult,
        heatmapAnioResult,
        evoFunnelResult,
        evoScoringResult,
        evoAbandonoResult,
        evoUtilidadResult,
        evoAsistenciaResult,
        evoTipoConvResult,
        kpisMesAnteriorResult
      ] = await Promise.all([
        // 1. KPIs: total leads + contactados (flag) + interesados (tibio/caliente)
        sequelize.query(`
          SELECT
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE p.fue_contactado = 1) as contactados,
            COUNT(*) FILTER (WHERE p.calificacion_lead IN ('tibio', 'caliente')) as interesados
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter} ${dateFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 2. Embudo por estado_prospecto
        sequelize.query(`
          SELECT ep.nombre, ep.color, ep.orden, COUNT(p.id) as total
          FROM estado_prospecto ep
          LEFT JOIN prospecto p ON p.id_estado_prospecto = ep.id
            AND p.estado_registro = 1
            ${empresaFilter} ${dateFilter}
          WHERE ep.estado_registro = 1
            ${idEmpresa ? 'AND ep.id_empresa = :idEmpresa' : ''}
          GROUP BY ep.id, ep.nombre, ep.color, ep.orden
          ORDER BY ep.orden
        `, { replacements, type: QueryTypes.SELECT }),

        // 3. Citados (prospectos con al menos una cita)
        sequelize.query(`
          SELECT COUNT(DISTINCT c.id_prospecto) as total
          FROM cita c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE c.estado_registro = 1
          ${empresaFilter} ${dateFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 4. Lead scoring por calificacion_lead
        sequelize.query(`
          SELECT
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'frio' OR p.calificacion_lead IS NULL) as frio,
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'tibio') as tibio,
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'caliente') as caliente
          FROM prospecto p
          WHERE p.estado_registro = 1 ${empresaFilter} ${dateFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 5. Conversaciones abandonadas
        sequelize.query(`
          SELECT
            COUNT(*) as total_chats,
            COUNT(*) FILTER (WHERE sub.ultimo_dir = 'out' AND sub.edad > INTERVAL '24 hours') as abandonados,
            COUNT(*) FILTER (WHERE sub.ultimo_dir = 'in' OR (sub.ultimo_dir = 'out' AND sub.edad <= INTERVAL '24 hours')) as activos
          FROM (
            SELECT c.id,
              ultimo.direccion as ultimo_dir,
              NOW() - ultimo.fecha_hora as edad
            FROM chat c
            INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
            LEFT JOIN LATERAL (
              SELECT m.direccion, m.fecha_hora
              FROM mensaje m
              WHERE m.id_chat = c.id AND m.estado_registro = 1
              ORDER BY m.fecha_hora DESC
              LIMIT 1
            ) ultimo ON true
            WHERE c.estado_registro = 1
            ${empresaFilter}
            AND ultimo.fecha_hora IS NOT NULL
          ) sub
        `, { replacements, type: QueryTypes.SELECT }),

        // 6. Utilidad de información
        sequelize.query(`
          SELECT
            COUNT(*) FILTER (WHERE i.satisfactorio = 1) as si,
            COUNT(*) FILTER (WHERE i.satisfactorio = 0) as no,
            COUNT(*) FILTER (WHERE i.satisfactorio IS NULL) as no_responde,
            COUNT(*) as total
          FROM interaccion i
          INNER JOIN prospecto p ON p.id = i.id_prospecto AND p.estado_registro = 1
          WHERE i.estado_registro = 1
          ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 7. Asistencia humana
        sequelize.query(`
          SELECT
            COUNT(*) FILTER (WHERE c.bot_activo = 0) as con_humano,
            COUNT(*) FILTER (WHERE c.bot_activo = 1) as solo_bot,
            COUNT(*) as total
          FROM chat c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE c.estado_registro = 1
          ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 8. Tipo de conversación
        sequelize.query(`
          SELECT COALESCE(t.tipo, 'Otros') as tipo, COUNT(*) as total
          FROM tipificacion t
          INNER JOIN prospecto p ON p.id = t.id_prospecto AND p.estado_registro = 1
          WHERE t.estado_registro = 1
          ${empresaFilter}
          GROUP BY t.tipo
          ORDER BY total DESC
        `, { replacements, type: QueryTypes.SELECT }),

        // 9. Heatmap semana (últimos 7 días)
        sequelize.query(`
          SELECT
            EXTRACT(DOW FROM m.fecha_hora)::int as dia,
            EXTRACT(HOUR FROM m.fecha_hora)::int as hora,
            COUNT(*) as total
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE m.estado_registro = 1
            AND m.direccion = 'in'
            ${empresaFilter}
            AND m.fecha_hora >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY dia, hora
          ORDER BY dia, hora
        `, { replacements, type: QueryTypes.SELECT }),

        // 10. Heatmap mes (últimos 31 días)
        sequelize.query(`
          SELECT
            EXTRACT(DAY FROM m.fecha_hora)::int as dia,
            EXTRACT(HOUR FROM m.fecha_hora)::int as hora,
            COUNT(*) as total
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE m.estado_registro = 1
            AND m.direccion = 'in'
            ${empresaFilter}
            AND m.fecha_hora >= CURRENT_DATE - INTERVAL '31 days'
          GROUP BY dia, hora
          ORDER BY dia, hora
        `, { replacements, type: QueryTypes.SELECT }),

        // 11. Heatmap año (últimos 12 meses)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM m.fecha_hora)::int as mes,
            EXTRACT(HOUR FROM m.fecha_hora)::int as hora,
            COUNT(*) as total
          FROM mensaje m
          INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE m.estado_registro = 1
            AND m.direccion = 'in'
            ${empresaFilter}
            AND m.fecha_hora >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY mes, hora
          ORDER BY mes, hora
        `, { replacements, type: QueryTypes.SELECT }),

        // 12. Evolución embudo (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM p.fecha_registro)::int as num_mes,
            TO_CHAR(p.fecha_registro, 'Mon') as mes,
            ep.nombre,
            COUNT(p.id) as total
          FROM prospecto p
          INNER JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto AND ep.estado_registro = 1
          WHERE p.estado_registro = 1
            ${empresaFilter}
            AND p.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes, ep.nombre
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 13. Evolución scoring (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM p.fecha_registro)::int as num_mes,
            TO_CHAR(p.fecha_registro, 'Mon') as mes,
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'frio' OR p.calificacion_lead IS NULL) as frio,
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'tibio') as tibio,
            COUNT(*) FILTER (WHERE p.calificacion_lead = 'caliente') as caliente
          FROM prospecto p
          WHERE p.estado_registro = 1
            ${empresaFilter}
            AND p.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 14. Evolución abandonos (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM c.fecha_registro)::int as num_mes,
            TO_CHAR(c.fecha_registro, 'Mon') as mes,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ultimo.direccion = 'out' AND NOW() - ultimo.fecha_hora > INTERVAL '24 hours') as abandonados,
            COUNT(*) FILTER (WHERE ultimo.direccion = 'in' OR (ultimo.direccion = 'out' AND NOW() - ultimo.fecha_hora <= INTERVAL '24 hours')) as activos
          FROM chat c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          LEFT JOIN LATERAL (
            SELECT m.direccion, m.fecha_hora
            FROM mensaje m
            WHERE m.id_chat = c.id AND m.estado_registro = 1
            ORDER BY m.fecha_hora DESC
            LIMIT 1
          ) ultimo ON true
          WHERE c.estado_registro = 1
            ${empresaFilter}
            AND c.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
            AND ultimo.fecha_hora IS NOT NULL
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 15. Evolución utilidad (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM i.fecha_registro)::int as num_mes,
            TO_CHAR(i.fecha_registro, 'Mon') as mes,
            COUNT(*) FILTER (WHERE i.satisfactorio = 1) as si,
            COUNT(*) FILTER (WHERE i.satisfactorio = 0) as no,
            COUNT(*) FILTER (WHERE i.satisfactorio IS NULL) as no_responde
          FROM interaccion i
          INNER JOIN prospecto p ON p.id = i.id_prospecto AND p.estado_registro = 1
          WHERE i.estado_registro = 1
            ${empresaFilter}
            AND i.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 16. Evolución asistencia humana (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM c.fecha_registro)::int as num_mes,
            TO_CHAR(c.fecha_registro, 'Mon') as mes,
            COUNT(*) FILTER (WHERE c.bot_activo = 0) as con_humano,
            COUNT(*) FILTER (WHERE c.bot_activo = 1) as solo_bot
          FROM chat c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE c.estado_registro = 1
            ${empresaFilter}
            AND c.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 17. Evolución tipo conversación (por mes, año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM t.fecha_registro)::int as num_mes,
            TO_CHAR(t.fecha_registro, 'Mon') as mes,
            COALESCE(t.tipo, 'Otros') as tipo,
            COUNT(*) as total
          FROM tipificacion t
          INNER JOIN prospecto p ON p.id = t.id_prospecto AND p.estado_registro = 1
          WHERE t.estado_registro = 1
            ${empresaFilter}
            AND t.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes, t.tipo
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 18. KPIs mes anterior (para calcular % cambio)
        sequelize.query(`
          SELECT
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE p.fue_contactado = 1) as contactados,
            COUNT(*) FILTER (WHERE p.calificacion_lead IN ('tibio', 'caliente')) as interesados
          FROM prospecto p
          WHERE p.estado_registro = 1
            ${empresaFilter}
            AND p.fecha_registro >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
            AND p.fecha_registro < DATE_TRUNC('month', CURRENT_DATE)
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      // --- Procesar resultados ---

      // KPIs
      const kpis = kpisResult[0] || {};
      const totalLeads = parseInt(kpis.total_leads || 0);
      const contactados = parseInt(kpis.contactados || 0);
      const interesados = parseInt(kpis.interesados || 0);

      // KPIs mes anterior
      const kpisPrev = kpisMesAnteriorResult[0] || {};
      const prevLeads = parseInt(kpisPrev.total_leads || 0);
      const prevContactados = parseInt(kpisPrev.contactados || 0);
      const prevInteresados = parseInt(kpisPrev.interesados || 0);

      const calcCambio = (actual, anterior) => {
        if (anterior === 0) return actual > 0 ? '+100%' : '0%';
        const diff = ((actual - anterior) / anterior * 100).toFixed(1);
        return diff > 0 ? `+${diff}%` : `${diff}%`;
      };

      // Funnel: construir array con total leads + estados + citados
      const funnelTotalLeads = funnelResult.reduce((sum, r) => sum + parseInt(r.total || 0), 0);
      const citados = parseInt(citadosResult[0]?.total || 0);
      const funnel = funnelResult.map(r => ({
        nombre: r.nombre,
        color: r.color,
        total: parseInt(r.total || 0),
        porcentaje: funnelTotalLeads > 0 ? Math.round((parseInt(r.total || 0) / funnelTotalLeads) * 100) + '%' : '0%'
      }));

      // Scoring
      const scoring = scoringResult[0] || {};
      const totalScoring = parseInt(scoring.frio || 0) + parseInt(scoring.tibio || 0) + parseInt(scoring.caliente || 0);

      // Abandonados
      const aband = abandonadosResult[0] || {};

      // Utilidad
      const util = utilidadResult[0] || {};
      const totalUtil = parseInt(util.total || 0);

      // Asistencia
      const asist = asistenciaResult[0] || {};
      const totalAsist = parseInt(asist.total || 0);

      // Tipo conversación - tomar los top 4 y agrupar el resto en "Otros"
      const topTipos = tipoConvResult.slice(0, 4);

      // Evolución funnel: pivotar de filas a formato [{mes, Estado1: X, Estado2: Y}]
      const evoFunnelMap = {};
      evoFunnelResult.forEach(r => {
        if (!evoFunnelMap[r.num_mes]) evoFunnelMap[r.num_mes] = { mes: r.mes.trim() };
        evoFunnelMap[r.num_mes][r.nombre] = parseInt(r.total || 0);
      });

      // Evolución tipo conversación: pivotar
      const evoTipoMap = {};
      evoTipoConvResult.forEach(r => {
        if (!evoTipoMap[r.num_mes]) evoTipoMap[r.num_mes] = { mes: r.mes.trim() };
        evoTipoMap[r.num_mes][r.tipo || 'Otros'] = parseInt(r.total || 0);
      });

      // Conversión: interesados (tibio+caliente) / total leads
      const conversion = totalLeads > 0 ? Math.round((interesados / totalLeads) * 100 * 10) / 10 : 0;

      const data = {
        kpis: {
          totalLeads,
          contactados,
          interesados,
          conversion,
          cambioLeads: calcCambio(totalLeads, prevLeads),
          cambioContactados: calcCambio(contactados, prevContactados),
          cambioInteresados: calcCambio(interesados, prevInteresados),
        },
        funnel,
        citados,
        scoring: {
          frio: totalScoring > 0 ? Math.round(parseInt(scoring.frio || 0) / totalScoring * 100) : 0,
          tibio: totalScoring > 0 ? Math.round(parseInt(scoring.tibio || 0) / totalScoring * 100) : 0,
          caliente: totalScoring > 0 ? Math.round(parseInt(scoring.caliente || 0) / totalScoring * 100) : 0,
        },
        abandonados: {
          total: parseInt(aband.total_chats || 0),
          abandonados: parseInt(aband.abandonados || 0),
          activos: parseInt(aband.activos || 0),
        },
        utilidad: {
          si: totalUtil > 0 ? Math.round(parseInt(util.si || 0) / totalUtil * 100) : 0,
          no: totalUtil > 0 ? Math.round(parseInt(util.no || 0) / totalUtil * 100) : 0,
          noResponde: totalUtil > 0 ? Math.round(parseInt(util.no_responde || 0) / totalUtil * 100) : 0,
        },
        asistencia: {
          conHumano: totalAsist > 0 ? Math.round(parseInt(asist.con_humano || 0) / totalAsist * 100) : 0,
          soloBot: totalAsist > 0 ? Math.round(parseInt(asist.solo_bot || 0) / totalAsist * 100) : 0,
        },
        tipoConversacion: topTipos.map(t => ({
          tipo: t.tipo,
          total: parseInt(t.total || 0),
        })),
        heatmap: {
          semana: heatmapSemanaResult.map(h => ({ dia: parseInt(h.dia), hora: parseInt(h.hora), total: parseInt(h.total) })),
          mes: heatmapMesResult.map(h => ({ dia: parseInt(h.dia), hora: parseInt(h.hora), total: parseInt(h.total) })),
          anio: heatmapAnioResult.map(h => ({ mes: parseInt(h.mes), hora: parseInt(h.hora), total: parseInt(h.total) })),
        },
        evolucion: {
          funnel: Object.values(evoFunnelMap),
          scoring: evoScoringResult.map(r => ({
            mes: r.mes.trim(),
            Frío: parseInt(r.frio || 0),
            Tibio: parseInt(r.tibio || 0),
            Caliente: parseInt(r.caliente || 0),
          })),
          abandonados: evoAbandonoResult.map(r => ({
            mes: r.mes.trim(),
            Total: parseInt(r.total || 0),
            Abandonos: parseInt(r.abandonados || 0),
            Activos: parseInt(r.activos || 0),
          })),
          utilidad: evoUtilidadResult.map(r => ({
            mes: r.mes.trim(),
            'Sí': parseInt(r.si || 0),
            No: parseInt(r.no || 0),
            'No responde': parseInt(r.no_responde || 0),
          })),
          asistencia: evoAsistenciaResult.map(r => ({
            mes: r.mes.trim(),
            'Sí': parseInt(r.con_humano || 0),
            No: parseInt(r.solo_bot || 0),
          })),
          tipoConversacion: Object.values(evoTipoMap),
        },
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener resumen: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos del resumen" });
    }
  }

  async getWhatsappCampanas(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};

      let empresaFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND ca.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      // Campanas con stats reales
      const campanas = await sequelize.query(`
        SELECT
          ca.id,
          ca.nombre,
          ca.descripcion,
          ca.id_plantilla_whatsapp,
          ca.id_plantilla,
          ca.id_estado_campania,
          pw.name as plantilla_whatsapp_nombre,
          pi2.nombre as plantilla_ia_nombre,
          ca.fecha_registro as created_at,
          -- Estado desde tabla estado_campania
          COALESCE(ec.nombre, 'Sin estado') as estado,
          ec.color as estado_color,
          -- Fechas de la ultima ejecucion
          ce.fecha_programada,
          ce.fecha_inicio,
          ce.fecha_fin,
          -- Stats: total prospectos en ejecuciones de esta campana
          COALESCE(stats.total_enviados, 0) as enviados,
          -- Stats: entregados (prospectos que tienen chat con al menos 1 mensaje out)
          COALESCE(stats.total_entregados, 0) as entregados
        FROM campania ca
        LEFT JOIN plantilla_whatsapp pw ON pw.id = ca.id_plantilla_whatsapp
        LEFT JOIN plantilla pi2 ON pi2.id = ca.id_plantilla
        LEFT JOIN estado_campania ec ON ec.id = ca.id_estado_campania
        LEFT JOIN LATERAL (
          SELECT ce2.*
          FROM campania_ejecucion ce2
          WHERE ce2.id_campania = ca.id AND ce2.estado_registro = 1
          ORDER BY ce2.fecha_registro DESC
          LIMIT 1
        ) ce ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(DISTINCT cp.id_prospecto) as total_enviados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1 AND m.direccion = 'out'
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
              ) THEN cp.id_prospecto
            END) as total_entregados
          FROM campania_prospectos cp
          WHERE cp.id_campania = ca.id AND cp.estado_registro = 1
        ) stats ON true
        WHERE ca.estado_registro = 1
        ${empresaFilter}
        ORDER BY ca.fecha_registro DESC
      `, { replacements, type: QueryTypes.SELECT });

      // Stats generales
      const totalCampanas = campanas.length;
      const activas = campanas.filter(c => c.estado?.toLowerCase() === 'activo').length;
      const pausadas = campanas.filter(c => c.estado?.toLowerCase() === 'pausado').length;
      const totalEnviados = campanas.reduce((acc, c) => acc + parseInt(c.enviados || 0), 0);

      return res.status(200).json({
        data: {
          campanas: campanas.map(c => ({
            ...c,
            plantilla_nombre: c.plantilla_whatsapp_nombre || c.plantilla_ia_nombre || null,
            estadoCampania: c.id_estado_campania ? { id: c.id_estado_campania, nombre: c.estado, color: c.estado_color } : null,
            enviados: parseInt(c.enviados || 0),
            entregados: parseInt(c.entregados || 0),
            entregados_pct: parseInt(c.enviados) > 0 ? Math.round((parseInt(c.entregados) / parseInt(c.enviados)) * 100) : 0,
          })),
          stats: {
            total: totalCampanas,
            activas,
            pausadas,
            totalEnviados
          }
        }
      });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener campanas WhatsApp: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener campanas de WhatsApp" });
    }
  }
  // ============================
  // AUTOMATIZACIÓN: Campañas WS
  // ============================
  async getAutomatizacionCampanas(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      const [kpisResult, kpisPrevResult, evoResult] = await Promise.all([
        // KPIs actuales: enviados, visualizados (entregados), respondidos, desuscritos
        sequelize.query(`
          SELECT
            COUNT(DISTINCT cp.id_prospecto) as enviados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND m.id_plantilla_whatsapp IS NOT NULL
              ) THEN cp.id_prospecto
            END) as visualizados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND m.direccion = 'in'
                AND m.fecha_hora > cp.fecha_registro
              ) THEN cp.id_prospecto
            END) as respondidos,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND ch.bot_activo = 0
              ) THEN cp.id_prospecto
            END) as desuscritos
          FROM campania_prospectos cp
          INNER JOIN campania ca ON ca.id = cp.id_campania AND ca.estado_registro = 1
            AND ca.id_plantilla_whatsapp IS NOT NULL
          INNER JOIN prospecto p ON p.id = cp.id_prospecto AND p.estado_registro = 1
          WHERE cp.estado_registro = 1
          ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // KPIs mes anterior
        sequelize.query(`
          SELECT
            COUNT(DISTINCT cp.id_prospecto) as enviados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND m.direccion = 'in' AND m.fecha_hora > cp.fecha_registro
              ) THEN cp.id_prospecto
            END) as respondidos
          FROM campania_prospectos cp
          INNER JOIN campania ca ON ca.id = cp.id_campania AND ca.estado_registro = 1
            AND ca.id_plantilla_whatsapp IS NOT NULL
          INNER JOIN prospecto p ON p.id = cp.id_prospecto AND p.estado_registro = 1
          WHERE cp.estado_registro = 1
          ${empresaFilter}
          AND cp.fecha_registro >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
          AND cp.fecha_registro < DATE_TRUNC('month', CURRENT_DATE)
        `, { replacements, type: QueryTypes.SELECT }),

        // Evolución mensual (año actual)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM cp.fecha_registro)::int as num_mes,
            TO_CHAR(cp.fecha_registro, 'Mon') as mes,
            COUNT(DISTINCT cp.id_prospecto) as enviados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND m.id_plantilla_whatsapp IS NOT NULL
              ) THEN cp.id_prospecto
            END) as visualizados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND m.direccion = 'in' AND m.fecha_hora > cp.fecha_registro
              ) THEN cp.id_prospecto
            END) as respondidos,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                WHERE ch.id_prospecto = cp.id_prospecto AND ch.estado_registro = 1
                AND ch.bot_activo = 0
              ) THEN cp.id_prospecto
            END) as desuscritos
          FROM campania_prospectos cp
          INNER JOIN campania ca ON ca.id = cp.id_campania AND ca.estado_registro = 1
            AND ca.id_plantilla_whatsapp IS NOT NULL
          INNER JOIN prospecto p ON p.id = cp.id_prospecto AND p.estado_registro = 1
          WHERE cp.estado_registro = 1
          ${empresaFilter}
          AND cp.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      const kpis = kpisResult[0] || {};
      const prev = kpisPrevResult[0] || {};
      const enviados = parseInt(kpis.enviados || 0);
      const visualizados = parseInt(kpis.visualizados || 0);
      const respondidos = parseInt(kpis.respondidos || 0);
      const desuscritos = parseInt(kpis.desuscritos || 0);

      const calcCambio = (actual, anterior) => {
        if (anterior === 0) return actual > 0 ? '+100%' : '0%';
        const diff = ((actual - anterior) / anterior * 100).toFixed(1);
        return diff > 0 ? `+${diff}%` : `${diff}%`;
      };

      const data = {
        kpis: {
          enviados,
          visualizados,
          respondidos,
          desuscritos,
          cambioEnviados: calcCambio(enviados, parseInt(prev.enviados || 0)),
          cambioRespondidos: calcCambio(respondidos, parseInt(prev.respondidos || 0)),
        },
        embudo: [
          { name: 'Envíos', value: enviados, percent: '100%' },
          { name: 'Visto', value: visualizados, percent: enviados > 0 ? Math.round(visualizados / enviados * 100) + '%' : '0%' },
          { name: 'Respondido', value: respondidos, percent: enviados > 0 ? Math.round(respondidos / enviados * 100) + '%' : '0%' },
          { name: 'Desuscrito', value: desuscritos, percent: enviados > 0 ? Math.round(desuscritos / enviados * 100) + '%' : '0%' },
        ],
        evolucion: evoResult.map(r => ({
          mes: r.mes.trim(),
          Envios: parseInt(r.enviados || 0),
          Vistos: parseInt(r.visualizados || 0),
          Respondido: parseInt(r.respondidos || 0),
          Desuscritos: parseInt(r.desuscritos || 0),
        })),
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener automatización campañas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos de automatización de campañas" });
    }
  }

  // ============================
  // AUTOMATIZACIÓN: Recordatorios de cita
  // ============================
  async getAutomatizacionRecordatorios(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      const [kpisResult, reagendResult, evoResult, evoReagendResult] = await Promise.all([
        // KPIs: recordatorios enviados, con respuesta
        sequelize.query(`
          SELECT
            COUNT(*) as enviados,
            COUNT(*) FILTER (WHERE pr.cantidad > 0) as visualizados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = pr.id_prospecto AND ch.estado_registro = 1
                AND m.direccion = 'in'
                AND m.fecha_hora > pr.fecha_registro
              ) THEN pr.id_prospecto
            END) as respondidos
          FROM prospecto_recordatorio pr
          INNER JOIN prospecto p ON p.id = pr.id_prospecto AND p.estado_registro = 1
          WHERE pr.estado_registro = 1
          ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // Reagendamiento: citas que fueron modificadas
        sequelize.query(`
          SELECT
            COUNT(*) as total_citas,
            COUNT(*) FILTER (WHERE c.fecha_actualizacion > c.fecha_registro) as reagendadas
          FROM cita c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE c.estado_registro = 1
          ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // Evolución mensual recordatorios
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM pr.fecha_registro)::int as num_mes,
            TO_CHAR(pr.fecha_registro, 'Mon') as mes,
            COUNT(*) as enviados,
            COUNT(*) FILTER (WHERE pr.cantidad > 0) as visualizados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM chat ch
                INNER JOIN mensaje m ON m.id_chat = ch.id AND m.estado_registro = 1
                WHERE ch.id_prospecto = pr.id_prospecto AND ch.estado_registro = 1
                AND m.direccion = 'in' AND m.fecha_hora > pr.fecha_registro
              ) THEN pr.id_prospecto
            END) as respondidos
          FROM prospecto_recordatorio pr
          INNER JOIN prospecto p ON p.id = pr.id_prospecto AND p.estado_registro = 1
          WHERE pr.estado_registro = 1
          ${empresaFilter}
          AND pr.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // Evolución reagendamiento mensual
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM c.fecha_registro)::int as num_mes,
            TO_CHAR(c.fecha_registro, 'Mon') as mes,
            COUNT(*) FILTER (WHERE c.fecha_actualizacion > c.fecha_registro) as si,
            COUNT(*) FILTER (WHERE c.fecha_actualizacion = c.fecha_registro OR c.fecha_actualizacion IS NULL) as no
          FROM cita c
          INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
          WHERE c.estado_registro = 1
          ${empresaFilter}
          AND c.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      const kpis = kpisResult[0] || {};
      const reagend = reagendResult[0] || {};
      const enviados = parseInt(kpis.enviados || 0);
      const visualizados = parseInt(kpis.visualizados || 0);
      const respondidos = parseInt(kpis.respondidos || 0);
      const totalCitas = parseInt(reagend.total_citas || 0);
      const reagendadas = parseInt(reagend.reagendadas || 0);
      const reagendPct = totalCitas > 0 ? Math.round(reagendadas / totalCitas * 100) : 0;

      const data = {
        kpis: { enviados, visualizados, respondidos },
        embudo: [
          { name: 'Enviados', value: enviados, percent: '100%' },
          { name: 'Vistos', value: visualizados, percent: enviados > 0 ? Math.round(visualizados / enviados * 100) + '%' : '0%' },
          { name: 'Respondidos', value: respondidos, percent: enviados > 0 ? Math.round(respondidos / enviados * 100) + '%' : '0%' },
        ],
        reagendamiento: {
          donut: [
            { name: 'Sí', value: reagendPct, color: '#10b981' },
            { name: 'No', value: 100 - reagendPct, color: '#f43f5e' },
          ],
          centerLabel: `${reagendPct}%`,
        },
        evolucion: evoResult.map(r => ({
          mes: r.mes.trim(),
          Enviados: parseInt(r.enviados || 0),
          Vistos: parseInt(r.visualizados || 0),
          Respondidos: parseInt(r.respondidos || 0),
        })),
        evolucionReagendamiento: evoReagendResult.map(r => ({
          mes: r.mes.trim(),
          'Sí': parseInt(r.si || 0),
          No: parseInt(r.no || 0),
        })),
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener automatización recordatorios: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos de automatización de recordatorios" });
    }
  }

  // ============================
  // AUTOMATIZACIÓN: Mensajes de recuperación
  // ============================
  async getAutomatizacionRecuperacion(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';
      if (idEmpresa) {
        empresaFilter = 'AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      const [kpisResult, evoResult] = await Promise.all([
        // KPIs: mensajes de recuperación (mensajes out a chats abandonados)
        sequelize.query(`
          WITH chats_abandonados AS (
            SELECT c.id, c.id_prospecto, ultimo.fecha_hora as fecha_ultimo_out
            FROM chat c
            INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
            LEFT JOIN LATERAL (
              SELECT m.direccion, m.fecha_hora
              FROM mensaje m
              WHERE m.id_chat = c.id AND m.estado_registro = 1
              ORDER BY m.fecha_hora DESC
              LIMIT 1
            ) ultimo ON true
            WHERE c.estado_registro = 1
            ${empresaFilter}
            AND ultimo.direccion = 'out'
            AND NOW() - ultimo.fecha_hora > INTERVAL '24 hours'
          )
          SELECT
            (SELECT COUNT(*) FROM chats_abandonados) as enviados,
            (SELECT COUNT(*) FROM chats_abandonados ca
             WHERE EXISTS (
               SELECT 1 FROM mensaje m
               WHERE m.id_chat = ca.id AND m.estado_registro = 1
               AND m.direccion = 'out'
               AND m.fecha_hora > ca.fecha_ultimo_out - INTERVAL '1 hour'
             )) as visualizados,
            (SELECT COUNT(*) FROM chats_abandonados ca
             WHERE EXISTS (
               SELECT 1 FROM mensaje m
               WHERE m.id_chat = ca.id AND m.estado_registro = 1
               AND m.direccion = 'in'
               AND m.fecha_hora > ca.fecha_ultimo_out
             )) as respondidos
        `, { replacements, type: QueryTypes.SELECT }),

        // Evolución mensual
        sequelize.query(`
          WITH mensajes_recup AS (
            SELECT
              m.id_chat,
              m.fecha_hora,
              c.id_prospecto,
              EXTRACT(MONTH FROM m.fecha_hora)::int as num_mes,
              TO_CHAR(m.fecha_hora, 'Mon') as mes
            FROM mensaje m
            INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
            INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
            WHERE m.estado_registro = 1
              AND m.direccion = 'out'
              ${empresaFilter}
              AND m.fecha_hora >= DATE_TRUNC('year', CURRENT_DATE)
              AND NOT EXISTS (
                SELECT 1 FROM mensaje m2
                WHERE m2.id_chat = m.id_chat AND m2.estado_registro = 1
                AND m2.direccion = 'in'
                AND m2.fecha_hora > m.fecha_hora - INTERVAL '24 hours'
                AND m2.fecha_hora < m.fecha_hora
              )
          )
          SELECT
            num_mes,
            mes,
            COUNT(DISTINCT id_chat) as enviados,
            COUNT(DISTINCT id_chat) as visualizados,
            COUNT(DISTINCT CASE
              WHEN EXISTS (
                SELECT 1 FROM mensaje m3
                WHERE m3.id_chat = mensajes_recup.id_chat AND m3.estado_registro = 1
                AND m3.direccion = 'in' AND m3.fecha_hora > mensajes_recup.fecha_hora
              ) THEN id_chat
            END) as respondidos
          FROM mensajes_recup
          GROUP BY num_mes, mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      const kpis = kpisResult[0] || {};
      const enviados = parseInt(kpis.enviados || 0);
      const visualizados = parseInt(kpis.visualizados || 0);
      const respondidos = parseInt(kpis.respondidos || 0);

      const data = {
        kpis: { enviados, visualizados, respondidos },
        embudo: [
          { name: 'Enviados', value: enviados, percent: '100%' },
          { name: 'Vistos', value: visualizados, percent: enviados > 0 ? Math.round(visualizados / enviados * 100) + '%' : '0%' },
          { name: 'Respondidos', value: respondidos, percent: enviados > 0 ? Math.round(respondidos / enviados * 100) + '%' : '0%' },
        ],
        evolucion: evoResult.map(r => ({
          mes: r.mes.trim(),
          Enviados: parseInt(r.enviados || 0),
          Vistos: parseInt(r.visualizados || 0),
          Respondidos: parseInt(r.respondidos || 0),
        })),
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener automatización recuperación: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos de automatización de recuperación" });
    }
  }

  // ============================
  // SEGMENTACIÓN de prospectos
  // ============================
  async getSegmentacion(req, res) {
    try {
      const { idEmpresa, estado, scoring, contactado, actividad } = req.query;
      const replacements = {};
      let filters = '';

      if (idEmpresa) {
        filters += ' AND p.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }
      if (estado) {
        const ids = estado.split(',').map(Number).filter(n => !isNaN(n));
        filters += ` AND p.id_estado_prospecto IN (:estadoIds)`;
        replacements.estadoIds = ids;
      }
      if (scoring) {
        const vals = scoring.split(',').map(v => v.trim());
        filters += ` AND p.calificacion_lead IN (:scoringVals)`;
        replacements.scoringVals = vals;
      }
      if (contactado !== undefined && contactado !== '') {
        filters += ' AND p.fue_contactado = :contactado';
        replacements.contactado = parseInt(contactado);
      }

      let actividadJoin = '';
      if (actividad === 'abandonados') {
        actividadJoin = `
          AND EXISTS (
            SELECT 1 FROM chat c
            LEFT JOIN LATERAL (
              SELECT m.direccion, m.fecha_hora FROM mensaje m
              WHERE m.id_chat = c.id AND m.estado_registro = 1
              ORDER BY m.fecha_hora DESC LIMIT 1
            ) ult ON true
            WHERE c.id_prospecto = p.id AND c.estado_registro = 1
            AND ult.direccion = 'out' AND NOW() - ult.fecha_hora > INTERVAL '24 hours'
          )
        `;
      } else if (actividad === 'sin_respuesta') {
        actividadJoin = `
          AND EXISTS (
            SELECT 1 FROM chat c
            LEFT JOIN LATERAL (
              SELECT m.direccion FROM mensaje m
              WHERE m.id_chat = c.id AND m.estado_registro = 1
              ORDER BY m.fecha_hora DESC LIMIT 1
            ) ult ON true
            WHERE c.id_prospecto = p.id AND c.estado_registro = 1
            AND ult.direccion = 'out'
          )
        `;
      } else if (actividad === 'sin_chat') {
        actividadJoin = `
          AND NOT EXISTS (
            SELECT 1 FROM chat c WHERE c.id_prospecto = p.id AND c.estado_registro = 1
          )
        `;
      }

      const [countResult, prospectos] = await Promise.all([
        sequelize.query(`
          SELECT COUNT(*) as total
          FROM prospecto p
          WHERE p.estado_registro = 1 ${filters} ${actividadJoin}
        `, { replacements, type: QueryTypes.SELECT }),

        sequelize.query(`
          SELECT p.id, p.nombre_completo, p.celular, p.email, p.calificacion_lead,
                 p.id_estado_prospecto, ep.nombre as estado_nombre,
                 p.fue_contactado, p.fecha_registro
          FROM prospecto p
          LEFT JOIN estado_prospecto ep ON ep.id = p.id_estado_prospecto
          WHERE p.estado_registro = 1 ${filters} ${actividadJoin}
          ORDER BY p.fecha_registro DESC
          LIMIT 100
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      return res.status(200).json({
        data: {
          total: parseInt(countResult[0]?.total || 0),
          prospectos,
        }
      });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al segmentar prospectos: ${error.message}`);
      return res.status(500).json({ msg: "Error al segmentar prospectos" });
    }
  }

  // ============================
  // Consumo diario de conversaciones
  // ============================
  async getConsumo(req, res) {
    try {
      const { idEmpresa, mes } = req.query;
      if (!idEmpresa) {
        return res.status(400).json({ msg: "idEmpresa es requerido" });
      }

      // Calcular rango del mes seleccionado y del mes anterior
      let mesInicio, mesFin, mesAntInicio, mesAntFin;
      if (mes) {
        const [y, m] = mes.split('-').map(Number);
        mesInicio = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        mesFin = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`;
        const pm = m === 1 ? 12 : m - 1;
        const py = m === 1 ? y - 1 : y;
        mesAntInicio = `${py}-${String(pm).padStart(2, '0')}-01 00:00:00`;
        mesAntFin = mesInicio;
      } else {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        mesInicio = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        mesFin = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`;
        const pm = m === 1 ? 12 : m - 1;
        const py = m === 1 ? y - 1 : y;
        mesAntInicio = `${py}-${String(pm).padStart(2, '0')}-01 00:00:00`;
        mesAntFin = mesInicio;
      }

      const replacements = {
        idEmpresa: parseInt(idEmpresa),
        mesInicio,
        mesFin,
        mesAntInicio,
        mesAntFin
      };

      const baseJoin = `
        FROM mensaje m
        INNER JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
        INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
        WHERE m.estado_registro = 1
          AND p.id_empresa = :idEmpresa
      `;

      const [totalMes, hoy, diario, totalMesAnt] = await Promise.all([
        // 1. Total conversaciones del mes
        sequelize.query(`
          SELECT COUNT(*) as total FROM (
            SELECT DISTINCT m.id_chat, DATE(m.fecha_hora) as dia
            ${baseJoin}
            AND m.fecha_hora >= :mesInicio
            AND m.fecha_hora < :mesFin
          ) sub
        `, { type: QueryTypes.SELECT, replacements }),

        // 2. Conversaciones de hoy
        sequelize.query(`
          SELECT COUNT(*) as total FROM (
            SELECT DISTINCT m.id_chat
            ${baseJoin}
            AND DATE(m.fecha_hora) = CURRENT_DATE
          ) sub
        `, { type: QueryTypes.SELECT, replacements }),

        // 3. Desglose diario
        sequelize.query(`
          SELECT
            DATE(m.fecha_hora) as fecha,
            TO_CHAR(DATE(m.fecha_hora), 'DD Mon') as fecha_label,
            EXTRACT(DOW FROM DATE(m.fecha_hora))::int as dia_semana,
            COUNT(DISTINCT m.id_chat) as conversaciones
          ${baseJoin}
          AND m.fecha_hora >= :mesInicio
          AND m.fecha_hora < :mesFin
          GROUP BY DATE(m.fecha_hora)
          ORDER BY DATE(m.fecha_hora)
        `, { type: QueryTypes.SELECT, replacements }),

        // 4. Total mes anterior
        sequelize.query(`
          SELECT COUNT(*) as total FROM (
            SELECT DISTINCT m.id_chat, DATE(m.fecha_hora) as dia
            ${baseJoin}
            AND m.fecha_hora >= :mesAntInicio
            AND m.fecha_hora < :mesAntFin
          ) sub
        `, { type: QueryTypes.SELECT, replacements }),
      ]);

      const total = parseInt(totalMes[0]?.total || 0);
      const totalAnt = parseInt(totalMesAnt[0]?.total || 0);
      const hoyCount = parseInt(hoy[0]?.total || 0);
      const diasConDatos = diario.length || 1;
      const promedio = Math.round(total / diasConDatos);

      let cambio = '0%';
      if (totalAnt > 0) {
        const pct = ((total - totalAnt) / totalAnt * 100).toFixed(1);
        cambio = (pct > 0 ? '+' : '') + pct + '%';
      }

      return res.status(200).json({
        data: {
          kpis: {
            totalMes: total,
            hoy: hoyCount,
            promedioDiario: promedio,
            cambioVsMesAnterior: cambio,
          },
          diario: diario.map(d => ({
            fecha: d.fecha,
            fecha_label: fechaLabelEs(d.fecha),
            dia_semana: d.dia_semana,
            conversaciones: parseInt(d.conversaciones),
          })),
        }
      });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener consumo: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener consumo" });
    }
  }

  // ============================
  // Consumo diario de llamadas (minutos facturables)
  // ============================
  async getConsumoLlamadas(req, res) {
    try {
      const { idEmpresa, mes } = req.query;
      if (!idEmpresa) {
        return res.status(400).json({ msg: "idEmpresa es requerido" });
      }

      let mesInicio, mesFin, mesAntInicio, mesAntFin;
      if (mes) {
        const [y, m] = mes.split('-').map(Number);
        mesInicio = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        mesFin = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`;
        const pm = m === 1 ? 12 : m - 1;
        const py = m === 1 ? y - 1 : y;
        mesAntInicio = `${py}-${String(pm).padStart(2, '0')}-01 00:00:00`;
        mesAntFin = mesInicio;
      } else {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        mesInicio = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        mesFin = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`;
        const pm = m === 1 ? 12 : m - 1;
        const py = m === 1 ? y - 1 : y;
        mesAntInicio = `${py}-${String(pm).padStart(2, '0')}-01 00:00:00`;
        mesAntFin = mesInicio;
      }

      const replacements = {
        idEmpresa: parseInt(idEmpresa),
        mesInicio,
        mesFin,
        mesAntInicio,
        mesAntFin
      };

      // Minutos facturables: CEIL(duracion_seg / 60) si sobrante >= 30s, sino FLOOR
      // Equivale a: FLOOR(duracion_seg / 60) + CASE WHEN (duracion_seg % 60) >= 30 THEN 1 ELSE 0 END
      // Mínimo 1 minuto por llamada
      const minFacturable = `GREATEST(FLOOR(l.duracion_seg / 60) + CASE WHEN (l.duracion_seg % 60) >= 30 THEN 1 ELSE 0 END, 1)`;

      const baseWhere = `
        FROM llamada l
        INNER JOIN prospecto p ON p.id = l.id_prospecto AND p.estado_registro = 1
        WHERE l.estado_registro = 1
          AND l.id_empresa = :idEmpresa
      `;

      const [totalMes, hoy, diario, totalMesAnt] = await Promise.all([
        // 1. Total del mes: llamadas y minutos facturables
        sequelize.query(`
          SELECT
            COUNT(*) as total_llamadas,
            COALESCE(SUM(${minFacturable}), 0) as total_minutos
          ${baseWhere}
          AND l.fecha_inicio >= :mesInicio
          AND l.fecha_inicio < :mesFin
        `, { type: QueryTypes.SELECT, replacements }),

        // 2. Hoy
        sequelize.query(`
          SELECT
            COUNT(*) as total_llamadas,
            COALESCE(SUM(${minFacturable}), 0) as total_minutos
          ${baseWhere}
          AND DATE(l.fecha_inicio) = CURRENT_DATE
        `, { type: QueryTypes.SELECT, replacements }),

        // 3. Desglose diario
        sequelize.query(`
          SELECT
            DATE(l.fecha_inicio) as fecha,
            TO_CHAR(DATE(l.fecha_inicio), 'DD Mon') as fecha_label,
            EXTRACT(DOW FROM DATE(l.fecha_inicio))::int as dia_semana,
            COUNT(*) as llamadas,
            COALESCE(SUM(${minFacturable}), 0) as minutos
          ${baseWhere}
          AND l.fecha_inicio >= :mesInicio
          AND l.fecha_inicio < :mesFin
          GROUP BY DATE(l.fecha_inicio)
          ORDER BY DATE(l.fecha_inicio)
        `, { type: QueryTypes.SELECT, replacements }),

        // 4. Total mes anterior
        sequelize.query(`
          SELECT
            COUNT(*) as total_llamadas,
            COALESCE(SUM(${minFacturable}), 0) as total_minutos
          ${baseWhere}
          AND l.fecha_inicio >= :mesAntInicio
          AND l.fecha_inicio < :mesAntFin
        `, { type: QueryTypes.SELECT, replacements }),
      ]);

      const totalLlamadas = parseInt(totalMes[0]?.total_llamadas || 0);
      const totalMinutos = parseInt(totalMes[0]?.total_minutos || 0);
      const totalLlamadasAnt = parseInt(totalMesAnt[0]?.total_llamadas || 0);
      const totalMinutosAnt = parseInt(totalMesAnt[0]?.total_minutos || 0);
      const hoyLlamadas = parseInt(hoy[0]?.total_llamadas || 0);
      const hoyMinutos = parseInt(hoy[0]?.total_minutos || 0);
      const diasConDatos = diario.length || 1;

      let cambioLlamadas = '0%';
      if (totalLlamadasAnt > 0) {
        const pct = ((totalLlamadas - totalLlamadasAnt) / totalLlamadasAnt * 100).toFixed(1);
        cambioLlamadas = (pct > 0 ? '+' : '') + pct + '%';
      }
      let cambioMinutos = '0%';
      if (totalMinutosAnt > 0) {
        const pct = ((totalMinutos - totalMinutosAnt) / totalMinutosAnt * 100).toFixed(1);
        cambioMinutos = (pct > 0 ? '+' : '') + pct + '%';
      }

      return res.status(200).json({
        data: {
          kpis: {
            totalLlamadas,
            totalMinutos,
            hoyLlamadas,
            hoyMinutos,
            promedioLlamadasDiario: Math.round(totalLlamadas / diasConDatos),
            promedioMinutosDiario: Math.round(totalMinutos / diasConDatos),
            cambioLlamadas,
            cambioMinutos,
          },
          diario: diario.map(d => ({
            fecha: d.fecha,
            fecha_label: fechaLabelEs(d.fecha),
            dia_semana: d.dia_semana,
            llamadas: parseInt(d.llamadas),
            minutos: parseInt(d.minutos),
          })),
        }
      });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener consumo llamadas: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener consumo de llamadas" });
    }
  }
  // ============================================================
  // Consumo histórico mes a mes (para gráfica de tendencia)
  // ============================================================
  async getConsumoHistorico(req, res) {
    try {
      const { idEmpresa, tipo, periodo } = req.query;
      if (!idEmpresa) {
        return res.status(400).json({ msg: "idEmpresa es requerido" });
      }

      // tipo: 'mensajes' | 'llamadas' (default mensajes)
      // periodo: 'todo', 'anio' (últimos 12 meses), 'mes' (último mes, datos diarios)
      const tipoConsumo = tipo || 'mensajes';
      const per = periodo || 'anio';

      // Si periodo = 'mes', devolver datos diarios del mes actual
      if (per === 'mes') {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const mesInicio = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
        const nm = m === 12 ? 1 : m + 1;
        const ny = m === 12 ? y + 1 : y;
        const mesFin = `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`;
        const diasSemNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        let query;
        if (tipoConsumo === 'mensajes') {
          query = `
            SELECT DATE(m.fecha_hora) AS fecha,
                   TO_CHAR(DATE(m.fecha_hora), 'DD') || ' ' || :mesLabel AS fecha_label,
                   EXTRACT(DOW FROM DATE(m.fecha_hora))::int AS dia_semana,
                   COUNT(DISTINCT c.id) AS conversaciones
            FROM mensaje m
            JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
            JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
            WHERE p.id_empresa = :idEmpresa
              AND m.estado_registro = 1
              AND m.fecha_hora >= :mesInicio AND m.fecha_hora < :mesFin
            GROUP BY DATE(m.fecha_hora)
            ORDER BY fecha ASC
          `;
        } else {
          query = `
            SELECT DATE(l.fecha_inicio) AS fecha,
                   TO_CHAR(DATE(l.fecha_inicio), 'DD') || ' ' || :mesLabel AS fecha_label,
                   EXTRACT(DOW FROM DATE(l.fecha_inicio))::int AS dia_semana,
                   COUNT(*) AS llamadas,
                   SUM(GREATEST(FLOOR(l.duracion_seg / 60) + CASE WHEN (l.duracion_seg % 60) >= 30 THEN 1 ELSE 0 END, 1)) AS minutos
            FROM llamada l
            WHERE l.id_empresa = :idEmpresa
              AND l.estado_registro = 1
              AND l.fecha_inicio >= :mesInicio AND l.fecha_inicio < :mesFin
            GROUP BY DATE(l.fecha_inicio)
            ORDER BY fecha ASC
          `;
        }

        const rows = await sequelize.query(query, {
          replacements: { idEmpresa: parseInt(idEmpresa), mesInicio, mesFin, mesLabel: mesesCortos[m - 1] },
          type: QueryTypes.SELECT,
        });

        const data = rows.map(r => {
          const lbl = fechaLabelEs(r.fecha);
          if (tipoConsumo === 'mensajes') {
            return { fecha: r.fecha, label: lbl, conversaciones: parseInt(r.conversaciones) };
          } else {
            return { fecha: r.fecha, label: lbl, llamadas: parseInt(r.llamadas), minutos: parseInt(r.minutos) };
          }
        });

        return res.json({ data: { historico: data } });
      }

      // Agrupado por mes
      let filtroFecha = '';
      if (per === 'todo') {
        filtroFecha = '';
      } else if (per === 'anio') {
        filtroFecha = `AND fecha_mes >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'`;
      }

      let query;
      if (tipoConsumo === 'mensajes') {
        query = `
          WITH meses AS (
            SELECT DATE_TRUNC('month', m.fecha_hora) AS fecha_mes,
                   COUNT(DISTINCT (c.id || '-' || DATE(m.fecha_hora))) AS total
            FROM mensaje m
            JOIN chat c ON c.id = m.id_chat AND c.estado_registro = 1
            JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
            WHERE p.id_empresa = :idEmpresa
              AND m.estado_registro = 1
            GROUP BY DATE_TRUNC('month', m.fecha_hora)
          )
          SELECT fecha_mes, total FROM meses
          WHERE 1=1 ${filtroFecha}
          ORDER BY fecha_mes ASC
        `;
      } else {
        query = `
          WITH meses AS (
            SELECT DATE_TRUNC('month', l.fecha_inicio) AS fecha_mes,
                   COUNT(*) AS total_llamadas,
                   SUM(GREATEST(FLOOR(l.duracion_seg / 60) + CASE WHEN (l.duracion_seg % 60) >= 30 THEN 1 ELSE 0 END, 1)) AS total_minutos
            FROM llamada l
            WHERE l.id_empresa = :idEmpresa
              AND l.estado_registro = 1
              AND l.fecha_inicio IS NOT NULL
            GROUP BY DATE_TRUNC('month', l.fecha_inicio)
          )
          SELECT fecha_mes, total_llamadas, total_minutos FROM meses
          WHERE 1=1 ${filtroFecha}
          ORDER BY fecha_mes ASC
        `;
      }

      const rows = await sequelize.query(query, {
        replacements: { idEmpresa: parseInt(idEmpresa) },
        type: QueryTypes.SELECT,
      });

      const data = rows.map(r => {
        const d = new Date(r.fecha_mes);
        const label = `${MESES_CORTO[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
        if (tipoConsumo === 'mensajes') {
          return { label, conversaciones: parseInt(r.total) };
        } else {
          return { label, llamadas: parseInt(r.total_llamadas), minutos: parseInt(r.total_minutos) };
        }
      });

      return res.json({ data: { historico: data } });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener consumo histórico: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener consumo histórico" });
    }
  }

  async getSpeechAnalytics(req, res) {
    try {
      const { idEmpresa } = req.query;
      const replacements = {};
      let empresaFilter = '';

      if (idEmpresa) {
        empresaFilter = 'AND al.id_empresa = :idEmpresa';
        replacements.idEmpresa = parseInt(idEmpresa);
      }

      const [
        fcrResult,
        sentimientoResult,
        emocionesResult,
        preguntasResult,
        temasResult,
        palabrasResult,
        convPorHoraResult,
        evoFcrResult,
        evoSentimientoResult,
        evoEmocionesResult
      ] = await Promise.all([
        // 1. FCR (First Call Resolution) - 100% preciso
        sequelize.query(`
          SELECT
            COUNT(*) FILTER (WHERE al.fcr = true) as resueltas,
            COUNT(*) FILTER (WHERE al.fcr = false) as no_resueltas,
            COUNT(*) as total
          FROM analisis_llamada al
          WHERE al.estado_registro = 1 ${empresaFilter}
        `, { replacements, type: QueryTypes.SELECT }),

        // 2. Sentimiento - 100% preciso
        sequelize.query(`
          SELECT
            ans.sentimiento,
            COUNT(*) as total
          FROM analisis_sentimiento ans
          WHERE ans.estado_registro = 1
          ${idEmpresa ? 'AND ans.id_empresa = :idEmpresa' : ''}
          GROUP BY ans.sentimiento
        `, { replacements, type: QueryTypes.SELECT }),

        // 3. Emociones - 100% preciso
        sequelize.query(`
          SELECT
            ans.emocion_principal,
            COUNT(*) as total
          FROM analisis_sentimiento ans
          WHERE ans.estado_registro = 1
          ${idEmpresa ? 'AND ans.id_empresa = :idEmpresa' : ''}
          GROUP BY ans.emocion_principal
          ORDER BY total DESC
        `, { replacements, type: QueryTypes.SELECT }),

        // 4. Preguntas frecuentes - 100% preciso
        sequelize.query(`
          SELECT pf.contenido as pregunta, SUM(pf.frecuencia) as total
          FROM pregunta_frecuente pf
          WHERE pf.estado_registro = 1 AND pf.tipo = 'pregunta'
          ${idEmpresa ? 'AND pf.id_empresa = :idEmpresa' : ''}
          GROUP BY pf.contenido
          ORDER BY total DESC
          LIMIT 8
        `, { replacements, type: QueryTypes.SELECT }),

        // 5. Temas frecuentes - 100% preciso
        sequelize.query(`
          SELECT pf.contenido as tema, SUM(pf.frecuencia) as total
          FROM pregunta_frecuente pf
          WHERE pf.estado_registro = 1 AND pf.tipo = 'tema'
          ${idEmpresa ? 'AND pf.id_empresa = :idEmpresa' : ''}
          GROUP BY pf.contenido
          ORDER BY total DESC
          LIMIT 8
        `, { replacements, type: QueryTypes.SELECT }),

        // 6. Palabras (Word Cloud) - 100% preciso
        sequelize.query(`
          SELECT pf.contenido as text, SUM(pf.frecuencia) as size
          FROM pregunta_frecuente pf
          WHERE pf.estado_registro = 1 AND pf.tipo = 'palabra'
          ${idEmpresa ? 'AND pf.id_empresa = :idEmpresa' : ''}
          GROUP BY pf.contenido
          ORDER BY size DESC
          LIMIT 20
        `, { replacements, type: QueryTypes.SELECT }),

        // 7. Conversaciones por hora - probable (basado en llamadas reales)
        sequelize.query(`
          SELECT
            EXTRACT(HOUR FROM l.fecha_inicio)::int as hora,
            COUNT(*) as total
          FROM llamada l
          WHERE l.estado_registro = 1
          ${idEmpresa ? 'AND l.id_empresa = :idEmpresa' : ''}
          AND l.fecha_inicio IS NOT NULL
          GROUP BY hora
          ORDER BY hora
        `, { replacements, type: QueryTypes.SELECT }),

        // 8. Evolución FCR mensual - probable (depende de distribución de datos)
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM al.fecha_registro)::int as num_mes,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE al.fcr = true) as resueltas
          FROM analisis_llamada al
          WHERE al.estado_registro = 1 ${empresaFilter}
          AND al.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 9. Evolución sentimiento mensual
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM ans.fecha_registro)::int as num_mes,
            COUNT(*) FILTER (WHERE ans.sentimiento = 'positivo') as positivo,
            COUNT(*) FILTER (WHERE ans.sentimiento = 'negativo') as negativo,
            COUNT(*) FILTER (WHERE ans.sentimiento = 'neutro') as neutro
          FROM analisis_sentimiento ans
          WHERE ans.estado_registro = 1
          ${idEmpresa ? 'AND ans.id_empresa = :idEmpresa' : ''}
          AND ans.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT }),

        // 10. Evolución emociones mensual
        sequelize.query(`
          SELECT
            EXTRACT(MONTH FROM ans.fecha_registro)::int as num_mes,
            ans.emocion_principal,
            COUNT(*) as total
          FROM analisis_sentimiento ans
          WHERE ans.estado_registro = 1
          ${idEmpresa ? 'AND ans.id_empresa = :idEmpresa' : ''}
          AND ans.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY num_mes, ans.emocion_principal
          ORDER BY num_mes
        `, { replacements, type: QueryTypes.SELECT })
      ]);

      // Procesar FCR
      const fcrData = fcrResult[0] || { resueltas: 0, no_resueltas: 0, total: 0 };
      const fcrTotal = parseInt(fcrData.total) || 1;
      const fcrPorcentaje = Math.round((parseInt(fcrData.resueltas) / fcrTotal) * 100);

      // Procesar sentimiento
      const sentimientoMap = {};
      sentimientoResult.forEach(s => { sentimientoMap[s.sentimiento] = parseInt(s.total); });
      const sentTotal = Object.values(sentimientoMap).reduce((a, b) => a + b, 0) || 1;

      // Procesar emociones con colores
      const EMOCION_COLORS = {
        'frustracion': '#dc2626', 'enojo': '#f43f5e', 'confusion': '#f97316',
        'ansiedad': '#f59e0b', 'desconfianza': '#eab308', 'decepcion': '#94a3b8',
        'satisfaccion': '#10b981', 'gratitud': '#059669', 'entusiasmo': '#6366f1',
        'curiosidad': '#8b5cf6', 'confianza': '#06b6d4', 'calma': '#14b8a6',
        'indiferencia': '#64748b',
      };

      // Procesar conv por hora
      const convPorHora = convPorHoraResult.map(r => ({
        hora: `${r.hora}:00`,
        value: parseInt(r.total),
      }));

      // Procesar evolución FCR
      const evoFcr = evoFcrResult.map(r => ({
        mes: MESES_CORTO[parseInt(r.num_mes) - 1],
        value: parseInt(r.total) > 0 ? Math.round((parseInt(r.resueltas) / parseInt(r.total)) * 100) : 0,
      }));

      // Procesar evolución sentimiento
      const evoSentimiento = evoSentimientoResult.map(r => ({
        mes: MESES_CORTO[parseInt(r.num_mes) - 1],
        Positivo: parseInt(r.positivo),
        Negativo: parseInt(r.negativo),
        Neutro: parseInt(r.neutro),
      }));

      // Procesar evolución emociones (pivot)
      const evoEmocionesMap = {};
      evoEmocionesResult.forEach(r => {
        const mes = MESES_CORTO[parseInt(r.num_mes) - 1];
        if (!evoEmocionesMap[mes]) evoEmocionesMap[mes] = { mes };
        const emocion = r.emocion_principal.charAt(0).toUpperCase() + r.emocion_principal.slice(1);
        evoEmocionesMap[mes][emocion] = parseInt(r.total);
      });

      const data = {
        // 100% precisos
        fcr: {
          donut: [
            { name: 'Resueltas', value: fcrPorcentaje, color: '#6366f1' },
            { name: 'No resueltas', value: 100 - fcrPorcentaje, color: '#94a3b8' },
          ],
          porcentaje: fcrPorcentaje,
          total: parseInt(fcrData.total),
        },
        sentimiento: {
          donut: [
            { name: 'Positivo', value: Math.round(((sentimientoMap['positivo'] || 0) / sentTotal) * 100 * 100) / 100, color: '#10b981' },
            { name: 'Negativo', value: Math.round(((sentimientoMap['negativo'] || 0) / sentTotal) * 100 * 100) / 100, color: '#f43f5e' },
            { name: 'Neutro', value: Math.round(((sentimientoMap['neutro'] || 0) / sentTotal) * 100 * 100) / 100, color: '#94a3b8' },
          ],
          totales: sentimientoMap,
        },
        emociones: emocionesResult.map(e => ({
          name: e.emocion_principal.charAt(0).toUpperCase() + e.emocion_principal.slice(1),
          value: parseInt(e.total),
          color: EMOCION_COLORS[e.emocion_principal] || '#64748b',
        })),
        preguntas: preguntasResult.map(p => ({
          pregunta: p.pregunta,
          value: parseInt(p.total),
        })),
        temas: temasResult.map(t => ({
          tema: t.tema,
          value: parseInt(t.total),
        })),
        palabras: palabrasResult.map(p => ({
          text: p.text,
          size: parseInt(p.size),
        })),

        // Probables
        convPorHora,
        evoFcr,

        // Evoluciones
        evoSentimiento,
        evoEmociones: Object.values(evoEmocionesMap),
      };

      return res.status(200).json({ data });
    } catch (error) {
      logger.error(`[reportes.controller.js] Error al obtener speech analytics: ${error.message}`);
      return res.status(500).json({ msg: "Error al obtener datos de speech analytics" });
    }
  }
}

module.exports = new ReportesCrmController();
