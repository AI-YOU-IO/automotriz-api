/**
 * Controlador n8n para gestión de Empresas
 *
 * Endpoints:
 * - GET /n8n/empresa/listar - Listar empresas activas
 * - GET /n8n/empresa/estadisticas-recuperacion - Estadísticas de recuperación por empresa
 */

const { sequelize, Empresa } = require('../models/sequelize');
const { QueryTypes } = require('sequelize');
const logger = require('../config/logger/loggerClient');

class N8nEmpresaController {

  /**
   * GET /n8n/empresa/listar
   *
   * Lista todas las empresas activas del sistema.
   * Útil para iterar por empresa en workflows de n8n.
   *
   * Query params:
   * - incluir_estadisticas: Si es 'true', incluye conteo de chats pendientes (default: false)
   */
  async listar(req, res) {
    try {
      const { incluir_estadisticas } = req.query;
      const conEstadisticas = incluir_estadisticas === 'true';

      if (conEstadisticas) {
        // Query con estadísticas de chats pendientes
        const empresas = await sequelize.query(`
          WITH chats_pendientes AS (
            SELECT
              p.id_empresa,
              COUNT(DISTINCT c.id) as total_chats_pendientes
            FROM chat c
            INNER JOIN prospecto p ON p.id = c.id_prospecto
            INNER JOIN LATERAL (
              SELECT direccion, fecha_hora
              FROM mensaje
              WHERE id_chat = c.id AND estado_registro = 1
              ORDER BY fecha_hora DESC
              LIMIT 1
            ) ultimo_msg ON true
            WHERE c.estado_registro = 1
              AND p.estado_registro = 1
              AND ultimo_msg.direccion = 'out'
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 >= 1
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 < 72
            GROUP BY p.id_empresa
          ),
          mensajes_visto_pendientes AS (
            SELECT
              p.id_empresa,
              COUNT(*) as total_pendientes_envio
            FROM mensaje_visto mv
            INNER JOIN mensaje m ON m.id = mv.id_mensaje
            INNER JOIN chat c ON c.id = m.id_chat
            INNER JOIN prospecto p ON p.id = c.id_prospecto
            WHERE mv.estado_registro = 1
              AND mv.mensaje_enviado = false
              AND mv.tipo_recuperacion IS NOT NULL
            GROUP BY p.id_empresa
          )
          SELECT
            e.id,
            e.nombre_comercial,
            e.razon_social,
            COALESCE(cp.total_chats_pendientes, 0) as chats_sin_respuesta,
            COALESCE(mvp.total_pendientes_envio, 0) as plantillas_pendientes_envio
          FROM empresa e
          LEFT JOIN chats_pendientes cp ON cp.id_empresa = e.id
          LEFT JOIN mensajes_visto_pendientes mvp ON mvp.id_empresa = e.id
          WHERE e.estado_registro = 1
          ORDER BY e.nombre_comercial ASC
        `, {
          type: QueryTypes.SELECT
        });

        logger.info(`[n8nEmpresa] listar: ${empresas.length} empresas (con estadísticas)`);

        return res.json({
          success: true,
          total: empresas.length,
          empresas
        });

      } else {
        // Query simple sin estadísticas
        const empresas = await Empresa.findAll({
          attributes: ['id', 'nombre_comercial', 'razon_social'],
          order: [['nombre_comercial', 'ASC']]
        });

        logger.info(`[n8nEmpresa] listar: ${empresas.length} empresas`);

        return res.json({
          success: true,
          total: empresas.length,
          empresas
        });
      }

    } catch (error) {
      logger.error(`[n8nEmpresa] Error listar: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/empresa/estadisticas-recuperacion
   *
   * Obtiene estadísticas detalladas de recuperación agrupadas por empresa.
   * Útil para decidir qué empresas procesar y con qué prioridad.
   *
   * Query params:
   * - id_empresa: Filtrar por empresa específica (opcional)
   */
  async estadisticasRecuperacion(req, res) {
    try {
      const { id_empresa } = req.query;

      let query = `
        WITH chats_por_rango AS (
          SELECT
            p.id_empresa,
            CASE
              WHEN horas < 8 THEN '1h'
              WHEN horas < 24 THEN '8h'
              WHEN horas < 48 THEN '24h'
              WHEN horas < 72 THEN '48h'
              ELSE '72h'
            END as tipo_rango,
            COUNT(*) as total
          FROM (
            SELECT
              p.id_empresa,
              EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 as horas
            FROM chat c
            INNER JOIN prospecto p ON p.id = c.id_prospecto
            INNER JOIN LATERAL (
              SELECT direccion, fecha_hora
              FROM mensaje
              WHERE id_chat = c.id AND estado_registro = 1
              ORDER BY fecha_hora DESC
              LIMIT 1
            ) ultimo_msg ON true
            WHERE c.estado_registro = 1
              AND p.estado_registro = 1
              AND ultimo_msg.direccion = 'out'
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 >= 1
              AND EXTRACT(EPOCH FROM (NOW() - ultimo_msg.fecha_hora)) / 3600 < 72
          ) sub
          INNER JOIN prospecto p ON true
          GROUP BY p.id_empresa, tipo_rango
        ),
        pendientes_envio AS (
          SELECT
            p.id_empresa,
            mv.tipo_recuperacion,
            COUNT(*) as pendientes
          FROM mensaje_visto mv
          INNER JOIN mensaje m ON m.id = mv.id_mensaje
          INNER JOIN chat c ON c.id = m.id_chat
          INNER JOIN prospecto p ON p.id = c.id_prospecto
          WHERE mv.estado_registro = 1
            AND mv.mensaje_enviado = false
            AND mv.tipo_recuperacion IS NOT NULL
          GROUP BY p.id_empresa, mv.tipo_recuperacion
        ),
        enviados AS (
          SELECT
            p.id_empresa,
            mv.tipo_recuperacion,
            COUNT(*) as enviados
          FROM mensaje_visto mv
          INNER JOIN mensaje m ON m.id = mv.id_mensaje
          INNER JOIN chat c ON c.id = m.id_chat
          INNER JOIN prospecto p ON p.id = c.id_prospecto
          WHERE mv.estado_registro = 1
            AND mv.mensaje_enviado = true
            AND mv.tipo_recuperacion IS NOT NULL
          GROUP BY p.id_empresa, mv.tipo_recuperacion
        )
        SELECT
          e.id as id_empresa,
          e.nombre_comercial,
          COALESCE(
            (SELECT json_object_agg(tipo_rango, total) FROM chats_por_rango WHERE id_empresa = e.id),
            '{}'::json
          ) as chats_por_rango,
          COALESCE(
            (SELECT json_object_agg(tipo_recuperacion, pendientes) FROM pendientes_envio WHERE id_empresa = e.id),
            '{}'::json
          ) as pendientes_por_tipo,
          COALESCE(
            (SELECT json_object_agg(tipo_recuperacion, enviados) FROM enviados WHERE id_empresa = e.id),
            '{}'::json
          ) as enviados_por_tipo,
          COALESCE((SELECT SUM(pendientes) FROM pendientes_envio WHERE id_empresa = e.id), 0) as total_pendientes
        FROM empresa e
        WHERE e.estado_registro = 1
      `;

      const replacements = {};

      if (id_empresa) {
        query += ` AND e.id = :id_empresa`;
        replacements.id_empresa = parseInt(id_empresa);
      }

      query += ` ORDER BY total_pendientes DESC, e.nombre_comercial ASC`;

      const estadisticas = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      // Calcular totales globales
      const totales = {
        empresas_con_pendientes: estadisticas.filter(e => e.total_pendientes > 0).length,
        total_pendientes_global: estadisticas.reduce((sum, e) => sum + parseInt(e.total_pendientes || 0), 0)
      };

      logger.info(`[n8nEmpresa] estadisticasRecuperacion: ${estadisticas.length} empresas, ${totales.total_pendientes_global} pendientes`);

      return res.json({
        success: true,
        totales,
        empresas: estadisticas
      });

    } catch (error) {
      logger.error(`[n8nEmpresa] Error estadisticasRecuperacion: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /n8n/empresa/resumen-pendientes
   *
   * Resumen simple de empresas con plantillas pendientes de envío.
   * Ideal para el workflow de n8n que itera por empresa.
   *
   * Retorna solo empresas que tienen pendientes > 0
   */
  async resumenPendientes(req, res) {
    try {
      const empresas = await sequelize.query(`
        SELECT
          p.id_empresa,
          e.nombre_comercial,
          COUNT(*) as total_pendientes,
          json_object_agg(mv.tipo_recuperacion, cnt) as pendientes_por_tipo
        FROM (
          SELECT
            p.id_empresa,
            mv.tipo_recuperacion,
            COUNT(*) as cnt
          FROM mensaje_visto mv
          INNER JOIN mensaje m ON m.id = mv.id_mensaje
          INNER JOIN chat c ON c.id = m.id_chat
          INNER JOIN prospecto p ON p.id = c.id_prospecto
          WHERE mv.estado_registro = 1
            AND mv.mensaje_enviado = false
            AND mv.tipo_recuperacion IS NOT NULL
            AND p.estado_registro = 1
            AND c.estado_registro = 1
          GROUP BY p.id_empresa, mv.tipo_recuperacion
        ) sub
        INNER JOIN mensaje_visto mv ON true
        INNER JOIN mensaje m ON m.id = mv.id_mensaje
        INNER JOIN chat c ON c.id = m.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        INNER JOIN empresa e ON e.id = p.id_empresa
        WHERE mv.estado_registro = 1
          AND mv.mensaje_enviado = false
          AND mv.tipo_recuperacion IS NOT NULL
        GROUP BY p.id_empresa, e.nombre_comercial
        HAVING COUNT(*) > 0
        ORDER BY COUNT(*) DESC
      `, {
        type: QueryTypes.SELECT
      });

      // Query más simple y eficiente
      const empresasSimple = await sequelize.query(`
        SELECT
          p.id_empresa,
          e.nombre_comercial,
          COUNT(*) as total_pendientes
        FROM mensaje_visto mv
        INNER JOIN mensaje m ON m.id = mv.id_mensaje
        INNER JOIN chat c ON c.id = m.id_chat
        INNER JOIN prospecto p ON p.id = c.id_prospecto
        INNER JOIN empresa e ON e.id = p.id_empresa
        WHERE mv.estado_registro = 1
          AND mv.mensaje_enviado = false
          AND mv.tipo_recuperacion IS NOT NULL
          AND p.estado_registro = 1
          AND c.estado_registro = 1
          AND e.estado_registro = 1
        GROUP BY p.id_empresa, e.nombre_comercial
        HAVING COUNT(*) > 0
        ORDER BY COUNT(*) DESC
      `, {
        type: QueryTypes.SELECT
      });

      logger.info(`[n8nEmpresa] resumenPendientes: ${empresasSimple.length} empresas con pendientes`);

      return res.json({
        success: true,
        total_empresas: empresasSimple.length,
        total_pendientes: empresasSimple.reduce((sum, e) => sum + parseInt(e.total_pendientes), 0),
        empresas: empresasSimple
      });

    } catch (error) {
      logger.error(`[n8nEmpresa] Error resumenPendientes: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new N8nEmpresaController();
