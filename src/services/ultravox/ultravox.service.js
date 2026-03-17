const axios = require('axios');
const logger = require('../../config/logger/loggerClient.js');
const { Llamada, CampaniaEjecucion, CampaniaProspectos, Prospecto, Empresa } = require('../../models/sequelize');

const ULTRAVOX_API_URL = process.env.ULTRAVOX_API_URL || 'https://bot.ai-you.io/api/calls/ultravox';
const MAX_CONCURRENT = 200;
const POLL_INTERVAL = 10000; // 10 segundos

class UltravoxService {
  constructor() {
    this.client = axios.create({
      baseURL: ULTRAVOX_API_URL,
      headers: { 'Content-Type': 'application/json', 'X-Origin-Service': 'viva-api.ai-you.io' },
      timeout: 30000
    });
    this.ejecucionesActivas = new Map();
  }

  /**
   * Obtiene las sesiones activas en Ultravox
   */
  async getSesionesActivas(idEmpresa) {
    const response = await this.client.get(`/sessions/${idEmpresa}`);
    return response.data?.data || [];
  }

  /**
   * Realiza una llamada via Ultravox
   */
  async realizarLlamada(body) {
    const response = await this.client.post('', body);
    return response.data;
  }

  /**
   * Formatea teléfono con código de país Perú
   */
  formatearTelefono(telefono) {
    const limpio = String(telefono).replace(/\D/g, '');
    const conCodigo = limpio.startsWith('51') ? limpio : `51${limpio}`;
    return conCodigo;
  }

  /**
   * Carga todos los prospectos de una ejecución de campaña
   */
  async cargarProspectosCampania(idCampania) {
    const registros = await CampaniaProspectos.findAll({
      where: { id_campania: idCampania },
      include: [
        {
          model: Prospecto,
          as: 'prospecto',
          attributes: ['id', 'nombre_completo', 'celular', 'email', 'dni', 'id_empresa'],
          include: [
            { model: Empresa, as: 'empresa', attributes: ['id', 'nombre_comercial'] }
          ]
        }
      ]
    });

    return registros
      .filter(r => r.prospecto && r.prospecto.celular)
      .map(r => ({
        id_prospecto: r.prospecto.id,
        nombre_completo: r.prospecto.nombre_completo,
        celular: r.prospecto.celular,
        email: r.prospecto.email,
        dni: r.prospecto.dni,
        id_empresa: r.prospecto.id_empresa,
        nombre_empresa: r.prospecto.empresa?.nombre_comercial || ''
      }));
  }

