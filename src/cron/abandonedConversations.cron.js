const cron = require('node-cron');
const abandonedConversationsService = require('../services/crm/abandonedConversations.service.js');
const logger = require('../config/logger/loggerClient.js');

/**
 * Cron job que detecta conversaciones abandonadas cada hora.
 * Un prospecto se marca como "Abandonado" si:
 * - El último mensaje del chat es de tipo 'out' (nosotros enviamos)
 * - Han pasado más de 24 horas desde ese mensaje
 * - El prospecto no está en estado Ganado, Perdido o ya Abandonado
 */
function initAbandonedConversationsCron() {
  // Ejecutar cada hora en el minuto 0
  cron.schedule('0 * * * *', async () => {
    logger.info('[cron] Ejecutando detección de conversaciones abandonadas...');
    const result = await abandonedConversationsService.detectAndMarkAbandoned();
    logger.info(`[cron] Detección finalizada. Prospectos actualizados: ${result.updated}`);
  });

  logger.info('[cron] Cron de conversaciones abandonadas programado (cada hora)');
}

module.exports = { initAbandonedConversationsCron };
