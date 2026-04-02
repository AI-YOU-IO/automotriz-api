const axios = require('axios');
const { Prospecto, sequelize } = require('../../models/sequelize');
const logger = require('../../config/logger/loggerClient');

const SPERANT_API_URL = process.env.SPERANT_API_URL || 'https://api.eterniasoft.com/v3';
const SPERANT_API_TOKEN = process.env.SPERANT_API_TOKEN || '';
class SperantService {

  // Método genérico para fetch paginado de la API de Sperant
  async fetchPaginated(endpoint) {
    const items = [];
    const separator = endpoint.includes('?') ? '&' : '?';
    let url = `${SPERANT_API_URL}${endpoint}${separator}per_page=100`;
    let page = 0;
    let previousUrl = null;

    while (url) {
      // Detectar loop infinito: si next apunta a la misma URL que acabamos de visitar
      if (previousUrl && url === previousUrl) {
        logger.info(`[sperant.service.js] ${endpoint} - Loop detectado en página ${page}, deteniendo. Total: ${items.length} items`);
        break;
      }

      try {
        previousUrl = url;
        const response = await axios.get(url, {
          headers: { 'Authorization': SPERANT_API_TOKEN },
          timeout: 60000
        });

        const data = response.data;

        if (data.data && data.data.length > 0) {
          for (const item of data.data) {
            items.push({ ...item.attributes, _links: item.links || {} });
          }
        }

        url = data.links?.next || null;
        page++;
        logger.info(`[sperant.service.js] ${endpoint} - Página ${page} - ${items.length} items`);
      } catch (fetchErr) {
        logger.error(`[sperant.service.js] Error en ${endpoint} página ${page + 1}: ${fetchErr.message}`);
        break;
      }
    }

    logger.info(`[sperant.service.js] ${endpoint} terminó. Total: ${items.length}`);
    return items;
  }

  // ==================== CLIENTES ====================
  async syncClients(idEmpresa, userId) {
    logger.info(`[sperant.service.js] Iniciando sincronización de clientes para empresa ${idEmpresa}`);

    const clients = await this.fetchPaginated('/clients');

    // Filtrar válidos y deduplicar por uuid
    const seenUuids = new Set();
    const validClients = clients.filter(client => {
      const nombre = [client.fname, client.lname].filter(Boolean).join(' ').trim();
      if (!nombre || !client.uuid || seenUuids.has(client.uuid)) return false;
      seenUuids.add(client.uuid);
      return true;
    });

    const skipped = clients.length - validClients.length;

    // Solo campos compatibles con BD: nombre_completo, celular, email, sperant_uuid
    const records = validClients.map(client => ({
      nombre_completo: [client.fname, client.lname].filter(Boolean).join(' ').trim(),
      celular: client.phone || null,
      email: client.email || null,
      sperant_uuid: client.uuid,
      id_estado_prospecto: 1,
      id_empresa: idEmpresa,
      estado_registro: 1,
      usuario_registro: userId,
      usuario_actualizacion: userId
    }));

    let created = 0, updated = 0, errors = 0;

    const BATCH_SIZE = 100;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      try {
        const result = await Prospecto.bulkCreate(batch, {
          updateOnDuplicate: ['nombre_completo', 'celular', 'email', 'usuario_actualizacion'],
          returning: true
        });

        for (const record of result) {
          if (record.isNewRecord === false || record._options?.isNewRecord === false) {
            updated++;
          } else {
            created++;
          }
        }

        logger.info(`[sperant.service.js] Clientes lote ${Math.floor(i / BATCH_SIZE) + 1} - ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`);
      } catch (err) {
        logger.error(`[sperant.service.js] Error en lote clientes, procesando individualmente: ${err.message}`);
        for (const record of batch) {
          try {
            const existing = await Prospecto.unscoped().findOne({
              where: { sperant_uuid: record.sperant_uuid }
            });
            if (existing) {
              await existing.update({
                nombre_completo: record.nombre_completo,
                celular: record.celular || existing.celular,
                email: record.email || existing.email
              });
              updated++;
            } else {
              await Prospecto.create(record);
              created++;
            }
          } catch (individualErr) {
            errors++;
            logger.error(`[sperant.service.js] Error cliente ${record.sperant_uuid}: ${individualErr.message}`);
          }
        }
      }
    }

    logger.info(`[sperant.service.js] Clientes sync: ${created} creados, ${updated} actualizados, ${errors} errores, ${skipped} omitidos`);
    return { created, updated, errors, skipped, total: clients.length };
  }

  // ==================== SYNC COMPLETO ====================
  async syncAll(idEmpresa, userId) {
    logger.info(`[sperant.service.js] === SYNC COMPLETO INICIADO ===`);

    const clientsResult = await this.syncClients(idEmpresa, userId);

    logger.info(`[sperant.service.js] === SYNC COMPLETO FINALIZADO ===`);

    return {
      clients: clientsResult
    };
  }
}

module.exports = new SperantService();
