/**
 * Controlador para envío masivo desde n8n
 * Estructura REST similar a los demás controllers
 */

const { Op } = require('sequelize');
const {
  EnvioMasivoWhatsapp,
  PlantillaWhatsapp,
  EnviosProspectos,
  Prospecto,
  Empresa,
  ConfiguracionWhatsapp
} = require('../models/sequelize');
const enviosProspectosRepository = require('../repositories/enviosProspectos.repository');
const configuracionWhatsappRepository = require('../repositories/configuracionWhatsapp.repository');
const whatsappGraphService = require('../services/whatsapp/whatsappGraph.service');
const logger = require('../config/logger/loggerClient');

// Configuración
const BATCH_SIZE = 50;
const DELAY_BETWEEN_MESSAGES = 500;

class N8nEnvioMasivoController {
  /**
   * GET /n8n/envios-masivos/pendientes
   * Obtiene envíos pendientes agrupados por empresa
   */
  async getPendientesAgrupados(req, res) {
    try {
      const { limite_por_empresa = 5 } = req.query;

      const envios = await EnvioMasivoWhatsapp.findAll({
        where: {
          estado_envio: 'pendiente',
          fecha_envio: { [Op.lte]: new Date() },
          [Op.or]: [
            { estado_registro: 1 },
            { estado_registro: null }
          ]
        },
        include: [
          { model: PlantillaWhatsapp, as: 'plantilla' },
          { model: Empresa, as: 'empresa' },
          {
            model: EnviosProspectos,
            as: 'enviosProspectos',
            where: { estado: 'pendiente' },
            required: false,
            include: [{ model: Prospecto, as: 'prospecto' }]
          }
        ],
        order: [['id_empresa', 'ASC'], ['fecha_envio', 'ASC']]
      });

      // Obtener configuraciones de WhatsApp
      const configuraciones = await ConfiguracionWhatsapp.findAll({
        where: { estado_registro: 1 }
      });

      const configMap = {};
      configuraciones.forEach(config => {
        configMap[config.id_empresa] = {
          numero_telefono_id: config.numero_telefono_id,
          token_whatsapp: config.token_whatsapp
        };
      });

      // Agrupar por empresa
      const empresasMap = {};

      for (const envio of envios) {
        const idEmpresa = envio.id_empresa;
        const config = configMap[idEmpresa];

        if (!config) continue;

        if (!empresasMap[idEmpresa]) {
          empresasMap[idEmpresa] = {
            id_empresa: idEmpresa,
            empresa_nombre: envio.empresa?.razon_social || 'Sin nombre',
            envios: []
          };
        }

        if (empresasMap[idEmpresa].envios.length < parseInt(limite_por_empresa)) {
          const prospectos = (envio.enviosProspectos || []).map(ep => ({
            envio_prospecto_id: ep.id,
            id_prospecto: ep.id_prospecto,
            nombre: ep.prospecto?.nombre_completo || 'Sin nombre',
            telefono: ep.prospecto?.celular || ''
          }));

          empresasMap[idEmpresa].envios.push({
            envio_id: envio.id,
            plantilla: envio.plantilla?.name || '',
            language: envio.plantilla?.language || 'es',
            cantidad: envio.cantidad,
            prospectos: prospectos
          });
        }
      }

      return res.json({
        success: true,
        empresas: Object.values(empresasMap),
        total_empresas: Object.keys(empresasMap).length
      });

    } catch (error) {
      logger.error(`[n8nEnvioMasivo] Error getPendientesAgrupados: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /n8n/envios-masivos/:id/enviar
   * Envía los mensajes de un envío masivo
   */
  async enviarMasivo(req, res) {
    try {
      const { id } = req.params;
      const {
        prospectos = [],
        plantilla,
        language = 'es',
        id_empresa
      } = req.body;

      if (!prospectos.length || !plantilla || !id_empresa) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (prospectos, plantilla, id_empresa)' });
      }

      // Obtener configuración de WhatsApp desde la BD
      const configWhatsapp = await configuracionWhatsappRepository.findByEmpresaId(id_empresa);
      if (!configWhatsapp || !configWhatsapp.token_whatsapp) {
        return res.status(400).json({ error: 'No se encontró configuración de WhatsApp para esta empresa' });
      }

      const resultados = {
        envio_id: parseInt(id),
        total: prospectos.length,
        enviados: 0,
        fallidos: 0,
        detalles: []
      };

      // Procesar en batches
      for (let i = 0; i < prospectos.length; i += BATCH_SIZE) {
        const batch = prospectos.slice(i, i + BATCH_SIZE);

        for (const persona of batch) {
          if (!persona.telefono) {
            resultados.fallidos++;
            resultados.detalles.push({
              envio_prospecto_id: persona.envio_prospecto_id,
              telefono: '',
              nombre: persona.nombre,
              status: 'fallido',
              error: 'Sin número de teléfono'
            });

            if (persona.envio_prospecto_id) {
              await enviosProspectosRepository.updateEstado(
                persona.envio_prospecto_id,
                'fallido',
                'Sin número de teléfono'
              );
            }
            continue;
          }

          try {
            await whatsappGraphService.enviarPlantilla(
              id_empresa,
              persona.telefono,
              plantilla,
              language
            );

            resultados.enviados++;
            resultados.detalles.push({
              envio_prospecto_id: persona.envio_prospecto_id,
              telefono: persona.telefono,
              nombre: persona.nombre,
              status: 'completado'
            });

            if (persona.envio_prospecto_id) {
              await enviosProspectosRepository.updateEstado(
                persona.envio_prospecto_id,
                'completado'
              );
            }

          } catch (error) {
            resultados.fallidos++;
            resultados.detalles.push({
              envio_prospecto_id: persona.envio_prospecto_id,
              telefono: persona.telefono,
              nombre: persona.nombre,
              status: 'fallido',
              error: error.message
            });

            if (persona.envio_prospecto_id) {
              await enviosProspectosRepository.updateEstado(
                persona.envio_prospecto_id,
                'fallido',
                error.message
              );
            }

            logger.error(`[n8nEnvioMasivo] Error enviando a ${persona.telefono}: ${error.message}`);
          }

          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
        }
      }

      // Determinar nuevo estado
      let nuevoEstado = 'completado';
      if (resultados.fallidos > 0 && resultados.enviados === 0) {
        nuevoEstado = 'fallido';
      }

      // Actualizar el envío masivo
      await EnvioMasivoWhatsapp.update({
        estado_envio: nuevoEstado,
        cantidad_exitosos: resultados.enviados,
        cantidad_fallidos: resultados.fallidos,
        fecha_envio: new Date().toISOString().split('T')[0]
      }, {
        where: { id }
      });

      logger.info(`[n8nEnvioMasivo] Envío ${id} completado: ${resultados.enviados} enviados, ${resultados.fallidos} fallidos`);

      return res.json({
        success: true,
        resultados
      });

    } catch (error) {
      logger.error(`[n8nEnvioMasivo] Error enviarMasivo: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /n8n/envios-masivos/:id/completar
   * Marca un envío como completado
   */
  async marcarCompletado(req, res) {
    try {
      const { id } = req.params;
      const {
        estado = 'completado',
        enviados = 0,
        fallidos = 0
      } = req.body;

      await EnvioMasivoWhatsapp.update({
        estado_envio: estado,
        cantidad_exitosos: enviados,
        cantidad_fallidos: fallidos,
        fecha_envio: new Date().toISOString().split('T')[0]
      }, {
        where: { id }
      });

      return res.json({
        success: true,
        message: `Envío ${id} marcado como ${estado}`,
        enviados,
        fallidos
      });

    } catch (error) {
      logger.error(`[n8nEnvioMasivo] Error marcarCompletado: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new N8nEnvioMasivoController();