  /**
   * Inicia el procesamiento async de llamadas.
   * Mantiene hasta 200 llamadas concurrentes, polleando cada 10s.
   */
  async procesarLlamadasAsync({ idEjecucion, idCampania, idEmpresa, tipificaciones, prompt, voiceCode }) {
    // Evitar doble ejecución
    if (this.ejecucionesActivas.has(idEjecucion)) {
      logger.warn(`[UltravoxService] Ejecución ${idEjecucion} ya está en proceso`);
      return;
    }

    this.ejecucionesActivas.set(idEjecucion, { active: true });

    try {
      // Marcar ejecución como iniciada
      await CampaniaEjecucion.update(
        { fecha_inicio: new Date() },
        { where: { id: idEjecucion } }
      );

      // Cargar todos los prospectos
      const prospectos = await this.cargarProspectosCampania(idCampania);
      const totalProspectos = prospectos.length;
      let indicePendiente = 0;
      let completadas = 0;
      let fallidas = 0;

      logger.info(`[UltravoxService] Ejecución ${idEjecucion}: ${totalProspectos} prospectos a procesar`);

      // Función para despachar un lote
      const despacharLote = async () => {
        logger.info(`[UltravoxService] Despachando lote, indicePendiente: ${indicePendiente}/${totalProspectos}`);
        let sesiones = [];
        try {
          sesiones = await this.getSesionesActivas(idEmpresa);
        } catch (err) {
          logger.warn(`[UltravoxService] No se pudo obtener sesiones activas: ${err.response?.status} ${JSON.stringify(err.response?.data || err.message)}. Asumiendo 0 activas.`);
        }
        logger.info(`[UltravoxService] Sesiones activas: ${sesiones.length}, slots: ${MAX_CONCURRENT - sesiones.length}`);
        const slotsDisponibles = MAX_CONCURRENT - sesiones.length;

        if (slotsDisponibles <= 0) return;

        const cantidadADespachar = Math.min(slotsDisponibles, totalProspectos - indicePendiente);

        const promesas = [];
        for (let i = 0; i < cantidadADespachar; i++) {
          const prospecto = prospectos[indicePendiente];
          if (!prospecto) break;
          indicePendiente++;

          const telefono = this.formatearTelefono(prospecto.celular);
          const body = {
            destination: telefono,
            data: {
              nombre_completo: prospecto.nombre_completo,
              celular: telefono,
              email: prospecto.email || '',
              dni: prospecto.dni || ''
            },
            extras: {
              voice: voiceCode,
              tipificaciones,
              prompt,
              empresa: {
                id: prospecto.id_empresa,
                nombre: prospecto.nombre_empresa
              }
            }
          };

          promesas.push(
            this.realizarLlamada(body)
              .then(async (result) => {
                completadas++;
                logger.info(`[UltravoxService] Llamada a ${telefono} resultado: ${JSON.stringify(result?.success)} channelId: ${result?.data?.channelId}`);
                if (result?.success) {
                  await Llamada.create({
                    id_empresa: idEmpresa,
                    id_prospecto: prospecto.id_prospecto,
                    id_campania_ejecucion: idEjecucion,
                    provider_call_id: result.data.channelId,
                    fecha_inicio: new Date(),
                    id_estado_llamada: null
                  });
                }
              })
              .catch((err) => {
                fallidas++;
                const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                logger.error(`[UltravoxService] Fallo llamada a ${telefono}: ${detail}`);
              })
          );
        }

        await Promise.allSettled(promesas);
      };

      // Despachar lote inicial
      await despacharLote();

      // Poll loop: cada 10s revisar sesiones y despachar más
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          const estado = this.ejecucionesActivas.get(idEjecucion);
          if (!estado?.active) {
            clearInterval(interval);
            resolve();
            return;
          }

          if (indicePendiente >= totalProspectos) {
            const sesiones = await this.getSesionesActivas(idEmpresa);
            if (sesiones.length === 0) {
              clearInterval(interval);
              resolve();
            }
            return;
          }

          await despacharLote();
        }, POLL_INTERVAL);
      });

      // Finalizar ejecución
      await CampaniaEjecucion.update(
        {
          fecha_fin: new Date(),
          resultado: JSON.stringify({ total: totalProspectos, completadas, fallidas })
        },
        { where: { id: idEjecucion } }
      );

      logger.info(`[UltravoxService] Ejecución ${idEjecucion} finalizada: ${completadas} ok, ${fallidas} fallidas de ${totalProspectos}`);

    } catch (error) {
      logger.error(`[UltravoxService] Error en ejecución ${idEjecucion}: ${error.message}`);
      await CampaniaEjecucion.update(
        {
          fecha_fin: new Date(),
          resultado: 'fallido',
          mensaje_error: error.message
        },
        { where: { id: idEjecucion } }
      );
      throw error;
    } finally {
      this.ejecucionesActivas.delete(idEjecucion);
    }
  }

  /**
   * Cancela una ejecución activa
   */
  cancelarEjecucion(idEjecucion) {
    const estado = this.ejecucionesActivas.get(idEjecucion);
    if (estado) {
      estado.active = false;
      logger.info(`[UltravoxService] Ejecución ${idEjecucion} marcada para cancelar`);
      return true;
    }
    return false;
  }

  /**
   * Retorna las ejecuciones activas en memoria
   */
  getEjecucionesActivas() {
    return Array.from(this.ejecucionesActivas.keys());
  }
}

module.exports = new UltravoxService();
