const { sequelize } = require('../../models/sequelize');
const logger = require('../../config/logger/loggerClient.js');

const ABANDONED_STATUS_ID = 7;
const HOURS_THRESHOLD = 24;
// No marcar como abandonado si ya está en Ganado (5), Perdido (6) o Abandonado (7)
const EXCLUDED_STATUS_IDS = [5, 6, 7];

class AbandonedConversationsService {

  /**
   * Detecta prospectos cuya última interacción fue un mensaje saliente (out)
   * hace más de 24 horas y los marca como "Abandonado"
   */
  async detectAndMarkAbandoned() {
    try {
      const [results] = await sequelize.query(`
        UPDATE prospecto p
        SET id_estado_prospecto = :abandonedStatusId,
            fecha_actualizacion = NOW()
        FROM chat c
        JOIN (
          SELECT id_chat,
                 MAX(fecha_hora) as ultima_fecha,
                 (ARRAY_AGG(direccion ORDER BY fecha_hora DESC))[1] as ultima_direccion
          FROM mensaje
          WHERE estado_registro = 1
          GROUP BY id_chat
        ) m ON c.id = m.id_chat
        WHERE c.id_prospecto = p.id
          AND c.estado_registro = 1
          AND p.estado_registro = 1
          AND m.ultima_direccion = 'out'
          AND m.ultima_fecha < NOW() - INTERVAL :hours
          AND p.id_estado_prospecto NOT IN (:excludedIds)
        RETURNING p.id, p.nombre_completo
      `, {
        replacements: {
          abandonedStatusId: ABANDONED_STATUS_ID,
          hours: `${HOURS_THRESHOLD} hours`,
          excludedIds: EXCLUDED_STATUS_IDS
        }
      });

      if (results.length > 0) {
        logger.info(`[abandonedConversations] ${results.length} prospecto(s) marcados como abandonados: ${results.map(r => r.nombre_completo).join(', ')}`);
      }

      return { updated: results.length, prospectos: results };
    } catch (error) {
      logger.error(`[abandonedConversations] Error al detectar conversaciones abandonadas: ${error.message}`);
      return { updated: 0, error: error.message };
    }
  }
}

module.exports = new AbandonedConversationsService();
