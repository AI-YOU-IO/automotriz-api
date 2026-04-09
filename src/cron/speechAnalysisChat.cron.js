const cron = require('node-cron');
const speechAnalysisChatService = require('../services/speechAnalysisChat.service.js');
const { sequelize } = require('../models/sequelize/index.js');
const { QueryTypes } = require('sequelize');
const logger = require('../config/logger/loggerClient.js');

/**
 * Cron job que analiza sentimientos de chats WhatsApp inactivos (>24h).
 * Se ejecuta al iniciar el servidor y luego cada hora.
 *
 * NOTA: Este cron NO funcionará hasta que las tablas analisis_llamada,
 * analisis_sentimiento y pregunta_frecuente tengan la columna id_chat
 * y id_llamada sea nullable. Ver speechAnalysisChat.service.js.
 */
function initSpeechAnalysisChatCron() {
  // Ejecutar al iniciar
  setTimeout(async () => {
    logger.info('[cron] Ejecutando análisis de chats al inicio...');
    await ejecutarAnalisis();
  }, 10000); // 10 segundos después de iniciar para que la BD esté lista

  // Ejecutar cada hora en el minuto 30 (para no chocar con el otro cron)
  cron.schedule('30 * * * *', async () => {
    logger.info('[cron] Ejecutando análisis de chats programado...');
    await ejecutarAnalisis();
  });

  logger.info('[cron] Cron de análisis de chats programado (al inicio + cada hora)');
}

async function ejecutarAnalisis() {
  try {
    // Obtener todas las empresas activas
    const empresas = await sequelize.query(
      'SELECT id FROM empresa WHERE estado_registro = 1',
      { type: QueryTypes.SELECT }
    );

    for (const empresa of empresas) {
      const resultado = await speechAnalysisChatService.analizarChatsInactivos(empresa.id);
      if (resultado.analizados > 0) {
        logger.info(`[cron] Empresa ${empresa.id}: ${resultado.analizados} chats analizados, ${resultado.errores} errores`);
      }
    }
  } catch (error) {
    logger.error(`[cron] Error en análisis de chats: ${error.message}`);
  }
}

module.exports = { initSpeechAnalysisChatCron };
