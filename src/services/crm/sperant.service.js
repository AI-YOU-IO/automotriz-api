const axios = require('axios');
const { Prospecto, Proyecto, Tipologia, Unidad, sequelize } = require('../../models/sequelize');
const logger = require('../../config/logger/loggerClient');

const SPERANT_API_URL = process.env.SPERANT_API_URL || 'https://api.eterniasoft.com/v3';
const SPERANT_API_TOKEN = process.env.SPERANT_API_TOKEN || '';
const DELAY_BETWEEN_PROJECTS = 2000; // 2 segundos entre proyectos

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

  // Utilidad para esperar entre llamadas
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  // ==================== PROYECTOS ====================
  async syncProjects(idEmpresa, userId) {
    logger.info(`[sperant.service.js] Iniciando sincronización de proyectos para empresa ${idEmpresa}`);

    const projects = await this.fetchPaginated('/projects');

    // Deduplicar por id
    const seenIds = new Set();
    const validProjects = projects.filter(p => {
      if (!p.name || !p.id || seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    let created = 0, updated = 0, errors = 0;

    for (let idx = 0; idx < validProjects.length; idx++) {
      const project = validProjects[idx];
      try {
        // Buscar por sperant_id primero, luego por nombre como fallback
        let existing = await Proyecto.unscoped().findOne({
          where: { sperant_id: project.id }
        });

        if (!existing) {
          existing = await Proyecto.unscoped().findOne({
            where: { nombre: project.name.substring(0, 60) }
          });
        }

        if (existing) {
          await existing.update({
            sperant_id: project.id,
            imagen: project.logo || existing.imagen
          });
          updated++;
        } else {
          await Proyecto.create({
            nombre: project.name.substring(0, 60),
            sperant_id: project.id,
            estado_proyecto: 'activo',
            imagen: project.logo || null,
            id_distrito: 1,
            id_empresa: idEmpresa,
            estado_registro: 1,
            usuario_registro: userId
          });
          created++;
        }

        if ((idx + 1) % 20 === 0 || idx === validProjects.length - 1) {
          logger.info(`[sperant.service.js] Proyectos procesados: ${idx + 1}/${validProjects.length}`);
        }
      } catch (err) {
        errors++;
        logger.error(`[sperant.service.js] Error proyecto "${project.name}": ${err.message}`);
      }
    }

    // Sincronizar tipologías de cada proyecto
    let typesResult = { created: 0, updated: 0, errors: 0, total: 0 };
    for (let idx = 0; idx < validProjects.length; idx++) {
      const project = validProjects[idx];
      if (project._links?.types) {
        try {
          const typeResult = await this.syncTypologies(project, idEmpresa, userId);
          typesResult.created += typeResult.created;
          typesResult.updated += typeResult.updated;
          typesResult.errors += typeResult.errors;
          typesResult.total += typeResult.total;
        } catch (err) {
          logger.error(`[sperant.service.js] Error sync tipologías de "${project.name}": ${err.message}`);
        }

        if ((idx + 1) % 10 === 0 || idx === validProjects.length - 1) {
          logger.info(`[sperant.service.js] Tipologías - proyecto ${idx + 1}/${validProjects.length}: "${project.name}"`);
        }
      }
    }

    logger.info(`[sperant.service.js] Proyectos sync: ${created} creados, ${updated} actualizados, ${errors} errores`);
    logger.info(`[sperant.service.js] Tipologías sync: ${typesResult.created} creadas, ${typesResult.updated} actualizadas, ${typesResult.errors} errores`);

    return {
      projects: { created, updated, errors, total: validProjects.length },
      typologies: typesResult
    };
  }

  // ==================== TIPOLOGÍAS ====================
  async syncTypologies(project, idEmpresa, userId) {
    const typesUrl = project._links.types;
    let created = 0, updated = 0, errors = 0, total = 0;

    // Buscar el proyecto local por sperant_id
    const proyectoLocal = await Proyecto.unscoped().findOne({
      where: { sperant_id: project.id }
    });

    try {
      const response = await axios.get(typesUrl, {
        headers: { 'Authorization': SPERANT_API_TOKEN },
        timeout: 30000
      });

      const types = response.data.data || [];
      total = types.length;

      for (const type of types) {
        const attrs = type.attributes;
        if (!attrs || !attrs.name) continue;

        try {
          // Buscar por sperant_id primero, luego por nombre como fallback
          let existing = null;
          if (attrs.id) {
            existing = await Tipologia.unscoped().findOne({
              where: { sperant_id: attrs.id }
            });
          }
          if (!existing) {
            existing = await Tipologia.unscoped().findOne({
              where: { nombre: attrs.name.substring(0, 100) }
            });
          }

          const tipData = {
            nombre: attrs.name.substring(0, 100),
            sperant_id: attrs.id || null,
            id_proyecto: proyectoLocal ? proyectoLocal.id : null,
            area: attrs.area || 0,
            unidades_disponibles: attrs.units_available || 0,
            numero_banios: attrs.num_bathroom != null ? String(attrs.num_bathroom) : null,
            numero_dormitorios: attrs.num_bedroom || 0,
            total_unidades: attrs.total_units || 0,
            precio_minimo: attrs.price_min || 0
          };

          if (existing) {
            await existing.update(tipData);
            updated++;
          } else {
            await Tipologia.create({
              ...tipData,
              estado_registro: 1,
              usuario_registro: userId,
              usuario_actualizacion: userId
            });
            created++;
          }
        } catch (err) {
          errors++;
          logger.error(`[sperant.service.js] Error tipología "${attrs.name}": ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`[sperant.service.js] Error fetch tipologías de "${project.name}": ${err.message}`);
    }

    return { created, updated, errors, total };
  }

  // ==================== UNIDADES ====================
  async syncUnits(idEmpresa, userId) {
    logger.info(`[sperant.service.js] Iniciando sincronización de unidades`);

    // Obtener todos los proyectos locales que tienen sperant_id
    const proyectosLocales = await Proyecto.unscoped().findAll({
      where: { sperant_id: { [require('sequelize').Op.ne]: null } }
    });

    if (proyectosLocales.length === 0) {
      logger.info(`[sperant.service.js] No hay proyectos con sperant_id. Sincronice proyectos primero.`);
      return { created: 0, updated: 0, errors: 0, total: 0 };
    }

    // Cargar todas las tipologías con sperant_id para mapeo rápido
    const tipologiasLocales = await Tipologia.unscoped().findAll({
      where: { sperant_id: { [require('sequelize').Op.ne]: null } }
    });
    const tipologiaMap = new Map(tipologiasLocales.map(t => [t.sperant_id, t.id]));

    let totalCreated = 0, totalUpdated = 0, totalErrors = 0, totalUnits = 0;

    for (let i = 0; i < proyectosLocales.length; i++) {
      const proyecto = proyectosLocales[i];
      logger.info(`[sperant.service.js] Sync unidades proyecto ${i + 1}/${proyectosLocales.length}: "${proyecto.nombre}" (sperant_id: ${proyecto.sperant_id})`);

      try {
        // Fetch unidades paginadas de este proyecto
        const units = await this.fetchPaginated(`/projects/${proyecto.sperant_id}/units`);

        // Deduplicar por id (Sperant puede devolver duplicados entre páginas)
        const seenUnitIds = new Set();
        const uniqueUnits = units.filter(unit => {
          if (!unit.id || seenUnitIds.has(unit.id)) return false;
          seenUnitIds.add(unit.id);
          return true;
        });
        totalUnits += uniqueUnits.length;

        // Procesar en lotes
        const BATCH_SIZE = 50;
        for (let j = 0; j < uniqueUnits.length; j += BATCH_SIZE) {
          const batch = uniqueUnits.slice(j, j + BATCH_SIZE);

          const records = batch.map(unit => ({
            sperant_id: unit.id,
            nombre: (unit.name || unit.code || '').substring(0, 100) || null,
            estado_comercial: unit.commercial_status || 'desconocido',
            precio: unit.price || 0,
            precio_venta: unit.sale_price || 0,
            estado_unidad: unit.commercial_status || 'disponible',
            area_total: unit.total_area || 0,
            moneda: unit.currency || 'PEN',
            id_proyecto: proyecto.id,
            id_tipologia: unit.type_id ? (tipologiaMap.get(unit.type_id) || null) : null,
            estado_registro: 1,
            usuario_registro: userId,
            usuario_actualizacion: userId
          }));

          try {
            await Unidad.bulkCreate(records, {
              conflictAttributes: ['sperant_id'],
              updateOnDuplicate: [
                'nombre', 'estado_comercial', 'precio', 'precio_venta',
                'estado_unidad', 'area_total', 'moneda', 'id_proyecto',
                'id_tipologia', 'usuario_actualizacion'
              ]
            });
            totalCreated += records.length;
          } catch (batchErr) {
            logger.error(`[sperant.service.js] Error lote unidades proyecto "${proyecto.nombre}": ${batchErr.message}`);
            // Procesar individualmente como fallback
            for (const record of records) {
              try {
                const existing = await Unidad.unscoped().findOne({
                  where: { sperant_id: record.sperant_id }
                });
                if (existing) {
                  await existing.update(record);
                  totalUpdated++;
                } else {
                  await Unidad.create(record);
                  totalCreated++;
                }
              } catch (individualErr) {
                totalErrors++;
                logger.error(`[sperant.service.js] Error unidad sperant_id ${record.sperant_id}: ${individualErr.message}`);
              }
            }
          }
        }

        logger.info(`[sperant.service.js] Proyecto "${proyecto.nombre}": ${units.length} unidades procesadas`);
      } catch (err) {
        totalErrors++;
        logger.error(`[sperant.service.js] Error sync unidades proyecto "${proyecto.nombre}": ${err.message}`);
      }

      // Delay entre proyectos para no saturar la API
      if (i < proyectosLocales.length - 1) {
        await this.delay(DELAY_BETWEEN_PROJECTS);
      }
    }

    logger.info(`[sperant.service.js] Unidades sync: ${totalCreated} creadas, ${totalUpdated} actualizadas, ${totalErrors} errores. Total procesadas: ${totalUnits}`);
    return { created: totalCreated, updated: totalUpdated, errors: totalErrors, total: totalUnits };
  }

  // ==================== SYNC COMPLETO ====================
  async syncAll(idEmpresa, userId) {
    logger.info(`[sperant.service.js] === SYNC COMPLETO INICIADO ===`);

    const clientsResult = await this.syncClients(idEmpresa, userId);
    const projectsResult = await this.syncProjects(idEmpresa, userId);
    const unitsResult = await this.syncUnits(idEmpresa, userId);

    logger.info(`[sperant.service.js] === SYNC COMPLETO FINALIZADO ===`);

    return {
      clients: clientsResult,
      projects: projectsResult.projects,
      typologies: projectsResult.typologies,
      units: unitsResult
    };
  }
}

module.exports = new SperantService();
